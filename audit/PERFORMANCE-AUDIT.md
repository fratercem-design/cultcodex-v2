# Performance Audit — CultCodex.me

## ⚠️ Core Web Vitals were NOT measured

The browser pane available for this audit reports `document.visibilityState === "hidden"`, which suppresses paint-timing APIs. Repeated attempts returned `FCP: 0, LCP: 0` — measurement artifacts, not results.

**No LCP, FCP or INP figure is claimed anywhere in this audit.** An early working note of "FCP 5,848ms" was an artifact of the hidden pane and is explicitly retracted.

To get real numbers: PageSpeed Insights, a local Lighthouse run, or the **Vercel Speed Insights already installed** / CrUX field data.

Everything below **was** measured reliably — network timing, transfer sizes, resource counts and layout are independent of paint.

---

## Measured: server response

`curl` against production, compressed, eight routes:

| Route | Status | Encoded HTML | TTFB | Total |
|---|---|---|---|---|
| `/` | 200 | 31.3 KB | 0.434s | 0.710s |
| `/episodes` | 200 | 24.4 KB | 0.428s | 0.643s |
| `/topics` | 200 | 19.0 KB | 0.255s | 0.284s |
| `/people` | 200 | 24.0 KB | 0.291s | 0.415s |
| `/explore` | 200 | 14.2 KB | 0.227s | 0.227s |
| `/start-here` | 200 | 20.6 KB | 0.256s | 0.256s |
| **`/lexicon`** | 200 | **109.6 KB** | 0.341s | 0.364s |
| `/psychenomicon` | 200 | 10.1 KB | 0.248s | 0.249s |

**TTFB 0.23–0.43s is good** for a database-backed page on serverless, and notable given Xata's hibernation behaviour — the keep-alive worker is doing its job.

## Measured: homepage resource load

| Metric | Value |
|---|---|
| Total transfer | **814 KB** |
| Total requests | 52 |
| **Fonts** | **237 KB / 8 files** |
| JavaScript | 295 KB / 20 files |
| CSS | 33 KB / 3 files |
| Images | 51 KB / 4 files |
| Third-party hosts | 2 (`youtube.com`, `yt3.ggpht.com`) |
| TTFB | 125 ms |
| DOMContentLoaded | 540 ms |
| Load event | 1,437 ms |
| **CLS** | **0** |

Built output: **3.1 MB JS** and **290 KB CSS** total across all routes (not all loaded per page). Largest chunks: 522 KB, 475 KB, 383 KB.

---

## Findings

### PERF-01 (P2) — Fonts are the heaviest asset class · OPEN

**237 KB across 8 files — more than all JavaScript (295 KB across 20 files), and 29% of total page weight.**

Six families resolved on the homepage:

| Family | Weights loaded |
|---|---|
| JetBrains Mono | 400, 500, 600, 700 (**4 weights**) |
| Playfair Display | 400 |
| Bodoni Moda | 500 |
| Space Grotesk | 300–700 (variable) |
| Inter | 100–900 (variable) |
| Cinzel | 400 |

**Why this is the top performance lever:** fonts block text rendering. With no CWV measurement available I will not claim an LCP figure, but on a text-dominant site the LCP element is almost always text, and 237 KB of blocking font is the most probable single contributor.

**Fixes, in order of value:**
1. **Subset aggressively.** Cinzel, Bodoni Moda and Playfair Display appear to be display faces used for a handful of headings.
2. **Reduce JetBrains Mono to 2 weights** (400 + 700). Four weights of a monospace face is the largest single win available.
3. **Audit whether six families are all load-bearing.** Space Grotesk and Inter overlap in role.
4. Confirm `font-display: swap` and that `next/font` preloads only above-the-fold faces.

Caching is already correct: `Cache-Control: public, max-age=31536000, immutable` on `.woff2`.

### PERF-02 (P3) — `/lexicon` is 5× the next-largest page · OPEN

109.6 KB compressed HTML from `src/app/lexicon/page.tsx` at **2,873 lines** — the largest hand-written file in the project. The content is inlined in the component rather than fetched.

**Fix:** move lexicon entries to the database, paginate or virtualise. This also makes entries editable without a deploy — and would enable per-term routes, which UX-CONTENT-AUDIT notes would create thousands of natural contextual links.

### PERF-03 (P3) — Modest polling · OPEN

Each page load issues repeated `GET /api/live/status` and `GET /api/auth/session-lite`. Worth confirming the interval is deliberate; on a long-lived tab this is continuous background load against serverless functions.

---

## What is already well done

Not padding — these are real and should not be "optimised":

- **CLS = 0.** Zero layout shift is genuinely hard.
- **Only two third-party hosts**, both YouTube, and analytics is consent-gated so nothing loads before the user answers.
- **Caching headers are correct and specific**: immutable one-year on `/_next/static` and fonts, one-week with SWR on images, one-day `s-maxage` with a week of SWR on `/about`, `/faq`, `/people`, `/episodes`, and explicit `no-store` on `/sw.js`.
- **`next/image` configured properly** — WebP output, sensible `deviceSizes`/`imageSizes`, 24-hour minimum cache TTL, tight `remotePatterns` allow-list.
- **`outputFileTracingIncludes`** pins the OG font files into the lambda, with a comment explaining exactly why tracing cannot infer them — the kind of fix only made after someone debugged it properly.
- **Sentry source-map upload is opt-in** on `SENTRY_AUTH_TOKEN`, so a missing token can never fail a build.
- **`poweredByHeader: false`.**

---

## Effect of the shipped remediation

Not a performance project, but two changes touch it:

- **Detail-route `loading.tsx` files were removed** (SEO-02). Those routes no longer show an instant skeleton; navigation holds the previous page until the new one is ready, which is Next's default. This is a **perceived**-performance trade accepted deliberately in exchange for correct 404 status codes. Listing routes kept their skeletons.
- **2,987 URLs left the sitemap**, which reduces crawl load but does not affect page performance.

## Not measured

| Item | Why |
|---|---|
| LCP / FCP / INP | Hidden browser pane suppresses paint timing |
| Unused JS / CSS coverage | Requires a Chrome coverage profile with a visible tab |
| Real-device mobile performance | Emulation only |
| Server-side render duration per route | Requires Vercel function logs |
| Cache hit rates | Requires Vercel edge analytics |
