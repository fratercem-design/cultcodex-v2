# SEO Audit — CultCodex.me

**Basis:** 367 live page fetches (134 static routes + a 173-URL stratified sample across 37 sitemap segments + a 60-URL random chapter sample), plus the full 6.1 MB sitemap and robots.txt.

> **No Search Console, analytics, ranking or traffic data was available.** Nothing here is a claim about current performance. Everything is a claim about what the site *tells* crawlers.

---

## What was already right

Worth stating plainly, because the technical SEO foundations are sound and should not be "fixed":

- **367/367 real URLs returned HTTP 200.** No 404s or 5xx on any legitimate page.
- **Titles and descriptions present on every crawled page** — 0 missing of 367.
- **OG and Twitter card tags on every page** — 0 missing `og:title`, 0 missing `twitter:card`.
- **`lastmod` is honest** — 31,709 distinct values across 31,797 URLs, genuinely per-record. Many sites fail this.
- **`robots.txt` is deliberate and tiered** — default allow; a curated allow-list for AI search crawlers; a hard `Disallow: /` for scrapers (CCBot, Bytespider, Scrapy, Diffbot, omgili).
- **Redirects work** — HTTP→HTTPS 308, `/pricing`→`/premium` 308, trailing slash normalised 308.
- **Lean HTML** (10–31 KB compressed for most routes) with TTFB 0.23–0.43s.

---

## SEO-01 — 2,990 indexable sealed chapter shells · SHIPPED

The single largest technical SEO issue found.

A 60-URL random sample of `/psychenomicon/chapters/*` returned:

| Measure | Result |
|---|---|
| Sealed (paywall shell) | **60 / 60** |
| Visible text length | 1,436–1,510 chars |
| `robots` meta | `index, follow` on **all 60** |
| Canonical present | **0 / 60** |
| `<h1>` present | **0 / 60** |
| Descriptions | Distinct but templated — *"Chapter N of the Psychenomicon. A living record of evolving patterns."* |

Rendered body for every one:

> `/// initiate_only` · **This chapter is sealed.** · `Become Initiate+ →`

Only **three** chapters (`DEFAULT_FREE_COUNT`, earliest by air date) are readable without a subscription. The other 2,987 were near-identical, indexable, and submitted — roughly 9% of the site's URLs, which Google weighs as a *sitewide* quality signal rather than a per-page one.

**Shipped:** sealed chapters emit `noindex, follow` (follow retained so links out still pass equity); free ones stay `index, follow`. The shell gained the `<h1>` it never had — the title is already public in `<title>` and on the chapter index, so it reveals nothing new. Metadata now routes through `buildMetadata` like every other content route, supplying the absolute canonical plus OG and Twitter tags these pages lacked entirely.

**Verified live:** the production sitemap now lists **3** chapter URLs, down from 2,990. Total sitemap 31,797 → 28,875.

## SEO-02 — Sitewide soft-404 · SHIPPED

Every nonexistent slug returned **HTTP 200**, across all ten content types tested. The page body was correct — it rendered "Not Found" and the RSC payload contained `NEXT_HTTP_ERROR_FALLBACK;404` — so the application *knew*. Only the status was wrong.

**The cause was not what this audit first assumed.** Pages call `notFound()` correctly. A `loading.tsx` at or above a route segment wraps it in a Suspense boundary; Next flushes the shell to satisfy that boundary, the status goes out with the flush, and HTTP cannot revise a status after the response begins.

Established with controls on a local production server:

| Configuration | Result |
|---|---|
| root `loading.tsx` present | **every** route 200 |
| root removed, no segment `loading.tsx` | **404** ✓ |
| root removed, segment `loading.tsx` present | still 200 |
| parent listing `loading.tsx` removed | **404** ✓, controls stay 200 |

Two theories were tested and **discarded** first: `force-dynamic` (collections carries it and returned 404 regardless) and `generateStaticParams` (removing the empty `return []` changed only the build marker).

**The trade-off is genuine:** instant skeleton *or* correct status, never both. Listing routes address fixed URLs that can never 404 — their `loading.tsx` moved into an `(index)` route group beside the dynamic sibling, keeping the skeleton on `/topics` while leaving `/topics/[slug]` unwrapped. Detail routes lost theirs. `/admin` kept its skeletons, being auth-gated and already `noindex`.

**Verified live:** 404 on `/episodes`, `/topics`, `/people`, `/lore`, `/symbols` and `/psychenomicon/chapters` bad slugs.

## SEO-03 — Conflicting robots directives · SHIPPED

Not-found pages emitted **two** robots metas, order varying by route:

```
/episodes/zzz-404    robots:[noindex | index, follow]
/people/zzz-404      robots:[index, follow | noindex]
```

Google resolves conflicts by taking the most restrictive, so indexation was safe **by luck, not design**. The cause: `layout.tsx` declared an app-wide `robots: { index: true, follow: true }`, which is already what a crawler assumes with no tag present — so it bought nothing while colliding with the `noindex` Next adds automatically to a 404.

Also fixed: the canonical on those pages pointed at the **nonexistent URL**.

**Verified live:** `noindex` only, 0 canonicals, on all six types tested. Real pages unaffected.

## SEO-04 — Thin content at scale · OPEN, largest remaining item

Measured visible text (markup and scripts stripped), stratified sample:

| Section | Sitemap URLs | Sampled | Median chars | Thin (<2,000) | Verdict |
|---|---|---|---|---|---|
| `/episodes/*` | 2,982 | 24 | **6,830** | 0 | Healthy |
| `/people/*` | 1,539 | 25 | — | 1/25 | Healthy |
| `/lore/*` | 10,453 | 25 | — | 2/25 | Healthy |
| **`/topics/*`** | **13,743** | 24 | **1,676** | **15/24** | **Thin** |

**Topics is the largest content type and the thinnest.** Extrapolating, roughly 8,500 of 13,743 topic pages sit under 2,000 visible characters — much of that shared navigation chrome, so unique content is thinner still.

**Recommended approach — no new writing required.** Set a quality floor (a topic needs *N* linked episodes or quotes to stay indexable; below that, `noindex` it and keep it as a navigation node). Consolidate near-duplicates into hub pages with 301s. Then enrich survivors from data already in the database: transcript excerpts where the topic is discussed (5.1M segments), first/last appearance, top speakers, co-occurring topics, representative quotes (4,438 available).

## SEO-05 — AI crawlers receive no metadata in `<head>` · OPEN

Same URL, nine user agents, checking whether `<title>` and `og:title` appear inside `<head>`:

| User agent | In `<head>` |
|---|---|
| Googlebot, GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot | **NO** |
| Bingbot, Applebot, LinkedInBot, Slackbot, Discordbot | YES |

This is Next.js **streaming metadata**: it blocks the stream for a built-in bot list and streams metadata into the `<body>` for everything else, including Googlebot, on the correct assumption that Googlebot renders JS.

**Why it still matters:** robots.txt contains a *dedicated block* allowing GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, ClaudeBot and Google-Extended into the content sections — a deliberate bet on AI-search citation. Those crawlers largely do **not** execute JavaScript.

**Honest scoping:** the `<title>` does appear later in the body and lenient parsers scan the whole document, so this is degradation rather than invisibility. `<meta description>`, `<link canonical>` and `og:*` are likeliest to be missed. Impact plausible but not measurable from here — confidence Medium.

**Fix:** set `htmlLimitedBots` in `next.config.ts` to include those UAs. One config line.

## SEO-06 — Sitemap approaching limits · OPEN

| Measure | At audit | Now |
|---|---|---|
| URLs | 31,797 | **28,875** |
| Size | 6.1 MB | 5.6 MB |
| Format | single flat `<urlset>` | unchanged |

Legal (limits are 50,000 URLs / 50 MB) but `topics` at 13,743 is the fastest-growing segment. Splitting into a sitemap index by content type also lets Google recrawl volatile sections independently of stable ones.

## SEO-07 / 08 / 09 / 10 — smaller items

- **90 of 367** pages had no canonical. Admin (25) is fine — `noindex, nofollow`. Chapters fixed. **Symbols (20/21) and archetypes (8) remain.**
- **118 of 367** meta descriptions exceed 160 chars; **45** under 70. 18 essentially echo the title.
- `/members/cultofpsycheofficial` is in the sitemap but `Disallow: /members/` in robots.txt.
- `http://www.` → `https://www.` → apex is a **2-hop chain**, and the www redirect serves **307** not 301 — `middleware.ts` requests 301 but the Vercel platform answers first. Configure the apex redirect at the domain level.

---

## Structured data coverage

| Section | Types | Assessment |
|---|---|---|
| `/` | `WebSite` + `Organization` | Good |
| `/episodes/[slug]` | `WebSite` + `VideoObject` + `BreadcrumbList` | **Excellent** |
| `/lore/[slug]` | `WebSite` + `Article` + `BreadcrumbList` | **Excellent** |
| `/people/[slug]` | `WebSite` + `Person` + `BreadcrumbList` | **Excellent** |
| `/topics/[slug]` | `WebSite` + `DefinedTerm` + `BreadcrumbList` | **Excellent** — apt choice |
| `/series/[slug]` | `WebSite` + `CreativeWorkSeries` + `BreadcrumbList` | Good |
| `/faq` | `WebSite` + `FAQPage` | Good |
| `/symbols/[slug]` | `WebSite` + `WebPage` | Weak — `DefinedTerm` would fit, as with topics |
| `/psychenomicon/chapters/*` | `WebSite` only | **Gap** — no `Article`, no breadcrumb, no `isAccessibleForFree` paywall markup |
| archetypes, collections, eras, lexicon, quotes | `WebSite` only | Gap — no `BreadcrumbList` |

No invalid or misleading structured data was found, and `jsonLdScript()` escapes output correctly. The gaps are omissions, not errors.

---

## Indexability control

`robots.txt` is one of the better-considered files in the project:

- **Default (`*`)**: allow all except `/api/`, `/auth/`, `/admin/`, `/settings/`, `/members/`, `/red-room/`, `/salon/`, `/onboarding/`, `/claim/`, `/user/`.
- **AI search crawlers**: explicit allow-list of content sections, plus extra `Disallow` on `/oracle/`, `/psychenomicon/`, `/cards/` — the paid/interactive surfaces deliberately withheld.
- **Scrapers**: `Disallow: /`.

No accidental de-indexation. The one accidental *indexation* risk was SEO-01, now fixed. Note the internal tension it exposed: AI crawlers were blocked from `/psychenomicon/` while **Googlebot was not**.
