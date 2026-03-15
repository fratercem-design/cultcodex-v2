# AI Enrichment Pipeline — Design

**Goal:** Use Claude Sonnet 4.6 to extract structured data (summaries, guests, quotes, lore, topics) from episode transcripts and populate the CultCodex database.

**Decisions:**
- Selective processing — only episodes with transcripts AND missing enrichment data
- Single-pass extraction — one API call per episode extracts all entity types
- JSON intermediate files — reviewable output before DB import
- Batch-controlled — CLI arg controls how many episodes per run

---

## Architecture

```
transcripts/{videoId}.json  ──>  enrich-episodes.ts  ──>  enriched/{slug}.json  ──>  import-enriched.ts  ──>  DB
     (raw captions)              (Claude Sonnet API)       (reviewable output)       (Prisma upserts)
```

Two scripts:
1. **enrich-episodes.ts** — reads transcripts, calls Claude API, saves structured JSON
2. **import-enriched.ts** — reads enriched JSON files, upserts to PostgreSQL via Prisma

## What Claude Extracts (per episode)

From each transcript + title + existing description, Claude returns structured JSON:

| Field | Type | Description |
|-------|------|-------------|
| `summaryShort` | string | 1-2 sentence episode summary |
| `summaryLong` | string | 2-3 paragraph comprehensive summary |
| `cutOfPsyche` | string | Characteristic quote or catchphrase from this episode |
| `guests` | array | `{ name, personType, shortBio }` for anyone appearing or mentioned |
| `quotes` | array | `{ text, speaker, timestampSeconds, context, significance }` — top 3-5 notable quotes |
| `lore` | array | `{ title, summary, canonStatus, category }` — mythology, concepts, recurring themes |
| `topics` | array | Topic name strings discussed in the episode |

## Enrichment Script — `scripts/enrich/enrich-episodes.ts`

- Reads `scripts/scrape/data/youtube-raw.json` for episode metadata
- Reads `scripts/scrape/data/transcripts/{videoId}.json` for transcript text
- Queries DB to find episodes missing enrichment data (selective)
- Batch size controlled via `--batch N` CLI arg (default: 10)
- Rate-limited at 1 request/second
- Saves each result to `scripts/enrich/data/{slug}.json`
- Resumable — skips episodes that already have an enriched JSON file
- Logs progress and failures to `scripts/enrich/enrich-progress.log`

## Import Script — `scripts/enrich/import-enriched.ts`

- Reads all `scripts/enrich/data/{slug}.json` files
- Upserts Person records (by slug), creates EpisodeGuest join table links
- Creates Quote records linked to episode + speaker Person
- Upserts LoreEntry records, creates EpisodeLore join table links
- Updates episode `summaryShort`, `summaryLong`, `cutOfPsyche`
- Updates/creates EpisodeTopic join table links
- Idempotent — safe to re-run after editing JSON files

## Claude Prompt Design

**System prompt:** Defines the show context (Cult of Psyche — tarot, consciousness, mythology, open-panel livestream). Specifies the exact JSON output schema. Instructs Claude to extract only what's present in the transcript, not hallucinate.

**User message:** Contains:
- Episode title
- Episode number and air date
- Existing YouTube description
- Full transcript text (concatenated segments)

**Response format:** Enforced via Zod schema validation. Malformed responses are logged and skipped.

## Zod Output Schema

```typescript
const EnrichmentResultSchema = z.object({
  summaryShort: z.string(),
  summaryLong: z.string(),
  cutOfPsyche: z.string(),
  guests: z.array(z.object({
    name: z.string(),
    personType: z.enum(["guest", "host", "mentioned", "recurring"]),
    shortBio: z.string(),
  })),
  quotes: z.array(z.object({
    text: z.string(),
    speaker: z.string(),
    timestampSeconds: z.number().nullable(),
    context: z.string(),
    significance: z.string(),
  })),
  lore: z.array(z.object({
    title: z.string(),
    summary: z.string(),
    canonStatus: z.enum(["canonical", "speculative", "community_myth", "disputed", "humorous"]),
    category: z.string(),
  })),
  topics: z.array(z.string()),
});
```

## Configuration

Added to `.env` / `.env.example`:

```env
ANTHROPIC_API_KEY=your_key_here
ENRICHMENT_MODEL=claude-sonnet-4-6-20250514
ENRICHMENT_BATCH_SIZE=10
```

## npm Scripts

```json
"enrich:episodes": "npx tsx scripts/enrich/enrich-episodes.ts",
"enrich:import": "npx tsx scripts/enrich/import-enriched.ts"
```

## Cost Estimate

- ~800 episodes with transcripts
- Sonnet 4.6 at ~$0.01/episode
- Full run: ~$8-12
- Batch-controlled: run 10 at a time, inspect, adjust prompts, continue

## Data Directory

```
scripts/enrich/
  enrich-episodes.ts      # Claude API enrichment script
  import-enriched.ts      # DB import from enriched JSON
  lib.ts                  # Shared utilities (Claude client, prompt builder)
  schemas.ts              # Zod schemas for enrichment output
  data/                   # Enriched JSON files (gitignored)
    {slug}.json
  enrich-progress.log     # Progress/failure log (gitignored)
```
