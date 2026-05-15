# CultCodex v2 — QA Checklist

## Pre-Deploy Checks

### Build
- [ ] `npx tsc --noEmit` passes (zero errors)
- [ ] `npx vitest run` passes (83+ tests, 1 known skip: site-header next-auth)
- [ ] Git identity is `fratercem-design <fratercem@gmail.com>` (Hobby plan requirement)

### Data Integrity
- [ ] Run `npx tsx scripts/validate-data.ts` — 0 errors expected
- [ ] Run `npx tsx scripts/_db-status.ts` — verify enrichment counts
- [ ] Check person type distribution: `npx tsx scripts/_person-dist.ts`

### Pages Spot-Check
- [ ] Homepage loads, featured episode displays, stats are non-zero
- [ ] `/episodes` — sort by newest/oldest works, pagination works
- [ ] `/people` — filter by type (host, recurring, guest, mentioned)
- [ ] `/people/psyche` — shows as Host, 1000+ episodes, no duplicate entries
- [ ] `/people/alexander-mcqueen` — shows as Recurring, alt names in Dossier
- [ ] `/people/alexandra-mayers` — separate from McQueen, correct bio
- [ ] `/people/thingthatis` — separate from Mason, shows as Recurring
- [ ] `/search?q=tarot` — returns episodes, topics, quotes with highlights
- [ ] `/search?q=Monica+Foster` — finds Alexandra Mayers via altNames
- [ ] `/stats` — all 10 stats fields render with correct values
- [ ] `/methodology` — governance page loads
- [ ] `/corrections` — GitHub Issues link works
- [ ] `/content-policy` — governance page loads

### SEO
- [ ] `/sitemap.xml` generates without error
- [ ] `/robots.txt` blocks /api/, /auth/, /admin/
- [ ] "mentioned" person pages have `noindex` meta
- [ ] Admin pages have `noindex` meta

### Components
- [ ] ProvenanceBadge shows correct state (TRANSCRIPT-BACKED / INFERRED / NO SUMMARY)
- [ ] DataQualityBadge shows A-F grade on episode pages
- [ ] SuggestCorrection appears on: episodes, people, lore, topics
- [ ] ArchiveNotice appears on person pages
- [ ] Episode cards cap at 3 guests + 3 topics with overflow indicators
- [ ] Host (Psyche) is filtered from guest displays everywhere

## Data Pipeline

### Enrichment
1. Download audio: `python scripts/pipeline.py`
2. Transcribe: `python scripts/transcribe-v2.py` (or Whisper for failed ones)
3. Enrich with Claude: `npx tsx scripts/enrich/enrich.ts`
4. Import to DB: `npx tsx scripts/enrich/import.ts`
5. Validate: `npx tsx scripts/validate-data.ts`

### Deduplication
- Person dedup scripts in `scripts/_dedup-*.ts`
- Topic dedup: `scripts/_merge-topics.ts` and `scripts/_find-topic-dupes.ts`
- Always dry-run first (no `--execute` flag), review output, then execute

## Known Issues
- 64 episodes unenriched (transcripts not available on YouTube)
- 446 quotes with no speaker (enrichment limitation)
- Unknown Speaker 1/2 (36 eps each) — unidentified panel guests
- site-header test fails due to next-auth module resolution (pre-existing)
