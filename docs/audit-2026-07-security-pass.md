# CultCodex.me — Audit (Security / Authz / Injection / Billing Pass)

> Date: 2026-07-07 · Scope: security-weighted spot audit of the live app.
> Prior audit (`audit-completion-notes.md`, 2026-04) covered data-quality / SEO / governance —
> this pass deliberately covers the surfaces that one did **not**: authz, injection, billing, XSS.
> Every claim below is tool-verified against the repo; false alarms are noted as such.

## Verdict

The security surfaces probed are **in good shape**. The June denial-of-wallet work and the
overall auth design hold up. No confirmed high-severity vulnerability found in this pass. A
handful of medium/low hardening items remain, plus scope this pass did **not** cover.

## What was checked and PASSED (evidence)

| Area | Finding | Evidence |
|------|---------|----------|
| Admin API authz | All 29 `src/app/api/admin/**` routes are gated — either `getCurrentUser()` + `role==="admin"` (→403) or `X-Enrich-Secret`===`ENRICH_SECRET` (→401). The 12 that first looked "unguarded" were a grep artifact (ENRICH_SECRET-gated). | per-route grep of every admin route.ts |
| SQL injection (public deep search) | No injection. Concept **strings never enter SQL** — only their numeric OpenAI embeddings (`vectorLiteral`) do. `threshold` and `limit` are clamped numerics (`Math.min/Math.max`), never raw. | `src/lib/queries/semantic.ts`, `src/app/api/search/semantic/route.ts:70-81` |
| Denial-of-wallet | Deep search is subscription-gated, per-IP rate-limited, **and** charged against a global daily cap with `AI_KILLSWITCH`. | `search/semantic/route.ts:26-100` |
| Stripe webhook | Signature verified via `constructEvent`; refuses to process when `STRIPE_WEBHOOK_SECRET` is unset. | `src/app/api/stripe/webhook/route.ts:59-68` |
| JSON-LD XSS | `jsonLdScript()` escapes `<` `>` `&` U+2028/2029 → all pages using it are safe. Has a regression test. | `src/lib/seo.ts:20-27`, `src/lib/__tests__/episode-jsonld.test.ts` |

## Findings (prioritized, actionable)

### M1 — [MEDIUM] Live DDL-executing HTTP endpoints remain deployed
`apply-migration`, `apply-pending-migrations`, `seed-cards`, `embed` call `$executeRawUnsafe`
to run schema/enum DDL, gated **only** by a single static `ENRICH_SECRET` header (plain `!==`
compare, not timing-safe). `ENRICH_SECRET` is spread across many npm scripts / CI / local `.env`,
so its blast radius is large: a leak = arbitrary DDL on the production DB over HTTP.
- **Fix:** remove/disable these one-shot migration endpoints after use (they're operational
  backdoors, not product features); or additionally gate behind `role==="admin"` + an IP allowlist.
  Rotate `ENRICH_SECRET`. Prefer running migrations via `prisma migrate deploy` in the build step
  (already wired in `package.json` `build:migrate`) rather than a live endpoint.

### L1 — [LOW] `symbols/[slug]` bypasses the safe JSON-LD helper
`src/app/symbols/[slug]/page.tsx:78` injects `JSON.stringify(jsonLd)` raw into a
`<script type="application/ld+json">` instead of using `jsonLdScript()`. **Not currently
exploitable** — `SYMBOLS` is a static in-code constant, not DB/user data — but it's inconsistent
with every other page and becomes a stored-XSS vector the moment symbols go DB-driven or the
pattern is copied.
- **Fix (one line):** `dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}`.

### L2 — [LOW] Type-safety debt
71 occurrences of `as any` / `@ts-ignore` / `@ts-nocheck` across `src`. Each is a spot where the
compiler stops catching regressions. Worth a scheduled burn-down, prioritizing API routes and
billing/auth code.

### I1 — [INFO] No edge-layer auth
`middleware.ts` does a `www`→apex 301 only — all authorization is in-route. That's fine (and
correctly applied), but worth knowing: there is no single choke point, so every new route owns its
own guard. Consider a shared `requireAdmin()` wrapper to prevent a future route from forgetting.

## Scope NOT covered by this pass (for a true "full" audit)

This was a security-weighted pass sized to a single session. A complete audit still needs:
**performance** (Core Web Vitals, bundle size, Prisma N+1 / slow queries), **SEO completeness**
(sitemap/canonical/OG coverage across all ~60 routes), **accessibility** (WCAG contrast, keyboard,
alt text), **product/UX**, **data integrity** (FK/orphan/enum invariants), **dead code**, and
**test coverage**. Recommended escalation: the 6-agent swarm used in the June audit, or
`/code-review ultra` on the branch.
