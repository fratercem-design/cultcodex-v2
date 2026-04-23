# ASR (second-pass enrichment) pipeline

Some YouTube videos have captions disabled, so `_fetch-missing-transcripts.ts`
can't see them. This pipeline pulls audio, transcribes it locally or via
ElevenLabs Scribe, and writes segments back into the DB so `enrich-from-db.ts`
can pick them up.

## Files

| Script                           | Purpose                                      |
| -------------------------------- | -------------------------------------------- |
| `asr-export-pending.ts`          | Exports work list → `scripts/asr-pending.json` |
| `asr-download-audio.py`          | `yt-dlp` downloads MP3 into `scrape/data/audio/` |
| `asr-transcribe.py`              | ElevenLabs Scribe (default) or local Whisper; writes JSON into `scrape/data/transcripts/` |
| `asr-import-segments.ts`         | Imports transcript JSON as `TranscriptSegment` rows |
| `enrich/enrich-from-db.ts`       | (existing) Runs Claude enrichment from DB segments |
| `enrich/import-enriched.ts`      | (existing) Writes enriched JSON back to the DB |

## Required env

- `DATABASE_URL` — Neon Postgres (already set in `.env`)
- `ELEVENLABS_API_KEY` — only if using the ElevenLabs backend
- `ANTHROPIC_API_KEY` — for the final enrichment step

## End-to-end run

```powershell
# 1. Export the pending work list
npx tsx scripts/asr-export-pending.ts

# 2. Download audio (yt-dlp; cookies.txt used if present)
python scripts/asr-download-audio.py --batch 25

# 3. Transcribe (ElevenLabs by default)
python scripts/asr-transcribe.py --batch 25
# or, for free local ASR:
python scripts/asr-transcribe.py --backend whisper --whisper-model medium

# 4. Import segments into the DB
npx tsx scripts/asr-import-segments.ts

# 5. Run existing enrichment (Claude)
npx tsx scripts/enrich/enrich-from-db.ts
npx tsx scripts/enrich/import-enriched.ts

# 6. Rebuild search index once everything lands
npx tsx scripts/_rebuild-search-text.ts
```

All of these are idempotent: re-running only picks up the remaining work.
Use `--dry-run` / `--batch N` flags to stage conservatively.
