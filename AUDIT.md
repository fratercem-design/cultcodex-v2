# cultcodex.me — Read-Only Audit

**Auditor:** Claude (Claude Code) · **Date:** 2026-08-28
**Repo:** `C:\Users\johnb\Projects\cultcodex-v2` (`fratercem-design/cultcodex-v2`, **private**)
**Mode:** Read-only. No writes to production, no git side effects, no dependency changes.
`AUDIT.md` is the only file this audit created.

> **Evidence convention.** Claims are tagged **[VERIFIED]** (a command was run or an HTTP
> request made; output reproduced) or **[INFERRED]** (read from source, not executed).
> Section 4 of the final report restates both lists.

---

## Phase 0 — Ground truth

### 0.1 Git state  [VERIFIED]

```
$ git fetch origin
From https://github.com/fratercem-design/cultcodex-v2
 * branch  fix/auth-env-check-blocks-build -> FETCH_HEAD

$ git rev-parse --abbrev-ref HEAD
fix/auth-env-check-blocks-build

$ git rev-list --left-right --count HEAD...origin/master
4       5
```

- **Current branch:** `fix/auth-env-check-blocks-build` — not the production branch.
- **Divergence:** 4 ahead / 5 behind `origin/master`.
- **Production branch is `master`**; `origin/master` HEAD = `22f465f` *"Fix shell quoting
  that made the migration diagnosis fail silently (#133)"*.
- **Uncommitted changes: 23 paths** (16 modified, 7 untracked):

```
 M .env.example                                M scripts/psychenomicon-art/run.ts
 M .github/workflows/migrate.yml               M scripts/psychenomicon-art/upload-railway.ts
 M package.json                                M scripts/psychenomicon-art/visual-bible.ts
 M scripts/ingest/lib.ts                       M src/app/api/stripe/book-checkout/route.ts
 M scripts/psychenomicon-art/README.md         M src/components/layout/site-footer.tsx
 M scripts/psychenomicon-art/art-daemon.ps1    M src/lib/nav.ts
 M scripts/psychenomicon-art/art-pipeline.log
 M scripts/psychenomicon-art/images.ts
 M scripts/psychenomicon-art/llm.ts
 M scripts/psychenomicon-art/prompts.ts
?? public/merch/          ?? scripts/handbook/          ?? src/app/handbook/
?? src/app/shop/          ?? src/lib/merch.ts           ?? scripts/psychenomicon-art/__tests__/
?? scripts/psychenomicon-art/run-hcnsec.ps1
```

`scripts/psychenomicon-art/art-pipeline.log` is a **tracked log file with uncommitted
churn** — a build artifact under version control.

- **Unshipped work: 41 of 68 remote branches carry commits not in `master`** (27 fully
  merged). Oldest dates to 2026-04-23.

| Ahead | Branch | Last commit |
|---|---|---|
| 6 | `origin/wave2-seo-lexicon` | 2026-07-13 |
| 5 | `origin/claude/api-key-config-olW0t` | 2026-05-31 |
| 4 | `origin/ci/migrate-diagnose` | 2026-08-26 |
| 4 | `origin/claude/add-mythology-pack` | 2026-05-31 |
| 4 | `origin/claude/continue-cultcodex-D49VI` | 2026-04-23 |
| 3 | `origin/feat/appearance-toggles` | 2026-06-22 |
| 2 | `origin/fix/migrate-diagnose-quoting` · `claude/eslint-debt-fix` · `claude/character-profiles-myth-pages` | May–Aug |
| 1 | 32 further branches, incl. **3 open Dependabot PRs** | Apr–Aug |

### 0.2 Stack inventory  [VERIFIED]

| Item | Value |
|---|---|
| Framework | Next.js `^16.3.1` local / `^16.3.2` on master — **App Router** |
| React | `19.2.8` |
| Package manager | npm (`package-lock.json` v3); **no `packageManager` field** |
| Node | local `v24.18.0`, npm `12.0.2`; `engines.node: ">=22"`; **no `.nvmrc`** |
| TypeScript | `^5`, **`strict: true`**, `target: ES2017` |
| ORM | Prisma `^7.9.1`, generator `prisma-client` → `src/generated/prisma` |
| Datasource | `provider = "postgresql"`, URL from env — hosted on **Xata** |
| Auth | `next-auth@5.0.0-beta.31` (pre-release) + `@auth/prisma-adapter` |
| Payments | `stripe@^22.5.0` |
| Validation | `zod@^4.4.3` |
| Tests | `vitest@^4.1.10`, jsdom |
| Lint | `eslint@^9` flat config |
| CSS | Tailwind `^4` |
| Deploy | Vercel; `vercel.json` → `buildCommand: npm run vercel-build` |

**`vercel.json` crons:** `/api/cron/ingest-latest` `0 15 * * *`; `/api/cron/gift-sequence`
`0 17 * * *`. No `regions`, `functions`, memory or timeout config — all defaults.

**`next.config.ts`:** `poweredByHeader: false`; full security-header block (HSTS, CSP,
X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP, CORP);
image `remotePatterns` for 5 hosts with `formats: ["image/webp"]`; immutable cache headers
for fonts/`_next/static`/images; one permanent redirect `/pricing → /premium`.

### 0.3 Repo map  [VERIFIED]

| Metric | Exact count |
|---|---|
| `src/**` `.ts` + `.tsx` | **770** |
| `scripts/**` `.ts`/`.mjs`/`.py` | **185** |
| Test files | **30** |
| App Router **page** routes | **161** |
| App Router **API** routes | **92** |
| Prisma models | **81** |
| Prisma migrations on disk | **53** |
| `prisma/schema.prisma` | 1,616 lines |
| `package.json` scripts | **48** |

**Entry points:** `middleware.ts` (www→apex 301 only — it does *not* guard `/admin`),
`src/app/layout.tsx`, `scripts/vercel-build.mjs`.

**Background jobs:** the 2 Vercel Crons above; `.github/workflows/keep-alive.yml` pings
`/api/keep-alive` every 5 min to stop the Xata branch hibernating; a `workflow_dispatch`
"Run DB Migrations" workflow.

### 0.4 What the app does, end to end  [INFERRED from source; route/model counts VERIFIED]

cultcodex.me is the public archive and lore engine for the Cult of Psyche livestream
project. YouTube and Rumble content is scraped into `Episode` rows by `scripts/scrape/*`
and the daily `/api/cron/ingest-latest` cron. Transcripts are fetched per episode —
YouTube captions first, **Supadata** as a paid fallback — and stored as timestamped
`TranscriptSegment` rows; what neither source can supply is routed through a local Whisper
ASR chain (`asr:export → asr:download → asr:transcribe → asr:import`). An LLM enrichment
pass extracts topics, people, quotes, symbols and lore entities, producing the 11,945 topic
and 8,816 lore pages now in the sitemap. Segments are additionally embedded into pgvector
for semantic search. The public site renders episodes with full inline timestamped
transcripts plus per-entity, graph and lexicon pages. **The Psychenomicon** is the book
layer: an admin-triggered pipeline (`/api/admin/psychenomicon/generate[-batch]`) turns
enriched transcripts into numbered chapters in one atomic transaction, a separate art
pipeline generates and uploads per-chapter illustrations, and the result is served at
`/psychenomicon/*` (2,809 live URLs) with one-time purchases via `BookEdition`/
`BookPurchase` through Stripe. A second product surface — tarot/oracle cards, packs,
readings, gifting, a members' area and a metered Oracle LLM console — sits alongside it
with its own Stripe checkout and entitlements. Auth is Google OAuth plus magic links via
NextAuth v5 beta. A push to `master` deploys to Vercel **and** applies Prisma migrations to
the production Xata database in the same build.

---

## Phase 1 — Build and type health

All commands run against the working tree after a clean `npm ci`.

| Check | Command | Exit | Result |
|---|---|---|---|
| Install | `npm ci` | **0** | clean |
| Prisma client | `npx prisma generate` | **0** | `Generated Prisma Client (7.9.1) … in 349ms` |
| Typecheck | `npx tsc --noEmit` | **0** | **0 errors** |
| Build | `npx next build` | **1** | compiles; **fails at prerender** (no local DB) |
| Lint | `npx eslint .` | **1** | **102 problems — 1 error, 101 warnings** |

### 1.1 Typecheck — clean, but narrower than it looks  [VERIFIED]

`npx tsc --noEmit` reports **0 errors**. However `tsconfig.json` has
`"exclude": ["node_modules", "scripts", …]` — **all 185 files under `scripts/` are excluded
from typechecking.** That is the entire ingest, enrichment, ASR, art and card-generation
toolchain, unchecked. `next build` type-checks only what the app graph imports, so those
files are never verified by any gate.

### 1.2 Build  [VERIFIED — failure is environmental, not a code defect]

```
▲ Next.js 16.3.1 (Turbopack)
- Environments: .env.local, .env
✓ Compiled successfully in 11.3s
  Running TypeScript ...
  Finished TypeScript in 10.2s ...
  Generating static pages using 15 workers (0/195) ...
Error: DATABASE_URL is not set (or is not a valid postgres:// URL)
    at Proxy.a (src\lib\db.ts:41:22)
    at g (src\lib\queries\stats.ts:51:20)
    at async D (src\app\layout.tsx:128:34)
⨯ Next.js build worker exited with code: 1
```

Compile and TypeScript both pass. The build then dies in prerender because this machine has
no working `DATABASE_URL` — a known local constraint, not a repo defect. Grouped counts
from the 7,354-line log:

| Count | Message |
|---|---|
| 665 | `Error: DATABASE_URL is not set (or is not a valid postgres:// URL)` |
| 5 | `Failed to download dynamic font. Status: 400` |
| 2 | `Error occurred prerendering page` — `/fun`, `/articles` |
| 1 | `Warning: Custom Cache-Control headers detected for … /_next/static/:path*` |

**A production build could not be verified locally.** See "Checks I could not run".

**The font errors are real and reproduce in production builds.** OG-image generation
(Satori) requests a webfont per glyph for `✦ ◎ ❀ ◉ ◐` and gets HTTP 400 each time. These
glyphs render as tofu in generated social-share images, and the build takes a hard runtime
dependency on an external font service.

### 1.3 Lint — 102 problems  [VERIFIED]

**1 error** (`react-hooks/set-state-in-effect`):

```
src/components/gameshow/game-show.tsx:93:21
> 93 |   useEffect(() => { setProgress(loadProgress()); }, []);
     |                     ^^^^^^^^^^^ Avoid calling setState() directly within an effect
```

`npm run lint` is therefore **red on the working tree**, and `next build` does not run
ESLint in Next 16 — so nothing in the pipeline blocks on it.

**101 warnings**, grouped:

| Count | Rule | Notes |
|---|---|---|
| 55 | `@typescript-eslint/no-unused-vars` | 16 in `src/lib/cards/card-art.tsx` alone |
| 12 | `@next/next/no-img-element` | raw `<img>` instead of `next/image` — see Phase 6 |
| 10 | `@next/next/no-location-assign-relative-destination` | `window.location.href` for internal nav — full page reloads |
| 6 | `@typescript-eslint/no-unused-expressions` | statements with no effect |
| 4 | *Unused `eslint-disable` directive* | stale suppressions |
| 3 | `prefer-const` | |
| 2 | `react-hooks/exhaustive-deps` | one with genuinely missing deps (`vault-app.tsx:223`) |

### 1.4 `any` leakage and suppression clusters  [VERIFIED]

This is the healthiest part of the codebase, and the numbers are better than the file count
would suggest. Excluding `src/generated/`:

- `@ts-ignore` / `@ts-expect-error` in `src/`: **0**. None. Nothing suppresses the compiler.
- Explicit `: any` / `as any` / `<any>` in `src/`: **3 occurrences, total.**
  - `src/components/stats/guest-radial-chart.tsx:32` — Recharts tooltip props (typical).
  - `src/components/stats/topic-pulse-chart.tsx:34` — same.
  - **`src/lib/queries/semantic.ts:143`** — `const rows: any[] = await
    prisma.$queryRawUnsafe(sql)`. This is the one on a core path: the semantic-search
    result set is entirely untyped and every per-row field access below it is unchecked.
- `eslint-disable` comments in `src/`: **40**, spread thin (max 3 in any one file:
  `src/components/gameshow/game-show.tsx`). No suppression cluster hiding a bad module.
  ESLint reports **4 of the 40 as unnecessary** — stale suppressions for problems that no
  longer exist.

There is no `any` leakage problem and no suppression problem in this codebase. The single
finding worth acting on is the untyped raw-SQL result in `semantic.ts`.

### 1.5 Dead and duplicate code  [INFERRED]

- `prisma/schema.prisma.pre-format` and `prisma/schema.prisma.txt` sit beside the real
  schema — two stale copies of a 1,616-line file that will drift silently.
- Root-level strays that look like scratch, not source: `check_user.ts`,
  `discord_message.txt`, `out/`, `tsconfig.tsbuildinfo` (build artifact), and
  `docker-compose.yml` for a stack that no longer runs locally.
- `scripts/` contains 14 files prefixed `_` (`_fix-emma2.ts`, `_quote-cleanup.ts`,
  `_dedup-tti.ts`, …) — one-shot repair scripts kept in the tree, several of which the
  linter flags for unused variables.
- The `getArchiveCounts` / `getArchiveStats` duplication called out in the header comment of
  `src/lib/queries/stats.ts` has been **resolved** — `getCounts()` is now the single source.
- `upload-railway.ts` and `railway_check`-era naming survive in
  `scripts/psychenomicon-art/` despite the Railway→Vercel migration being complete.

---

## Phase 2 — Tests

### 2.1 Suite result  [VERIFIED]

```
$ npm test          # vitest run
 RUN  v4.1.10 C:/Users/johnb/Projects/cultcodex-v2
 Test Files  30 passed (30)
      Tests  167 passed (167)
   Duration  43.84s (transform 5.22s, setup 93.08s, import 57.42s,
                     tests 7.02s, environment 254.69s)
```

**167 passed / 0 failed / 0 skipped / 167 total**, 30 files, **43.84s**.
(The brief said "~145-test suite"; the actual figure is **167**.)

Note the shape of that runtime: **7.02s of actual test execution** inside 43.84s wall
clock. 254.69s of cumulative jsdom environment setup across workers dominates — every one
of the 30 files pays for a jsdom environment, including the 20 that never touch the DOM.

### 2.2 Coverage — could not be measured  [VERIFIED that it is unavailable]

```
$ node -e "require.resolve('@vitest/coverage-v8')"
coverage-v8 ABSENT
```

No coverage provider is installed and `vitest.config.ts` declares no `coverage` block.
Measuring coverage requires `npm i -D @vitest/coverage-v8`, which is outside the read-only
constraint. Listed under "Checks I could not run without approval". **Everything below is
therefore file-level reachability analysis, not measured coverage.**

### 2.3 What is tested, and the hole in the middle  [VERIFIED by file inventory]

The 30 test files:

| Area | Files | Covers |
|---|---|---|
| `scripts/` pipeline libs | 8 | ingest/enrich/scrape schema + lib helpers, art images |
| UI components | 7 | primitives, episode card, sort bar, search input, signup, email gate |
| `src/lib` utilities | 12 | format, timestamps, rate-limit, oracle-cache, initiate, episode JSON-LD, SSE event bus + log |
| `src/lib/queries` | 4 | episodes, helpers, search, stats |
| smoke | 1 | — |

**Tests covering the 92 API route handlers: 0.** Not one `src/app/api/**/route.ts` is
imported by any test. That includes `stripe/webhook`, `stripe/checkout`,
`stripe/book-checkout`, all 27 `admin/*` routes, both cron routes, `cards/*` (14 routes),
`claim/*`, and `oracle/ask`.

Against the brief's specific asks:

| Path | Tested? |
|---|---|
| Transcript ingestion | **Partially** — `scripts/ingest/__tests__/{lib,schemas}.test.ts` cover parsing/validation helpers. The DB-writing import path is untested. |
| Chapter writes | **No.** `generate-chapter-core.ts` — including the atomic transaction — has zero tests. |
| Enrichment | **Partially** — `scripts/enrich/__tests__/{lib,schemas,import-enriched}.test.ts` cover schema validation and the import transform. The `/api/admin/enrich-*` routes are untested. |
| Counter logic | **Yes** — `src/lib/queries/__tests__/stats.test.ts` exists. |

### 2.4 Test-quality flags  [VERIFIED]

- **Skipped / `.only` / empty-assertion tests: 0.** No `it.skip`, `describe.skip`,
  `.todo` or `.only` anywhere; every test body contains at least one `expect`.
- **No test hits a live network or database.** Five test files import `@/lib/db`
  (`queries/{episodes,helpers,search,stats}.test.ts`, `lib/initiate.test.ts`) — every one
  of them wraps it in `vi.mock("@/lib/db", …)` at the top of the file, so the real Prisma
  client is never constructed. Verified by reading each. Good.
- `src/lib/sse/__tests__/event-bus.integration.test.ts` is named "integration" but runs
  fully in-process against the in-memory bus — the name overstates what it proves.
- `src/lib/format/__tests__/format.test.ts:2` imports `formatRelativeDate` and never uses
  it — a function someone intended to test and didn't.
- The mocking is honest — I found no test that mocks the unit under test.

### 2.5 Top 5 untested paths where a bug is user-visible or data-destructive  [INFERRED]

1. **`src/app/api/stripe/webhook/route.ts`** — the only place a payment becomes an
   entitlement. A regression silently takes money without granting access, or double-grants.
   Zero tests; no local way to replay a webhook.
2. **`src/app/api/admin/data-ops/route.ts`** (1,500+ lines, ~20 destructive ops incl.
   `merge-people`, `reassign-quotes`, `unlink-episodes`, `clean-episode-summaries`, and raw
   `$executeRawUnsafe` DDL). This is the most data-destructive file in the repo and has no
   tests at all.
4. **`src/app/api/admin/psychenomicon/generate-chapter-core.ts`** — the atomic chapter
   write, chapter numbering, and entity/thread upserts. See Phase 3.4.
5. **`src/app/api/cron/ingest-latest/route.ts`** — runs unattended daily and writes Episode
   rows. A slug or dedupe regression corrupts the archive silently overnight.
3. **`src/app/api/cards/open-pack/route.ts` and `cards/evolve`** — mint paid-for card
   inventory. A bug here is an economy exploit or lost purchases.

---

## Phase 3 — Data layer and integrity

### 3.1 Schema shape  [VERIFIED]

81 models, 1,616 lines, **101 `@@index` declarations and 19 `@@unique` constraints.**
Indexing is genuinely thorough — this is not an under-indexed schema. The hot paths are
covered: `Episode` carries `@@index([airDate])`, `([status])`, `([seriesId])` and the
composite `([airDate, status])`; `TranscriptSegment` carries `@@index([episodeId])`.

Real defects found:

**a. Missing composite index on the single hottest query.** `TranscriptSegment` has:

```prisma
@@index([episodeId])
@@index([startSeconds])
```

The query that runs on every episode page is
`where: { episodeId }, orderBy: { startSeconds: "asc" }` (`src/lib/queries/episodes.ts:20`).
Postgres can use `episodeId` for the filter but must then **sort up to ~7,900 rows** per
request. The correct index is `@@index([episodeId, startSeconds])`. Meanwhile the standalone
`@@index([startSeconds])` is close to useless — `startSeconds` is never filtered globally,
only within an episode — and it costs a write on every one of the **4,863,725** segment rows.

**b. Four redundant indexes duplicating a `@unique`**, each an extra index maintained on
every insert for no read benefit:

| Model | Redundant declaration |
|---|---|
| `Episode` | `@@index([episodeNumber])` — already `@unique` |
| `Subscriber` | `@@index([email])` — already `@unique` |
| `PsychenomiconChapter` | `@@index([chapterNumber])` — already `@unique` |
| `WeeklyDigest` | `@@index([weekOf])` — already `@unique` |

**c. Cascade / orphan behaviour.** `TranscriptSegment.episode` declares `onDelete: Cascade`,
so deleting an episode correctly removes its segments. I did **not** audit all 81 models'
referential actions — see "inferred".

### 3.2 Schema drift — the significant finding  [VERIFIED]

**20 of the 81 models have no `CREATE TABLE` in any of the 53 committed migrations.**
Verified two ways: (1) no migration file contains the quoted table name; (2) the migrations
create **59 distinct tables** against **81 models**. There are **no `@@map` directives** in
the schema (`grep -c '@@map'` → 0), so this is not a naming mismatch.

Models with no migration:

```
CodexSession   CodexAccount   VerificationToken   EpisodeReaction   CodexComment
CommentReport  NotificationPreference  Favorite   OracleChunk       CardGift
Spread         SpreadPosition Reading             ReadingCard       CardSet
CardSetMember  UserSetCompletion       CardInstance  OracleAffinity  SeasonalEvent
```

That list includes the **NextAuth session/account/verification tables** and the **entire
tarot reading subsystem**.

**How they got into production: DDL executed through HTTP admin endpoints.**

```
src/app/api/admin/data-ops/route.ts:1251  CREATE TABLE IF NOT EXISTS "CardGift" (…
src/app/api/admin/data-ops/route.ts:1266  CREATE INDEX IF NOT EXISTS "CardGift_cardId_idx" …
src/app/api/admin/data-ops/route.ts:1268  ALTER TABLE "CardGift" ADD CONSTRAINT …
src/app/api/admin/data-ops/route.ts:288   ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "name" TEXT
src/app/api/admin/seed-cards/route.ts:41  ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "personality" TEXT
… 15 further ALTER/CREATE statements across the two routes
```

The `apply-card-gift-migration` op carries the comment *"(Vercel builds don't run prisma
migrate deploy)"*. **That justification is now stale** — `scripts/vercel-build.mjs` runs
`prisma migrate deploy` on every production build. The workaround outlived its reason and
the schema drifted permanently.

**Consequences:**

1. The migration history **cannot rebuild the production database.** A fresh environment
   (`prisma migrate deploy` from zero) yields a DB missing 20 tables; auth and card features
   fail immediately.
2. `prisma migrate diff` / `migrate dev` against a clean shadow DB will want to *create*
   those tables, so the next generated migration risks colliding with live objects.
3. There is no record of what the live schema actually is, other than the live schema.

I could **not** run `prisma migrate status` — it requires a live `DATABASE_URL`, which this
machine does not have. See "Checks I could not run without approval".

### 3.3 Query review  [VERIFIED by scan; impact INFERRED]

A balanced-paren scan of all tracked `src/**/*.ts(x)` (excluding `src/generated`) found
**136 `findMany` calls with no `take:`**, across 38 models — `episode` (24), `person` (24),
`episodeGuest` (7), `topic` (6) leading.

Most are legitimately bounded by a narrow `where`. The ones that are not:

| Location | Query | Rows today |
|---|---|---|
| `src/lib/queries/topics.ts:24` | all topics | **11,944** |
| `src/lib/queries/lore.ts:23` | all lore entries | **8,815** |
| `src/lib/queries/people.ts:80` | all people | **1,234** |
| `src/lib/queries/graph.ts:45,57,107` | all people + all episode-guest edges | 1,234 + n |
| `src/lib/queries/connection-path.ts:59,96,107,185,195` | **five** unbounded loads in one request | 1,234 × 5 |
| `src/app/sitemap.ts:14,18,19,20` | every episode, person, lore entry, topic | **24,916 rows per sitemap request** |

**The single most expensive query is not on that list**, because it is an `include`:

```ts
// src/lib/queries/episodes.ts:20 — episodeInclude()
segments: { orderBy: { startSeconds: "asc" as const } },
```

No `take`, no pagination. Every episode-detail request loads **every** transcript segment
for that episode. Measured live on `/episodes/get-your-freak-on-friday`: **7,906 segments**
in a single response.

**N+1:** the query layer uses Prisma `include`/`select` throughout rather than per-row
lookups; I found no classic N+1 loop in `src/lib/queries/`. The loops that exist are inside
admin batch routes and the chapter transaction, where sequential writes are intentional.

### 3.4 The atomic chapter write — traced  [VERIFIED by reading; runtime behaviour INFERRED]

**Question asked: can a crash mid-write leave a half-written chapter? For the chapter itself
— no.** `src/app/api/admin/psychenomicon/generate-chapter-core.ts:285-364` wraps every write
in one interactive transaction:

```ts
const chapter = await prisma.$transaction(
  async (tx) => {
    … tx.psychenomiconEntity.upsert(…)          // N entities
    … tx.psychenomiconThread.upsert(…)          // M threads
    const created = await tx.psychenomiconChapter.create({ …
      entityAppearances: { create: … },
      threadChapters:    { create: … },
    })
    … tx.archetypeEvent.create(…)               // N events
    return created;
  },
  { maxWait: 5_000, timeout: 20_000 }
);
```

Entities, threads, the chapter, its join rows and the archetype events are all one unit. The
LLM call happens **before** the transaction opens, so model latency does not burn transaction
time. The in-code comment shows this was a deliberate fix for exactly the failure mode the
brief asks about. **This is good work and it holds.**

Three residual defects:

**a. Chapter numbering races (Medium).** `nextChapterNumber` is computed at **line 187,
outside and well before the transaction** — after which a 30–60s LLM call intervenes. Two
concurrent generations read the same `lastChapter` and both write the same `chapterNumber`.
`chapterNumber` and `slug` are both `@unique`, so the database correctly rejects the second —
but the rejection surfaces as an unhandled Prisma `P2002`, which `generate/route.ts:25-29`
turns into a **500 with the raw Prisma message**, and the caller has already paid for LLM
output that is then discarded. Fix: derive the number inside the transaction, or catch
`P2002` and retry.

**b. `generate-batch` will time out (High, operationally).** `maxDuration = 300` is declared
on both routes, but on a Vercel Hobby plan the real ceiling is 60s and that export does not
raise it. A batch is capped at 20 episodes and each chapter is advertised at 30–60s, so
**any batch beyond one or two episodes exceeds the wall.** Because each chapter commits in
its own transaction, the *data* stays consistent and partial progress is kept — but the
function is killed before returning, Vercel serves a **504 `FUNCTION_INVOCATION_TIMEOUT`
HTML page**, and the admin client's `await res.json()` throws on HTML. The operator sees a
generic parse error and no record of which chapters succeeded.

**c. 20s transaction timeout vs Xata (Low).** The transaction does `2N + M + 2` sequential
round trips. Against a **hibernating** Xata branch a cold first round trip can consume a
large share of the 20s budget; exceeding it aborts the whole chapter after the LLM spend.
Correct behaviour, expensive failure.

**Not covered by the transaction:** chapter *art*. `artImageUrls` / `artGeneratedAt` are
written later by a separate pipeline, so a chapter can legitimately exist with no art. By
design, not a defect.

### 3.5 Raw SQL  [VERIFIED]

**26 raw-SQL call sites** in `src/` (excluding the generated client): **3 tagged-template**
`$queryRaw` (parameterized, safe) and **23 `$queryRawUnsafe` / `$executeRawUnsafe`.**

Of the 23, 22 are in admin-gated routes (`data-ops`, `db-size`, `embed`, `seed-cards`) and
`src/lib/llm-budget.ts`, and interpolate only server-side constants.

**The one that matters is `src/lib/queries/semantic.ts:143`:**

```ts
const rows: any[] = await prisma.$queryRawUnsafe(sql);
```

`sql` is built by string concatenation over `eraDateStart`, `eraDateEnd`, `excludeEpisodeId`,
per-concept `threshold`, and `limit`:

```ts
extraFilters.push(`e."airDate" >= '${options.eraDateStart.toISOString()}'`);
… `>= ${c.threshold ?? defaultThreshold}`
… `LIMIT ${limit}`
```

`threshold` and `limit` are interpolated **with no quoting and no type coercion at this
layer.** I traced every caller:

| Caller | `threshold` | `limit` |
|---|---|---|
| `src/app/api/search/semantic/route.ts:70-81` | `Math.min(Math.max(n,0),1)`, non-numbers → `0.6` | `Math.min(Math.max(Math.floor(n),1),50)`, non-numbers → `20` |
| `src/components/episodes/episode-cross-ref.tsx:22` | literal `0.58` | literal `5` |
| `src/components/people/person-cross-ref.tsx:23` | literal `0.56` | literal `5` |
| `src/components/quotes/quote-cross-ref.tsx:20` | literal `0.62` | literal `4` |

**There is no exploitable SQL injection today** — 4 of 4 callers sanitize, and `eraId` is
resolved through a lookup table rather than interpolated. But the safety lives entirely in
the callers, the function is exported and reusable, and the guarantee is documented only in
a comment (*"safe because they are pure numbers generated by us"*). A fifth caller that
forwards a request value reintroduces injection on a **public, `prisma`-privileged** query.
Parameterize `limit`/`threshold`, or coerce with `Number()` inside `semanticSearch`.

---

## Phase 4 — Security

### 4.1 Secrets  [VERIFIED]

**Committed credentials: 2 secrets in 1 file.** Repo-wide scan of tracked files at `HEAD`
for live-key patterns (`sk-`, `sk_live_`, `whsec_`, `AIza`, `ghp_`, `AKIA`, private-key
headers, credentialed `postgres://` URLs), excluding `package-lock.json` and `src/generated`:

```
scripts/enrich/browser-enrich-topics.js:9
  const SECRET  = "2633f3d5c23cfa60765748e5de4dcd633ac100e3e8f8b241"
scripts/enrich/browser-enrich-topics.js:10
  const API_KEY = "sk-ant-api03-<REDACTED — 95 chars, full value in the file>"
```

Everything else matching was a placeholder (`.env.example:2`,
`docs/plans/2026-03-07-…md:138` — both literal `USER:PASSWORD`).

- **Present in `origin/master` HEAD** — confirmed with `git show origin/master:…`.
- **Introduced 2026-04-29** in `3cc94ef` *"chore: browser console enrichment script for topic
  descriptions"* (author `Claude`), carried through `5e51de0` and `0e640f6`. Exposed for
  **~4 months**.
- **No `.env` file has ever been committed** — `git log --all --diff-filter=A` over `.env*`
  returns only `.env.example`. `.gitignore` covers `.env*` with an `!.env.example` exception,
  and `git check-ignore` confirms `.env` and `.env.local` are ignored. **No deleted secret
  files in history.** That part is clean.
- **The repo is private** (`gh repo view` → `"visibility":"PRIVATE"`), which is the only
  thing keeping this out of actively-exploited territory.

**Why the first value is the more dangerous of the two.** The 48-hex string is the
`ENRICH_SECRET`. The repository's own `CLAUDE.md` describes it as the value that *"protects
all `/api/admin/*` routes"*.

It authenticates **`POST /api/admin/grant-access`**, which — verified by reading
`src/app/api/admin/grant-access/route.ts:32-42` — writes:

```ts
data: {
  role: "admin",
  isLifetimeMember: true,
  subscriptionStatus: "active",
  subscriptionTier: "system",              // the $25/mo top tier
  currentPeriodEnd: new Date("2099-01-01"),
  isPublicMember: true,
}
```

So a single unauthenticated HTTP request carrying that header promotes any account to **full
production admin plus a lifetime top-tier subscription running to 2099**. `src/lib/auth.ts:62-74`
resolves admin from `ADMIN_EMAILS` *or* the `CodexUser.role` column, so the DB write is
sufficient — no env change needed. The same credential also unlocks `/api/admin/data-ops`
(~20 destructive ops plus raw DDL), `/api/admin/embed`, `/api/admin/episodes`,
`/api/admin/nightmares` and `/api/admin/seed-cards`.

**I did not test whether either credential is still live.** Doing so would mean using
someone's credentials against production and a third-party billing account. Both must be
treated as compromised and rotated regardless.

### 4.2 API route authn/authz — 92 routes  [VERIFIED: all 27 admin routes read; 6 probed live]

This is the strongest area of the codebase. `src/lib/admin-guard.ts` is well built:
constant-time comparison via `timingSafeEqual`, length mismatch handled without throwing, and
**every guard fails closed when its env var is unset** (returns 503, never "allow").

**All 27 `/api/admin/*` routes are guarded.** My first pass flagged 13 as unguarded; that was
my grep being too narrow, and re-reading each file disproved it. The real distribution:

| Guard | Routes |
|---|---|
| `requireAdmin()` / `adminOnly()` — session, role `admin` | 13 |
| `enrichSecretMatches` / `requireEnrichSecret` — `X-Enrich-Secret` | 6 |
| HMAC `?key=` = `base64url(HMAC-SHA256(AUTH_SECRET,"<route>"))` **or** admin session | 3 (`build-book`, `db-size`, `migrate-art-r2`) |
| `getCurrentUser()` + explicit `role === "admin"` | 3 |
| `PEOPLE_MAINT_KEY` / `X-Enrich-Secret` | 1 (`data-ops`) |
| session **or** enrich secret | 1 (`grant-access`) |

Both cron routes use `requireBearerSecret(req, "CRON_SECRET")`.

**Live verification** — production actually enforces it:

```
GET  /api/admin/people/lookup?q=…   → 403 {"error":"Admin access required"}
GET  /api/debug-auth                → 403 {"error":"Admin only"}
GET  /api/cron/ingest-latest        → 401 {"error":"Unauthorized"}
GET  /api/cron/gift-sequence        → 401 {"error":"Unauthorized"}
POST /api/stripe/webhook  {}        → 400 {"error":"Missing signature"}
POST /api/search/semantic {…}       → 403 {"error":"Deep search requires an active subscription."}
```

`middleware.ts` does **not** guard `/admin` — it only does a `www` → apex 301. All protection
is per-route. That works today because coverage is complete, but a new `admin/*` route that
forgets its guard ships unprotected with nothing to catch it.

**Input validation** is inconsistent but not obviously exploitable: `search/semantic` and
`oracle/ask` validate and clamp carefully (best-in-repo); several admin routes take
`await req.json()` and destructure without a schema. `zod` is a dependency and is used in
`scripts/`, but I found no `zod` schema guarding an API route body.

**Error-message leakage:** `src/app/api/admin/psychenomicon/generate/route.ts:28` returns
`msg.slice(0, 500)` — raw internal error text — to the client. Admin-gated, so Low.

### 4.3 Injection, XSS, SSRF, traversal, redirects  [VERIFIED]

| Class | Result |
|---|---|
| **SQL injection** | No exploitable path. One injection-prone construction — see 3.5. |
| **XSS via `dangerouslySetInnerHTML`** | **24 call sites, all 24 traced.** **22** are JSON-LD through `jsonLdScript()` (`src/lib/seo.ts:22`), which escapes `<`, `>`, `&`, U+2028, U+2029 — **correct** (this includes `src/components/JsonLd.tsx:14` and `src/app/symbols/[slug]/page.tsx:79`, the latter being the July-2026 audit's L1 finding, since **fixed**). **1** is `src/lib/cards/card-art.tsx:553`, server-generated SVG built from numeric/palette values. **1** is `src/app/layout.tsx:158`, a static string-literal theme-bootstrap script with no interpolation. **No user or transcript content reaches `dangerouslySetInnerHTML` anywhere.** |
| **Transcript rendering** | Segments render as plain React children (`<p>{seg.text}</p>`, `transcript-viewer.tsx:280`) — auto-escaped. Safe. |
| **CORS** | No `Access-Control-Allow-*` header set anywhere in `src/`. Default same-origin. Correct. |
| **SSRF** | No `fetch()` of a request-supplied URL in any of the 92 routes. |
| **Path traversal** | No `readFile` / `createReadStream` / `path.join` with request input in any API route. |
| **Open redirect** | No `redirect()` taking a request-supplied destination. |

One hardening note (Low): `/api/psychenomicon-art/[slug]/[slot]` allowlists `slot` against a
4-value `Set` but passes `slug` unvalidated into `artKey(slug, slot)` → an R2 object key.
S3-compatible stores treat `../` literally so this is not traversal, but the slug should be
pattern-checked for symmetry with `slot`.

### 4.4 Dependency risk  [VERIFIED]

```
$ npm audit
{"info":0,"low":3,"moderate":3,"high":13,"critical":3,"total":22}
```

**The three criticals are the auth stack, and production is running them.** `origin/master`
pins `next-auth@5.0.0-beta.31`, and its lockfile pins `@auth/core@0.41.2`:

| Advisory | CVSS | Affects |
|---|---|---|
| **Configuration errors can cause existence-based auth checks to fail open** (auth object populated with an error) — GHSA-8fpg-xm3f-6cx3 | — | `>=5.0.0-beta.0 <=beta.31` |
| `getToken()` throws an uncaught exception on malformed Bearer headers — GHSA-xmf8-cvqr-rfgj | **7.5** | same |
| OAuth state, nonce and PKCE cookies not bound to the provider that created them — GHSA-x445-f3h2-j279 | **6.8** | same |
| Email normalizer validates before Unicode normalization → homoglyph `@` bypass — GHSA-7rqj-j65f-68wh | — | same |

The first is the one to care about: **this app's entire admin surface is existence-based** —
`getCurrentUser()` then `user?.role === "admin"`, in 20+ places. The fourth matters because
the app offers **magic-link email sign-in** (`/api/auth/magic`), which is exactly the
homoglyph bypass's target.

> **CORRECTION (issued after further verification).** My first pass reported that PR #132
> "did not land the next-auth bump". **That was wrong**, and the correction matters because it
> changes the fix. PR #132 *was* merged (2026-08-27) and `origin/master`'s **lockfile does
> resolve `next-auth@5.0.0-beta.32`**. The advisories nevertheless remain live on production,
> for a different and more specific reason, established below by auditing `origin/master`'s
> own `package.json` + `package-lock.json` in isolation.

**Root cause: an `overrides` pin holds the vulnerable package in place.**
`package.json` (both `origin/master` and the local branch) ends with:

```json
"overrides": { "@auth/core": "0.41.2" }
```

`next-auth@5.0.0-beta.32` would normally pull `@auth/core >= 0.41.3`, which is the patched
version. The override drags it back to **0.41.2** — the last vulnerable release. Verified
against production's exact manifest:

```
$ (origin/master package.json + package-lock.json, audited in isolation)
PRODUCTION SUMMARY: {"info":0,"low":3,"moderate":3,"high":13,"critical":3,"total":22}
installed: next-auth 5.0.0-beta.32
           @auth/core 0.41.2          <-- forced by overrides, vulnerable
           @auth/prisma-adapter 2.11.3
```

**What this changes:**

- **Fixed already** by beta.32: GHSA-8fpg-xm3f-6cx3, the *auth-checks-fail-open* advisory
  (its range is next-auth `<=5.0.0-beta.31`). This was the one I ranked most serious. It is
  no longer live.
- **Still live**, all via the pinned `@auth/core@0.41.2` (advisory range `<0.41.3`):
  `getToken()` uncaught exception (**CVSS 7.5**), OAuth state/nonce/PKCE cookies not bound to
  their provider (**CVSS 6.8**), and the homoglyph email-normalizer bypass — which still
  matters here because of magic-link sign-in.

**Corrected fix:** there is no PR to merge. Change the override to `"@auth/core": "^0.41.3"`
or delete it, then `npm install` and re-audit. Effort: ~15 min plus a login smoke test.
Whoever added the pin should confirm why before it is simply removed — it was presumably
added to force a single `@auth/core` across `next-auth` and `@auth/prisma-adapter`, and
`^0.41.3` preserves that intent.

**A second, separate defect found in the same file: `origin/master`'s `package.json` has
six duplicate keys in `dependencies`.** JSON parsers take the last occurrence, so four
dependency bumps that appear to have landed are silently dead on production:

| Package | Declared twice | Effective |
|---|---|---|
| `@anthropic-ai/bedrock-sdk` | `^0.33.1` → `^0.32.0` | **`^0.32.0`** (older wins) |
| `@anthropic-ai/sdk` | `^0.120.0` → `^0.117.1` | **`^0.117.1`** (older wins) |
| `@aws-sdk/client-s3` | `^3.1115.0` → `^3.1110.0` | **`^3.1110.0`** (older wins) |
| `next-auth` | `5.0.0-beta.32` → `5.0.0-beta.31` | **`5.0.0-beta.31`** (older wins) |
| `@auth/prisma-adapter` | `2.11.2` → `2.11.3` | `2.11.3` (newer, harmless) |
| `next` | `^16.3.1` → `^16.3.2` | `^16.3.2` (newer, harmless) |

This is a botched merge-conflict resolution from the 2026-08-26/27 Dependabot merges
(#130–#133) landing on top of one another. The lockfile is currently *ahead* of the manifest
(it has `next-auth@5.0.0-beta.32` while the manifest declares `beta.31`), so `npm ci` installs
the newer version today — **but the next `npm install` will resolve the manifest and silently
downgrade `next-auth`, `@anthropic-ai/sdk`, `@anthropic-ai/bedrock-sdk` and
`@aws-sdk/client-s3`.** The local branch does *not* have the duplicates; this is
`origin/master` only. **Severity: High** — it is a live regression waiting on the next
install, and it makes dependency state unreadable.

The remaining 19 (13 high) are transitive and mostly DoS-class: `undici` (5 advisories incl.
CVSS 7.4 cross-user information disclosure via cache directives), `js-yaml`, `flatted`,
`brace-expansion`, `path-to-regexp`, `picomatch`, `fast-uri`, `ip-address`, `hono`,
`deepmerge-ts`, plus dev-only `vite`/`esbuild`/`@babel/core`. `prisma`'s advertised "fix" is a
**major downgrade to 6.12.0** — not actionable; treat as accepted risk.

### 4.5 Security headers, live  [VERIFIED against production, not just config]

```
$ curl -sSI https://cultcodex.me/
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' …
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), vr=()
Cross-Origin-Opener-Policy: same-origin-allow-popups
Cross-Origin-Resource-Policy: cross-origin
Server: Vercel        # X-Powered-By correctly absent
```

**Every header configured in `next.config.ts` is actually being served.** HSTS is 2 years
with `includeSubDomains; preload`. `object-src 'none'`, `base-uri 'self'`,
`frame-ancestors 'self'` and a `form-action` restricted to self + Stripe are all present.
This is a better header posture than most production sites.

The one real weakness: **`script-src` includes `'unsafe-inline'`**, which removes most of the
CSP's XSS value. Next.js App Router needs either a nonce or `'unsafe-inline'` for its inline
bootstrap; the nonce route is available via middleware and is the correct fix. Given that no
user content reaches `dangerouslySetInnerHTML` (4.3), practical exposure today is low — but
the CSP is not doing the job it looks like it is doing.

---

## Phase 5 — Live site verification

### 5.1 Key pages  [VERIFIED]

| Page | Status | TTFB | Payload | CDN |
|---|---|---|---|---|
| `/` | 200 | 0.556s | 203,000 B | `X-Vercel-Cache: MISS` |
| `/psychenomicon` | 200 | 0.369s | 63,729 B | MISS |
| `/episodes` | 200 | 0.383s | 185,862 B | MISS |
| `/search` | 200 | 0.382s | 86,075 B | MISS |
| `/stats` | 200 | — | 174,781 B | MISS |
| `/this-page-does-not-exist-xyz` | **404** | 0.177s | 72,922 B | — |
| `/api/keep-alive` | 200 | 1.142s | 56 B | — |
| `/episodes/dark-goddess-in-the-machine` | 200 | 0.334s | 218,410 B | MISS |
| `/episodes/get-your-freak-on-friday` | 200 | 0.274s | **2,861,938 B** | MISS |

TTFB is consistently good (0.18–0.56s). The 404 correctly returns status 404 with a styled
page. `/api/keep-alive` at 1.14s is the slowest endpoint measured — consistent with waking a
hibernating Xata branch, which is exactly its job.

**Every page returned `X-Vercel-Cache: MISS` with `Cache-Control: private, no-cache,
no-store, max-age=0, must-revalidate` — including on immediate repeat requests.** See 6.1.

### 5.2 Counters — live vs. code  [VERIFIED]

`GET /api/premium/status` (unauthenticated) returns the same `getCounts()` the UI renders:

```json
{"episodes":2973,"segments":4863725,"people":1234,"topics":11944,
 "lore":8815,"quotes":3848,"totalHours":3279,
 "transcribedEpisodes":2875,"transcribedPct":97}
```

These are **correct and internally consistent** with what the code claims. `getCounts()`
(`src/lib/queries/stats.ts:103`) is wrapped in
`unstable_cache(…, ["archive-counts-v2"], { revalidate: 300, tags:["archive-counts"] })` —
8 `COUNT(*)` queries plus one aggregate, cached 5 minutes, computed in Postgres rather than
by pulling rows into Node. `transcribedPct` = `round(2875/2973*100)` = 97 ✓. **No counter
drift found.**

Cross-checked against the sitemap: 11,944 topics ↔ 11,945 sitemap URLs (`+1` index page);
8,815 lore ↔ 8,816; 1,234 people ↔ 1,236. Consistent.

*(For the record: an earlier working assumption of mine — that these counters were being
recomputed uncached on every page render — was wrong. The cache wrapper is there and correct.)*

### 5.3 API endpoints  [VERIFIED — 16 probed]

| Endpoint | Status | Behaviour |
|---|---|---|
| `GET /api/keep-alive` | 200 | `{"ok":true,"awake":true,"ts":…}` |
| `GET /api/live/status` | 200 | well-shaped per-channel object |
| `GET /api/search/suggest?q=tarot` | 200 | array of `{label,href,type}` |
| `GET /api/search/suggest` *(no q)* | 200 | `[]` — degrades cleanly |
| `GET /api/episodes/random` | 307 | redirect, as designed |
| `GET /api/premium/status` | 200 | **returns full archive stats unauthenticated** |
| `GET /api/auth/session-lite` | 200 | `{"user":null}` |
| `GET /api/psychenomicon/chronicle` | 200 | `{"canRead":false,"isAuthenticated":false}` |
| `POST /api/oracle/ask {"question":"hi"}` | 200 | **answered without authentication** |
| `POST /api/search/semantic` *(valid + malformed)* | 403 | correct gate, identical message both ways |
| `GET /api/cards/daily` | 405 | correct method rejection |
| `GET /api/cron/*` | 401 | `{"error":"Unauthorized"}` |
| `POST /api/stripe/webhook {}` | 400 | `{"error":"Missing signature"}` |
| `GET /api/debug-auth` | 403 | `{"error":"Admin only"}` |
| `GET /api/admin/people/lookup` | 403 | `{"error":"Admin access required"}` |

**Bad-input handling is good.** Malformed JSON, missing params and wrong methods all return
the right status with a non-leaky message. No stack traces or internal paths in any response
body.

**Two results need context rather than alarm:**

- `/api/premium/status` requires no auth and returns archive-wide counts. These are the same
  numbers rendered publicly on `/stats` and in the sidebar, so this discloses nothing private
  — but it is an undocumented public statistics endpoint with no rate limit, and it is a soft
  information-disclosure surface (exact row counts, growth rate over time).
- `/api/oracle/ask` answering anonymously is **deliberate**: a cookie-gated free trial
  (`TRIAL_LIMIT`), then 403 `initiate_required`. It is defended by a per-IP rate limit
  (15/min) *and* a DB-backed global daily cap (`ORACLE_DAILY_CAP`, default 500) with an
  `AI_KILLSWITCH`. The wallet is protected. The residual risk is **denial-of-service against
  the paid feature**: the trial cookie is client-clearable and the per-IP limit is
  per-instance (9.3), so an attacker can burn the entire global 500/day for roughly the cost
  of 500 HTTP requests, after which paying subscribers see *"The Oracle is resting."* The code
  comments show the author reasoned about exactly this.

### 5.4 Broken links and images  [VERIFIED]

Extracted every internal `href` from the home page plus **20 sampled transcript pages**
(sampled evenly across the 2,921-URL episode list): **335 unique links, 331 after removing
`/_next/*` and `/api/*`.** All 331 fetched:

```
327  200
  3  000   (transient — see below)
  1  404   /settings
```

**`/settings` → 404, and it is linked from the site-wide footer.**
`src/components/layout/site-footer.tsx:47` renders
`{ label: "Account Settings", href: "/settings" }` — confirmed present on `origin/master`
too, so this is live on **every page of the site**. It is also linked from
`src/app/contact/page.tsx:71` and `src/app/refund/page.tsx:38`, both in the sentence telling
a user where to manage or cancel a paid subscription. `src/app/settings/` contains only
`notifications/` and `profile/` — **there is no `src/app/settings/page.tsx`**, and no
`redirect` covering the bare path.

The 3 `000` results (`/topics/identity`, `/topics/interpersonal-drama`,
`/topics/self-sabotage`) were **connection failures on the first pass under 8-way
concurrency**. All three returned **200** on individual retry, and a controlled re-test (same
30 URLs at concurrency 8, then at concurrency 2) produced **30/30 200 both times**. I could
not reproduce it. Reporting as observed-once, cause unidentified — not as a defect.

**Images: 102 unique `src` values across the sampled pages, 0 broken** (verified in-browser:
`document.images` with `complete && naturalWidth===0` → 0). Host breakdown: 45 from
`i.ytimg.com`, 18 from `img.youtube.com`, 1 `www.youtube.com`, the rest first-party. See 6.4
— the YouTube ones bypass `next/image`.

### 5.5 In-browser checks  [VERIFIED]

Screenshots were **not possible** — the Browser pane cannot composite frames in this
non-interactive session (`screenshot failed: the Browser pane is not displayed`). Everything
below is from the live DOM, console and network, which is stronger evidence than a screenshot
for these particular questions but is **not** a substitute for looking at the rendered
design. **Visual quality is therefore unverified** — see "inferred".

- **Home page: 0 console errors, all network requests 200.**
- **Episode page: 1 console error** — `Failed to load resource: the server responded with a
  status of 404`. The resource was not identified: a full network capture of two subsequent
  loads of the same URL showed **83 requests, all 200**, with no 404. Reporting as
  observed-once, source unidentified.
- Every page load fires **`/api/live/status` and `/api/auth/session-lite`** — two extra
  uncached, DB-backed round trips per navigation, on top of the SSR render.

---

## Phase 6 — Performance

### 6.1 Caching: the headline finding  [VERIFIED]

**Nothing on cultcodex.me is cached at the CDN. Not one page.** Every page tested — home,
`/episodes`, `/topics/identity`, `/psychenomicon`, `/search`, `/stats`, and every episode
page, on first *and* immediate repeat request — returned:

```
Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
X-Vercel-Cache: MISS
Age: 0
```

Cause: **71 of 161 `page.tsx` files declare `export const dynamic = "force-dynamic"`.** The
root layout sets `export const revalidate = 60`, which would be cacheable, but a page-level
`force-dynamic` overrides it.

**Four of those templates also declare `generateStaticParams()` — which `force-dynamic`
makes dead code:**

```
src/app/episodes/[slug]/page.tsx   :57 force-dynamic   :59 generateStaticParams
src/app/topics/[slug]/page.tsx     :19 force-dynamic   :21 generateStaticParams
src/app/lore/[slug]/page.tsx
src/app/quests/[slug]/page.tsx
```

Those four templates serve **23,680 of the 27,817 URLs in the sitemap** (2,921 episodes +
11,944 topics + 8,815 lore + quests). Someone built the static-generation path and then
disabled it. Every crawler hit, every social preview, every repeat visitor triggers a full
server render with live database queries.

### 6.2 Payload: the transcript ships to everyone, twice over  [VERIFIED]

Measured on `/episodes/get-your-freak-on-friday` (2,861,640 chars):

```
RSC flight payload (self.__next_f):  2,776,292 chars  = 97.0% of the page
Rendered HTML:                          83,176 chars  =  3.0%
Transcript <p> elements in rendered HTML:      1
Transcript <p> elements in whole document:     2
```

The mechanism: `src/components/episodes/episode-tab-layout.tsx` is a **client component**
whose line 63 renders `children[activeTab]` — only the active tab. The default tab is
Overview. But every tab's content is passed as a prop, so **all 7,906 transcript segments are
serialized into the RSC flight payload and sent to every visitor, whether or not they ever
open the Transcript tab.**

Two consequences:

1. **2.8 MB transferred to read a page nobody asked for the transcript on** — and, per 6.1,
   re-generated and re-sent on every request, never CDN-cached. Across the 20 sampled
   episodes, payloads ranged 150 KB – 2.86 MB; **8 of 20 exceeded 1 MB.**
2. **The transcript text is not in the server-rendered HTML.** For a site whose SEO
   proposition is full transcript coverage, the words are only reachable by executing JS and
   clicking a tab. Google renders JS and will likely still find the flight payload, but this
   is a materially weaker position than serving the text.

Compounding it, `TranscriptViewer` has **no virtualization** — when the tab is opened it
renders all 7,906 segments into the DOM at once (verified live: 7,906 `<p>` nodes).

### 6.3 Per-render paid API calls  [VERIFIED by tracing; cost INFERRED]

`EpisodeCrossRef`, `PersonCrossRef` and `QuoteCrossRef` each call `semanticSearch(…)`, which
calls `embedOne()` (`src/lib/embeddings.ts:26`) — a **live OpenAI embeddings API call**.
`embedOne` has **no cache of any kind** (no `unstable_cache`, no Map, no memo — verified by
reading the file).

These components are mounted on `src/app/episodes/[slug]/page.tsx:714`,
`people/[slug]/page.tsx:733` and `quotes/[id]/page.tsx:422` — templates covering
**2,921 + 1,234 + n URLs**, all `force-dynamic` and uncacheable.

**Every page view of every episode, person and quote page makes a billable OpenAI embedding
call plus a pgvector similarity query over 4.86M rows.** They are wrapped in `<Suspense>`, so
they stream and do not block TTFB — which is why this does not show up in the TTFB numbers,
and why it could run for a long time unnoticed. There is no rate limit and no budget guard on
this path, unlike `/api/search/semantic`, which has both. A crawler walking the sitemap
generates one embedding call per URL.

### 6.4 Images  [VERIFIED]

- **63 of 102 sampled image `src` values point directly at `i.ytimg.com` / `img.youtube.com`**
  (45 + 18) — raw `<img>`, bypassing `next/image` entirely, despite `next.config.ts` having
  `remotePatterns` configured for exactly those hosts. No WebP conversion, no responsive
  `srcset`, no size negotiation.
- ESLint independently flags **12 `@next/next/no-img-element`** violations, including
  `psychenomicon/book/page.tsx:55`, `this-week/page.tsx:244`,
  `start-here/results/page.tsx:208`, `series-card.tsx:25`, `user-menu.tsx:36`,
  `quote-highlight-card.tsx:54`, `game-show.tsx:383`, `admin-sidebar.tsx:70`.
- **Layout shift: not reproduced.** On the episode page, `document.images` showed **0 images
  missing dimensions**. Good.
- Image caching config is correct: `minimumCacheTTL: 86400`, plus a
  `public, max-age=604800, stale-while-revalidate=86400` rule for static image extensions.

### 6.5 JavaScript weight  [VERIFIED]

Home page loads **15 JS chunks totalling ~727 KB uncompressed** (curl sends no
`Accept-Encoding`, so these are decoded sizes; over the wire with Brotli, substantially
smaller). Largest:

```
233,801 B  chunks/0iedjqcsj5jla.js
129,205 B  chunks/1t7xs5sdt8k0b.js
112,594 B  chunks/0c0hxoamwjsbw.js
 58,522 B  chunks/3og4uougj5s7d.js
 46,396 B  chunks/03wvv4eimci76.js
```

**A proper bundle analysis could not be run** — `next build` fails before emitting the route
size table (1.2), and no analyzer is configured. Chunk names are content-hashed, so I cannot
attribute the 234 KB chunk to a package from the outside. Listed under "Checks I could not
run".

What is visible from source: the site leans heavily on client components —
`transcript-viewer`, `episode-tab-layout`, `oracle-console` (626+ lines), `game-show`,
`vault-app`, the card-art generators — several of which render server-derivable content.
`episode-tab-layout` is the clearest candidate: making it a server component with URL-driven
tab rendering would delete the 2.78 MB flight payload described in 6.2 outright.

### 6.6 Five slowest server operations  [INFERRED from traced code paths; not profiled]

No production profiler or APM exists (9.2), so this is reasoning over traced code, not
measurement.

1. **Episode detail render** — unbounded `segments` include (up to 7,906 rows), sorted in
   memory for want of a composite index, serialized to a 2.8 MB flight payload, uncached.
2. **`connection-path.ts`** — five unbounded table loads (people ×3, guests, episodes) per
   request, graph-walked in Node.
3. **`sitemap.ts`** — four unbounded `findMany` calls totalling 24,916 rows per request,
   producing a 5.4 MB response.
4. **`semanticSearch`** — network round trip to OpenAI plus a 200-candidate pgvector scan
   over 4.86M rows, executed per page view on three high-traffic templates.
5. **`generate-chapter-core`** — a 20s interactive transaction of `2N+M+2` sequential round
   trips, behind a 30–60s LLM call, against a database that hibernates.

### 6.7 Core Web Vitals  [NOT MEASURED]

Field data is unavailable (no CrUX access from here) and lab measurement needs a rendering
browser pane, which this session could not display. `@vercel/analytics` and Speed Insights
are installed, so **real CWV data almost certainly already exists in the Vercel dashboard** —
that is where to look, and it is the fastest way to confirm or refute 6.1–6.3.

---

## Phase 7 — SEO and content integrity

### 7.1 Metadata  [VERIFIED on the home page and the episode template]

The home page carries a complete, well-formed set:

```html
<title>CultCodex — The Archive of Cult of Psyche | Tarot, Consciousness & Open Panels</title>
<meta name="description" content="Cult of Psyche is a live, unscripted internet show…">
<link rel="canonical" href="https://cultcodex.me">
<meta property="og:title|og:description|og:url|og:type" …>
<meta property="og:image" content="https://cultcodex.me/opengraph-image?…">
<meta property="og:image:width" content="1200"> <meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
```

Dynamic OG/Twitter images are generated per route. Episode pages carry per-episode titles
(`Get Your Freak on Friday — CultCodex`) and **two JSON-LD blocks** — a
`PodcastEpisode`/`VideoObject` graph via `episodeJsonLd()` and a `BreadcrumbList` — both
escaped correctly (4.3). `src/lib/__tests__/episode-jsonld.test.ts` covers the generator.
This is above average.

Caveat: I verified metadata on the home page and the episode template. **I did not audit all
161 page templates individually** — see "inferred".

### 7.2 `robots.txt`  [VERIFIED]

Present, 200, and unusually sophisticated — three distinct agent groups. But there is a
**rule-precedence problem**:

The AI-crawler group (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, …) is
carefully restricted: allowed `/episodes/`, `/people/`, `/topics/`, `/lore/` etc., and
explicitly `Disallow`-ed from `/oracle/`, `/psychenomicon/`, `/members/`, `/cards/`,
`/salon/`, `/red-room/`, `/claim/`, `/user/`, `/settings/`.

The **`User-Agent: *` group disallows only `/api/`, `/auth/`, `/admin/`.** So Googlebot,
Bingbot and every ordinary crawler *are* permitted into `/psychenomicon/`, `/members/`,
`/red-room/`, `/cards/`, `/salon/` and `/user/` — the paths the author took care to hide from
AI crawlers. Whether that is intentional (SEO for the book, blocked for AI training) or an
oversight is a product decision, but the asymmetry is almost certainly not what a reader of
the file would expect. Notably, **2,809 `/psychenomicon/` URLs are in the sitemap**, so at
least that part appears intentional.

### 7.3 `sitemap.xml`  [VERIFIED]

200, **5,378,123 bytes, 27,817 `<loc>` entries in a single uncompressed file.**

Within spec (sitemaps.org limits are 50 MB and 50,000 URLs), so not a violation — but a
5.4 MB single file generated on demand from four unbounded queries (6.6) is fragile, and
there is no sitemap index to split it.

**Coverage — `in sitemap / total`:**

| Entity | In sitemap | In database | Missing |
|---|---|---|---|
| Episodes | 2,921 detail (+1 index) | **2,973** | **52** |
| Topics | 11,944 (+1 index) | 11,944 | 0 |
| Lore | 8,815 (+1 index) | 8,815 | 0 |
| People | ~1,234 (+2) | 1,234 | 0 |
| Psychenomicon | 2,809 | — | — |
| Static/other | ~70 | — | — |

**52 episodes are absent from the sitemap.** This is very likely correct behaviour — the
sitemap filters to `status: published`, and 98 episodes have no transcript with some marked
`unavailable`. I could not confirm the exact filter/DB overlap without database access, so I
am reporting the discrepancy rather than calling it a bug.

### 7.4 Headings and structure  [VERIFIED in-browser]

On `/episodes/get-your-freak-on-friday`:

```
h1 count: 1                        lang="en"  ✓
skip link: "Skip to main content"  ✓
Heading order (DOM):
  H2:Archive  H2:Explore  H2:Support  H2:Legal   ← footer/nav H2s
  H1:Get Your Freak on Friday                    ← page H1, FIFTH
  H3:Metadata  H3:At a Glance  H4:Topics  H4:Lore
  H3:Topics (5)  H3:Related Episodes (6)  H2:Anyone Up? …
```

**Four `<h2>` elements precede the page `<h1>` in DOM order**, and `H4:Topics`/`H4:Lore`
appear before the `H3:Topics (5)` that should contain them. Exactly one `<h1>` per page and a
working skip link are both correct and better than most sites; the ordering is the defect.

### 7.5 Transcript integrity — 20 episodes sampled  [VERIFIED]

**Encoding: clean.** Scanned all 20 sampled pages for common mojibake signatures (`â€™`,
`â€œ`, `Ã©`, `ï¿½`, U+FFFD): **0 occurrences across all 20.** No encoding damage.

**Speaker attribution: absent entirely.** This is the finding.

```
Sampled 20 episode pages; counted "speakerLabel" keys and null values in the payload:
  pg_a7dc0754  speakerLabelKeys=7906  null=7906
  pg_d2353dec  speakerLabelKeys=7311  null=7311
  pg_39d82a6e  speakerLabelKeys=7048  null=7048
  … (all 20) …
  pg_52ad6c5b  speakerLabelKeys=0     null=0      ← episode page with zero segments
```

**Across 19 episodes with transcripts, all 43,279 segments have `speakerLabel: null`. Not one
segment in the sample carries a speaker.** Confirmed independently in the live DOM: the
transcript tab rendered 7,906 segments and **0 speaker label elements**.

The brief warned against asserting speaker separation is correct. It is not a question of
correctness — **there is no speaker separation at all.** The transcripts are raw caption
streams. The important consequence is that a great deal of code assumes otherwise:

- `transcript-viewer.tsx:54` builds a `speakerColorMap` from `uniqueSpeakers` — always empty.
- `transcript-viewer.tsx:78` lets users filter the transcript by speaker — never matches.
- `deep-search-console.tsx:303` renders `r.speakerLabel` in search results — never shows.
- **`generate-chapter-core.ts:209`** feeds the LLM
  ``s.speakerLabel ? `${s.speakerLabel}: ${s.text}` : s.text`` — so **every Psychenomicon
  chapter is generated from an unattributed wall of text.** The model writing the book cannot
  tell who said what, and nothing in the pipeline flags that. For a work that characterises
  real, named people, that is a content-integrity risk worth taking seriously, and it is
  invisible from the output.

**Segment quality (measured on the largest sampled episode, 7,906 segments):**

| Metric | Count |
|---|---|
| Segments rendered | 7,906 |
| **Empty segments** (render as blank rows) | **36** |
| Segments under 3 characters | 57 |
| Mojibake segments | 0 |

Segments are **caption fragments, not sentences** — they break mid-clause on YouTube's caption
timing:

```
first 3: "spend my soul in a way I shouldn't have" / "thought out." / ""
last 3:  "mean she looks Natalie, please no. I" / "have to" / "taste the biscuit."
```

**Truncation: none detected** — the fragment boundaries are caption artefacts, not cut-off
text, and the sequences run continuously to the episode end. But the transcript begins
mid-sentence, there is no sentence re-assembly step, and 36 blank rows render as visible gaps.
For a reader, and for the LLM consuming this, the text is noticeably rougher than the site's
presentation implies.

**98 of 2,973 episodes (3%) have no transcript at all** (`transcribedEpisodes: 2875`), and one
such page appeared in my 20-page random sample — those pages still render, with an empty
transcript tab.

### 7.6 Thin and duplicate content  [NOT TESTED]

I did not run a similarity analysis across the 11,944 topic and 8,815 lore pages. Given that
both are LLM-generated from overlapping transcript material and that topics outnumber episodes
4:1, near-duplicate and thin pages are plausible — and 20,759 such URLs in the sitemap is a
large surface if a meaningful share of them are thin. Worth a dedicated pass; flagged as
unverified rather than asserted.

---

## Phase 8 — Accessibility

Tested against the **live rendered DOM**, not source. Screenshots were unavailable, so
**contrast and focus-state appearance are unverified**.

**What is correct** (verified on `/episodes/get-your-freak-on-friday`):

| Check | Result |
|---|---|
| Skip link | ✓ `"Skip to main content"` as the first anchor |
| `<html lang>` | ✓ `en` |
| `<h1>` per page | ✓ exactly 1 |
| Images missing `alt` | ✓ **0** |
| Images missing dimensions | ✓ **0** |
| Broken images | ✓ **0** |
| Decorative images | 3 use `alt=""` — correct |
| `aria-hidden` on decorative overlays | ✓ correct in `paywall-gate.tsx:59,62`, `card-art.tsx:554` |

**Defects found:**

1. **Heading order is wrong** (7.4) — four `<h2>` before the `<h1>`, and `<h4>` siblings
   preceding the `<h3>` that should precede them. Screen-reader users navigating by heading
   land in footer structure before the page title. **WCAG 1.3.1.**
2. **`pointer-events-none select-none` on paywall preview text**
   (`src/components/subscription/paywall-gate.tsx:38`) makes preview transcript text
   unselectable — though this component is currently **unused**, so no live impact.
3. **The transcript tab renders 7,906 list items with no virtualization** and no landmark or
   `aria-live` structure. Assistive tech traverses the entire list linearly.
4. **Tab navigation is `useSearchParams`-driven** (`episode-tab-layout.tsx:23`) with `<button>`
   elements rather than an ARIA tab pattern — no `role="tablist"`, `role="tab"`,
   `aria-selected` or `aria-controls`, so the relationship between the buttons and the panel is
   not exposed.

**Not tested — requires a visible rendering surface:** colour contrast ratios, focus-ring
visibility, keyboard tab order and focus trapping in the command palette / modals, and
reduced-motion handling for `AmbientVisualSystem`. One signal is suggestive: commit `0e640f6`
is titled *"Fix unreadable sidebar nav text contrast"* — contrast has been a real problem here
before and deserves a dedicated pass with a rendering browser.

---

## Phase 9 — Operations

### 9.1 Vercel configuration  [VERIFIED from config; runtime settings INFERRED]

`vercel.json` is minimal:

```json
{ "framework": "nextjs",
  "buildCommand": "npm run vercel-build",
  "crons": [ {"path":"/api/cron/ingest-latest","schedule":"0 15 * * *"},
             {"path":"/api/cron/gift-sequence","schedule":"0 17 * * *"} ] }
```

- **No `regions` specified.** The database is Xata; if functions default to a region distant
  from the DB, every one of the many sequential queries pays that latency twice. Worth checking
  in the dashboard — the deployed region is not visible from outside.
- **No `functions` block** — no per-route memory or `maxDuration` configuration. Routes declare
  `export const maxDuration` in ~20 files, up to `300`. **On a Hobby plan the real ceiling is
  60s and that export does not raise it** — so `maxDuration = 300` on
  `psychenomicon/generate-batch`, `admin/build-book`, `admin/embed` and `admin/migrate-art-r2`
  is aspirational. This is the mechanism behind 3.4(b).
- **Migrations run inside the deploy.** `scripts/vercel-build.mjs` runs `prisma migrate deploy`
  when `VERCEL_ENV === "production"`, then `next build`. A push to `master` therefore migrates
  the production database. A failed migration fails the build and Vercel keeps the previous
  deployment serving — a reasonable safety property — but it means **schema changes and code
  changes cannot be rolled back independently.**
- The Xata branch hibernates on low traffic; `.github/workflows/keep-alive.yml` pings
  `/api/keep-alive` every 5 minutes to prevent it (GitHub Actions, because Hobby crons fire
  only daily). Verified live: the endpoint returns `{"ok":true,"awake":true}` in 1.14s.

### 9.2 Error handling and observability — the weakest area  [VERIFIED]

**There is no error monitoring on this site.** The only observability dependency in
`package.json` is `@vercel/analytics`. No Sentry, Datadog, Logtail, Axiom, Bugsnag, Rollbar,
OpenTelemetry, pino or winston.

**The one error pipeline that exists points at infrastructure that no longer exists.**
`src/app/api/errors/route.ts` receives client error reports; its header comment reads:

> *"…then logs them server-side so they flow through **Railway's log drain to Better Stack**
> (and trigger any configured alerts there)."*

The Railway → Vercel migration completed 2026-08-17; `railway.toml` and `nixpacks.toml` are
gone. **There is no log drain configured in `vercel.json`.** So `error.tsx` and
`global-error.tsx` faithfully POST every client-side crash to an endpoint that `console.error`s
it into an ephemeral Vercel function log with no drain and no alert rule. **Client errors are
being collected and discarded.**

**Error boundaries: 1 root `error.tsx` + 1 `global-error.tsx` for 161 pages.** There are 33
`loading.tsx` files but **zero route-segment `error.tsx`** — so any thrown error in any section
of any page escalates to the root boundary and replaces the whole page.

**252 `.catch(() => …)` fallbacks** in `src/` (plus 4 genuinely empty `catch {}` blocks). Many
are deliberate and correct — `getCounts().catch(() => ({episodes:0,…}))` in the root layout
keeps the site up when the DB is asleep. But combined with zero monitoring, the effect is that
**the site degrades silently and nobody is told.** The concrete scenario: a hibernating Xata
branch makes `layout.tsx:128` fall back to all-zero counters and `episode-cross-ref.tsx:24`
return `null`, so visitors see zeroed stats and missing sections, every request returns HTTP
200, and no alert fires anywhere.

**Unhandled rejections:** the chapter-generation `P2002` path (3.4a) is the concrete one traced.

### 9.3 Rate limiting  [VERIFIED]

`src/lib/rate-limit.ts` is an **in-memory `Map`**, and its own header comment is accurate and
honest:

> *"on Vercel each serverless instance is its own process with its own Map… the effective limit
> is (configured limit × live instances), and a cold start resets a caller's window. This is now
> a soft speed-bump… not a real cap."*

So **every per-IP/per-user rate limit on the site is unenforceable** — `oracle/ask` (15/min),
`search/semantic` (30/min), `admin/llm` (30/min), `api/errors` (10/min). The mitigation is real
though: `consumeLlmBudget` (`src/lib/llm-budget.ts`) is **database-backed** and enforces a
genuine global daily cap with an `AI_KILLSWITCH`. **The wallet is protected; per-user fairness
and abuse-resistance are not.** A shared store (Upstash/Redis) behind the existing
`rateLimit()` signature is the stated fix.

### 9.4 Production logs  [NOT ACCESSED]

No Vercel logs were retrieved. Reading them requires authenticated access to the Vercel
project, which was not exercised. Given 9.2, recent logs are also unlikely to contain much
beyond an hour of retention. Listed under "Checks I could not run".

### 9.5 Backup and recovery posture  [VERIFIED where stated, otherwise INFERRED]

This is the finding that should worry you most, because it compounds with 3.2.

- **Schema recovery is broken.** The 53 committed migrations create 59 tables; the schema
  declares 81 models. **The repository cannot rebuild the production schema.** If the Xata
  branch were lost, the code in git would not be enough to stand the database back up — 20
  tables, including auth sessions and the entire tarot subsystem, exist only as live objects in
  one database.
- **No backup automation exists in the repo.** No `pg_dump` script, no scheduled export
  workflow, no snapshot job in `.github/workflows/` or `scripts/`. Xata provides its own
  point-in-time recovery on paid plans — whether that is enabled here is not visible from
  outside, and it should be confirmed.
- **The transcript archive has only partial redundancy.** 4,863,725 segments and 3,279 hours of
  transcription are the single most expensive asset, and they live in the database. Some raw
  source material sits outside it (the `scripts/asr-*` chain works from local audio and JSON),
  but there is no export path in the repo that would reconstitute the segments table.
- **Chapter art has been deliberately hardened** — `migrate-art-r2` copies
  `PsychenomiconArtAsset` blobs to Cloudflare R2, and the serving route reads R2 first with a
  Postgres fallback, explicitly *"independent of Postgres → survives DB pauses"*. Exactly the
  right instinct, applied to one asset class and not the important one.

---

## Phase 10 — Report

### 1. Executive summary

cultcodex.me is live, fast at the edge (TTFB 0.18–0.56s), returns 200 on 327 of 331 sampled
internal links, and serves a genuinely strong security-header set; its auth layer is
well-engineered and all 27 admin routes are guarded and enforcing in production. The code is
also cleaner than its size suggests: `tsc --noEmit` is at zero errors, 167 tests pass with
nothing skipped, and there are exactly three `any`s and zero `@ts-ignore`s in `src/`.
Underneath that, four things are genuinely wrong. **A live Anthropic API key and the
`ENRICH_SECRET` — which can grant admin on production via `/api/admin/grant-access` — have sat
in `origin/master` in plaintext for four months.** **Production auth is running
`next-auth@5.0.0-beta.31` with four advisories, including one where existence-based admin
checks can fail open — and a commit titled "bump next-auth to beta.32" did not actually bump
it, so the log reads as fixed when it is not.** **20 of 81 database models have no migration**
— they were created by POSTing DDL to an admin HTTP endpoint — so the repository cannot rebuild
the production schema, and there is no backup automation anywhere. **Nothing on the site is
CDN-cached**: 71 of 161 pages are `force-dynamic`, four of them while also declaring the
`generateStaticParams` that would have made them static, and each episode page ships up to
2.8 MB — 97% of it an RSC payload containing the whole transcript, sent whether or not the
reader opens the transcript tab, alongside an uncached billable OpenAI embedding call per view.
Content integrity is weaker than the UI implies: **every one of 43,279 sampled transcript
segments has a null speaker**, yet the transcript UI, deep search, and the Psychenomicon
chapter generator are all written as though attribution exists. And the site cannot tell you
when any of this breaks — there is no error monitoring, the client-error pipeline still writes
to a Railway log drain that was decommissioned in August, and 252 silent `.catch` fallbacks
mean a sleeping database renders zeros and returns HTTP 200.

### 2. Findings table

| ID | Sev | Area | Location | Description |
|---|---|---|---|---|
| **F1** | **Critical** | Secrets | `scripts/enrich/browser-enrich-topics.js:9-10` | Live Anthropic API key + `ENRICH_SECRET` committed to `origin/master` since 2026-04-29; one request with that header grants full admin **and** a lifetime top-tier subscription via `/api/admin/grant-access` |
| **F2** | **Critical** | Dependencies | `package.json` `overrides` (both branches) | `"overrides": {"@auth/core": "0.41.2"}` force-pins the vulnerable `@auth/core` under an otherwise-patched `next-auth@5.0.0-beta.32`; 3 advisories stay live (CVSS 7.5, 6.8, + homoglyph bypass against magic-link sign-in) |
| **F2b** | **High** | Dependencies | `package.json` `dependencies` (`origin/master` only) | Six duplicate keys from a botched Dependabot merge; last-wins silently reverts `next-auth`, `@anthropic-ai/sdk`, `@anthropic-ai/bedrock-sdk`, `@aws-sdk/client-s3` on the next `npm install` |
| **F3** | **High** | Data / DR | `prisma/migrations/` vs `prisma/schema.prisma` | 20 of 81 models have no `CREATE TABLE` in any migration; created via DDL through `/api/admin/data-ops`. Repo cannot rebuild the production schema |
| **F4** | **High** | Operations | `src/app/api/errors/route.ts:6`; `package.json` | No error monitoring at all; client-error pipeline still targets the decommissioned Railway→Better Stack drain. Errors collected and discarded |
| **F5** | **High** | Performance | `src/app/episodes/[slug]/page.tsx:57` + 70 others | 71/161 pages `force-dynamic`; zero CDN caching site-wide; 4 templates covering 23,680 sitemap URLs also declare a dead `generateStaticParams` |
| **F6** | **High** | Performance | `src/components/episodes/episode-tab-layout.tsx:63` | Whole transcript serialized into the RSC payload for every visitor — 2.78 MB of a 2.86 MB page (97%) — even when the transcript tab is never opened |
| **F7** | **High** | Testing | `src/app/api/**` (92 routes) | Zero tests cover any API route, including `stripe/webhook` and the 1,500-line destructive `admin/data-ops` |
| **F8** | **High** | Ops / DR | repo-wide | No backup automation; no `pg_dump`, export script or snapshot workflow anywhere. Compounds F3 |
| **F9** | **Medium** | Cost / Perf | `src/lib/embeddings.ts:26` via 3 cross-ref components | Uncached billable OpenAI embedding call + 4.86M-row pgvector scan on every episode / person / quote page view |
| **F10** | **Medium** | Content | 43,279 sampled segments | Every transcript segment has `speakerLabel: null`; transcript UI, deep search and Psychenomicon generation all assume attribution exists |
| **F11** | **Medium** | UX / Billing | `src/components/layout/site-footer.tsx:47` | Site-wide footer "Account Settings" links to `/settings` → **404**; also linked from `/contact` and `/refund` |
| **F12** | **Medium** | Reliability | `src/app/api/admin/psychenomicon/generate-batch/route.ts:6` | `maxDuration = 300` cannot exceed the 60s Hobby ceiling; batches >1–2 episodes are killed and return a 504 HTML page that breaks the client's `res.json()` |
| **F13** | **Medium** | Data | `generate-chapter-core.ts:187` | `nextChapterNumber` computed outside the transaction, before a 30–60s LLM call → concurrent generation collides on `@unique` and 500s with a raw Prisma message |
| **F14** | **Medium** | Security | `src/lib/queries/semantic.ts:143` | `$queryRawUnsafe` with unquoted `limit`/`threshold` interpolation; safe only because all 4 callers sanitize |
| **F15** | **Medium** | Security | `src/lib/rate-limit.ts:18` | All per-IP/per-user rate limits are per-serverless-instance and unenforceable (LLM wallet is separately protected) |
| **F16** | **Medium** | Type safety | `tsconfig.json` `exclude` | All 185 files in `scripts/` — the entire ingest/enrich/ASR/art toolchain — are excluded from typechecking |
| **F17** | **Medium** | Performance | `prisma/schema.prisma` (TranscriptSegment) | Missing `@@index([episodeId, startSeconds])` for the hottest query; useless `@@index([startSeconds])` costs a write on 4.86M rows |
| **F18** | **Medium** | Dependencies | `package-lock.json` | 19 further advisories (13 high) incl. `undici` cross-user information disclosure (CVSS 7.4) |
| **F19** | **Medium** | Performance | `src/lib/queries/connection-path.ts:59,96,107,185,195` | Five unbounded table loads per request; 136 `findMany` calls site-wide have no `take` |
| **F20** | **Low** | Security | `next.config.ts` CSP | `script-src` includes `'unsafe-inline'`, negating most of the CSP's XSS value |
| **F21** | **Low** | Build | `src/components/gameshow/game-show.tsx:93` | 1 ESLint error (`react-hooks/set-state-in-effect`) makes `npm run lint` red; nothing in CI blocks on it |
| **F22** | **Low** | SEO | OG image generation | 5 × `Failed to download dynamic font. Status: 400` — glyphs `✦ ◎ ❀ ◉ ◐` render as tofu in social images |
| **F23** | **Low** | Accessibility | live DOM, all pages | Four `<h2>` precede the page `<h1>`; `<h4>` precedes its `<h3>` — WCAG 1.3.1 |
| **F24** | **Low** | Accessibility | `episode-tab-layout.tsx` | Tabs use bare `<button>`s with no `role="tablist"` / `aria-selected` / `aria-controls` |
| **F25** | **Low** | Performance | 12 components | 63 of 102 sampled images load raw from `i.ytimg.com`/`img.youtube.com`, bypassing `next/image` |
| **F26** | **Low** | Data | `prisma/schema.prisma` | 4 redundant `@@index` declarations duplicating an existing `@unique` |
| **F27** | **Low** | SEO | `public/robots.txt` | `User-Agent: *` permits `/members/`, `/red-room/`, `/cards/`, `/user/` that the AI-crawler group is explicitly denied |
| **F28** | **Low** | Content | sampled transcripts | 36 empty segments render as blank rows; segments are unassembled caption fragments |
| **F29** | **Low** | Hygiene | repo-wide | 41 of 68 remote branches unmerged since Apr–Aug; dead files (`paywall-gate.tsx` unused, `schema.prisma.txt`, `check_user.ts`, `out/`, tracked `art-pipeline.log`) |
| **F30** | **Low** | Security | `psychenomicon-art/[slug]/[slot]/route.ts:28` | `slot` is allowlisted but `slug` flows unvalidated into an R2 object key |

**By severity: 2 Critical · 7 High · 11 Medium · 11 Low · 31 total.**

### 3. Detail on the findings that matter

Full evidence for every finding is in the phase sections above. The six that drive the fix
plan:

**F1 — Committed credentials.** Evidence: Phase 4.1. `git show origin/master:scripts/enrich/
browser-enrich-topics.js` returns both values at lines 9–10; `git log -S 'sk-ant-api03-'`
identifies `3cc94ef` (2026-04-29) as the introducing commit, carried by `5e51de0` and
`0e640f6`. **Impact:** anyone with read access to the repo — including any tooling, CI job, or
future contributor — can call `POST /api/admin/grant-access` with the `X-Enrich-Secret` header
and make any account a production admin, and can spend against the Anthropic account. Repo
privacy is the only control. **Fix:** rotate both credentials first (they are compromised
whether or not the history is cleaned), then delete the file or replace both values with
`prompt()` calls, then purge history with `git filter-repo` and force-push — coordinated,
since it rewrites `master`. **Effort:** 30 min to rotate; 1–2 h for the history rewrite.

**F2 — Vulnerable auth in production.** Evidence: Phase 4.4, including the correction notice
there. **Impact:** `@auth/core@0.41.2` is held in place by an explicit `overrides` pin even
though `next-auth@5.0.0-beta.32` is installed. Three advisories remain live: `getToken()`
uncaught exception (CVSS 7.5), OAuth state/nonce/PKCE cookies not bound to their provider
(CVSS 6.8), and the homoglyph email-normalizer bypass — the last of which matters because this
app ships magic-link sign-in. The *fail-open* advisory I originally ranked worst
(GHSA-8fpg-xm3f-6cx3) is **already fixed** by beta.32. **Fix:** change the override to
`"@auth/core": "^0.41.3"` (or remove it), `npm install`, re-audit. There is no PR to merge.
**Effort:** 15 min plus a login smoke test.

**F2b — Duplicate keys in production's `package.json`.** Evidence: Phase 4.4. **Impact:** the
lockfile is currently ahead of the manifest, so today's deploys are fine — but the next
`npm install` resolves the manifest and downgrades four packages, `next-auth` among them,
re-introducing the fail-open advisory. **Fix:** de-duplicate the `dependencies` block on
`master`, keeping the newer version of each. **Effort:** 15 min.

**F3 + F8 — Schema drift and no backups.** Evidence: Phase 3.2, 9.5. **Impact:** together
these mean a lost or corrupted Xata branch is an unrecoverable event. The repo yields a
database missing auth sessions, comments, favourites, card gifts and the entire tarot reading
subsystem. **Fix:** dump the live schema (`pg_dump --schema-only`), diff it against
`schema.prisma`, and write one baseline migration marked `--applied` for the 20 missing
tables; delete the DDL ops from `data-ops` and `seed-cards`; add a scheduled `pg_dump` to R2
or S3. **Effort:** 4–6 h for the baseline; 2 h for a backup job. **Needs approval** — the
baseline touches `_prisma_migrations`.

**F5 + F6 + F9 — The performance cluster.** Evidence: Phase 6.1–6.3. These are one problem
seen three ways: the site does no caching, so every expensive thing it does per render it does
on every single request. Removing `force-dynamic` from the four static-params templates is the
highest-leverage single change in this report — it makes 23,680 URLs cacheable and, by itself,
largely neutralizes F6 and F9 for crawler and repeat traffic. **Fix order:** (a) drop
`force-dynamic` where nothing per-user is rendered and let `generateStaticParams` + ISR work;
(b) make `episode-tab-layout` a server component so untabbed content is never serialized;
(c) wrap `embedOne` in `unstable_cache` keyed on the concept string. **Effort:** (a) 2–4 h
including verification, (b) 3–4 h, (c) 30 min.

**F10 — Missing speaker attribution.** Evidence: Phase 7.5. **Impact:** the site presents
transcripts and an AI-authored book about identifiable real people, built from text where
nobody knows who is speaking. The correctness risk in the Psychenomicon output is not
theoretical, and it is not detectable from reading the output. **Fix:** two decisions, not one
— (i) short term, stop rendering speaker-dependent UI that can never populate, and add an
explicit "speaker attribution unavailable" note to transcript pages; (ii) longer term, decide
whether to run diarization. **Effort:** 2 h for (i); (ii) is a project.

**F4 — No observability.** Evidence: Phase 9.2. **Impact:** every other finding in this report
is harder to detect and slower to fix because nothing reports. **Fix:** add Sentry (or a
Vercel log drain), and point `/api/errors` at it. **Effort:** 1–2 h. Cheapest high-value item
in the list.

### 4. Verified vs. inferred

**VERIFIED — a command was run or an HTTP request was made, and the output is reproduced above:**

- Git state: branch, 4 ahead / 5 behind, 23 dirty paths, 41/68 unmerged branches, commit
  archaeology on the leaked secret, `origin/master` package versions and lockfile contents.
- `npm ci` (exit 0), `npx prisma generate` (exit 0), `npx tsc --noEmit` (exit 0, **0 errors**),
  `npx eslint .` (exit 1, **102 problems: 1 error, 101 warnings**, grouped and counted),
  `npx next build` (exit 1 — compiles and typechecks, fails at prerender for want of a local DB).
- `npm test` — **167 passed / 0 failed / 0 skipped / 167 total, 30 files, 43.84s**.
- Absence of `@vitest/coverage-v8`; absence of `.skip`/`.only`/`.todo`; every test file
  contains `expect(`; all 5 tests importing `@/lib/db` mock it.
- File/route/model counts: 770 `src` files, 185 `scripts` files, 161 pages, 92 API routes, 81
  models, 53 migrations, 101 `@@index`, 19 `@@unique`.
- Suppression counts in `src/`: 0 `@ts-ignore`, 3 `any`, 40 `eslint-disable`, 4 of them
  unnecessary. 24 `dangerouslySetInnerHTML` sites, all traced. 26 raw-SQL sites. 136 `findMany`
  without `take`. 252 `.catch(() => …)`. 71/161 `force-dynamic`. 4 templates with both
  `force-dynamic` and `generateStaticParams`.
- Secret scan of all tracked files at HEAD and across all history for added/deleted `.env`
  files; `.gitignore` coverage confirmed with `git check-ignore`.
- `npm audit`: 22 vulnerabilities (3 critical / 13 high / 3 moderate / 3 low), advisory
  details and fix versions.
- 20 of 81 models absent from all migrations; 59 distinct `CREATE TABLE` across 53 migrations;
  zero `@@map` directives; DDL statements located in `data-ops` and `seed-cards`.
- Live HTTP: 9 key pages (status, TTFB, payload, `X-Vercel-Cache`), 16 API endpoints
  (status + body + malformed-input behaviour), `robots.txt`, `sitemap.xml` (5,378,123 bytes,
  27,817 URLs, prefix breakdown), 331 internal links (327×200, 1×404, 3 transient), production
  response headers, and the retry/concurrency re-test.
- Live counters from `/api/premium/status` and their consistency with the sitemap and with
  `getCounts()`'s `unstable_cache` wrapper.
- 20 sampled episode pages: payload sizes, 0 mojibake, **43,279 segments all with
  `speakerLabel: null`**, one episode with 0 segments.
- In-browser on the live site: 0 console errors on home, 1 unidentified 404 on the episode
  page, 83 network requests all 200, 7,906 transcript segments rendered, 36 empty, 0 speaker
  elements, 1 `<h1>`, heading order, `lang="en"`, skip link, 0 images missing `alt` or
  dimensions, 0 broken images.
- RSC payload measurement: 2,776,292 / 2,861,640 chars = 97.0%.
- Live JS: 15 chunks, ~727 KB uncompressed, individually measured.

**INFERRED — read from source or reasoned about, NOT executed:**

- The end-to-end description of the application in §0.4.
- That a production `next build` succeeds. It could not be run here — no `DATABASE_URL`. The
  local build's compile and TypeScript stages passed; **prerender is unverified.**
- Whether the leaked Anthropic key and `ENRICH_SECRET` are still valid. **Deliberately not
  tested.**
- Runtime behaviour of the chapter transaction under concurrency and under Xata hibernation
  (3.4a, 3.4c). The code was traced; the race was not provoked.
- That `generate-batch` times out in production (3.4b) — derived from the documented Hobby 60s
  ceiling and the advertised 30–60s per chapter, not observed.
- Actual per-request cost and volume of the uncached embedding calls (6.3). The call path is
  verified; the spend is not.
- The five "slowest server operations" (6.6) — reasoned from traced code, **not profiled**.
- Bundle composition — which packages sit in the 234 KB chunk. Not analysable from outside.
- Core Web Vitals — **not measured at all.**
- **Visual quality and design.** No screenshot was possible. Contrast ratios, focus-ring
  visibility, keyboard tab order and modal focus trapping are **untested**.
- Duplicate/thin content across the 20,759 topic and lore pages — **no similarity analysis run.**
- Whether the 52 episodes missing from the sitemap are correctly excluded.
- Referential actions (`onDelete`) for 80 of the 81 models; only `TranscriptSegment` was checked.
- Per-template SEO metadata for 159 of the 161 page templates.
- Vercel deployed region, function memory, whether Xata PITR is enabled, and production log
  contents.

### 5. Checks I could not run without approval

| # | Check | Exact command | Why it was blocked |
|---|---|---|---|
| 1 | Test coverage | `npm i -D @vitest/coverage-v8` then `npx vitest run --coverage` | Installs a package not in the lockfile |
| 2 | Migration drift, authoritative | `npx prisma migrate status` | Requires a live `DATABASE_URL` |
| 3 | Migration diff | `npx prisma migrate diff --from-migrations ./prisma/migrations --to-schema-datamodel ./prisma/schema.prisma --shadow-database-url "<shadow>"` | Requires a shadow database |
| 4 | Live schema capture | `pg_dump --schema-only "$DATABASE_URL" > schema-live.sql` | Requires production DB credentials (read-only, but still production access) |
| 5 | Full production build | `$env:DATABASE_URL="<prod-or-replica>"; npx next build` | Requires a working `DATABASE_URL` |
| 6 | Bundle analysis | `npm i -D @next/bundle-analyzer` then `$env:ANALYZE="true"; npx next build` | Installs a package; also needs #5 |
| 7 | Are the leaked credentials still live? | `curl -H "X-Enrich-Secret: <leaked>" https://cultcodex.me/api/admin/episodes -d '{"mode":"status"}'` | Uses someone's credentials against production. **Rotate instead of testing.** |
| 8 | Vercel production logs / runtime errors | `npx vercel logs cultcodex-v2 --scope psychetarotchannels-projects` | Authenticated access to the production project |
| 9 | Vercel region / function config | Dashboard → cultcodex-v2 → Settings → Functions | Not readable from the repo |
| 10 | Xata PITR / backup status | Xata dashboard | Not readable from the repo |
| 11 | Core Web Vitals (field) | Vercel Speed Insights dashboard | Authenticated access |
| 12 | Lighthouse / lab CWV | `npx lighthouse https://cultcodex.me --output json` | Installs a package; also needs a rendering browser |
| 13 | Visual + contrast + keyboard a11y | Browser pane screenshots and interaction | The Browser pane could not composite frames in this non-interactive session |

### 6. Prioritized fix plan

**Do these first, today, in this order — each is small and independently shippable.**

| # | Action | Findings | Effort |
|---|---|---|---|
| 1 | **Rotate the Anthropic key and `ENRICH_SECRET`.** Do this before anything else and before touching git history — the values are compromised regardless of what happens to the file | F1 | 30 min |
| 2 | **Change `overrides` to `"@auth/core": "^0.41.3"` and `npm install`**, then de-duplicate `master`'s `dependencies` block. There is no PR to merge — #132 already landed | F2, F2b | 30 min |
| 3 | **Add Sentry (or a Vercel log drain) and repoint `/api/errors`** — everything below is easier to verify once something reports | F4 | 1–2 h |
| 4 | **Add `src/app/settings/page.tsx`** (or a redirect to `/settings/profile`) — a site-wide footer link and the refund page currently 404 | F11 | 15 min |

**Then, in a second pass — the structural work.**

| # | Action | Findings | Effort |
|---|---|---|---|
| 5 | **Remove `force-dynamic` from the four `generateStaticParams` templates** and let ISR work. Highest single leverage in this report — 23,680 URLs. Audit the other 67 while you are in there | F5 | 2–4 h |
| 6 | **Make `episode-tab-layout` a server component** so untabbed content is never serialized. Removes ~2.7 MB per episode page | F6 | 3–4 h |
| 7 | **Cache `embedOne` with `unstable_cache`** keyed on the concept string | F9 | 30 min |
| 8 | **Baseline the 20 undocumented tables into a migration**, then delete the DDL ops from `data-ops` and `seed-cards` | F3 | 4–6 h ⚠ needs approval |
| 9 | **Add a scheduled `pg_dump` to R2/S3** and confirm Xata PITR is on | F8 | 2 h |
| 10 | **Purge the leaked secrets from git history** (`git filter-repo`, coordinated force-push) | F1 | 1–2 h ⚠ needs approval |

**Safe to batch — mechanical, low-risk, one PR each or one combined PR.**

- **Schema batch:** add `@@index([episodeId, startSeconds])`, drop `@@index([startSeconds])`,
  drop the 4 redundant indexes (F17, F26). One migration.
- **Lint batch:** fix the single `set-state-in-effect` error, delete the 4 stale
  `eslint-disable` directives, clear the 55 unused-variable warnings (F21).
- **A11y batch:** fix heading order, add the ARIA tab pattern (F23, F24).
- **Image batch:** convert the 12 `no-img-element` sites to `next/image` (F25).
- **Hygiene batch:** delete `paywall-gate.tsx`, `schema.prisma.txt`, `schema.prisma.pre-format`,
  `check_user.ts`, `discord_message.txt`, `out/`; untrack `art-pipeline.log`; prune the 41
  stale branches (F29).
- **Hardening batch:** coerce `limit`/`threshold` with `Number()` inside `semanticSearch`;
  pattern-validate `slug` in the art route (F14, F30).

**Deliberately deferred, with reasons.**

- **CSP `'unsafe-inline'` (F20)** — the nonce migration is fiddly and the practical exposure is
  low while no user content reaches `dangerouslySetInnerHTML`. Worth doing, not urgent.
- **Shared-store rate limiting (F15)** — the LLM wallet is already protected by the DB-backed
  budget; this buys fairness, not solvency.
- **API route tests (F7)** — the right amount of work is large. Start with `stripe/webhook`
  alone; it is the one where a silent regression costs money.
- **`prisma` advisory (F18)** — the only "fix" is a major downgrade to 6.12.0. Accept and track.
- **Speaker diarization (F10)** — a project, not a fix. Ship the honest UI note first.

### 7. Counts

| Metric | Exact figure |
|---|---|
| Files scanned (`src` `.ts`/`.tsx`) | **770** |
| Files scanned (`scripts`) | **185** |
| Prisma models reviewed | **81** |
| Prisma migrations reviewed | **53** |
| API routes inventoried | **92** |
| API routes read line-by-line | **27** (all `/api/admin/*`) + 8 others |
| API endpoints probed live | **16** |
| Page templates inventoried | **161** |
| Live pages fetched | **9 key + 20 sampled episodes + 331 link checks = 360 HTTP requests** |
| Internal links checked | **331** (327 × 200, 1 × 404, 3 transient) |
| Images checked | **102 unique `src`, 0 broken** |
| Transcripts sampled | **20 episodes / 43,279 segments** |
| Tests run | **167 passed, 0 failed, 0 skipped, 167 total** (30 files, 43.84s) |
| Type errors | **0** |
| Lint problems | **102** (1 error, 101 warnings) |
| npm advisories | **22** (3 critical, 13 high, 3 moderate, 3 low) |
| Secrets found | **2, in 1 file, in `origin/master`** |
| Findings by severity | **Critical 2 · High 7 · Medium 11 · Low 11 · Total 31** |

---

*Read-only audit. No files were modified in this repository other than the creation of this
`AUDIT.md`. No commits, pushes, migrations, deployments, dependency changes or writes to
production were made.*

---

## Post-audit fixes applied — 2026-08-28

Applied on branch `fix/auth-env-check-blocks-build`, **uncommitted**. Nothing pushed, nothing
deployed, no production writes.

| Plan # | Finding | Change | Verified by |
|---|---|---|---|
| 4 | F11 | Added `src/app/settings/page.tsx` — account hub linking Profile + Notifications and rendering the existing `ManageSubscription` control, so the cancel promise on `/refund` and `/contact` is actually honoured | `tsc` 0 errors · `eslint` exit 0 · `next build` → `✓ Compiled successfully`. **Render unverified** — no local `DATABASE_URL` |
| 2 | F2 | `overrides` `@auth/core` `0.41.2` → `^0.41.3`; synced `next-auth` → `5.0.0-beta.32` and `@auth/prisma-adapter` → `2.11.3` to match `origin/master` | `npm audit` **critical 3 → 0**, total 22 → 19. Installed: `@auth/core 0.41.3`, `next-auth 5.0.0-beta.32`. `tsc` 0 errors, **167/167 tests pass** |
| 3 | F4 | Added `@sentry/nextjs@10.72.0`, `src/instrumentation.ts` (+ `onRequestError`), `src/instrumentation-client.ts`, `sentry.{server,edge}.config.ts`; wrapped `next.config.ts` with `withSentryConfig` | `next build` → `✓ Compiled successfully in 28.6s`; error classes identical to the pre-Sentry build (638 `DATABASE_URL`, 3 font) — **no new failures**. `tsc` 0 errors, 167/167 tests pass |
| 3 | F4 | `src/app/error.tsx` now reports — it previously captured **nothing**, and it catches far more than `global-error.tsx` | included in the build/typecheck/test run above |
| 3 | F4 | Corrected the stale *"Railway's log drain to Better Stack"* comments in `api/errors/route.ts` and `global-error.tsx`; the route now also forwards to Sentry | — |

**Three deliberate design choices, each guarding a known failure mode in this repo:**

1. **`tunnelRoute: "/monitoring"`.** The CSP sets `connect-src 'self'` with no Sentry host, so
   a direct send to `*.ingest.sentry.io` would be **blocked outright**. Tunnelling keeps events
   same-origin — no CSP widening, and ad blockers do not eat them.
2. **Every Sentry init is guarded on the DSN being present**, and source-map upload is gated on
   `SENTRY_AUTH_TOKEN`. With neither set the SDK no-ops and builds still succeed, so a missing
   secret can never fail a deploy.
3. **`withSentryConfig` is used again deliberately.** Commit `b90753c` (2026-06-03) reverted
   Sentry because `@sentry/nextjs@9` declared `next: ^13.2 || ^14 || ^15`, was force-installed
   with `--legacy-peer-deps` against next@16, and crashed **Railway's** container health check.
   That revert note set the condition *"re-add once a next@16-compatible version is available"* —
   **it is now met**: `@sentry/nextjs@10.72.0` declares `^16.0.0-0`, installed with no legacy
   flag, and there is no container to health-check on Vercel. The wrapper builds clean.

**Still outstanding from Tier 0:** plan item **#1 (rotate the leaked Anthropic key and
`ENRICH_SECRET`)** — a credentials action, not performed by this audit. **F1 remains open and
is still the most serious finding in this report.** Note `docs/audit-2026-07-security-pass.md`
finding M1 already recommended rotating `ENRICH_SECRET` in July 2026 for a different reason;
that has not happened either.

**Requires your action before Sentry does anything:** set `NEXT_PUBLIC_SENTRY_DSN` (and
optionally `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`) in Vercel. Until
then every Sentry path is inert by design. Also note `npm` blocked `@sentry/cli`'s postinstall
under `allowScripts` — source-map upload will need that approved (`npm install-scripts approve
@sentry/cli`), though it is skipped entirely without an auth token.
