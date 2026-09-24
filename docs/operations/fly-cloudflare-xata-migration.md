# CultCodex: Vercel to Fly.io, Cloudflare, and Xata

This runbook moves application compute off Vercel while leaving the working
Xata PostgreSQL database unchanged. It does not introduce Neon or another
database provider. Avoiding a simultaneous data migration keeps the existing
Vercel deployment usable as a compute rollback target.

## Target architecture

```text
Cloudflare DNS/CDN/TLS
        |
        v
Fly.io: persistent Next.js web/API/SSE Machine
        |
        v
Existing Xata PostgreSQL + pgvector

GitHub Actions schedules
  - 15:00 UTC: /api/cron/ingest-latest
  - 17:00 UTC: /api/cron/gift-sequence

Sentry: exceptions and sampled traces
```

## Why GitHub Actions runs the schedules

Fly scheduled Machines support fuzzy hourly, daily, weekly, and monthly cycles,
not exact crontab times. An always-running scheduler Machine would add avoidable
cost. The existing repository already uses GitHub Actions to keep Xata warm, so
`.github/workflows/scheduled-jobs.yml` calls the protected application routes at
the existing UTC schedules. Scheduled GitHub workflows can be delayed under
load; these jobs must remain safe to run late and idempotent.

## Pre-deploy checklist

- [ ] Apply this patch to a branch based on commit `653ee51`.
- [ ] Review and approve the pull request.
- [ ] Make CI type-check, lint, tests, and production build green.
- [ ] Record the current Xata database region, size, extension versions,
      connection count, and backup/restore procedure.
- [ ] Take a fresh Xata logical backup and restore-test it into an empty
      PostgreSQL database with the `vector` extension.
- [ ] Export Vercel production environment-variable names. Copy values directly
      between provider dashboards; never commit secret values.
- [ ] Record the current Vercel production deployment URL and Cloudflare DNS
      target as the rollback baseline.
- [ ] Confirm no schema migration is included in the initial compute-only
      release. If there is one, run the migration workflow before deployment.

## Build design

The Docker image uses Next.js standalone output. The application prerenders
database-backed routes, so `DATABASE_URL` is provided to Docker BuildKit as a
required build secret. It is mounted only for the build instruction and is not
stored in an image layer.

The final image runs as a non-root user and contains only the standalone server,
static build output, and public assets. It does not contain the Prisma CLI.
Database migrations therefore remain an explicit pre-deploy action using the
existing `Run DB Migrations` GitHub workflow and its non-pooled `DIRECT_URL`.

## Create Fly staging

1. Install `flyctl` and authenticate interactively.
2. From the repository root, run `fly launch --no-deploy`. Choose a staging app
   name and a region close to the Xata production database. Do not create a Fly
   Postgres database.
3. Preserve the generated `app` and `primary_region` values in `fly.toml`; keep
   the remaining reviewed settings from this repository.
4. Set staging runtime secrets with `fly secrets set`. Use a staging-safe set of
   Stripe/Google credentials where possible. Keep Xata URLs out of source code.
5. Build with the Xata URL as a BuildKit secret. Use Fly's supported build-secret
   mechanism rather than a Docker `ARG` for `DATABASE_URL`.
6. Deploy without attaching `cultcodex.me`.
7. Verify the Fly hostname and `/api/health` before proceeding.

## Runtime secret inventory

Derived from the variables the deployed image actually reads. The runner stage
copies only `.next/standalone`, `.next/static` and `public`, so nothing under
`scripts/` ever executes on Fly — variables used only there belong to GitHub
Actions, not to `fly secrets`. The split is stated explicitly below because the
two sets were previously conflated.

### Set on the Fly app

**Database.** `DATABASE_URL` only. `DIRECT_URL` is read by `prisma.config.ts`
and by `scripts/`; the runtime image never reads it, so it belongs to the
`Run DB Migrations` workflow rather than to the Fly app. Setting it on Fly is
harmless but does not migrate anything.

**Auth.** `AUTH_SECRET`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `ADMIN_EMAILS`. `NEXTAUTH_URL` and `AUTH_TRUST_HOST`
are non-secret config and already live in `fly.toml`.

Two things about the secret itself:

- `AUTH_SECRET` is a distinct, load-bearing variable, not an alias. Auth.js
  signs sessions with `AUTH_SECRET ?? NEXTAUTH_SECRET`, so either name keeps
  sign-in working — but four routes read `AUTH_SECRET` alone with no fallback
  and 500 without it: `/api/admin/db-size`, `/api/admin/build-book`,
  `/api/admin/migrate-art-r2` and `/api/psychenomicon/book/[sku]` (the
  HMAC-signed gift-link path). Set both names to the same value.
- Whatever value Vercel holds must be carried over **unchanged**. The session
  cookie is a JWT signed with it, so a fresh value silently signs out every
  logged-in member the moment DNS moves. This is the one secret where "generate
  a new one for the new host" is wrong.

**Scheduled and admin.** `CRON_SECRET`, `ENRICH_SECRET`, `LIVE_TOGGLE_SECRET`,
`SWEEP_SECRET`, `PEOPLE_MAINT_KEY`.

**Origin verification.** `CLOUDFLARE_ORIGIN_SECRET`; configure Cloudflare to
overwrite `X-Origin-Verify` with the same high-entropy value on origin requests.
Note what this does and does not do today: `src/lib/rate-limit.ts` uses it to
decide whether `CF-Connecting-IP` may be trusted for rate-limit bucketing. It
is not an origin lock. The app's only edge-level code is `src/proxy.ts` (Next 16
renamed `middleware.ts` to `proxy.ts`), which canonicalises `www.cultcodex.me`
and the `cultcodex.xyz` pair to the apex with a 308 and does nothing else — so
the `*.fly.dev` hostname stays reachable and serves the full site. Rejecting
unverified origin traffic would be a separate change, and `src/proxy.ts` is
where it would go.

Worth noting while that file is in view: the 2026-09-01 audit recorded
`www.cultcodex.me` redirecting with a **307 from Vercel's edge** rather than the
308 this proxy emits, because Vercel's domain settings shortcut it before the
app ran. On Fly there is no such shortcut — the redirect will be served by this
code, on the Machine. Re-check the status code after cutover rather than
assuming it is unchanged.

**Ingest.** `YOUTUBE_API_KEY`, `SUPADATA_API_KEY`.

**AI.** The provider wiring is not what the previous version of this list
implied, so it is spelled out per feature:

| Feature | Route | Credential it actually needs |
|---|---|---|
| Oracle | `/api/oracle/ask` | `GROQ_API_KEY` (primary path) |
| Oracle paid fallback | same | `ORACLE_USE_BEDROCK=true` + `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` |
| Tarot | `/api/tarot/interpret` | `GROQ_API_KEY`, else the same AWS trio |
| Comment moderation | `src/lib/moderation.ts` | AWS trio (Bedrock, no Groq path) |
| Psychenomicon chapters | `/api/admin/psychenomicon/...` | AWS trio (Bedrock) |
| Semantic search | `src/lib/embeddings.ts` | `OPENAI_API_KEY` |
| Admin enrichment | `/api/admin/enrich-episodes` | any of `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, or the AWS trio |

`src/lib/anthropic.ts` exports an `AnthropicBedrock` client, so every
Claude-backed feature except admin enrichment authenticates with **AWS
credentials, not `ANTHROPIC_API_KEY`**. `ANTHROPIC_API_KEY` is used by exactly
one route. Optional spoken Oracle answers additionally need
`ELEVENLABS_API_KEY`; `ELEVENLABS_VOICE_ID` is optional and defaults in code.

Daily-cap and model-selection variables (`ORACLE_MODEL`, `ORACLE_DAILY_CAP`,
`TAROT_DAILY_CAP`, `MODERATION_DAILY_CAP`, `SEMANTIC_DAILY_CAP`,
`MAGIC_LINK_DAILY_CAP`, `ENRICHMENT_*`, `AI_KILLSWITCH`) are non-secret tuning
with defaults in code. `ORACLE_MODEL` is worth setting explicitly: unset, the
Bedrock fallback defaults to `claude-opus-4-8`.

**Stripe.** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and all ten price
ids. Most are read dynamically through `process.env[...]` and so do not show up
in a plain grep for `process.env.STRIPE_PRICE_`:

```text
STRIPE_PRICE_ACCESS_ID           STRIPE_PRICE_ACCESS_ANNUAL_ID
STRIPE_PRICE_SYSTEM_ID           STRIPE_PRICE_SYSTEM_ANNUAL_ID
STRIPE_PRICE_ID                  (legacy, points at Initiate+ monthly)
STRIPE_PRICE_CREDITS_SPARK_ID    STRIPE_PRICE_CREDITS_SURGE_ID
STRIPE_PRICE_CREDITS_FLOOD_ID
STRIPE_PRICE_BOOK_VOL1_ID        STRIPE_PRICE_BOOK_HANDBOOK_ID
```

A price id that is unset fails closed — its checkout returns a logged 500
rather than charging anything — so a missing one is a silently broken purchase
path, not an outage. Check all of them.

**Email and push.** `RESEND_API_KEY`, `ALERT_EMAIL`, `ALERT_FROM`,
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.

**Art storage.** `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_BUCKET`. These are runtime, not ops-only: `/api/psychenomicon-art/[slug]/[slot]`
streams chapter art out of R2 on every request.

**Sentry.** `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_ORG`,
`SENTRY_PROJECT`, and optionally `SENTRY_AUTH_TOKEN`.

### Set on GitHub Actions, not on Fly

`DIRECT_URL` and `DATABASE_URL` (migrations), `CRON_SECRET` and
`STAGING_CRON_SECRET` (scheduled jobs), and the pipeline credentials the
`scripts/` workflows use: `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`,
`GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, `ENRICH_SECRET`, `YOUTUBE_API_KEY`,
`YOUTUBE_COOKIES`. Repository variables: `ENABLE_PRODUCTION_SCHEDULES`,
`STAGING_BASE_URL`, `PRODUCTION_BASE_URL`.

The art pipeline (`HCNSEC_API_KEY`, `ART_*`) is local-CLI only and belongs on
neither.

### Build-time values

Public values embedded during the Docker build include `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_DEPLOY_ENV`, and optionally
`SOURCE_COMMIT`. They are not secrets. `DATABASE_URL` is a BuildKit secret, as
described under Build design. `SENTRY_AUTH_TOKEN` is build-time only —
source-map upload is opt-in on it and its absence cannot fail a deploy.
### Parity check

Fly prints names and digests but never values, so parity against this inventory
is checkable without exposing anything:

```bash
flyctl secrets list --app <app> --json | jq -r '.[].name' | sort
```

Two digest rules worth asserting:

- `DIRECT_URL` must **differ** from `DATABASE_URL`. Identical digests mean the
  direct URL was copied from the pooled one, and `prisma migrate deploy` will
  take its advisory lock through PgBouncer, which can silently drop or refuse
  it. The same secret must also exist in GitHub Actions — an unset secret
  arrives as `""`, and `prisma.config.ts` then falls back to the pooled URL.
- `STRIPE_PRICE_ID` sharing a digest with `STRIPE_PRICE_ACCESS_ID` is expected:
  the legacy single-price variable points at Initiate+ monthly.

As of 2026-09-16 the staging app carries 18 secrets and is missing
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `ADMIN_EMAILS`, `SUPADATA_API_KEY`,
`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and every `SENTRY_*` value.
`RESEND_API_KEY` is absent deliberately so staging cannot send mail. The rest
are gaps, and two of them invalidate smoke tests below: semantic search embeds
its query at request time via `embedOne()`, which throws without
`OPENAI_API_KEY`, and Sentry cannot receive anything without a DSN. Production
must carry all of them.

That list is a floor, not a ceiling. It was drawn against the earlier version
of the inventory above and so does not cover the variables that version omitted.
Re-run parity against the current inventory before trusting it — `AUTH_SECRET`,
`GROQ_API_KEY`, the `AWS_*` trio, the `R2_*` group, `SWEEP_SECRET`,
`PEOPLE_MAINT_KEY`, the annual and book Stripe price ids, and `VAPID_SUBJECT`
were never on it.

One correction to carry forward: Oracle and Psychenomicon are **not** blocked on
`ANTHROPIC_API_KEY`. Oracle's primary path is Groq and needs `GROQ_API_KEY`;
Psychenomicon chapter generation goes through Bedrock and needs the `AWS_*`
trio. `ANTHROPIC_API_KEY` gates only `/api/admin/enrich-episodes`, which has
four other providers to fall back on. Setting it would not have unblocked
either smoke test.

## Staging smoke tests

- [ ] `/api/health` returns HTTP 200 and Fly marks the Machine healthy.
- [ ] Homepage, archive pages, images, fonts, and search render correctly.
- [ ] Google sign-in, callback, session persistence, and sign-out work.
- [ ] An authenticated route and an admin-only route enforce authorization.
- [ ] Stripe test checkout and billing portal work.
- [ ] A signed Stripe test webhook is accepted once and deduplicated on replay.
- [ ] Both SSE endpoints maintain connections through the Fly proxy **and
      deliver an event**. Holding the socket open is not the test:
      `src/lib/sse/event-bus.ts` opens a dedicated `pg.Client` and `LISTEN`s on
      the pooled `DATABASE_URL`. A transaction-pooling endpoint accepts
      `LISTEN` and then never delivers a `NOTIFY`, which looks identical to a
      healthy idle stream. Publish one and confirm it arrives.
- [ ] Semantic search uses the existing Xata `pgvector` HNSW index. Blocked
      until `OPENAI_API_KEY` is set — the query is embedded per request.
- [ ] Sentry receives a controlled server and browser error. Blocked until the
      `SENTRY_*` values are set.
- [ ] Oracle streams a reply. Blocked until `GROQ_API_KEY` is set (not
      `ANTHROPIC_API_KEY` — see the correction above).
- [ ] A Psychenomicon chapter generates, and `/api/psychenomicon-art/...`
      serves an image. Blocked until the `AWS_*` trio and the `R2_*` group are
      set respectively.
- [ ] Tarot returns an interpretation. Needs `GROQ_API_KEY` or the `AWS_*` trio.
- [ ] Database connections remain below the Xata limit with a five-connection
      application pool per running Fly Machine.
- [ ] Both scheduled endpoints return 401 without a bearer secret and 2xx with
      the correct staging secret. A **503** means `CRON_SECRET` is unset on the
      app — `requireBearerSecret()` fails closed with `503` before it ever
      compares a token, so a 503 here is a missing secret, not a passing gate.

## Capacity: one Machine behind a static-assets-only edge

The plan is one `shared-cpu-1x`/2 GB Machine with Cloudflare caching static
assets only. Two figures are usually raised against it — 161 pages of which 71
render dynamically, and a sitemap once measured at 27,882 URLs. They are not the
same problem, and only one of them is real.

### The sitemap is fine

The 27,882-URL figure was measured on 2026-09-01 against a single monolithic
`/sitemap.xml` that serialised every URL into one 5.39 MB document per render
and intermittently returned a 500 doing it. That route no longer exists in that
shape. `/sitemap.xml` is now an index of seven children; each
`/sitemaps/<segment>.xml` declares `revalidate = 3600`, has a real
`generateStaticParams`, and ships `s-maxage=3600, stale-while-revalidate=86400`.
Chapters were cut to the free-preview subset and thin topics and lore are
filtered out by `isThinPage`, so the live total is well below the 2026-09-01
number. The largest remaining segment is episodes at roughly 2,900 URLs, which
serialises to a few hundred kilobytes and is served from cache between hourly
regenerations. One Machine serves this without difficulty.

### What the sitemap points at is not fine

`force-dynamic` appears on 71 of 161 `page.tsx` files. Four of them matter more
than the rest: `episodes/[slug]`, `topics/[slug]`, `lore/[slug]` and
`quests/[slug]` together serve 23,680 of the sitemap's URLs. `force-dynamic`
makes Next send `Cache-Control: private, no-store`, so those responses are
uncacheable by construction — a more permissive Cloudflare config could not
cache them either.

Confirm this from the build rather than from the directives, because the build
summary is misleading here: it marks `/episodes/[slug]`, `/topics/[slug]` and
`/lore/[slug]` with ● (SSG), which reflects only that they declare
`generateStaticParams`. The authoritative answer is
`.next/prerender-manifest.json`. After `npm run build`:

```bash
node -e "const m=require('./.next/prerender-manifest.json'); \
  console.log(Object.keys(m.dynamicRoutes).join('\n'))"
```

It lists ten routes — `people/[slug]`, `series/[slug]`, `symbols/[slug]`,
`timeline/[year]`, `sitemaps/[segment]` and friends. None of the four appear,
and neither do any of their paths under `routes`. They have no cache entry of
any kind: every request is a fresh render. That is the measurement to re-run
after any attempt to make them cacheable — a route is fixed when it shows up in
that manifest, not when the directive is deleted. Every hit, from a reader or a crawler, is a cold React
render plus live Xata queries on that one shared vCPU. The measured
`/episodes/<slug>` response is 2.86 MB, 97% of it RSC flight payload.

The arithmetic is unforgiving. Vercel served those pages at a 237 ms TTFB while
scaling functions horizontally; a single shared vCPU cannot. Even taking
250 ms of CPU per render as a floor, one Machine tops out near 4 renders/second
with nothing left over. A Googlebot recrawl of ~24,000 URLs at a routine
2 req/s consumes half the machine for several hours; at 5 req/s it saturates it.

`http_service.concurrency` does not protect against this. `soft_limit = 75`
exists to trigger `auto_start_machines`, and with `min_machines_running = 1` and
one Machine ever created there is nothing to start — requests queue behind a
saturated event loop. The health check then becomes the failure amplifier:
`/api/health` runs `SELECT 1` against Xata every 15 s with a 10 s timeout, so a
loaded Machine starts failing it, Fly restarts the Machine, and the restart
drops every open SSE connection and empties the on-disk ISR cache, which makes
the next wave of requests more expensive still.

Two smaller constraints on the same Machine:

- **SSE holds concurrency slots.** Both `/api/sse/episodes/[slug]` and
  `/api/sse/live/chat` keep a request open for the life of the connection, and
  Fly counts held-open requests against the concurrency limit. 75 concurrent
  viewers reach the soft limit with no page traffic at all.
- **Connections.** Five Prisma pool connections plus the event bus's dedicated
  `LISTEN` client, plus the health check, per Machine. Comfortable at one
  Machine; record the Xata limit before adding a second.

### What this means for the plan

One Machine is sufficient **if the four templates stop rendering dynamically**,
and insufficient if they do not. Scaling the Machine is the expensive way to buy
the same outcome, and it does not help crawl traffic much, because the cost is
per-render rather than per-concurrent-user.

The cheapest real win is `lore/[slug]`: 8,815 of the 23,680 URLs, and its
`force-dynamic` is gratuitous — the page reads no cookies, no headers, and never
calls `getCurrentUser()`. Removing the directive and giving it a `revalidate`
should make it cacheable on its own (confirm no child server component in its
tree reaches for a dynamic API). `episodes/[slug]`, `topics/[slug]` and
`quests/[slug]` are a genuine refactor, not a flag change: each calls
`getCurrentUser()` in the server render, which opts the route into dynamic
rendering no matter what the directive says, and the first three return `[]`
from `generateStaticParams`. Making them cacheable means moving the
per-user branch into a client component or a Suspense boundary first.

This is the same defect `AUDIT.md` tracks as **F5**, reached from the
performance side rather than the hosting side. Treat F5 as a prerequisite for
sizing rather than a follow-up: until it lands, size the Machine for crawl
traffic, not for readers.

### Cloudflare

Static-assets-only is the right starting point and does not need widening yet —
while the HTML carries `no-store`, there is nothing to widen it onto. Two
specifics when the rules are written:

- `/api/psychenomicon-art/[slug]/[slot]` streams immutable chapter art out of
  R2 on every request. It is the one path under `/api/*` that wants caching,
  and the blanket "do not cache `/api/*`" rule would send every image to the
  origin. Carve it out explicitly.
- `/monitoring` is the Sentry tunnel route, not a dashboard. It must stay
  uncached and must not be blocked, or browser error reporting goes silent.

## Production preparation

1. Create the production Fly app in the Xata-adjacent region.
2. Start with one `shared-cpu-1x` Machine and 2 GB RAM. Do not reduce memory until
   production observations show adequate headroom. Read the capacity section
   above first: one Machine is sized for the site *after* the four
   `force-dynamic` templates become cacheable, and for crawl traffic rather
   than reader traffic before that.
3. Set runtime secrets directly with Fly. Never put them in `fly.toml`.
4. Deploy the reviewed commit and test the generated `*.fly.dev` hostname.
5. Store the production Fly `CRON_SECRET` as the GitHub Actions repository
   secret `CRON_SECRET`. Store the staging Fly secret separately as
   `STAGING_CRON_SECRET`.
6. Set `STAGING_BASE_URL` to `https://cultcodex-v2-staging.fly.dev` and
   `PRODUCTION_BASE_URL` to `https://cultcodex.me`. Manual dispatches are
   staging-only; arbitrary target URLs are not accepted.
7. Keep the repository variable `ENABLE_PRODUCTION_SCHEDULES` unset or set to
   `false` while the two Vercel Cron definitions are active. Set it to `true`
   only after Vercel Cron has been disabled during cutover.

## Pre-cutover gates

Run these against production and the production Fly app immediately before the
maintenance window. Each is read-only.

- [ ] Secret parity, plus both digest rules above, on the **production** Fly app.
- [ ] Migration state is clean. `Run DB Migrations` with `diagnose_only` enabled
      reports `0 unresolved failures`. P3009 fires only on a row that started,
      never finished, and was never rolled back — a `rolled_back_at` timestamp is
      the resolution, not the problem, so rolled-back rows are expected history
      and must not be "resolved" again.
- [ ] Production `/api/health` on the `*.fly.dev` hostname returns `{"ok":true}`
      before any DNS record changes.
- [ ] Both scheduled routes answer 401 without a bearer token. A 503 means
      `CRON_SECRET` is unset on the app, not that the gate passed.

Stripe needs **no change at cutover**. The live event destination already points
at `https://cultcodex.me/api/stripe/webhook`, so it follows the domain rather
than the origin. Do not create a `*.fly.dev` live endpoint; there is none today,
and adding one would double-deliver. The live secret key in production use is the
one named `cc` — confirm the Fly production `STRIPE_SECRET_KEY` digest matches
whatever Vercel holds before cutting over, and do not revoke that key while
pruning unused ones.

Note what makes rollback cheap here: this is a **compute-only** cutover. Both
origins read and write the same Xata production database, so during DNS
propagation Vercel and Fly serve identical data, and reverting the record is
sufficient on its own — there is nothing to restore or replay.

## Cloudflare cutover

1. Add `cultcodex.me` to the Fly app and complete Fly's ownership/certificate
   instructions with the verification records set to **DNS only**.
2. Create a high-entropy `CLOUDFLARE_ORIGIN_SECRET`, store it as a Fly secret,
   and add a Cloudflare request-header transform that overwrites
   `X-Origin-Verify` with the same value. Never commit or log the value.
3. Wait for Fly's certificate to become ready.
4. Set Cloudflare SSL/TLS mode to **Full (strict)**.
5. Lower the existing record TTL before the maintenance window if necessary.
6. Replace the Vercel origin record with Fly's instructed target. Enable the
   Cloudflare proxy only after Fly validates the hostname and certificate.
7. Do not broadly cache HTML, `/api/*`, `/monitoring`, Auth.js, Stripe, or SSE.
   Start with static assets only.
8. Repeat the smoke tests through `https://cultcodex.me`.
9. Confirm `CF-Connecting-IP` produces distinct rate-limit buckets and direct
   spoofed Cloudflare headers are ignored.
10. Verify signed Stripe webhook delivery and Google OAuth callbacks.
11. Disable the two Vercel Cron definitions, enable the GitHub scheduled-jobs
    workflow, and manually dispatch each job once. Confirm expected effects and
    no duplicate emails or episode writes.

## Rollback triggers

Rollback compute if any of the following persists for more than five minutes or
affects a critical flow:

- `/api/health` is not HTTP 200.
- HTTP 5xx exceeds 2%.
- Google authentication or session persistence fails.
- Stripe checkout, portal, or signed webhook handling fails.
- Xata connections approach exhaustion or migrations report an error.
- SSE connections cannot remain open through Cloudflare and Fly.
- A scheduled job duplicates writes/emails or repeatedly fails.

Rollback procedure:

1. Restore Cloudflare's previous Vercel DNS target.
2. Disable the GitHub scheduled-jobs workflow.
3. Re-enable the two Vercel Cron definitions.
4. Keep the Fly release and logs for diagnosis.
5. Do not reverse an applied database migration without a separately reviewed
   down procedure. In the compute-only cutover, Xata remains unchanged.

### The rollback target was frozen — keep it unfrozen

Rollback assumes Vercel can still serve. Between 2026-09-16 and 2026-09-18 it
could, but only from the build it already had.

This migration's own merge (PR #181) removed the Vercel build entrypoint in two
places: it renamed the `vercel-build` npm script — which Vercel prefers over
`build` by convention — to `db:migrate`, and deleted the
`scripts/vercel-build.mjs` that script called, along with `.vercelignore`.
Removing the npm script alone would have been harmless, since Vercel falls back
to `build`. Builds kept failing anyway, which means the project also carries a
dashboard **Build Command** override still naming the deleted file. Every Vercel
build in that window failed there, visible as a red `Vercel` commit status on
every PR opened since.

Nothing was broken by that in the meantime: Vercel keeps the last successful
deployment serving when a build fails, so the DNS record still pointed at a
working origin and reverting it would still have worked. What was gone was the
ability to **ship anything through the rollback target** — if the cutover were
reverted and the reason for reverting then needed a code fix, there was no path
to deploy it on Vercel. The fallback was frozen at its last good build.

**Status: partly fixed, still red.** The `vercel.json` at the root sets
`buildCommand` to `next build`. That is the repository's half of the fix and it
is in place, but it did **not** turn the Vercel check green — the deployment on
`9bc8c57` failed the same way. So the remaining cause is something only the
Vercel project can show, and the next step needs someone with access to run:

```bash
npx vercel inspect <deployment-id> --logs
```

The deployment id is in the failing check's own description on each commit. Two
candidates worth checking first in that log, in order: an **Install Command**
override (which `vercel.json`'s `buildCommand` does not touch), and a build-time
environment variable the project lost when the Vercel-specific plumbing was
removed. Do not assume the build command is still the problem — that hypothesis
has now been tested and is not sufficient on its own.

The deleted script did exactly two things: `prisma migrate deploy` when
`VERCEL_ENV === "production"`, then `next build`. Only the second needed
restoring — the first is already covered, and covered better. The
`Run DB Migrations` workflow applies migrations over the non-pooled
`DIRECT_URL`, whereas the build script ran them over whatever
`prisma.config.ts` resolved and warned that a pooled endpoint could refuse the
advisory lock. Migrations are now an explicit pre-deploy gate, as the Build
design section above already describes, so nothing should be moved into that
workflow; it is where the step already lives.

`next build` alone is verified to succeed on this repository, with no database
reachable — `src/lib/db.ts` returns a rejecting proxy when `DATABASE_URL` is
absent and the sitemap and page loaders catch it, so the build completes and
simply prerenders less. Whatever Vercel is failing on, it is therefore not the
repository's build itself. Netlify building the same commits successfully says
the same thing from the other direction.

Two loose ends this does not close, neither of them blocking:

- `.vercelignore` was deleted alongside the script. Nothing breaks without it;
  deploys just upload more than they need to (`scripts/scrape/data` in
  particular). Restore it if Vercel deploy times become annoying during the
  rollback window.
- Until the Vercel check is green, treat the rollback target as still frozen.
  Reverting DNS would restore availability from the last good deployment, but
  shipping a fix through Vercel is not yet possible.

## Post-deploy checks

- [ ] Monitor Fly CPU, memory, restarts, request latency, and health for at least
      30 minutes after cutover and daily for seven days.
- [ ] Monitor Sentry errors and traces, Xata connections, Stripe webhook
      failures, Google authentication errors, and GitHub scheduled job results.
- [ ] Confirm Cloudflare cache behavior and origin bandwidth.
- [ ] Compare the first complete Fly, Xata, Cloudflare, Sentry, and external API
      invoices with the recorded Vercel baseline.
- [ ] Keep the Xata keep-alive workflow until real traffic and hibernation
      behavior are understood. Remove it only after observation proves it is
      unnecessary.

## Vercel decommission

After seven stable days and a successful backup/restore check:

- [ ] Confirm production DNS no longer points to Vercel.
- [ ] Confirm GitHub scheduled jobs ran successfully and Vercel Cron is off.
- [ ] Disable Vercel automatic deployments.
- [ ] Delete the empty `sabian-art` Blob store; it has no objects to migrate.
- [ ] Verify whether `sabian-production` belongs to the separate `sabian`
      project before changing or deleting that database integration.
- [ ] Preserve invoices, usage exports, deployment metadata, and rollback notes.
- [ ] Remove Vercel projects and integrations only after the rollback window.

## Observability

Vercel Analytics and Speed Insights remain removed. Keep Sentry for exceptions
and conservatively sampled traces, Fly logs for application runtime, GitHub
Actions logs for scheduled jobs, Xata observability for the database, and
Cloudflare analytics for edge traffic. Do not add another paid log vendor until
retention and query requirements justify it.

## 2026-09-18 cutover rollback: root cause

The first cutover rolled back on `/auth/error?error=Configuration` (Prisma
P2021, `public.CodexUser` missing). Production had no schema drift. Fly
production's `DATABASE_URL` and `DIRECT_URL` point at the right Xata branch
(`g4323jhord5ojc2gbse9idelo4`) with the right user, but at database **`/xata`**.
That database holds 3 old migrations and no episodes. Production data lives in
database **`/postgres`** on the same branch: 59 applied migrations, latest
`20260913000000_add_shared_rate_limit`, 3,047 episodes (verified by
`scripts/_xata-branch.ts` through `Run DB Script`).

Fix: change the path of both Fly secrets from `/xata` to `/postgres`. Do not run
migrations against production, and leave the `/xata` database alone.
Pre-cutover gate: `scripts/_xata-branch.ts` output from CI and the same facts
read from inside the Fly Machine must match (host, `db=/postgres`, migration
count, episode count).

## 2026-09-18 cutover: production on Fly

DNS for `cultcodex.me` and `www` points at Fly (DNS-only), and both Fly
certificates are issued. Vercel is untouched and remains the rollback target.

Smoke tests on `cultcodex.me` (all passing):

- Google sign-in; the session carries `codexUser` from the `/postgres` database
- Session survives a reload
- Checkout for access/system, month/year: all four return live
  `checkout.stripe.com` sessions (no payment made)
- Billing portal returns a `billing.stripe.com` session
- SSE `live/chat` and `episodes/[slug]` connect and emit `connected`
- Webhook: the live endpoint is enabled, an unsigned POST gets 400, and Stripe
  reports 0 undelivered events in the last 24 h
- Health 200; archive shows 3,052 episodes

Defect found and fixed during the tests: five `STRIPE_PRICE_*` Fly secrets held
their own names as values (placeholder import), so checkout returned
`resource_missing`. They now hold the live price ids: Initiate+
`price_1TSJQgPLMWc5NC9F1QBHClFT` (month) / `price_1TjLWjPLMWc5NC9FAnD6SQ1a`
(year), Oracle `price_1TSJQiPLMWc5NC9FfDxOjooG` (month) /
`price_1TjLWkPLMWc5NC9F4x08iaxe` (year). Legacy `STRIPE_PRICE_ID` = Initiate+ monthly.

Open items:

- `AUTH_SECRET` differs from Vercel's, so sessions issued on Vercel don't carry
  over (`JWTSessionError: no matching decryption secret`). Users sign in once.
- Scheduled jobs still run on Vercel Cron. `ENABLE_PRODUCTION_SCHEDULES` stays
  false until Vercel Cron is disabled, so the jobs never run on both.
- Replace the price-check gate with one that fails on any `STRIPE_PRICE_*` value
  that does not start with `price_`.
