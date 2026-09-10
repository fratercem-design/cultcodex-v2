# CultCodex.me — Audit, 2026-09-09

A full production audit of cultcodex.me, plus the remediation that followed.

**Audited:** `origin/master` @ `6ba2a50`, in an isolated worktree.
**Method:** 367 live page fetches, production build, typecheck, lint, the test suite, live API probing, and browser instrumentation against production.
**Remediation:** shipped 2026-09-10 as [#157](https://github.com/fratercem-design/cultcodex-v2/pull/157) (squash-merged, deployed as `81dcef0`) and re-verified against production.

## Read in this order

| File | What it is |
|---|---|
| [EXECUTIVE-SUMMARY.md](EXECUTIVE-SUMMARY.md) | Overall assessment, top findings, scores |
| [ISSUES.md](ISSUES.md) | Every finding as a prioritised table, with current status |
| [ROADMAP.md](ROADMAP.md) | Remediation plan by phase — what shipped, what remains |
| [PHASE-1.1-REPORT.md](PHASE-1.1-REPORT.md) | Accessibility remediation, with measurements |
| [PHASE-1.2-REPORT.md](PHASE-1.2-REPORT.md) | Search-engine correctness remediation |
| [SEO-AUDIT.md](SEO-AUDIT.md) | Technical SEO, structured data, indexability |
| [ACCESSIBILITY-AUDIT.md](ACCESSIBILITY-AUDIT.md) | WCAG 2.2 AA findings |
| [SECURITY-AUDIT.md](SECURITY-AUDIT.md) | Defensive review — no secret values anywhere |
| [PERFORMANCE-AUDIT.md](PERFORMANCE-AUDIT.md) | What was measured, and what could not be |
| [UX-CONTENT-AUDIT.md](UX-CONTENT-AUDIT.md) | UX, information architecture, content, trust |
| [PAGE-INVENTORY.md](PAGE-INVENTORY.md) | 272 crawled URLs with their SEO status |

## Standing rule for these documents

Every claim is either backed by a command's output, a browser measurement, or a `file:line` citation — or it is explicitly labelled **Not verified**. Several things could not be measured in this environment, most importantly Core Web Vitals. **No LCP, FCP or INP number appears anywhere in this audit**, and none should be inferred from it.

Where a first pass got something wrong, the correction is recorded rather than quietly overwritten. Three worth knowing about:

- The soft-404's cause was **not** what the audit first assumed; two theories were tested and discarded before the real one (`loading.tsx` Suspense boundaries).
- `/shop`'s ten dead links looked like a trust violation until the page turned out to disclose them plainly. Downgraded.
- The first contrast sweep mis-parsed `lab()` colours as RGB and produced bogus ratios. Rebuilt through a canvas before anything was published.

## Status at a glance

Shipped and re-verified against production:

- Sitewide soft-404 — every bad slug now returns a real **404** (was 200)
- Conflicting robots directives — now `noindex` only, no bogus canonical
- 2,987 sealed chapters de-indexed; live sitemap went from 2,990 chapter URLs to **3**
- React hydration error #418 — console now clean on `/`, `/episodes`, `/topics`
- Production dependency vulnerabilities **20 → 0**
- Contrast, heading order and touch targets across ~1,300 call sites

Largest item still open is **SEO-04**: topic pages, 13,743 URLs at a 1,676-character median. See ROADMAP.md.
