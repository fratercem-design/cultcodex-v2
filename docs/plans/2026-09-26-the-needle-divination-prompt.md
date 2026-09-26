# Build prompt: The Needle — divination by the archive's own voice

Paste everything below the line into Zencoder (or any coding agent) at the repo root.

---

## Role and ground rules

You are working in the CultCodex v2 repo. Read `CLAUDE.md` first and follow it: Next.js 16 App Router (read `node_modules/next/dist/docs/` before writing route or page code, the APIs differ from what you know), React 19, Prisma 7 with the client at `@/generated/prisma/client`, Tailwind v4, Vitest. Make surgical changes, match existing style, and don't refactor code you didn't need to touch.

## What we're building

**The Needle** (`/needle`) is a divination tool that answers a question with a real moment from the show.

Most divination apps shuffle a fixed deck. CultCodex already has one of those (`/tarot`, `/draw`, `src/lib/cards/reading.ts`). The Needle does something no other app can: it treats every transcribed hour of the show as the deck. You ask a question, the Codex "drops the needle" somewhere in the archive, and you get a 30–60 second clip, timestamped and playable, that becomes your answer.

The old name for this is *sortes* (bibliomancy): open a book at random and read the line your finger lands on. Here the book is the transcript archive, the randomness is seeded and weighted by meaning, and the line comes with the original video.

### One reading = three pulls

| Pull | What it is | How it's picked |
|---|---|---|
| **The Needle** | The answer | Weighted-random pick from the segments semantically closest to the question |
| **The Echo** | The same idea said at a different time | Closest match from a *different episode* and a different year than the Needle, if one exists |
| **The Skip** | The thing you didn't ask about | Seeded pick from the lower-similarity half of the candidates: related, but sideways |

Each pull shows: episode title + number + air date, speaker label, the transcript text of the window, a playable embed that starts at the timestamp, and a link to `/episodes/[slug]` at that moment.

## How it works (implement in this order)

### 1. Pure logic — `src/lib/needle/`

Keep everything that can be pure, pure, so it's testable without a DB.

- `seed.ts`
  - `needleSeed({ userId, question, day })` returns a sha256 hex string of `userId | normalized question | YYYY-MM-DD (UTC)`. Normalize by lowercasing, trimming, and collapsing whitespace. Same person + same question + same day = same reading. That's intentional: asking again doesn't reroll fate.
  - `publicSeed(day)` for the anonymous "Needle of the Day" (same for everyone).
  - A small seeded PRNG (mulberry32 or similar) built from the seed. Don't use `Math.random` anywhere in the pick path.
- `pick.ts`
  - `weightedPick(candidates, rng, temperature)`: softmax over `score / temperature`, then sample. Default temperature `0.08`, tuned so the top hit usually wins but not always.
  - `pickThree(candidates, rng)` returns `{ needle, echo, skip }` using the rules in the table. Echo must differ from Needle in `episodeId` and should differ by air-date year when possible (fall back to any other episode). Skip samples from the bottom half by score. Return `null` for a pull that has no valid candidate. Never duplicate a segment across pulls.
- `window.ts`
  - `expandWindow(anchor, neighbors, { minSeconds: 30, maxSeconds: 60 })` merges adjacent `TranscriptSegment`s from the same episode around the anchor until the window is 30–60s. Keep speaker labels per line.

### 2. Data — `src/lib/queries/needle.ts`

- Candidate search: call the existing `semanticSearch([{ concept: question, threshold: 0.3 }], { limit: 50 })` from `src/lib/queries/semantic.ts`. Don't write new vector SQL. Drop candidates whose text is under ~60 characters (filler like "yeah, totally").
- Neighbor fetch for `expandWindow`: one query for segments in the same episode with `startSeconds` within ±60s of the anchor, ordered by `startSeconds`.
- Only use episodes with `status: published`.
- Include `youtubeVideoId`, `rumbleEmbedId`, `slug`, `episodeNumber`, `airDate`, `thumbnailUrl`.

### 3. Persistence — new Prisma model + migration

```prisma
model NeedleReading {
  id             String   @id @default(cuid())
  userId         String?
  question       String   @db.Text
  seed           String
  day            DateTime @db.Date
  needleSegId    String?
  echoSegId      String?
  skipSegId      String?
  interpretation String?  @db.Text
  shareSlug      String   @unique
  isPublic       Boolean  @default(false)
  createdAt      DateTime @default(now())

  @@unique([userId, seed])
  @@index([userId, createdAt])
}
```

- Store segment ids rather than copying text; re-read on render.
- Create the migration with `npx prisma migrate dev --name add_needle_reading`, commit it under `prisma/migrations/`, run `npx prisma generate`.
- `@@unique([userId, seed])` makes a same-day repeat question return the stored reading instead of creating (or charging for) a new one.

### 4. API — `src/app/api/needle/route.ts` (POST)

Request: `{ question: string, interpret?: boolean }`.

In this order:
1. Validate: question is 3–280 characters after trimming. Reject otherwise with 400.
2. Auth: `getCurrentUser()` from `src/lib/auth.ts`. Signed-out users get 401 with a message pointing them to sign in (they can still see the public Needle of the Day on the page).
3. Rate limit: `rateLimit` + `sharedRateLimit("needle", clientKey(req, user.id), { limit: 10, windowMs: 60_000 })` from `src/lib/rate-limit.ts`. Copy how `src/app/api/oracle/ask/route.ts` does it.
4. Compute the seed. If a `NeedleReading` with `(userId, seed)` already exists, return it. No charge, no new embedding call.
5. Pricing, using the existing Signal economy in `src/lib/cards/signal.ts`:
   - The first Needle each UTC day is free.
   - Each additional one costs **2 Signal** via `spendSignalTx(tx, userId, 2, grant, "needle_drop", { readingId })` inside a Serializable transaction. Map "Insufficient Signal" to 402.
6. Embedding spend: the question embed goes through OpenAI. Guard it with `consumeDailyBudget("needle_embed", Number(process.env.NEEDLE_DAILY_CAP ?? 2000))` from `src/lib/llm-budget.ts`. Budget failure → 503.
7. Search, pick, expand, persist, return JSON:
   `{ shareSlug, question, day, needle, echo, skip, interpretation: string | null }`.

### 5. Optional interpretation — `interpret: true`

- Allowed for subscribers (`isSubscribed(user.id)` from `src/lib/subscription.ts`). Everyone else pays **3 extra Signal**.
- Model: go through the existing Bedrock client in `src/lib/anthropic.ts` with `bedrockModelId(...)`. Read the model from `NEEDLE_MODEL` and default to a fast, cheap model. The interpretation is short, so it doesn't need the Oracle's heavy model.
- Gate with `consumeDailyBudget("needle_interpret", Number(process.env.NEEDLE_INTERPRET_CAP ?? 500))`.
- System prompt rules (put them in `src/lib/needle/prompt.ts` and unit-test that the builder includes them):
  - Interpret **only** from the three passages. Quote them. Never invent things the hosts said.
  - 120–180 words. Plain, warm, a little wry, in the voice of the archive, not a fortune teller.
  - Read the Needle as the answer, the Echo as the pattern, and the Skip as the blind spot.
  - No predictions about health, money, legal outcomes, or other people's intentions. If the question asks for one, reframe it as reflection.
- Save to `NeedleReading.interpretation`. If generation fails, refund the Signal (or skip charging until success) and still return the three pulls.

### 6. Pages

- `src/app/needle/page.tsx`: a server shell and a client component.
  - Top: a question box (280 char counter) and a "Drop the needle" button.
  - Signed out: show **Needle of the Day**, built from `publicSeed(today)` against a fixed rotating prompt list in `src/lib/needle/daily-prompts.ts` (about 30 short evocative prompts, indexed by day-of-year). Cache it for the day.
  - Result view: three stacked cards labeled Needle / Echo / Skip. Use `src/components/media/youtube-embed.tsx` with `startSeconds`. Fall back to the Rumble embed (`rumbleEmbedId`) if there's no YouTube id, and to text-only if neither exists.
  - Reveal animation: a short "needle drop" (a record-groove line sweeping to a point, then the card fades in). Respect `prefers-reduced-motion`.
  - Interpretation button, shown with its price (free for subscribers, 3 Signal otherwise).
  - "Your recent needles" list (last 10) for signed-in users.
- `src/app/needle/r/[slug]/page.tsx`: public share page. Only visible if `isPublic` is true. Show the question, the three pulls, and the interpretation. Add a "make public / private" toggle for the owner through a server action.
- `src/app/needle/r/[slug]/opengraph-image.tsx`: copy the pattern and fonts in `src/app/oracle/opengraph-image.tsx` and `src/lib/og-fonts.ts`. Show the question plus the Needle's quote line and episode title.
- Metadata with `alternates.canonical`, the same way `src/app/draw/page.tsx` does it.
- Link The Needle from `src/components/layout/site-footer.tsx` next to the existing "Draw from the Deck" (`/draw`) link. Leave the main nav in `src/lib/nav.ts` alone unless asked; it's a numbered, keyboard-shortcut list.
- Add `/needle` to the sitemap where the other static routes live (`src/lib/sitemap.ts`).

### 7. Copy

Keep visitor-facing text plain and specific. After writing it, run the repo's `no-ai-slop` guidance (`.claude/skills/no-ai-slop/`) over `src/app/needle`. Examples of the right register:
- Button: "Drop the needle"
- Empty state: "The archive went quiet on that one. Try asking it differently."
- Repeat-ask note: "You already asked that today. The needle lands in the same place until midnight UTC."

## Tests (Vitest)

- `src/lib/needle/__tests__/seed.test.ts`: same inputs give the same seed; whitespace and case changes don't change it; a different day does.
- `pick.test.ts`: determinism for a fixed seed; the three pulls never share a segment; Echo always has a different episode; the function handles 0, 1, and 2 candidates without throwing; with temperature → 0 the top candidate always wins.
- `window.test.ts`: windows stay within 30–60s, stay inside one episode, and handle an anchor at the start or end of an episode.
- `src/app/api/needle/route.test.ts`: mock Prisma, `semanticSearch`, and the budget helpers the way `src/app/api/oracle/ask/route.test.ts` does. Cover 400 (bad question), 401 (signed out), cached repeat (no charge, no search call), first-of-day free, second costs 2 Signal, 402 on insufficient Signal, 503 on budget exhausted, and interpretation gating for subscriber vs. non-subscriber.

## Done means

- [ ] `npm run lint`, `npm run test`, and `npx tsc --noEmit` pass.
- [ ] `npm run build` succeeds (the page must not prerender a DB call at build time; mark it dynamic where needed).
- [ ] Migration committed; `CLAUDE.md` gets a short **The Needle** paragraph under Architecture, and `NEEDLE_MODEL`, `NEEDLE_DAILY_CAP`, and `NEEDLE_INTERPRET_CAP` are added to the env var list.
- [ ] Manually verified locally: ask a question, get three playable clips at the right timestamps, ask again and get the identical reading, share link works when public and 404s when private.

## Out of scope (don't build these)

- New embedding pipelines or reindexing. Use what `semanticSearch` already queries.
- Changes to the card/tarot system.
- Streaming (SSE) for the interpretation. It's short enough for a normal JSON response.
