#!/usr/bin/env python3
"""
Transcribe MP3 files (downloaded by asr-download-audio.py) using
ElevenLabs Scribe. Reads scripts/asr-pending.json for the work list,
writes transcripts to scripts/scrape/data/transcripts/{ytId}.json.

Output format (matches DB importer):
  [{ "offset": <ms>, "duration": <ms>, "text": "..." }, ...]

Usage:
  python scripts/asr-transcribe.py
  python scripts/asr-transcribe.py --batch 10
  python scripts/asr-transcribe.py --backend whisper          # local Whisper instead of ElevenLabs
  python scripts/asr-transcribe.py --whisper-model medium     # tiny|base|small|medium|large
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time
import warnings

warnings.filterwarnings("ignore")

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

from dotenv import load_dotenv
load_dotenv()

HERE = os.path.dirname(os.path.abspath(__file__))
PENDING = os.path.join(HERE, "asr-pending.json")
AUDIO_DIR = os.path.join(HERE, "scrape", "data", "audio")
TRANSCRIPT_DIR = os.path.join(HERE, "scrape", "data", "transcripts")
LOG_FILE = os.path.join(HERE, "asr-transcribe.log")

ELEVEN_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip('"')


def log(msg: str) -> None:
    line = f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {msg}"
    print(line, flush=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


# ─── ElevenLabs backend ────────────────────────────────────────────────

def words_to_segments(words):
    """Group ElevenLabs word-level timestamps into ~15-word sentences."""
    segments = []
    cur_words = []
    cur_start = None
    cur_end = None

    for w in words:
        text = (w.text if hasattr(w, "text") else w.get("text", "")) or ""
        start = w.start if hasattr(w, "start") else w.get("start", 0)
        end = w.end if hasattr(w, "end") else w.get("end", 0)

        if not text.strip():
            continue
        if cur_start is None:
            cur_start = start
        cur_words.append(text.strip())
        cur_end = end

        sentence_end = text.strip().endswith((".", "!", "?"))
        if len(cur_words) >= 15 or (sentence_end and len(cur_words) >= 3):
            seg_text = " ".join(" ".join(cur_words).split())
            segments.append({
                "offset": int(cur_start * 1000),
                "duration": int((cur_end - cur_start) * 1000),
                "text": seg_text,
            })
            cur_words = []
            cur_start = None

    if cur_words:
        seg_text = " ".join(" ".join(cur_words).split())
        segments.append({
            "offset": int(cur_start * 1000),
            "duration": int((cur_end - cur_start) * 1000),
            "text": seg_text,
        })
    return segments


def split_audio(mp3_path: str, chunk_minutes: int = 30):
    """Split files >25MB into chunks via ffmpeg so they fit ElevenLabs limits."""
    size_mb = os.path.getsize(mp3_path) / 1024 / 1024
    if size_mb < 25:
        return [mp3_path]

    probe = subprocess.run(
        ["ffmpeg", "-i", mp3_path, "-f", "null", "-"],
        capture_output=True, text=True, timeout=60
    )
    m = re.search(r"Duration:\s*(\d+):(\d+):(\d+)", probe.stderr)
    if not m:
        return [mp3_path]

    total = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3))
    chunks = []
    chunk_seconds = chunk_minutes * 60
    base = mp3_path.replace(".mp3", "")

    for i, start in enumerate(range(0, total, chunk_seconds)):
        out_path = f"{base}_chunk{i:03d}.mp3"
        if not os.path.exists(out_path) or os.path.getsize(out_path) < 1000:
            try:
                subprocess.run(
                    ["ffmpeg", "-y", "-i", mp3_path, "-ss", str(start),
                     "-t", str(chunk_seconds), "-acodec", "libmp3lame", "-q:a", "5",
                     out_path],
                    capture_output=True, timeout=300
                )
            except Exception:
                pass
        if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
            chunks.append(out_path)
    return chunks if chunks else [mp3_path]


def transcribe_elevenlabs(mp3_path: str):
    from elevenlabs import ElevenLabs
    import httpx
    client = ElevenLabs(
        api_key=ELEVEN_KEY,
        timeout=600.0,
        httpx_client=httpx.Client(timeout=httpx.Timeout(600.0, connect=30.0))
    )

    chunks = split_audio(mp3_path)
    all_segments = []

    for chunk_idx, chunk_path in enumerate(chunks):
        chunk_offset_ms = chunk_idx * 30 * 60 * 1000
        with open(chunk_path, "rb") as f:
            result = client.speech_to_text.convert(
                file=f, model_id="scribe_v1", language_code="en"
            )

        if hasattr(result, "words") and result.words:
            segs = words_to_segments(result.words)
            for s in segs:
                s["offset"] += chunk_offset_ms
            all_segments.extend(segs)
        elif hasattr(result, "text") and result.text:
            all_segments.append({
                "offset": chunk_offset_ms, "duration": 0, "text": result.text
            })

        if chunk_path != mp3_path and os.path.exists(chunk_path):
            try:
                os.remove(chunk_path)
            except OSError:
                pass

        if len(chunks) > 1:
            time.sleep(1)

    return all_segments


# ─── Whisper backend ───────────────────────────────────────────────────

_WHISPER_MODEL = None
def transcribe_whisper(mp3_path: str, model_name: str):
    global _WHISPER_MODEL
    if _WHISPER_MODEL is None:
        try:
            import whisper  # type: ignore
        except ImportError:
            raise SystemExit(
                "ERROR: openai-whisper is not installed. Run `pip install openai-whisper`. "
                "In CI it is installed only when --backend whisper is selected."
            )
        log(f"Loading Whisper {model_name} model...")
        _WHISPER_MODEL = whisper.load_model(model_name)
    result = _WHISPER_MODEL.transcribe(mp3_path, language="en", verbose=False)
    return [
        {
            "offset": int(seg["start"] * 1000),
            "duration": int((seg["end"] - seg["start"]) * 1000),
            "text": seg["text"].strip(),
        }
        for seg in result["segments"]
    ]


# ─── faster-whisper backend ────────────────────────────────────────────

_FASTER_MODEL = None
def transcribe_faster_whisper(mp3_path: str, model_name: str):
    global _FASTER_MODEL
    if _FASTER_MODEL is None:
        try:
            from faster_whisper import WhisperModel  # type: ignore
        except ImportError:
            raise SystemExit(
                "ERROR: faster-whisper is not installed. Run `pip install faster-whisper`. "
                "In CI it is installed only when --backend faster-whisper is selected."
            )
        log(f"Loading faster-whisper {model_name} model...")
        _FASTER_MODEL = WhisperModel(model_name, device="cpu", compute_type="int8")
    segments, _ = _FASTER_MODEL.transcribe(mp3_path, language="en", beam_size=5)
    return [
        {
            "offset": int(seg.start * 1000),
            "duration": int((seg.end - seg.start) * 1000),
            "text": seg.text.strip(),
        }
        for seg in segments
    ]


# ─── Main ──────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", type=int, default=999)
    parser.add_argument("--backend", choices=["elevenlabs", "whisper", "faster-whisper"], default="elevenlabs")
    parser.add_argument("--whisper-model", default="medium")
    parser.add_argument("--overwrite", action="store_true",
                        help="Re-transcribe even if transcript already exists")
    args = parser.parse_args()

    if args.backend == "elevenlabs" and not ELEVEN_KEY:
        print("ERROR: ELEVENLABS_API_KEY not set in .env")
        return 1
    if not os.path.exists(PENDING):
        print(f"ERROR: {PENDING} missing. Run `npx tsx scripts/asr-export-pending.ts` first.")
        return 1

    os.makedirs(TRANSCRIPT_DIR, exist_ok=True)
    with open(PENDING, "r", encoding="utf-8") as f:
        episodes = json.load(f)

    transcribed = skipped_existing = no_audio = failed = 0

    for i, ep in enumerate(episodes):
        if transcribed >= args.batch:
            break

        ytid = ep["ytId"]
        mp3_path = os.path.join(AUDIO_DIR, f"{ytid}.mp3")
        out_path = os.path.join(TRANSCRIPT_DIR, f"{ytid}.json")

        if os.path.exists(out_path) and not args.overwrite:
            skipped_existing += 1
            continue
        if not os.path.exists(mp3_path):
            no_audio += 1
            continue

        size_mb = os.path.getsize(mp3_path) / 1024 / 1024
        log(f"[{i + 1}/{len(episodes)}] EP.{ep['ep']} ({ytid}) {ep['title'][:50]} ({size_mb:.0f}MB) [{args.backend}]")

        try:
            if args.backend == "elevenlabs":
                segments = transcribe_elevenlabs(mp3_path)
            elif args.backend == "faster-whisper":
                segments = transcribe_faster_whisper(mp3_path, args.whisper_model)
            else:
                segments = transcribe_whisper(mp3_path, args.whisper_model)

            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(segments, f, ensure_ascii=False)

            log(f"  OK - {len(segments)} segments")
            transcribed += 1
            time.sleep(2)

        except Exception as ex:
            log(f"  FAILED: {ex}")
            failed += 1
            if "rate" in str(ex).lower() or "429" in str(ex):
                log("  rate limited - sleeping 60s")
                time.sleep(60)
            else:
                time.sleep(5)

    log("")
    log("=== DONE ===")
    log(f"Transcribed:        {transcribed}")
    log(f"Skipped (existing): {skipped_existing}")
    log(f"No audio file:      {no_audio}")
    log(f"Failed:             {failed}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
