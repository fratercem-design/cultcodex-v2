# Remediation Roadmap — CultCodex.me

Ordered by value per unit of risk. Every item traces to a finding ID in `ISSUES.md`.

**Phases 1.1 and 1.2 have shipped** as [#157](https://github.com/fratercem-design/cultcodex-v2/pull/157), deployed as `81dcef0` and re-verified against production. Phases 2–5 remain.

---

## ✅ Phase 1.1 — Accessibility · SHIPPED

| Task | ID | Outcome |
|---|---|---|
| Adopt the readable accent tints on text utilities | A11Y-01/02/03 | violet 1.73:1 → **8.67:1**; gold → 7.03:1; 0 bare violet remain |
| Raise opacity-modified text to its contrast floor | A11Y-08 | 233 raised; **274/290 pass**, 16 hand-reviewed decoration |
| 24px minimum touch targets | A11Y-05 | **34 → 4** under-24 targets |
| Fix the heading outline | A11Y-06 | Root cause was worse than reported — 80 items outranked their container; now h1→h2→h3 |

See [PHASE-1.1-REPORT.md](PHASE-1.1-REPORT.md).

## ✅ Phase 1.2 — Search-engine correctness · SHIPPED

| Task | ID | Outcome |
|---|---|---|
| Real 404 statuses | SEO-02 | Verified live on 6 content types |
| One robots directive, no bogus canonical | SEO-03 | `noindex` only, 0 canonicals |
| De-index sealed chapters, add `<h1>` + canonical | SEO-01 | Live sitemap: 2,990 chapter URLs → **3** |
| Production dependency vulnerabilities | SEC-02/03/04 | **20 → 0** |
| Hydration mismatch | BUG-01 | Console clean on `/`, `/episodes`, `/topics` |
| Cap the one unbounded costly endpoint | SEC-01 | Magic-link email behind a global daily cap |

See [PHASE-1.2-REPORT.md](PHASE-1.2-REPORT.md).

---

## Phase 2 — Quick wins

**Effort: ~1 day total · Impact: moderate, disproportionate to cost**

| Task | ID | Effort |
|---|---|---|
| Remove `vr` from `Permissions-Policy` — kills a console warning on every page | BUG-02 | **One word** |
| Make the 10 `/shop` product links non-clickable until the store opens (keep the honest copy) | UX-03 | Tiny |
| Point `/corrections` at a working public channel | UX-04 | Tiny |
| Drop `/members/cultofpsycheofficial` from the sitemap, or unblock it in robots.txt | SEO-09 | Tiny |
| Add `<main>` to `/psychenomicon` and `/settings/notifications` | A11Y-07 | Tiny |
| Gate Vercel Analytics behind the same consent flag as GA, or reword the banner | PRIV-01/02 | Tiny |
| Delete whichever `middleware.ts` is dead; point `cultcodex.xyz` DNS or drop the redirect | OPS-01/02 | Tiny |
| Add canonicals to symbols and archetypes | SEO-07 | Small |
| Set `htmlLimitedBots` to include GPTBot / ClaudeBot / PerplexityBot / OAI-SearchBot | SEO-05 | Small |
| Single 301 for `http://www.` at the Vercel domain level | SEO-10 | Tiny |
| Trim 118 over-length meta descriptions to ≤160 chars | SEO-08 | Small |

## Phase 3 — Structural

**Effort: 1–2 weeks · Impact: high, compounding**

| Task | ID | Effort |
|---|---|---|
| **`admin-guard.ts` unit tests + one auth-rejection test per guarded route family** | SEC-05 | Small |
| Sweep the remaining `.catch(() => null)` → `notFound()` sites (`topics/[slug]` and others) | SEO-12 | Small |
| Split `/sitemap.xml` into a sitemap index by content type | SEO-06 | Small |
| Route-level tests: status codes, metadata presence, not-found behaviour | MNT-04 | Medium |
| Move `/lexicon` content into the database; paginate or virtualise | PERF-02 | Medium |
| Font diet: subset display faces, cut JetBrains Mono to 2 weights, re-evaluate 6 families | PERF-01 | Medium |
| Add `BreadcrumbList` to chapters, archetypes, collections, eras, lexicon | SEO-11 | Small |
| Split `data-ops/route.ts` (1,524 lines); move `grant-admin` to its own audited endpoint | MNT-02 | Medium |
| Verify inner-container scroll restoration and analytics scroll-depth | UX-02 | Medium |
| Clear the 101 lint warnings so new ones are visible | MNT-03 | Small |
| Rename `accent-gold`/`accent-violet` → `accent-ember`/`accent-bruise` | MNT-05 | Small |

**Highest-value item in this phase: the guard tests.** They are small, and they protect the one thing whose failure would be genuinely serious.

## Phase 4 — Growth and discovery

**Effort: 3–6 weeks · Impact: highest long-term**

This is where the real upside is. Everything above is repair; this is building.

| Task | ID | Effort |
|---|---|---|
| **Set a quality floor for topic pages.** Below *N* linked episodes or quotes → `noindex`, keep as a navigation node | SEO-04 | Medium |
| **Enrich surviving topics from existing data**: transcript excerpts, first/last appearance, top speakers, co-occurring topics, representative quotes — *no new writing* | SEO-04 | Large |
| **Consolidate near-duplicate topics** into hub pages; 301 the merged slugs | SEO-04 | Large |
| **Build topic↔topic relationships** from episode co-occurrence — creates the lateral paths the site lacks | UX | Medium |
| **"Continue exploring" module** at the end of every content page | UX | Medium |
| **Per-term lexicon routes** so terms can be cited from episode pages — thousands of natural contextual links, and fixes PERF-02 | UX / PERF-02 | Medium |
| **Triage the 48 orphans**: link, de-sitemap, or delete | UX-01 | Medium |
| **Free excerpts on sealed chapters** + `isAccessibleForFree` markup — improves conversion *and* restores a legitimate path to indexability | SEO-01 / SEO-11 | Medium |

**Expected impact.** Topics is 43% of the sitemap and the weakest content type. Raising its floor and enriching the survivors addresses the single largest quality-signal drag on the site, using data already in the database.

## Phase 5 — Polish

| Task | ID |
|---|---|
| Nonce-based CSP to remove `script-src 'unsafe-inline'` | SEC-06 |
| Harden `clientKey()` against proxy-header trust (prefer `x-vercel-forwarded-for`) | SEC-07 |
| Replace the per-instance rate limiter with a shared store (Upstash/Redis) — drop-in at the `rateLimit()` signature | SEC-01 |
| `DefinedTerm` schema for symbols, matching topics | SEO-11 |
| Redirect `/admin/*` to sign-in instead of returning 200 chrome | — |
| Review `/api/live/status` + `/api/auth/session-lite` polling cadence | PERF-03 |

---

## Measurement gaps to close first

Three things this audit **could not measure**. Close them before judging progress:

1. **Core Web Vitals.** Run PageSpeed Insights or read the Vercel Speed Insights already installed. **No CWV number appears anywhere in this audit**, and none should be inferred from it.
2. **Screen reader testing.** The highest-value remaining accessibility check, especially given the inner-scroll architecture (UX-02).
3. **Search Console.** Soft-404 counts and index coverage will confirm the Phase 1.2 result. Expect **~2,987 chapter URLs to leave the index** — that drop is the intended outcome, not a regression.
