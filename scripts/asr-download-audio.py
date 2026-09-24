#!/usr/bin/env python3
"""
Download MP3 audio for episodes listed in scripts/asr-pending.json
(produced by scripts/asr-export-pending.ts).

Skips files already present on disk. Logs failures.

Usage:
  python scripts/asr-download-audio.py            # all
  python scripts/asr-download-audio.py --batch 10
"""
import argparse
import json
import os
import subprocess
import sys
import time

# Force UTF-8 stdout/stderr so Unicode episode titles don't crash on Windows cp1252.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
PENDING = os.path.join(HERE, "asr-pending.json")
AUDIO_DIR = os.path.join(HERE, "scrape", "data", "audio")
LOG_FILE = os.path.join(HERE, "asr-download.log")
COOKIES = os.path.join(HERE, "cookies.txt")


def _has_impersonate() -> bool:
    """yt-dlp's --impersonate needs curl_cffi. Absent it, yt-dlp aborts every
    download with 'Impersonate target "chrome" is not available'."""
    try:
        import curl_cffi  # noqa: F401
        return True
    except ImportError:
        return False


def _find_ffmpeg() -> str | None:
    """yt-dlp needs ffmpeg to extract MP3. Honour an explicit path, then PATH,
    then the WinGet install location (ffmpeg is commonly not on PATH here)."""
    import glob
    import shutil
    if os.environ.get("FFMPEG_LOCATION"):
        return os.environ["FFMPEG_LOCATION"]
    if shutil.which("ffmpeg"):
        return None  # already on PATH; let yt-dlp find it
    pattern = os.path.join(
        os.environ.get("LOCALAPPDATA", ""),
        "Microsoft", "WinGet", "Packages", "Gyan.FFmpeg*", "ffmpeg-*", "bin",
    )
    hits = sorted(glob.glob(pattern))
    return hits[-1] if hits else None


def log(msg: str) -> None:
    line = f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", type=int, default=999, help="Max episodes to download")
    parser.add_argument(
        "--no-cookies", action="store_true",
        help="Skip cookies.txt even if present"
    )
    parser.add_argument(
        "--cookies-from-browser", default=None,
        help="Pull cookies live from a browser profile, e.g. 'chrome', 'firefox', 'edge'. "
             "More reliable than a stale cookies.txt."
    )
    args = parser.parse_args()

    if not os.path.exists(PENDING):
        print(f"ERROR: {PENDING} missing. Run `npx tsx scripts/asr-export-pending.ts` first.")
        return 1

    os.makedirs(AUDIO_DIR, exist_ok=True)
    with open(PENDING, "r", encoding="utf-8") as f:
        episodes = json.load(f)

    use_browser_cookies = args.cookies_from_browser
    use_cookies_file = (not args.no_cookies) and (not use_browser_cookies) and os.path.exists(COOKIES)
    if use_browser_cookies:
        log(f"Using cookies live from browser: {use_browser_cookies}")
    elif use_cookies_file:
        log(f"Using cookies from {COOKIES}")

    impersonate = _has_impersonate()
    if not impersonate:
        log("curl_cffi not installed - running without --impersonate "
            "(fine from a residential IP; datacenter IPs may be blocked)")
    ffmpeg_location = _find_ffmpeg()
    if ffmpeg_location:
        log(f"Using ffmpeg from {ffmpeg_location}")

    downloaded = 0
    skipped = 0
    failed = 0
    failures = []

    for i, ep in enumerate(episodes):
        if downloaded >= args.batch:
            break

        ytid = ep["ytId"]
        mp3_path = os.path.join(AUDIO_DIR, f"{ytid}.mp3")

        if os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 1000:
            skipped += 1
            continue

        log(f"[{i + 1}/{len(episodes)}] EP.{ep['ep']} ({ytid}) {ep['title'][:55]}")

        cmd = [
            sys.executable, "-m", "yt_dlp",
            "-x", "--audio-format", "mp3", "--audio-quality", "5",
            "-o", os.path.join(AUDIO_DIR, "%(id)s.%(ext)s"),
        ]
        if impersonate:
            # Mimic a real browser TLS fingerprint — avoids throttling/blocks.
            cmd.extend(["--impersonate", "chrome"])
        if ffmpeg_location:
            cmd.extend(["--ffmpeg-location", ffmpeg_location])
        if use_browser_cookies:
            cmd.extend(["--cookies-from-browser", use_browser_cookies])
        elif use_cookies_file:
            cmd.extend(["--cookies", COOKIES])
        cmd.append(f"https://www.youtube.com/watch?v={ytid}")

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
            if result.returncode == 0 and os.path.exists(mp3_path):
                size_mb = os.path.getsize(mp3_path) / 1024 / 1024
                log(f"  OK ({size_mb:.1f} MB)")
                downloaded += 1
            else:
                err = (result.stderr or "unknown error").strip().splitlines()[-1][:200]
                log(f"  FAILED: {err}")
                failures.append(f"EP.{ep['ep']} ({ytid}): {err}")
                failed += 1
        except subprocess.TimeoutExpired:
            log("  TIMEOUT")
            failures.append(f"EP.{ep['ep']} ({ytid}): timeout")
            failed += 1
        except Exception as ex:
            log(f"  ERROR: {ex}")
            failures.append(f"EP.{ep['ep']} ({ytid}): {ex}")
            failed += 1

        time.sleep(2)  # Be polite to YouTube

    log("")
    log(f"=== DONE ===")
    log(f"Downloaded: {downloaded}")
    log(f"Skipped (already present): {skipped}")
    log(f"Failed: {failed}")

    if failures:
        fail_log = os.path.join(HERE, "asr-download-failures.log")
        with open(fail_log, "w", encoding="utf-8") as f:
            f.write("\n".join(failures))
        log(f"Failures logged to {fail_log}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
