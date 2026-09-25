import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { adminKeyValid } from "@/lib/admin-key";
import { buildPsychenomiconVolume, DEFAULT_COUNT } from "@/lib/book/build-volume";

// Compiles the Psychenomicon Volume I PDF into BookEdition, server-side, where
// the internal DB host is reachable (the public proxy used by the CLI builder
// is flaky). POST only (it writes). Gated by an admin session OR a
// short-lived `?key=` token from `scripts/mint-admin-key.ts build-book`
// (see src/lib/admin-key.ts).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function keyValid(req: Request): boolean {
  return adminKeyValid(new URL(req.url).searchParams.get("key"), "build-book");
}

export async function POST(req: Request) {
  let allowed = keyValid(req);
  if (!allowed) {
    const user = await getCurrentUser().catch(() => null);
    allowed = user?.role === "admin";
  }
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const sp = new URL(req.url).searchParams;
  const count = Number(sp.get("count")) || DEFAULT_COUNT;
  const volume = Number(sp.get("volume")) || 1;
  // `?dryRun=1` compiles and reports without writing to BookEdition. Useful
  // here specifically: R2 credentials only exist on the server, so this is the
  // only place that can confirm the art actually resolves before publishing.
  const dryRun = sp.get("dryRun") === "1";

  const result = await buildPsychenomiconVolume(prisma, {
    volume,
    count,
    persist: !dryRun,
  });

  // `bytes` is the whole PDF (megabytes) — never serialise it into JSON.
  let body: unknown = result;
  if (result.ok) {
    const rest: Partial<typeof result> = { ...result };
    delete rest.bytes;
    body = rest;
  }
  return Response.json(body, { status: result.ok ? 200 : 500 });
}
