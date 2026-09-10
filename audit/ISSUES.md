# CultCodex.me — Prioritised Issue List

**Audit date:** 2026-09-09 · **Remediation shipped:** 2026-09-10 via [#157](https://github.com/fratercem-design/cultcodex-v2/pull/157) (squash-merged to `master`, deployed as `81dcef0`)
**Code audited:** `origin/master` @ `6ba2a50` (isolated worktree; the working checkout was not modified)
**Live target:** https://cultcodex.me

Severity: **P0** catastrophic · **P1** major · **P2** meaningful · **P3** polish
Confidence: **High** = directly measured · **Medium** = measured with caveats · **Low** = inferred

> **No P0 issues were found.** The site was up, admin auth held against anonymous probing, no secrets were committed, and the production build was green.

| ID | Pri | Category | Issue | Location | Effort | Conf | Status |
|----|-----|----------|-------|----------|--------|------|--------|
| SEC-01 | P1 | Security | Rate limiter does not limit: 75 sequential requests against a documented 60/min cap produced **zero** 429s. In-memory Map, so each serverless instance keeps its own counter | `src/lib/rate-limit.ts` | Medium | High | **MITIGATED & SHIPPED** — paid LLM + email endpoints now behind a global daily cap; the limiter itself is still per-instance (needs Upstash/Redis) |
| SEC-02 | P1 | Security | 20 production dependency vulns (13 high) incl. `undici` (5 CVEs), `qs`, `path-to-regexp` | `package.json` | Small | High | **SHIPPED** — production vulns **20 → 0** |
| SEC-03 | P2 | Security | `prisma` CLI was a runtime dependency, never imported by app code (0 imports), dragging `mysql2`/`hono`/`deepmerge-ts` into the production graph | `package.json` | Tiny | High | **SHIPPED** — moved to devDependencies |
| SEC-04 | P2 | Security | `npm audit fix --force` would **downgrade Prisma 7.10 → 6.19.3** and break the app | `package.json` | Tiny | High | **DOCUMENTED** — the 4 remaining dev-only highs are this cluster; recorded in the commit so it is not "fixed" by accident |
| SEC-05 | P2 | Testing | `src/lib/admin-guard.ts` — the gate in front of 27 admin endpoints — has **no tests**; 0 API-route tests exist | `src/lib/__tests__/` | Small | High | **Open** |
| SEC-06 | P3 | Security | CSP allows `script-src 'unsafe-inline'` with no nonce | `next.config.ts` | Medium | High | **Open** |
| SEC-07 | P3 | Security | `clientKey()` trusts the client-supplied `x-forwarded-for` first value with no proxy-depth validation | `src/lib/rate-limit.ts` | Tiny | Medium | **Open** — spoof **not verified** |
| SEO-01 | P1 | SEO | **2,990 sealed chapter URLs** in the sitemap, all `index, follow`, all serving an identical ~1,500-char paywall shell, no `<h1>`, no canonical | `/psychenomicon/chapters/*` | Medium | High | **SHIPPED & VERIFIED LIVE** — live sitemap now lists **3** chapter URLs; sealed chapters return `noindex, follow` + `<h1>` + canonical |
| SEO-02 | P1 | SEO | **Sitewide soft-404**: every nonexistent slug returned **HTTP 200**, across all 10 content types | all `[slug]` routes | Small | High | **SHIPPED & VERIFIED LIVE** — 404 confirmed on production across 6 types |
| SEO-03 | P1 | SEO | Conflicting robots meta on not-found pages: both `noindex` **and** `index, follow`, order varying by route; canonical pointed at the missing URL | not-found paths | Small | High | **SHIPPED & VERIFIED LIVE** — `noindex` only, 0 canonicals |
| SEO-04 | P1 | Content | ~52% of the sitemap is thin or gated: topics median **1,676 chars** (15/24 sampled under 2,000) across 13,743 URLs | `/topics/*` | Large | High | **Open — largest remaining item** |
| SEO-05 | P2 | SEO | Metadata absent from `<head>` for **GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot, Googlebot**; present for Bingbot / Applebot / Slack / Discord / LinkedIn | Next.js streaming metadata | Small | Medium | **Open** — robots.txt explicitly *invites* those crawlers |
| SEO-06 | P2 | SEO | Single flat sitemap: 31,797 URLs / 6.1 MB, 64% of Google's 50k ceiling | `src/app/sitemap.ts` | Small | High | **Open** — eased to 28,875 by SEO-01, not solved |
| SEO-07 | P2 | SEO | 90 of 367 crawled pages had no canonical | see PAGE-INVENTORY | Small | High | **Partial** — chapters fixed; symbols (20/21) and archetypes (8) still open |
| SEO-08 | P2 | SEO | 118 of 367 meta descriptions exceed 160 chars; 45 fall under 70 | sitewide | Small | High | **Open** |
| SEO-09 | P3 | SEO | `/members/cultofpsycheofficial` is in the sitemap but `Disallow: /members/` in robots.txt | robots.txt vs sitemap | Tiny | High | **Open** |
| SEO-10 | P3 | SEO | `http://www.` → `https://www.` → apex is a 2-hop chain; the www redirect serves **307**, not 301 | Vercel platform | Tiny | High | **Open** |
| SEO-11 | P2 | Structured data | Chapters, archetypes, collections, eras, lexicon, quotes carried only `WebSite`; no `BreadcrumbList`, no paywall markup | see SEO-AUDIT | Small | High | **Partial** — chapters gained canonical/OG/Twitter; `BreadcrumbList` + `isAccessibleForFree` still open |
| SEO-12 | P2 | Reliability | `.catch(() => null)` feeding `notFound()` makes a transient DB error indistinguishable from a missing record. With a hibernating database, a wake-up blip can serve Google a 404 for a page that exists | chapter route fixed; others remain | Small | High | **Partial** — fixed on chapters; `topics/[slug]` and others still carry the pattern |
| A11Y-01 | P1 | Accessibility | `--accent-violet` `#4A2D6E` renders text at **1.73:1** (needs 4.5:1) — 423 uses. Below the 3:1 floor for graphics too | `src/app/globals.css` | Small | High | **SHIPPED** — 0 bare uses remain |
| A11Y-02 | P1 | Accessibility | `--accent-gold` `#C8392E` renders text at **3.93:1** — 949 uses | `src/app/globals.css` | Small | High | **SHIPPED** — 58 remain, all verified large text or icons |
| A11Y-03 | P1 | Accessibility | **The fix already existed and was unused**: `--accent-gold-text` (5:1) had **0** uses, `--accent-violet-text` (8:1) had **1** | `src/app/globals.css` | Small | High | **SHIPPED** — now 891 / 427 uses |
| A11Y-04 | P1 | Accessibility | 46 of 218 visible text elements (**21%**) failed WCAG AA contrast on one episode page | `/episodes/[slug]` | Medium | High | **SHIPPED** — solid colours and the opacity band both resolved |
| A11Y-08 | P1 | Accessibility | **Found while fixing A11Y-04:** 290 call sites carry an opacity modifier that composites the fixed tint back down — `gold/60` = 3.08:1, `violet/50` = 2.83:1 | sitewide | Medium | High | **SHIPPED** — 233 raised to floor; 274/290 pass, 16 hand-reviewed decoration |
| A11Y-05 | P2 | Accessibility | **34 of 44** interactive targets under 24×24 CSS px at 375px (WCAG 2.2 AA 2.5.8) | footer nav, entry banner | Medium | High | **SHIPPED** — 34 → 4, the 4 exempt by rule |
| A11Y-06 | P2 | Accessibility | Heading order jumped `H1 → H3`. Root cause was worse: 80 list items rendered `<h2>` **inside** an `<h3>` section | `SectionCard`, `EpisodeListItem` | Small | High | **SHIPPED** — now h1 → h2 → h3 |
| A11Y-07 | P3 | Accessibility | 2 of 134 static routes lack a `<main>` landmark | `/psychenomicon`, `/settings/notifications` | Tiny | High | **Open** |
| BUG-01 | P1 | Correctness | Uncaught React **#418 hydration mismatch on every page**. Cause: `formatDate` used Intl with no `timeZone`, and 93 bare `toLocaleString()` calls read the ambient locale | `src/lib/format/date.ts` + 38 files | Medium | High | **SHIPPED & VERIFIED LIVE** — console clean on `/`, `/episodes`, `/topics` |
| BUG-02 | P3 | Correctness | `Permissions-Policy` includes the unrecognised feature `vr` — console warning on every page | `next.config.ts` | Tiny | High | **Open** — one word |
| PRIV-01 | P2 | Privacy | Vercel Analytics loads and POSTs a pageview **after the user clicks "Decline"** | `src/app/layout.tsx` | Tiny | High | **Open** — GA gating works correctly; this stream does not |
| PRIV-02 | P3 | Privacy | The consent banner names only "Google Analytics"; Vercel Analytics is disclosed in the privacy policy but not the banner | `components/layout/cookie-consent` | Tiny | High | **Open** — technical observation, not a legal conclusion |
| UX-01 | P2 | UX / IA | **48 static routes are never linked** from any of 367 crawled pages; 4 are in the sitemap (`/media-kit`, `/stats`, `/mythic-map`, `/live`) | see UX-CONTENT-AUDIT | Medium | Medium | **Open** |
| UX-02 | P2 | UX | The document does not scroll; everything scrolls inside `div#main-content`. Costs the mobile URL-bar collapse, native scroll restoration, viewport `sticky`, and scroll-depth analytics | layout | Large | High | **Open — deliberate design** |
| UX-03 | P2 | Conversion | All 10 `/shop` product links 404. **Disclosed** on the page as pre-launch, so not a trust violation — but still clickable | `src/lib/merch.ts` | Tiny | High | **Open** |
| UX-04 | P2 | Trust | `/corrections` links to a GitHub URL that **404s** publicly (private repo) — the stated accountability channel is unusable | `/corrections` | Tiny | High | **Open** |
| PERF-01 | P2 | Performance | Fonts are **237 KB across 8 files** — heavier than all JS (295 KB). Six families, JetBrains Mono in 4 weights | `src/app/globals.css` | Medium | High | **Open** |
| PERF-02 | P3 | Performance | `/lexicon` ships **109 KB** compressed HTML from a 2,873-line page component | `src/app/lexicon/page.tsx` | Medium | High | **Open** |
| MNT-01 | P2 | Maintainability | An `audit-remediation` branch held unmerged commits fixing issues that were still live | branch | Small | High | **Resolved** — superseded by #157 |
| MNT-02 | P3 | Maintainability | `src/app/api/admin/data-ops/route.ts` is 1,524 lines with ~15 operations including `grant-admin` | that file | Medium | High | **Open** |
| MNT-03 | P3 | Maintainability | 101 lint warnings (0 errors) | see FULL-AUDIT | Small | High | **Open** |
| MNT-04 | P2 | Testing | 31 test files for 691 source files (~4.5%); zero tests across 162 pages / 92 API routes | `src/**/__tests__` | Large | High | **Partial** — 207 tests now (from 182); route/metadata guards added, API auth still untested |
| MNT-05 | P3 | Design system | The token named `accent-gold` resolves to red `#C8392E`; `accent-violet` to a dark bruise | `src/app/globals.css` | Tiny | High | **Open** — deliberate repaint, stale names |
| OPS-01 | P2 | Correctness | `master` has **two middleware files** — root `middleware.ts` (www→apex) and `src/middleware.ts` (.xyz→.me). Next.js uses only one, so one is dead code | repo root + `src/` | Tiny | High | **Open** — no live breakage: www→apex is handled by **Vercel** at the platform level (307) |
| OPS-02 | P3 | Config | `cultcodex.xyz` does **not resolve**, so the `.xyz→.me` redirect can never fire | DNS / Vercel domains | Tiny | High | **Open** |

## Not verified

Listed so silence is not mistaken for a pass.

| Item | Why |
|---|---|
| **Core Web Vitals (LCP / FCP / INP)** | The browser pane reports `visibilityState: "hidden"`, which suppresses paint timing. **No CWV number appears anywhere in this audit.** Use PageSpeed Insights or the Vercel Speed Insights already installed. |
| `x-forwarded-for` spoofability (SEC-07) | The per-instance limiter is too leaky to act as a detector. Needs an endpoint that echoes the resolved IP. |
| Orphan list completeness (UX-01) | Built from server-rendered HTML links only; links revealed by client-side interaction would not appear. |
| Authenticated, member and admin UI | Audited anonymously only. |
| Stripe checkout, Oracle answers, card packs, email sending | Paid, stateful or outbound flows deliberately not exercised. |
| Screen-reader behaviour | Programmatic checks are not a substitute, especially given the inner-scroll architecture (UX-02). **Highest-value remaining accessibility test.** |
| Real-device mobile | Viewport emulation at 375×812 only. |
