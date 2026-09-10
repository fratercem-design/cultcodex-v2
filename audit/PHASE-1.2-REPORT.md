# Phase 1.2 — Search-engine correctness, dependencies, hydration

**Shipped** in [#157](https://github.com/fratercem-design/cultcodex-v2/pull/157), deployed as `81dcef0`, then **re-verified against production**.
Commits: `70d8ef6`, `c864484`, `bd71c43`, `1479bc1`, `4cbfe9b` (pre-squash SHAs).

---

## A real feedback loop came first

Phase 1.1's weakness was having no running app — and a 404 *status code* cannot be verified by reading code. So before touching anything:

- **`@electric-sql/pglite-socket`** (already a devDependency) serves an in-process Postgres over TCP, so Prisma connects with a normal `postgresql://` URL.
- `prisma db push` created all **81 tables**. An empty database is exactly right for 404 work — every slug resolves to "not found".
- `next start` against it reproduced the production bug on the first try: `/topics/zzz-nope` → **200**.

*(Docker was tried first — the repo ships a pgvector compose file — but Docker Desktop's daemon never came up. The harness gotchas are recorded in project memory.)*

---

## SEO-02 — the diagnosis in the audit was wrong

The audit said "resolve existence before streaming begins". That mis-stated the mechanism. The pages already call `notFound()` correctly; the status was committed before they ran.

**A `loading.tsx` at or above a route segment** wraps it in a Suspense boundary. Next flushes the shell to satisfy that boundary, the status goes out with the flush, and HTTP cannot revise a status afterwards. `notFound()` then only swaps the body.

Established with controls:

| Configuration | Result |
|---|---|
| root `loading.tsx` present | **every** route 200 |
| root removed, no segment `loading.tsx` | **404** ✓ (symbols, eras, archetypes) |
| root removed, segment `loading.tsx` present | still 200 (topics, episodes, lore) |
| parent listing `loading.tsx` removed | **404** ✓ (topics), controls stay 200 |

**Two theories tested and discarded first** — recorded so nobody re-runs them:

1. **`force-dynamic`** — added it to `collections/[slug]`, which returned 404 before and after.
2. **`generateStaticParams`** — removing the empty `return []` from topics flipped the build marker from ● SSG to ƒ Dynamic and changed nothing else.

### The trade-off is genuine

A route gets an instant skeleton **or** a correct 404 status. Never both. That is HTTP, not Next.js.

So skeletons were kept exactly where they cost nothing:

- **Listing routes** address fixed URLs that can never 404 → skeleton kept, moved into an `(index)` route group beside the dynamic sibling. `/topics` keeps its skeleton; `/topics/[slug]` is unwrapped.
- **Detail routes** address an unbounded URL space → 11 files removed.
- **Root** `loading.tsx` was wrapping all 84 route segments → moved into `(home)`, scoping it to `/`.
- **`/admin`** keeps its skeletons — auth-gated and already `noindex, nofollow`.

## SEO-03 — the robots conflict

`layout.tsx` declared an app-wide `robots: { index: true, follow: true }`. That is already what a crawler assumes with no tag present, so it bought nothing — while colliding with the `noindex` Next adds automatically to a 404. Google resolves such conflicts by taking the most restrictive, so the outcome happened to be right, but by luck rather than intent. Removed.

## SEO-01 — sealed chapters

Of 2,990 chapters, **three** are readable without a subscription (`DEFAULT_FREE_COUNT`, earliest by air date). The other **2,987** served the same ~1,450-character shell.

Verified against a seeded scratch database (5 chapters, 3 free / 2 sealed), then re-verified live:

| Chapter | HTTP | robots | `<h1>` | canonical |
|---|---|---|---|---|
| sealed | 200 | **`noindex, follow`** | **1** | absolute ✓ |
| free | 200 | **`index, follow`** | 1 | absolute ✓ |

Both had **zero** `<h1>` and **no** canonical before. `follow` is kept on sealed pages so links out still pass equity. Metadata now routes through `buildMetadata`, which also supplies the OG and Twitter tags these pages lacked entirely.

The sitemap rule is extracted as `indexableChapterSubset()` and unit-tested, because the sitemap route caches for an hour and cannot be checked over HTTP within a session.

## BUG-01 — hydration mismatch

It didn't reproduce locally, which turned out to be the clue: the scratch DB is **empty**, so no dates or counts render. Two formatters read ambient state:

| | server (UTC) | client |
|---|---|---|
| `formatDate` (no `timeZone`) | Jan 1, 2024 | **Dec 31, 2023** |
| `3018.toLocaleString()` | 3,018 | **3.018** / **3 018** / **51,03,266** |

Both are React's own documented causes for #418. Fixed centrally: `timeZone: "UTC"` (covers 35 sites), 93 bare `toLocaleString()` pinned across 38 files, 22 `toLocaleDateString` sites given a zone. Typecheck caught a duplicate-key bug the codemod introduced.

## SEC-02/03/04 — dependencies

`prisma` (the CLI) sat in `dependencies` with **zero** app imports, dragging its whole toolchain into the production graph. Moving it to devDependencies took 20 → 16 and highs 13 → 9; `npm audit fix` cleared the rest.

**Production vulnerabilities: 20 → 0.** Four highs remain, dev-only, all the Prisma cluster whose only offered "fix" is a major downgrade. **Never run `npm audit fix --force` here.**

## SEC-01 — magic-link email

All three paid-LLM endpoints already had global daily caps. The gap was `/api/auth/magic`: anonymous, sends via Resend, and its per-email cooldown only guards the *same* address.

Added `consumeDailyBudget()` — same counter, fails closed, deliberately **without** the AI killswitch so an AI incident can't lock people out of sign-in. On self-review I caught my own bug: I had consumed the budget before validating input, letting malformed requests burn the day's allowance for free. Moved it to the line where money is spent.

---

## A reliability bug found while verifying

Two `.catch(() => null)` guards fed `notFound()`. Once a missing row produced a real 404, that made a **transient database error indistinguishable from a chapter that does not exist** — and this database hibernates, so a wake-up blip could hand Google a 404 for a page that exists.

Errors now surface as 500, which crawlers retry. Not theoretical: the moment the guards came out, harness connection drops turned from silent 404s into visible 500s.

**Follow-up (SEO-12):** the same pattern appears on other routes including `topics/[slug]`. Harmless when everything returned 200; not harmless now.

---

## Verification — live in production

| Probe | Before | After |
|---|---|---|
| `/episodes/zzz-nope` | 200 | **404** |
| `/topics/zzz-nope` | 200 | **404** |
| `/people/zzz-nope` | 200 | **404** |
| `/lore/zzz-nope` | 200 | **404** |
| `/symbols/zzz-nope` | 200 | **404** |
| `/psychenomicon/chapters/chapter-999999` | 200 | **404** |
| robots on not-found | `noindex` + `index, follow` | **`noindex`** |
| canonical on not-found | the missing URL | **none** |
| Sitemap chapter URLs | 2,990 | **3** |
| Sitemap total | 31,797 | **28,875** |
| Console on `/`, `/episodes`, `/topics` | uncaught #418 | **clean** |

Real pages unaffected: `/`, `/episodes`, `/about`, `/explore` all still 200.

**Gates:** typecheck 0 · lint 0 errors · **207 tests** · build 0.

### Two new test files

- **`route-status-guards.test.ts`** — walks `src/app` and fails if a `loading.tsx` sits at or above any public dynamic segment. **Confirmed non-vacuous:** restoring `topics/loading.tsx` fails it, naming the offending pair.
- **`sitemap-chapters.test.ts`** — tests `indexableChapterSubset()` directly, including at real scale (2,990 in → 3 out).

### Not verified

- **`series/[slug]`** returns 500 locally — **pre-existing**, confirmed by reverting my changes and seeing it persist. An artifact of the empty scratch database; production returns 200.
- `people`/`lore` 404s were verified only after restarting PGlite; the harness degrades under concurrent queries and needed the pool serialised.
