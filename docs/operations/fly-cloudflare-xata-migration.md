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

- Database: `DATABASE_URL`, `DIRECT_URL` (the unchanged Xata pooled/direct pair)
- Auth: `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
  `ADMIN_EMAILS`; `NEXTAUTH_URL` and `AUTH_TRUST_HOST` are non-secret config
- Scheduled/admin: `CRON_SECRET`, `ENRICH_SECRET`, `LIVE_TOGGLE_SECRET`
- Origin verification: `CLOUDFLARE_ORIGIN_SECRET`; configure Cloudflare to
  overwrite `X-Origin-Verify` with the same high-entropy value on origin requests
- Ingest: `YOUTUBE_API_KEY`, `SUPADATA_API_KEY`
- AI: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and any configured provider
  fallback credentials
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and every configured
  `STRIPE_PRICE_*` value
- Email/push: `RESEND_API_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- Sentry: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_ORG`,
  `SENTRY_PROJECT`, and optionally `SENTRY_AUTH_TOKEN`
- Any AWS/S3 or art-pipeline secrets present in the Vercel production inventory

Public values embedded during the Docker build include `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_DEPLOY_ENV`, and optionally
`SOURCE_COMMIT`. They are not secrets.

## Staging smoke tests

- [ ] `/api/health` returns HTTP 200 and Fly marks the Machine healthy.
- [ ] Homepage, archive pages, images, fonts, and search render correctly.
- [ ] Google sign-in, callback, session persistence, and sign-out work.
- [ ] An authenticated route and an admin-only route enforce authorization.
- [ ] Stripe test checkout and billing portal work.
- [ ] A signed Stripe test webhook is accepted once and deduplicated on replay.
- [ ] Both SSE endpoints maintain connections through the Fly proxy.
- [ ] Semantic search uses the existing Xata `pgvector` HNSW index.
- [ ] Sentry receives a controlled server and browser error.
- [ ] Database connections remain below the Xata limit with a five-connection
      application pool per running Fly Machine.
- [ ] Both scheduled endpoints return 401 without a bearer secret and 2xx with
      the correct staging secret.

## Production preparation

1. Create the production Fly app in the Xata-adjacent region.
2. Start with one `shared-cpu-1x` Machine and 2 GB RAM. Do not reduce memory until
   production observations show adequate headroom.
3. Set runtime secrets directly with Fly. Never put them in `fly.toml`.
4. Deploy the reviewed commit and test the generated `*.fly.dev` hostname.
5. Store the exact same `CRON_SECRET` as a GitHub Actions repository secret.
6. Optionally set the repository variable `PRODUCTION_BASE_URL`; it defaults to
   `https://cultcodex.me`.
7. Keep `.github/workflows/scheduled-jobs.yml` disabled until after DNS cutover,
   while the two Vercel Cron definitions are still active.

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
