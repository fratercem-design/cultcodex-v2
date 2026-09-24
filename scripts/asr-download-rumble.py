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

  # Rumble auto-captions many uploads. Grab those WebVTT tracks instead of
  # audio - they go straight to `npm run asr:import`, no Whisper needed:
  python scripts/asr-download-rumble.py --captions --dry-run   # report only
  python scripts/asr-download-rumble.py --captions             # save transcripts
"""
import argparse
import datetime
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
TRANSCRIPT_DIR = os.path.join(HERE, "scrape", "data", "transcripts")
CAPTION_TMP = os.path.join(HERE, "scrape", "data", "rumble-vtt")
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


# Any Rumble video link: a relative href, an absolute URL, or one escaped
# inside inline JSON ("\/v7f5pxc-...html"). The channel page carries its own
# uploads in one of the latter forms, not as plain href="/v..." attributes.
# Shorts (/shorts/v...) never match. Unrelated sidebar recommendations do,
# but they cannot match an episode's date or title, so they are harmless.
VIDEO_LINK = re.compile(r'(?:https?:\\?/\\?/(?:www\.)?rumble\.com)?\\?/(v[0-9a-z]{4,}-[0-9a-z-]+?)\.html')
DEFAULT_SEARCH = ["psyche awakens vod"]


def fetch_page(session, url, params, label):
    """GET with backoff on 429/5xx. Returns the response, or None on 404/give-up."""
    resp = None
    for attempt in range(6):
        try:
            resp = session.get(url, params=params, timeout=60)
        except Exception as e:  # network hiccup: back off and retry
            log(f"  {label}: {e} - retrying")
            resp = None
        if resp is not None and resp.status_code != 429 and resp.status_code < 500:
            break
        wait = min(5 * 2 ** attempt, 120)
        code = resp.status_code if resp is not None else "error"
        log(f"  {label}: HTTP {code}, waiting {wait}s")
        time.sleep(wait)
    if resp is None or resp.status_code == 404:
        return None
    if resp.status_code != 200:
        log(f"  {label}: HTTP {resp.status_code} - stopping")
        return None
    return resp


def list_rumble_pages(channel_url: str, searches: list):
    """Collect video links from the channel's /videos pages and Rumble search.

    yt-dlp's Rumble channel extractor strips everything after /user/<name>,
    so it pages the channel *home* (?page=2, 3, ...) - which shows one Short
    and never 404s. Fetch <channel>/videos?page=N ourselves instead, with a
    Chrome fingerprint (plain clients get 403). The channel page does not
    list every upload, so also page through Rumble's video search for each
    query (the VODs are titled "MMDDYY Psyche Awakens VOD: ..."). Each source
    stops at a 404 or the first page that adds no new videos.

    Returns [{title, url}], or None when curl_cffi is missing.
    """
    try:
        from curl_cffi import requests as creq
    except ImportError:
        return None
    sources = []
    m = re.match(r"(https?://(?:www\.)?rumble\.com/(?:c|user)/[^/?#&]+)", channel_url)
    if m:
        sources.append(("channel", m.group(1) + "/videos", {}))
    for q in searches:
        sources.append((f"search '{q}'", "https://rumble.com/search/video", {"q": q}))

    seen, videos = set(), []
    session = creq.Session(impersonate="chrome")
    for label, base, params in sources:
        for page in range(1, 200):
            resp = fetch_page(session, base, {**params, "page": page}, f"{label} page {page}")
            if resp is None:
                break
            new = 0
            for slug in VIDEO_LINK.findall(resp.text):
                full = f"https://rumble.com/{slug}.html"
                if full in seen:
                    continue
                seen.add(full)
                videos.append({"title": title_from_url(full), "url": full})
                new += 1
            log(f"  {label} page {page}: {new} new videos ({len(videos)} total)")
            if new == 0:
                break
            time.sleep(3)
    return videos


def list_rumble_channel(channel_url: str, searches: list = ()) -> list:
    """Return [{title, url}] for every video on the Rumble channel."""
    log(f"Listing Rumble channel: {channel_url}")
    videos = list_rumble_pages(channel_url, list(searches))
    if videos is not None:
        log(f"  Found {len(videos)} videos on the channel.")
        return videos

    # Fallback without curl_cffi. Subject to the yt-dlp paging bug above.
    # --sleep-requests: the listing pages through the channel, and Rumble
    # answers 429 when those page fetches come back to back. The extractor
    # retries back off exponentially (5s up to 2 min) when it still does.
    cmd = [*ytdlp_cmd(), "--flat-playlist", "--ignore-errors",
           "--sleep-requests", "3",
           "--extractor-retries", "6", "--retry-sleep", "extractor:exp=5:120",
           "--dump-json", channel_url]
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


def vtt_ms(ts: str) -> int:
    """'01:02:03.456' or '02:03.456' -> milliseconds."""
    parts = ts.strip().split()[0].replace(",", ".").split(":")
    secs = 0.0
    for p in parts:
        secs = secs * 60 + float(p)
    return int(round(secs * 1000))


def parse_vtt(vtt: str) -> list:
    """WebVTT -> [{offset, duration, text}] in ms, the asr-transcribe.py format."""
    segs, seen = [], set()
    for block in re.split(r"\r?\n\s*\r?\n", vtt):
        lines = [l.strip() for l in block.strip().splitlines()]
        timing = next((l for l in lines if "-->" in l), None)
        if not timing:
            continue
        start_s, end_s = [t.strip() for t in timing.split("-->", 1)]
        text = " ".join(l for l in lines[lines.index(timing) + 1:] if l)
        text = re.sub(r"<[^>]+>", "", text)
        text = (text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
                    .replace("&#39;", "'").replace("&apos;", "'").replace("&quot;", '"')
                    .replace("&nbsp;", " ")).strip()
        if not text:
            continue
        start, end = vtt_ms(start_s), vtt_ms(end_s)
        if (start, text) in seen:
            continue
        seen.add((start, text))
        segs.append({"offset": start, "duration": max(end - start, 0), "text": text})
    return segs


def fetch_captions(url: str, ytid: str, save: bool):
    """Check a Rumble video for a caption track.

    Returns (languages, segment_count, error). Rumble exposes its captions as
    WebVTT files in the player's "cc" block, which yt-dlp reports as regular
    subtitles. With save=True the track (English preferred) is parsed and
    written to transcripts/<ytId>.json for asr-import-segments.ts.
    """
    r = subprocess.run([*ytdlp_cmd(), "--skip-download", "--dump-json", url],
                       capture_output=True, text=True, timeout=180)
    if r.returncode != 0:
        err = (r.stderr or "unknown").strip().splitlines()
        return [], 0, (err[-1][:200] if err else "unknown")
    try:
        info = json.loads(r.stdout.strip().splitlines()[-1])
    except (json.JSONDecodeError, IndexError):
        return [], 0, "unreadable yt-dlp output"
    langs = sorted((info.get("subtitles") or {}).keys())
    if not langs or not save:
        return langs, 0, None

    lang = next((l for l in langs if l.lower().startswith("en")), langs[0])
    os.makedirs(CAPTION_TMP, exist_ok=True)
    for f in os.listdir(CAPTION_TMP):
        if f.startswith(ytid + "."):
            os.remove(os.path.join(CAPTION_TMP, f))
    r = subprocess.run([*ytdlp_cmd(), "--skip-download", "--write-subs",
                        "--sub-langs", lang, "--sub-format", "vtt/best",
                        "-o", os.path.join(CAPTION_TMP, f"{ytid}.%(ext)s"), url],
                       capture_output=True, text=True, timeout=300)
    produced = [f for f in os.listdir(CAPTION_TMP)
                if f.startswith(ytid + ".") and f.endswith(".vtt")]
    if not produced:
        err = (r.stderr or "").strip().splitlines()
        return langs, 0, "caption download failed" + (": " + err[-1][:160] if err else "")
    with open(os.path.join(CAPTION_TMP, produced[0]), "r", encoding="utf-8", errors="replace") as f:
        segs = parse_vtt(f.read())
    if not segs:
        return langs, 0, "caption track was empty"
    os.makedirs(TRANSCRIPT_DIR, exist_ok=True)
    with open(os.path.join(TRANSCRIPT_DIR, f"{ytid}.json"), "w", encoding="utf-8") as f:
        json.dump(segs, f, ensure_ascii=False)
    return langs, len(segs), None


def slug_date(title: str):
    """'090526 psyche awakens vod ...' -> date(2026, 9, 5), else None.

    The VOD uploader prefixes every title with the stream's MMDDYY date,
    which is a far better key than the free-text title that follows it.
    """
    m = re.match(r"\s*(\d{2})(\d{2})(\d{2})\b", title or "")
    if not m:
        return None
    try:
        return datetime.date(2000 + int(m.group(3)), int(m.group(1)), int(m.group(2)))
    except ValueError:
        return None


def best_match(ep_title: str, videos: list, norm_index: list, threshold: float,
               air_date: str = None, date_index: list = None):
    """Return (video, score) for the closest Rumble video, or (None, score).

    When the episode has an airDate, a VOD dated that day scores 0.95 and one
    dated a day either side 0.85 (airDate is UTC; a late-night US stream can
    land on the next UTC day). Title similarity breaks ties between VODs on
    the same date. Without a date hit it falls back to title similarity.
    """
    target = normalize(ep_title)
    air = None
    if air_date:
        try:
            air = datetime.date.fromisoformat(air_date[:10])
        except ValueError:
            air = None
    best, best_score = None, 0.0
    for i, (vid, ntitle) in enumerate(zip(videos, norm_index)):
        sim = difflib.SequenceMatcher(None, target, ntitle).ratio() if target else 0.0
        score = sim
        # Boost when one title contains the other (mirrors often add prefixes)
        if target and ntitle and (target in ntitle or ntitle in target):
            score = max(score, 0.9)
        vdate = date_index[i] if date_index else None
        if air and vdate:
            gap = abs((vdate - air).days)
            if gap == 0:
                score = max(score, 0.95 + sim * 0.04)
            elif gap == 1:
                score = max(score, 0.85 + sim * 0.04)
        if score > best_score:
            best, best_score = vid, score
    if best_score >= threshold:
        return best, best_score
    return None, best_score


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--channel", default=DEFAULT_CHANNEL)
    ap.add_argument("--search", action="append",
                    help="Rumble search query to page through for more videos "
                         f"(repeatable; default {DEFAULT_SEARCH!r}; pass --search '' to skip)")
    ap.add_argument("--batch", type=int, default=999)
    ap.add_argument("--threshold", type=float, default=0.6,
                    help="Min title-similarity 0-1 to accept a match (default 0.6)")
    ap.add_argument("--list", action="store_true", help="Just print the channel's videos and exit")
    ap.add_argument("--dry-run", action="store_true", help="Show matches, download nothing")
    ap.add_argument("--captions", action="store_true",
                    help="Check matched videos for Rumble's WebVTT captions and save those "
                         "as transcripts instead of downloading audio (with --dry-run: report only)")
    args = ap.parse_args()

    searches = [q for q in (args.search if args.search is not None else DEFAULT_SEARCH) if q]
    videos = list_rumble_channel(args.channel, searches)
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
    date_index = [slug_date(v["title"]) for v in videos]

    matched, downloaded, skipped, no_match, failed = 0, 0, 0, 0, 0
    with_captions, captions_saved = 0, 0
    match_report = []

    for ep in pending:
        ytid = ep["ytId"]
        title = ep.get("title", "")
        mp3_path = os.path.join(AUDIO_DIR, f"{ytid}.mp3")

        tx_path = os.path.join(TRANSCRIPT_DIR, f"{ytid}.json")
        have = tx_path if args.captions else mp3_path
        if os.path.exists(have) and os.path.getsize(have) > 1000:
            skipped += 1
            continue

        vid, score = best_match(title, videos, norm_index, args.threshold,
                                ep.get("airDate"), date_index)
        if not vid:
            no_match += 1
            log(f"  NO MATCH (best {score:.2f})  EP.{ep.get('ep')} ({ep.get('airDate')})  {title[:55]}")
            match_report.append({"ytId": ytid, "title": title, "airDate": ep.get("airDate"),
                                 "matched": False, "score": round(score, 3)})
            continue

        matched += 1
        match_report.append({
            "ytId": ytid, "title": title, "airDate": ep.get("airDate"), "matched": True,
            "score": round(score, 3), "rumbleTitle": vid["title"], "rumbleUrl": vid["url"],
        })
        log(f"  MATCH {score:.2f}  EP.{ep.get('ep')} ({ep.get('airDate')})  {title[:40]}  ->  {vid['title'][:50]}")

        if args.captions:
            if downloaded + failed >= args.batch:
                continue
            try:
                langs, nsegs, err = fetch_captions(vid["url"], ytid, save=not args.dry_run)
            except subprocess.TimeoutExpired:
                langs, nsegs, err = [], 0, "timeout"
            match_report[-1]["captions"] = langs
            if err:
                log(f"    captions: ERROR {err}")
                failed += 1
            elif not langs:
                log("    captions: none")
                downloaded += 1
            else:
                with_captions += 1
                downloaded += 1
                if nsegs:
                    captions_saved += 1
                    log(f"    captions: {', '.join(langs)} -> saved {nsegs} segments")
                else:
                    log(f"    captions: {', '.join(langs)}")
            time.sleep(3)
            continue

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
    if args.captions:
        log(f"Checked:            {downloaded}")
        log(f"Have captions:      {with_captions}")
        log(f"Check errors:       {failed}")
        if not args.dry_run:
            log(f"Transcripts saved:  {captions_saved}  (next: npm run asr:import)")
    elif not args.dry_run:
        log(f"Downloaded:         {downloaded}")
        log(f"Failed:             {failed}")
    log(f"Match report:       {MATCHES_OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
