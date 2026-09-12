# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # start dev server (Turbopack)
npm run build            # production build (no migration)
npm run vercel-build     # what Vercel runs: migrate (production only) + build
npm run lint             # eslint
npm run test             # vitest (run once)
npm run test:watch       # vitest watch mode
npx vitest run src/lib/format/__tests__/format.test.ts  # single test file
npx prisma generate      # regenerate Prisma client after schema changes
npx prisma migrate dev --name <name>  # create + apply migration locally (needs DIRECT_URL)
npx prisma studio        # DB browser
```

**Ingest pipeline** (run in order for a full sync):
```bash
npm run scrape:youtube        # fetch YouTube metadata
npm run scrape:transcripts    # fetch captions
npm run ingest                # import all into DB
npm run enrich:pipeline       # Claude AI enrichment
```

## Architecture

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Prisma 7 + PostgreSQL (Xata), NextAuth v5, Stripe, Tailwind v4, Vitest.

**Prisma client** is generated to `src/generated/prisma/` (not the default location). Import from `@/generated/prisma/client`. The DB singleton lives in `src/lib/db.ts` using `PrismaPg` adapter for connection pooling.

**Auth** (`src/lib/auth.ts`): Google OAuth via NextAuth v5. On sign-in, a `CodexUser` row is upserted. The session JWT carries a `codexUser` object with `id`, `role`, `subscriptionTier`, etc. Three auth helpers: `getCurrentUser()`, `requireAuth()`, `requireAdmin()`. Admin access is controlled by `ADMIN_EMAILS` env var (no DB write needed).

**Subscription tiers** (`src/lib/subscription-tiers.ts`): Two paid tiers — `access` ($10/mo, "Initiate+") and `system` ($25/mo, "Oracle"). `isSubscribed()` in `src/lib/subscription.ts` checks `subscriptionStatus === "active"` + `currentPeriodEnd` + `isLifetimeMember` flag. Stripe price IDs are read from env vars (`STRIPE_PRICE_ACCESS_ID`, `STRIPE_PRICE_SYSTEM_ID`) so the same code works in test/live.

**Queries layer** (`src/lib/queries/`): All Prisma queries live here, organized by entity (episodes, people, lore, topics, search, etc.). Pages call these directly — there's no separate API layer for server components.

**Search** has two modes:
- `src/lib/queries/search.ts` — keyword/fulltext search across all entity types
- `src/lib/queries/semantic.ts` — multi-concept vector search using pgvector HNSW index. Embeddings via OpenAI `text-embedding-3-small` (1536-dim), implemented in `src/lib/embeddings.ts`. Strategy: top-200 candidates via primary concept HNSW, then re-score against all concepts.

**Oracle** (`src/app/oracle/`, `src/app/api/oracle/`) — AI chat feature powered by Anthropic Claude, uses SSE streaming. `src/lib/sse/` contains the event bus, logger, and `useSSE` hook.

**Admin** (`src/app/admin/`) — protected by `requireAdmin()`. Covers episode CRUD, bulk enrichment, psychenomicon chapter generation, sync panel, and live toggle. All admin mutations go through Server Actions (`src/app/admin/actions.ts`, `create-actions.ts`).

**Trading Cards** (`src/app/cards/`, `src/lib/queries/cards.ts`, `src/lib/cards/rarity.ts`): Signal Credits economy. Cards have `Rarity` (STATIC→ORACLE) and `CardType` (VOICE, TRANSMISSION, LORE, SIGNAL, ORACLE, CIPHER). Pack weights live on `CardPack`. `OwnedCard` is unique on `(userId, cardId, isFoil)`. `UserWallet` stores `balance` (the operative field) and `signalCredits` (legacy alias).

**Psychenomicon** (`src/app/psychenomicon/`) — premium AI myth engine. Generates narrative chapters per episode using Claude, stored as `PsychenomiconChapter`. Gated behind `access` tier.

## Key env vars

```
DATABASE_URL          # Xata pooled connection (app runtime)
DIRECT_URL            # Xata direct connection (migrations — advisory locks need non-pooled)
NEXTAUTH_URL          # must match deployed origin exactly
NEXTAUTH_SECRET
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
ANTHROPIC_API_KEY
OPENAI_API_KEY        # for embeddings
STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ACCESS_ID / STRIPE_PRICE_SYSTEM_ID                # monthly price ids
STRIPE_PRICE_ACCESS_ANNUAL_ID / STRIPE_PRICE_SYSTEM_ANNUAL_ID  # annual price ids
RESEND_API_KEY        # transactional + lead-capture email (Subscriber list)
ADMIN_EMAILS          # comma-separated, grants admin role without DB write
ENRICH_SECRET         # protects all /api/admin/* routes
```

## Schema notes

- Migrations live in `prisma/migrations/`. Deploys run on **Vercel**, and `vercel.json` points `buildCommand` at `scripts/vercel-build.mjs`, which runs `prisma migrate deploy` **only when `VERCEL_ENV === "production"`** and then `next build`. Preview builds skip migrations on purpose — they share the production database. A failed migration fails the build, and Vercel keeps the previous deployment serving. The `Run DB Migrations` GitHub Action (workflow_dispatch) remains available for applying a migration without deploying. Railway config (`railway.toml`, `nixpacks.toml`) and the `build:migrate` script have been removed.
- `prisma.config.ts` uses `DIRECT_URL` (non-pooled) for migrations, falls back to `DATABASE_URL`.
- If a migration fails, clear it with: `npx prisma migrate resolve --rolled-back <migration_name>`
- The Xata branch hibernates when idle; `.github/workflows/keep-alive.yml` pings `/api/keep-alive` so builds (which prerender thousands of DB-backed pages) don't hit a sleeping branch.
- Local env: put real `DATABASE_URL` / `DIRECT_URL` in `.env.local`. `vercel env pull` writes `[SENSITIVE]` placeholders for Sensitive vars, so `.env` cannot supply them.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
