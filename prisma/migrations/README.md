# Migrations

`0_baseline` is the whole production schema as of 2026-09-30, and it replaces
the 60 migrations before it. Those could not build a database from empty:
22 tables (`CodexUser`, the auth tables, cards, readings, chat) were created
with `prisma db push` and never had a migration. That broke `migrate deploy` on
a new database and the shadow database `prisma migrate dev` uses. The old
migrations are in git history, up to commit `13a298d`.

The baseline is a `pg_dump --schema-only` of `prisma/production-schema.sql`
restored and brought up to date with the four migrations after it. So it
includes what `schema.prisma` can't express: the pgvector columns and indexes,
and the partial unique index on `CreditTransaction`. It leaves out one object on
purpose: `public.user_search`, the host's PgBouncer login lookup, which reads
`pg_shadow` and is not part of the app.

## One-time step on production

Production already has this schema, so the baseline must be recorded as
applied, not run. Do this once, after the PR merges and before any new
migration is deployed:

1. Actions → **Run DB Migrations** → `diagnose_only: false`,
   `resolve_migration: 0_baseline`, `resolve_as: applied`.
   The log should end with "No pending migrations to apply."
2. Actions → **Refresh production schema snapshot**, so that
   `prisma/production-schema.sql` records `0_baseline` as applied. Until it
   does, a database restored from the snapshot needs step 1 as well.

If `migrate deploy` runs first by mistake, it fails on the first statement
(`type "CanonStatus" already exists`) and changes nothing. Step 1 then clears it.

The old migration rows stay in `_prisma_migrations`. Prisma ignores applied
migrations that have no folder here (production already had three).

## New database

```bash
npx prisma migrate deploy
```

## Known drift

The database and `schema.prisma` differ. The baseline follows the database, so
`prisma migrate dev` will offer to reconcile them:

- `Card` and `CardPack` have 16 columns the schema no longer declares
  (`imageUrl`, `weight*`, `statLabel*`, …), plus 10 indexes the schema doesn't list.
- (Resolved by `20260930000000_restore_segment_embedding`.) `TranscriptSegment.embedding`
  was in the schema but not in the database. It is back at 512 dims and filled by
  the Backfill Segment Embeddings workflow.
- Defaults differ on `PackPurchase`, `RateLimitBucket` and `WeeklyDigest`.

Review any generated migration before applying it: it will contain `DROP
COLUMN` statements for the card columns.
