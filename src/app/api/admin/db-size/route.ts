import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { adminKeyValid } from "@/lib/admin-key";

// Reports total DB size + biggest tables for capacity and cost planning.
// Read-only. Gated by admin session or a short-lived `?key=` token from
// `scripts/mint-admin-key.ts db-size` (see src/lib/admin-key.ts).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function keyValid(req: Request): boolean {
  return adminKeyValid(new URL(req.url).searchParams.get("key"), "db-size");
}

export async function GET(req: Request) {
  let allowed = keyValid(req);
  if (!allowed) {
    const user = await getCurrentUser().catch(() => null);
    allowed = user?.role === "admin";
  }
  if (!allowed) return new Response("Forbidden", { status: 403 });

  try {
    const size = await prisma.$queryRawUnsafe<{ pretty: string; bytes: string }[]>(
      "SELECT pg_size_pretty(pg_database_size(current_database())) AS pretty, pg_database_size(current_database())::text AS bytes"
    );
    const tables = await prisma.$queryRawUnsafe<{ tbl: string; size: string; bytes: string }[]>(
      `SELECT relname AS tbl, pg_size_pretty(pg_total_relation_size(c.oid)) AS size, pg_total_relation_size(c.oid)::text AS bytes
       FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
       WHERE n.nspname='public' AND c.relkind='r'
       ORDER BY pg_total_relation_size(c.oid) DESC LIMIT 15`
    );
    return Response.json({ ok: true, database: size[0], tables });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
