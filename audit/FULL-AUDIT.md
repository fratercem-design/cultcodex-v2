# Full Audit — CultCodex.me

**Date:** 2026-09-09 · **Audited:** `origin/master` @ `6ba2a50` · **Remediation:** #157, deployed `81dcef0`

All work was done in a detached `git worktree`. **The working checkout was never modified.**

---

## 1. Architecture

### Stack

| Layer | Technology |
|---|---|
| Framework | Next.js **16.3.4** App Router, React **19.2.8** |
| Language | TypeScript 5, strict (typecheck exit 0) |
| Styling | Tailwind CSS 4 + `globals.css` custom properties |
| ORM / DB | Prisma **7.10** → PostgreSQL on **Xata** |
| Auth | NextAuth **5.0.0-beta.32** (Google OAuth + magic link) |
| Payments | Stripe 22.6 |
| Monitoring | Sentry 10.73 (`tunnelRoute: /monitoring`) |
| Analytics | Google Analytics (consent-gated) + Vercel Analytics |
| Validation | Zod 4 |
| Tests | Vitest |
| Hosting | Vercel (2 cron jobs) |
| Deploy branch | **`master`** (not `main`) |

### Scale

```
162  page.tsx routes          92  route.ts API endpoints
195  components               84  top-level route segments
780  TS/TSX files         243,158  lines under src/ (incl. generated Prisma client)
 31  test files (at audit)   691  source files excluding generated  (~4.5% coverage)
```

### Directory shape

```
src/app/            162 pages + 92 API routes across 84 segments
src/components/     195 components (archive, cards, ui, layout, search, oracle…)
src/lib/            db singleton, queries/, auth, admin-guard, rate-limit, seo,
                    providers/ (anthropic|gemini|groq|cohere|openrouter), cards/, book/, sse/
src/generated/      Prisma client (untracked, generated at install)
scripts/            ingest, scrape, enrich, asr, psychenomicon-art, cards
prisma/             schema + migrations (partly db-push built)
```

### Content pipeline

```
YouTube ──▶ ingest (Episode rows) ──▶ transcripts (YouTube captions → Supadata → ASR)
                                          │
                                          ▼
                              enrich (LLM: topics, people, quotes, lore)
                                          │
                                          ▼
                        Postgres/Xata ──▶ Next.js App Router ──▶ Vercel
```

Content is **database-driven**, rendered dynamically for most content routes. Automation runs through GitHub Actions plus two Vercel crons, with `/api/keep-alive` pinged every 5 minutes to prevent Xata branch hibernation.

### Production-specific behaviour

- `vercel.json` sets `buildCommand: npm run vercel-build` → `scripts/vercel-build.mjs`, which runs `prisma migrate deploy` **only when `VERCEL_ENV === "production"`**, then `next build`. A push to `master` therefore migrates the production database as well as deploying.
- ~20 API routes export `maxDuration`, a Vercel-only primitive.
- Sentry source-map upload is opt-in on `SENTRY_AUTH_TOKEN`, so a missing token cannot fail a build.

---

## 2. Build and runtime health (at audit)

| Check | Command | Result |
|---|---|---|
| Install | `npm ci` | ✅ 1,101 packages |
| Typecheck | `npx tsc --noEmit` | ✅ **exit 0, zero errors** |
| Lint | `npx eslint .` | ✅ **0 errors**, 101 warnings |
| Tests | `npx vitest run` | ✅ **31 files, 182 tests, all passing** |
| Production build | `npx next build` | ✅ **exit 0**, 200/200 static pages |

A genuinely healthy build. Nothing was skipped or silenced to get it green.

**After remediation:** 36 test files, **207 tests**, typecheck 0, lint 0 errors, build 0.

### Warnings recorded, not dismissed

- **101 ESLint warnings**, 0 errors. Concentrations: `src/lib/cards/card-art.tsx` (16 unused vars), `src/lib/providers/*` (5 unused `req` params), 2 `window.location.href` internal navigations that should use `useRouter()`, 2 stale `eslint-disable` directives.
- **Build:** custom Cache-Control header warning — expected, given the deliberate caching rules.
- **Install:** 6 packages had install scripts blocked locally (`@prisma/engines`, `@sentry/cli`, `esbuild`, `prisma`, `unrs-resolver`) — a sandbox artifact; these run normally on Vercel.
- **Deprecated transitive deps:** `node-domexception@1.0.0`, `glob@10.5.0`.

### Runtime errors observed in production

- **Uncaught React #418** (hydration mismatch) on `/`, `/episodes`, `/topics` — **fixed**, verified clean.
- **`Permissions-Policy: Unrecognized feature 'vr'`** on every page — **still open** (BUG-02).
- No failed network requests for site assets; no 5xx across 367 fetches.

---

## 3. Category findings

Detailed findings live in the dedicated reports:

| Area | Report |
|---|---|
| Crawl, status codes, metadata, duplicates, redirects | `PAGE-INVENTORY.md` |
| Technical SEO, structured data, indexability | `SEO-AUDIT.md` |
| Performance | `PERFORMANCE-AUDIT.md` |
| Accessibility (WCAG 2.2 AA) | `ACCESSIBILITY-AUDIT.md` |
| Security, privacy, tracking | `SECURITY-AUDIT.md` |
| UX, IA, content, brand, trust, conversion | `UX-CONTENT-AUDIT.md` |
| Prioritised issue table | `ISSUES.md` |
| Remediation plan | `ROADMAP.md` |

---

## 4. Code quality

**Strengths — and these are real:**

- Zero TypeScript errors across 243k lines; no `any` epidemic.
- **The comments are unusually good.** Several explain *why* rather than *what*, and encode hard-won debugging: `next.config.ts` explains why `outputFileTracingIncludes` is needed for OG fonts (tracing cannot infer a runtime `readFileSync`); `rate-limit.ts` documents its own serverless limitation honestly rather than pretending; `globals.css` records the palette repaint and its rationale.
- `jsonLdScript()` is correctly hardened against `</script>` breakout **and** U+2028/U+2029.
- `admin-guard.ts` is disciplined: constant-time, fail-closed, with a wrapper specifically to turn a throwing guard into a 403 rather than a 500.

**Weaknesses:**

| Issue | Evidence |
|---|---|
| Mega-files | `data-ops/route.ts` 1,524 lines (~15 ops incl. `grant-admin`); `lexicon/page.tsx` 2,873 lines |
| Dead code | ~16 unused variables in `card-art.tsx` |
| Warning debt | 101 warnings means a new one is invisible |
| Ad-hoc DDL | 8 `$executeRawUnsafe` calls applying schema patches through an API endpoint rather than migrations (not injectable — all hardcoded literals — but a process smell) |
| Error swallowing | `.catch(() => null)` feeding `notFound()` makes a transient DB error indistinguishable from a missing record (SEO-12) |
| Test coverage | ~4.5% at audit; **zero** API route tests; the admin guard untested |

---

## 5. Testing health

| Measure | At audit | Now |
|---|---|---|
| Test files | 31 | **36** |
| Tests | 182 | **207** |
| API route tests | **0** | 0 |
| Ratio vs 691 source files | ~4.5% | ~5.2% |

**What is covered:** query helpers, formatters, SSE event bus (including a real pglite integration test — good), ingest/enrich/scrape script libraries, UI primitives, `rate-limit`, `episode-jsonld`, `content-hygiene`. **Added by remediation:** heading levels, soft-404 structural guard, sitemap chapter filtering, hydration-stable formatting, budget kill-switch scope.

**Still dangerously untested:**

1. **`admin-guard.ts`** — the gate in front of 27 admin endpoints, including `grant-admin`.
2. **All 92 API routes** — no test asserts any of them rejects an unauthenticated caller.
3. **Metadata generation** beyond the new guards.

---

## 6. Adversarial review — challenging my own conclusions

**Did I only inspect the homepage?** No. 367 live fetches over 357 unique URLs, spanning all 134 static routes and a stratified sample of every major content type, plus a 60-URL random chapter sample.

**Did I actually test mobile?** Yes, at 375×812 with real layout measurement — but via viewport emulation, not hardware. Touch-target and overflow findings are geometric and hold; feel and performance on a real device are untested.

**Did I follow internal links?** Yes — a link graph over all 367 pages produced the orphan list. **Limitation stated:** server-rendered HTML only, so client-revealed links would be missed. That is why UX-01 is Medium confidence.

**Did I verify production behaviour?** Yes. Every SEO, security and privacy finding came from live production requests, and the remediation was re-verified against production after deploy.

**Where did I catch myself being wrong?**

1. **`/api/admin/data-ops` looked unguarded** to a grep for shared helpers. It is guarded (inline `auth()`, line 277). Corrected before publication.
2. **I nearly filed `/shop` as a P1 trust violation.** Reading the rendered page showed an explicit "Coming soon… prices are provisional" notice. Downgraded to P2 UX. The site was more honest than my first pass assumed.
3. **My first contrast sweep was wrong** — it parsed `lab()` values as RGB, producing a bogus 1.43:1. Rebuilt through a canvas and re-run. All published ratios use the corrected method.
4. **I published an FCP of 5,848ms in working notes.** An artifact of a hidden browser pane. Retracted; **no Core Web Vitals are claimed anywhere.**
5. **My first per-page a11y numbers were taken before hydration finished** (0 headings on a page with 16). Re-run after content settled.
6. **Memory said "~50 routes lack `<main>`."** Measured on master: **2**.
7. **The soft-404 diagnosis in the original audit was wrong.** "Resolve existence before streaming begins" mis-stated the mechanism. Two further theories (`force-dynamic`, `generateStaticParams`) were tested and discarded before the real cause — `loading.tsx` Suspense boundaries — was established with controls.
8. **During remediation I flagged a middleware "regression" on master that was not one.** www→apex still works because Vercel handles it at the platform level. Corrected within the same turn.

**Did I confuse stylistic preference with UX failure?** I tried not to. The terminal aesthetic, dark palette, sealed-chapter paywall and inner-scroll frame are all deliberate and defensible. Their *costs* are named with measurements rather than their removal recommended. The one place I pushed firmly — contrast — is not taste: 1.73:1 is below threshold at every size, and the author had already written the fix.

**Did I recommend unnecessary refactoring?** Several candidates were dropped. Not recommended: rewriting `card-art.tsx`, restructuring components for aesthetics, changing CSS approach, or upgrading dependencies wholesale. Each recommended refactor attaches to a concrete finding.

**Did I overlook security because the site is content-focused?** No — it was the most heavily probed area: 27 API guards enumerated, 10 endpoints probed live, secret scanning, dependency audit, header review, CSP analysis, XSS vector review, raw-SQL review, webhook signature verification. The verdict is largely positive, and the positives are evidence-backed.

**Did I overlook SEO problems in dynamically generated pages?** That is where the biggest findings were — the soft-404 and the 2,990 sealed chapters are both dynamic-route problems invisible from a static route list.

**Did I overlook console-only errors?** No — React #418 is console-only and would not appear in any HTML crawl.

**What might I still have missed?**

- **Authenticated and admin UI** — entirely unaudited. Given `/admin/*` returns 200 chrome anonymously, the signed-in admin experience deserves its own pass.
- **The Oracle**, the flagship interactive feature — not exercised (costs money, needs a session).
- **Cards, packs, gifting, Stripe checkout** — stateful and paid.
- **Email flows** — testing them sends real mail.
- **The 230 YouTube outbound links** — catalogued but not status-checked.
