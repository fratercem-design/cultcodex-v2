-- ContentStatus gains `unavailable`, used by the ingest pipeline for episodes
-- whose video is no longer available. schema.prisma already lists it; the init
-- migration only created ('draft','published','archived'). ALTER TYPE ... ADD
-- VALUE cannot run inside a transaction in Postgres, so no BEGIN/COMMIT here.
ALTER TYPE "ContentStatus" ADD VALUE IF NOT EXISTS 'unavailable';
