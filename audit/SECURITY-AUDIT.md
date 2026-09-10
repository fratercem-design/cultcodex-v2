# Security Audit — CultCodex.me

**Scope:** defensive review only. No destructive testing, no credential rotation, no attacks on third-party infrastructure. All probing was read-only or explicitly non-destructive.

**No secret values appear in this document.**

---

## Summary

The security posture is **better than typical for a project of this size**. None of the findings is a breach, and several categories that commonly fail came back clean.

| Area | Result |
|---|---|
| Admin authorisation | **Pass** — verified live |
| Committed secrets | **Pass** — none in the working tree |
| Security headers | **Pass** — comprehensive |
| Auth guard implementation | **Pass** — constant-time, fail-closed |
| Stripe webhook signature | **Pass** — verified |
| XSS / injection vectors | **Pass** — all checked |
| Rate limiting | **Fail → mitigated** |
| Dependency hygiene | **Fail → fixed (20 → 0)** |
| CSP strength | **Weak** — `unsafe-inline` scripts |
| Guard test coverage | **None** |

---

## Verified strengths

### Admin API authorisation holds

Ten read-only admin endpoints probed anonymously against production. Every one refused:

```
/api/admin/people/lookup    403  {"error":"Admin access required"}
/api/admin/sse-status       403  {"error":"forbidden"}
/api/admin/db-size          403  Forbidden
/api/admin/providers        403  {"error":"Admin only"}
/api/admin/test-anthropic    403  {"error":"Admin only"}
/api/debug-auth             403  {"error":"Admin only"}
/api/admin/comments         403  {"error":"Admin access required"}
```

This matters because `/admin/*` **pages** return HTTP 200 to anonymous users, which looks alarming at first glance. Inspection shows they render only navigation chrome (1,320–1,355 chars of visible text, all `noindex, nofollow`) with no admin data. The data layer is what is actually defended, and it is.

*Minor:* returning 200 rather than redirecting is a soft-403. It leaks the existence and titles of admin routes. Worth tightening; not a data exposure.

### The guard implementation is disciplined

`src/lib/admin-guard.ts`:

- `timingSafeEqual` with a length pre-check, so comparisons do not leak via timing.
- **Fails closed** when the expected secret is unset — an unset `ENRICH_SECRET` returns 503, never "allow everyone". This is the single most commonly inverted check in this class of code, and it is correct here.
- `adminOnly()` exists specifically to convert a throwing `requireAdmin()` into a proper 403 rather than an uncaught 500.

> **False positive on record:** `/api/admin/data-ops` initially appeared unguarded to a grep for the shared helpers. It is not — it uses an inline `auth()` helper and rejects at line 277. Recorded so it is not rediscovered.

### No committed secrets *in the working tree*

- `git ls-files` shows only `.env.example`.
- `.gitignore` ignores all `.env*` and re-allows only the template.
- A tracked-file scan for AWS keys, OpenAI keys, GitHub PATs, Slack tokens and PEM private keys returned **no matches**.
- `src/generated/` (Prisma client) is correctly untracked.

> **Separately known:** three real keys exist in `master` **history**. Rewriting history was declined, so rotation is the remediation. `81dcef0` on master is titled "Redeploy: rotate SWEEP_SECRET, new SUPADATA_API_KEY", which suggests that is in progress. Out of scope for this audit but recorded here so the "no committed secrets" line above is not read more broadly than it is meant.

### Security headers

Applied to `/:path*` from `next.config.ts`:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`, `Cross-Origin-Resource-Policy: cross-origin`
- CSP with `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'`, `form-action` limited to self plus Stripe

Notably thoughtful: Sentry's `tunnelRoute` is used specifically so browser events stay inside `connect-src 'self'` instead of widening the policy — the comment says so.

### Stripe webhook — pass

`src/app/api/stripe/webhook/route.ts:59–77`: missing `stripe-signature` → **400**; `STRIPE_WEBHOOK_SECRET` unset → refuses (fails closed); `constructEvent()` invalid signature → **400**. Having no session guard is correct here — the signature *is* the authentication.

### XSS, injection and unsafe rendering — all checked, all pass

**24 `dangerouslySetInnerHTML` uses:** 22 render `jsonLdScript(...)`, 1 renders locally generated card-art SVG, 1 is the theme bootstrap script.

`jsonLdScript()` (`src/lib/seo.ts:22`) is **correctly hardened**:

```ts
JSON.stringify(obj)
  .replace(/</g,"\\u003c").replace(/>/g,"\\u003e").replace(/&/g,"\\u0026")
  .replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");
```

That closes the `</script>` breakout **and** the U+2028/U+2029 JS-parser hazard. Better than most codebases; do not change it.

**Raw SQL:** `$executeRawUnsafe` / `$queryRawUnsafe` appear 8 times, all in `admin/data-ops` and `admin/db-size`. Every one executes **hardcoded DDL string literals** from fixed arrays. No request data is interpolated. **Not injectable.** They are a *process* smell — ad-hoc schema patches through an API endpoint rather than migrations — tracked as maintainability, not security.

All ORM access is through Prisma's query builder. Zod v4 validates request shapes in the ingest and enrich paths.

---

## Findings

### SEC-01 (P1) — The rate limiter does not limit · MITIGATED

Against `/api/search/suggest`, configured `{ limit: 60, windowMs: 60_000 }`:

```
PHASE1 no-spoof x75          {"200":75}   <- 75 requests, 60/min limit, ZERO 429s
PHASE2 spoofed XFF x15       {"200":15}
PHASE3 rotating XFF x15      {"200":12,"429":3}
PHASE4 no-spoof again x10    {"200":10}
```

`src/lib/rate-limit.ts` uses a module-level `Map`. Its own docblock predicts this: on Vercel each instance is its own process with its own Map, so the effective limit is `limit × live instances` and a cold start resets the window.

**What that actually exposed.** All three paid-LLM endpoints (`oracle/ask`, `search/semantic`, `tarot/interpret`) already sat behind `consumeLlmBudget` — a global daily counter that holds regardless of instance count, fails closed, and has an `AI_KILLSWITCH`. The gap was **email**: `/api/auth/magic` is anonymous, sends through Resend, and its per-email cooldown only guards repeat sends to the *same* address. An attacker cycling addresses was bounded by nothing — real Resend quota, plus CultCodex sign-in links arriving at strangers' inboxes from this domain, which is a deliverability problem as much as a cost one.

**Shipped:** `consumeDailyBudget()` — the same counter and fail-closed behaviour, deliberately **without** the AI kill-switch, so shutting off paid AI during an incident cannot lock everyone out of sign-in. Consumed immediately before `resend.emails.send`, not at the top of the handler: charging earlier would let malformed requests burn the day's allowance without sending anything, a free denial of service on sign-in. Default 500/day via `MAGIC_LINK_DAILY_CAP`.

**Still open:** `rateLimit()` itself is per-instance. A true cap needs a shared store (Upstash/Redis) — infrastructure to provision, not code to write. The call sites only depend on the `rateLimit()` signature, so that swap stays a drop-in.

### SEC-02 / 03 / 04 — Dependencies · FIXED

`npm audit --omit=dev` reported **20 vulnerabilities, 13 high**. It now reports **none**.

The structural cause: `prisma` — the CLI — sat in `dependencies` while app code imports it **zero** times (only `@prisma/client`, via the generated client). Its whole toolchain therefore counted as production surface: `mysql2`, `hono`, `@hono/node-server`, `deepmerge-ts`, `@prisma/config`. Moving it to `devDependencies` alone took 20 → 16 and highs 13 → 9. `npm audit fix` cleared the rest, including `undici` (five CVEs), `path-to-regexp`, `js-yaml`, `picomatch`, `ip-address`, `fast-uri` and `brace-expansion`.

Nothing in the repo or workflows installs with `--omit=dev`, and Vercel installs devDependencies for builds, so `postinstall: prisma generate` and `npx prisma migrate deploy` both still resolve the CLI. Verified: generated client present after clean install, production build succeeds.

> **⚠️ Do not run `npm audit fix --force` on this repo.** Four high-severity advisories remain, all dev-only and all the Prisma CLI cluster. npm's only offered remedy is `prisma@6.19.3` — a **major downgrade** from 7.10 that would break the generated client, the schema and the migration history.

### SEC-05 (P2) — The admin guard has no tests · OPEN

`src/lib/__tests__/` contains `content-hygiene`, `episode-jsonld`, `initiate`, `oracle-cache`, `rate-limit`. There is **no** `admin-guard.test.ts`, and `find src/app/api -name "*.test.*"` returns **0**.

So the module standing between anonymous users and 27 admin endpoints — including `data-ops`, which can `grant-admin` — is untested, and no API route asserts it rejects unauthenticated callers.

**Fix (small, high value):** table-driven tests over `admin-guard.ts` — unset secret must 503; wrong secret must 401; correct secret passes; length-mismatched secret must not throw. Then one auth-rejection test per guarded route family.

### SEC-06 (P3) — CSP allows `unsafe-inline` scripts · OPEN

`script-src 'self' 'unsafe-inline' ...` negates most of the CSP's XSS value. Next.js supports nonce-based CSP via middleware, which already exists. Medium effort; worth doing after the higher-priority items.

### SEC-07 (P3) — Proxy header trust · NOT VERIFIED

`clientKey()` takes the first value of client-supplied `x-forwarded-for`, falling back to `x-real-ip`, with no proxy-depth validation. On Vercel the platform overwrites `x-forwarded-for`, so this is **probably** not exploitable today — but I could not confirm it: the per-instance limiter is too leaky to act as a detector and no endpoint echoes the resolved IP. **Marked "Not verified" deliberately.** The pattern is fragile regardless; prefer `x-vercel-forwarded-for`, or take the *last* trusted hop.

---

## Information disclosure

`/api/premium/status` returns aggregate corpus statistics to anonymous callers (episode/segment/people/topic counts). The same numbers appear in the site's own UI, so this is almost certainly intentional. **Low / informational**, not a finding.

## Cron endpoints — pass

`/api/cron/*` use `requireBearerSecret` against `CRON_SECRET` — correct for Vercel Cron, fails closed.
