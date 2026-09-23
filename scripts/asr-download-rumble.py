#!/usr/bin/env python3
"""
Download audio for caption-less episodes from RUMBLE instead of YouTube.

Why: YouTube blocks unauthenticated audio downloads from many IPs and needs
browser cookies. Rumble does not — so if the same episodes are mirrored on a
Rumble channel (e.g. PanelverseVods), we can pull audio there with no cookies.

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
  python scripts/asr-download-rumble.py --channel https://rumble.com/c/PanelverseVods
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
DEFAULT_CHANNEL = "https://rumble.com/c/PanelverseVods"


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


def list_rumble_channel(channel_url: str) -> list:
    """Return [{title, url}] for every video on the Rumble channel."""
    cmd = ["yt-dlp", "--flat-playlist", "--ignore-errors", "--dump-json", channel_url]
    log(f"Listing Rumble channel: {channel_url}")
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
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
        title = obj.get("title") or ""
        if url and title:
            if url.startswith("/"):
                url = "https://rumble.com" + url
            videos.append({"title": title, "url": url})
    if not videos:
        err = (proc.stderr or "").strip().splitlines()
        if err:
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
            "yt-dlp", "-x", "--audio-format", "mp3", "--audio-quality", "5",
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
