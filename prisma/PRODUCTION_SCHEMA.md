# Production schema snapshot

`production-schema.sql` is a schema-only snapshot of the live CultCodex PostgreSQL
`public` schema. It exists as a disaster-recovery baseline for database objects
that predate or are missing from the Prisma migration history.

The snapshot contains:

- tables, types, sequences, indexes, constraints, functions, triggers, policies,
  and extensions emitted by `pg_dump --schema-only`;
- Prisma's `_prisma_migrations` rows only, so a restored database can safely run
  `prisma migrate deploy`;
- no application table rows, credentials, ownership, or grants.

## Refresh

Run the **Refresh production schema snapshot** GitHub Action. It uses the
repository's existing `DIRECT_URL` secret, falling back to `DATABASE_URL`,
validates that migration history has no failed records, restores the result into
a clean pgvector/PostgreSQL instance, checks Prisma migration status, and commits
a changed snapshot back to its branch.

Locally, with a direct production connection in the environment:

```bash
scripts/dump-production-schema.sh
```

## Rebuild from scratch

Create an empty PostgreSQL database with pgvector available, then restore:

```bash
psql "$DIRECT_URL" -X -v ON_ERROR_STOP=1 -f prisma/production-schema.sql
npx prisma migrate deploy
```

The first command reconstructs the production baseline. The second applies only
migrations added after the snapshot. Seed or restore application data separately.

## Safety rules

- Never replace this with a full/data dump.
- Review every snapshot diff before merging.
- Refresh it whenever production DDL changes and at least before a release that
  adds a migration.
- Do not edit the generated SQL by hand; change the database/migrations and
  regenerate it.
