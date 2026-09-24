#!/usr/bin/env python3
"""
Download audio for caption-less episodes from RUMBLE instead of YouTube.

Why: YouTube blocks unauthenticated audio downloads from many IPs and needs
browser cookies. Rumble does not — so if the same episodes are mirrored on a
Rumble channel (e.g. PanelverseVODs), we can pull audio there with no cookies.

How it works:
  1. Reads scripts/asr-pending.json  (produced by `npm run asr:export`)
  2. Lists every video on the Rumble channel once (yt-dlp --flat-playlist)
  3. Fuzzy-matches each pending episode to a Rumble video BY TITLE
  4. Downloads matched audio as scrape/data/audio/<ytId>.mp3
     (named by the YouTube id so the existing transcribe/import steps just work)

Usage:
  # First, see what's on the channel and how well titles match — downloads nothing:
  python scripts/asr-download-rumble.py --list
  python scripts/asr-download-rumble.py --dry-run

  # Then actually download:
  python scripts/asr-download-rumble.py --batch 25
  python scripts/asr-download-rumble.py --channel https://rumble.com/user/PanelverseVODs/videos
  python scripts/asr-download-rumble.py --threshold 0.55   # looser title matching
"""
import argparse
import difflib
import json
import os
import re
import subprocess
import sys
import time

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
PENDING = os.path.join(HERE, "asr-pending.json")
AUDIO_DIR = os.path.join(HERE, "scrape", "data", "audio")
MATCHES_OUT = os.path.join(HERE, "asr-rumble-matches.json")
LOG_FILE = os.path.join(HERE, "asr-rumble.log")
DEFAULT_CHANNEL = "https://rumble.com/user/PanelverseVODs/videos"


def log(msg: str) -> None:
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def normalize(s: str) -> str:
    """Lowercase, strip punctuation, collapse whitespace — for title comparison."""
    s = (s or "").lower()
    s = re.sub(r"[‘’“”]", "", s)   # smart quotes
    s = re.sub(r"[^a-z0-9 ]+", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def ytdlp_cmd() -> list:
    """yt-dlp invocation with a browser TLS fingerprint.

    Rumble answers plain HTTP clients with 403 - from GitHub runners and from
    home connections alike - unless the request looks like Chrome, which needs
    `--impersonate` backed by curl_cffi. Prefer this interpreter's yt_dlp module
    (so curl_cffi installed with `python -m pip` is the one used; a standalone
    yt-dlp.exe on PATH may lack it), and only pass --impersonate when curl_cffi
    is importable, since yt-dlp aborts otherwise.
    """
    try:
        import yt_dlp  # noqa: F401
        base = [sys.executable, "-m", "yt_dlp"]
    except ImportError:
        base = ["yt-dlp"]
    try:
        import curl_cffi  # noqa: F401
        return base + ["--impersonate", "chrome"]
    except ImportError:
        log("curl_cffi not installed - Rumble will likely answer 403. "
            "Fix: python -m pip install -U \"yt-dlp[default,curl-cffi]\"")
        return base


def title_from_url(url: str) -> str:
    """Recover a title from a Rumble video URL slug.

    Rumble's channel listing often comes back without titles (yt-dlp prints
    "NA"), but regular video URLs carry the title as a slug:
    https://rumble.com/v6abc12-psyche-awakens-tarot-live-stream.html
    -> "psyche awakens tarot live stream". normalize() lowercases and strips
    punctuation anyway, so the slug is directly comparable to episode titles.
    """
    m = re.search(r"/v[0-9a-z]+-([^/?#]+?)(?:\.html)?(?:[?#]|$)", url)
    return m.group(1).replace("-", " ") if m else ""


def list_rumble_channel(channel_url: str) -> list:
    """Return [{title, url}] for every video on the Rumble channel."""
    # --sleep-requests: the listing pages through the channel, and Rumble
    # answers 429 when those page fetches come back to back. The extractor
    # retries back off exponentially (5s up to 2 min) when it still does.
    cmd = [*ytdlp_cmd(), "--flat-playlist", "--ignore-errors",
           "--sleep-requests", "3",
           "--extractor-retries", "6", "--retry-sleep", "extractor:exp=5:120",
           "--dump-json", channel_url]
    log(f"Listing Rumble channel: {channel_url}")
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)
    videos = []
    for raw in proc.stdout.splitlines():
        raw = raw.strip()
        if not raw:
            continue
        try:
            obj = json.loads(raw)
        except json.JSONDecodeError:
            continue
        url = obj.get("url") or obj.get("webpage_url") or obj.get("id")
        if not url:
            continue
        if url.startswith("/"):
            url = "https://rumble.com" + url
        # Shorts are clips, not full episodes, and their URLs carry no title.
        if "/shorts/" in url:
            continue
        title = obj.get("title") or ""
        if not title or title == "NA":
            title = title_from_url(url)
        if title:
            videos.append({"title": title, "url": url})
    err = (proc.stderr or "").strip().splitlines()
    if err and (not videos or any("429" in line for line in err)):
        log("  yt-dlp said: " + err[-1][:300])
    log(f"  Found {len(videos)} videos on the channel.")
    return videos


def best_match(ep_title: str, videos: list, norm_index: list, threshold: float):
    """Return (video, score) for the closest Rumble title, or (None, score)."""
    target = normalize(ep_title)
    if not target:
        return None, 0.0
    best, best_score = None, 0.0
    for vid, ntitle in zip(videos, norm_index):
        score = difflib.SequenceMatcher(None, target, ntitle).ratio()
        # Boost when one title contains the other (mirrors often add prefixes)
        if target and ntitle and (target in ntitle or ntitle in target):
            score = max(score, 0.9)
        if score > best_score:
            best, best_score = vid, score
    if best_score >= threshold:
        return best, best_score
    return None, best_score


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--channel", default=DEFAULT_CHANNEL)
    ap.add_argument("--batch", type=int, default=999)
    ap.add_argument("--threshold", type=float, default=0.6,
                    help="Min title-similarity 0-1 to accept a match (default 0.6)")
    ap.add_argument("--list", action="store_true", help="Just print the channel's videos and exit")
    ap.add_argument("--dry-run", action="store_true", help="Show matches, download nothing")
    args = ap.parse_args()

    videos = list_rumble_channel(args.channel)
    if not videos:
        log("No videos found. Check the --channel URL (try /c/Name or /user/Name).")
        return 1

    if args.list:
        for v in videos:
            print(f"  {v['title'][:70]:70s}  {v['url']}")
        return 0

    if not os.path.exists(PENDING):
        log(f"Missing {PENDING}. Run `npm run asr:export` first.")
        return 1
    with open(PENDING, "r", encoding="utf-8") as f:
        pending = json.load(f)

    os.makedirs(AUDIO_DIR, exist_ok=True)
    norm_index = [normalize(v["title"]) for v in videos]

    matched, downloaded, skipped, no_match, failed = 0, 0, 0, 0, 0
    match_report = []

    for ep in pending:
        ytid = ep["ytId"]
        title = ep.get("title", "")
        mp3_path = os.path.join(AUDIO_DIR, f"{ytid}.mp3")

        if os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 1000:
            skipped += 1
            continue

        vid, score = best_match(title, videos, norm_index, args.threshold)
        if not vid:
            no_match += 1
            log(f"  NO MATCH (best {score:.2f})  EP.{ep.get('ep')}  {title[:55]}")
            match_report.append({"ytId": ytid, "title": title, "matched": False, "score": round(score, 3)})
            continue

        matched += 1
        match_report.append({
            "ytId": ytid, "title": title, "matched": True,
            "score": round(score, 3), "rumbleTitle": vid["title"], "rumbleUrl": vid["url"],
        })
        log(f"  MATCH {score:.2f}  EP.{ep.get('ep')}  {title[:45]}  ->  {vid['title'][:45]}")

        if args.dry_run:
            continue
        if downloaded >= args.batch:
            continue

        cmd = [
            *ytdlp_cmd(), "-x", "--audio-format", "mp3", "--audio-quality", "5",
            "-o", os.path.join(AUDIO_DIR, f"{ytid}.%(ext)s"), vid["url"],
        ]
        try:
            r = subprocess.run(cmd, capture_output=True, text=True, timeout=900)
            if r.returncode == 0 and os.path.exists(mp3_path):
                size_mb = os.path.getsize(mp3_path) / 1024 / 1024
                log(f"    OK ({size_mb:.1f} MB)")
                downloaded += 1
            else:
                err = (r.stderr or "unknown").strip().splitlines()
                log("    FAILED: " + (err[-1][:200] if err else "unknown"))
                failed += 1
        except subprocess.TimeoutExpired:
            log("    TIMEOUT")
            failed += 1
        time.sleep(2)

    with open(MATCHES_OUT, "w", encoding="utf-8") as f:
        json.dump(match_report, f, ensure_ascii=False, indent=2)

    log("")
    log("=== DONE ===")
    log(f"Pending episodes:   {len(pending)}")
    log(f"Title matched:      {matched}")
    log(f"No match:           {no_match}")
    log(f"Already had audio:  {skipped}")
    if not args.dry_run:
        log(f"Downloaded:         {downloaded}")
        log(f"Failed:             {failed}")
    log(f"Match report:       {MATCHES_OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
