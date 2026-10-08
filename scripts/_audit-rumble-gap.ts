/**
 * READ-ONLY audit. Makes no writes of any kind.
 *
 * Answers: of the 172 Rumble-only episodes (deleted from YouTube) and the 48
 * still-live ones, how many already have Episode rows, what status are they,
 * and do they have transcript segments yet?
 *
 *   npx tsx scripts/_audit-rumble-gap.ts
 */
import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import * as dotenv from "dotenv";
// Safe despite the env loading below: @/lib/db wraps the client in a lazy Proxy
// that only resolves DATABASE_URL on the first query, which happens in main().
import { prisma } from "@/lib/db";

// DATABASE_URL lives in the production env files, not .env.local. Try them in
// order and report which one was used — the value itself is never printed.
// An empty or placeholder DATABASE_URL counts as missing, and `override: false`
// would let that empty value win, so force an override from the file we pick.
// NOTE: when run under `npx dotenvx run -f <file> --`, DATABASE_URL is already
// decrypted in the environment. Never clear or override it in that case — the
// raw file values are ciphertext and would clobber a perfectly good URL.
// The .env.* files are dotenvx-encrypted, so a plain read yields ciphertext.
// Only a real postgres URL counts; anything else is discarded rather than left
// in place, where it would masquerade as a connection string.
const usable = (v?: string) => !!v && /^postgres(ql)?:\/\//i.test(v.trim());

if (!usable(process.env.DATABASE_URL)) {
  const candidates = [
    process.env.ENV_FILE,
    ".env.fly-production",
    ".env.vercel-production",
    ".env.local",
    ".env",
  ].filter(Boolean) as string[];

  for (const f of candidates) {
    if (!existsSync(f)) continue;
    dotenv.config({ path: f, override: true });
    if (usable(process.env.DATABASE_URL)) {
      console.log(`[env] DATABASE_URL loaded from ${f}`);
      break;
    }
    delete process.env.DATABASE_URL; // ciphertext or placeholder — not a URL
  }
}

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL not found. Run from the repo root, or set it explicitly:\n" +
      "  $env:ENV_FILE='.env.fly-production'; npx tsx scripts/_audit-rumble-gap.ts",
  );
  process.exit(1);
}

const RUMBLE_FILE = "scripts/ingest/data/rumble-deleted-172.txt";
const YT_FILE = "scripts/data/backfill-ids.txt";

function readLines(p: string): string[] {
  if (!existsSync(p)) {
    console.error(`missing file: ${p}`);
    process.exit(1);
  }
  return readFileSync(p, "utf8")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("#"));
}

async function main() {
  const rumbleIds = readLines(RUMBLE_FILE).map((l) => l.split("|")[2]).filter(Boolean);
  const ytIds = readLines(YT_FILE);

  console.log(`\nInput: ${rumbleIds.length} rumble ids, ${ytIds.length} youtube ids\n`);

  // ── Rumble-only set ──────────────────────────────────────────────────────
  const rumbleRows = await prisma.episode.findMany({
    where: { rumbleVideoId: { in: rumbleIds } },
    select: {
      id: true, slug: true, status: true, rumbleVideoId: true,
      youtubeVideoId: true, transcriptRaw: true,
      _count: { select: { segments: true } },
    },
  });

  const foundRumble = new Set(rumbleRows.map((r) => r.rumbleVideoId!));
  const noRow = rumbleIds.filter((id) => !foundRumble.has(id));

  const byStatus: Record<string, number> = {};
  let withSegments = 0, withRaw = 0, alsoHasYt = 0;
  for (const r of rumbleRows) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    if (r._count.segments > 0) withSegments++;
    if (r.transcriptRaw && r.transcriptRaw.length > 0) withRaw++;
    if (r.youtubeVideoId) alsoHasYt++;
  }

  console.log("=== 172 Rumble-only (deleted from YouTube) ===");
  console.log(`  have an Episode row : ${rumbleRows.length}`);
  console.log(`  no row at all       : ${noRow.length}`);
  console.log(`  status breakdown    : ${JSON.stringify(byStatus)}`);
  console.log(`  with segments       : ${withSegments}`);
  console.log(`  with transcriptRaw  : ${withRaw}`);
  console.log(`  also have a yt id   : ${alsoHasYt}`);
  console.log(`  => need transcribing: ${rumbleRows.length - withSegments} of those with rows`);

  // ── Still-live-on-YouTube set ────────────────────────────────────────────
  const ytRows = await prisma.episode.findMany({
    where: { youtubeVideoId: { in: ytIds } },
    select: {
      id: true, status: true, youtubeVideoId: true,
      _count: { select: { segments: true } },
    },
  });
  const foundYt = new Set(ytRows.map((r) => r.youtubeVideoId!));
  const ytNoRow = ytIds.filter((id) => !foundYt.has(id));
  const ytByStatus: Record<string, number> = {};
  let ytWithSegments = 0;
  for (const r of ytRows) {
    ytByStatus[r.status] = (ytByStatus[r.status] ?? 0) + 1;
    if (r._count.segments > 0) ytWithSegments++;
  }

  console.log("\n=== 48 still live on YouTube ===");
  console.log(`  have an Episode row : ${ytRows.length}`);
  console.log(`  no row at all       : ${ytNoRow.length}`);
  console.log(`  status breakdown    : ${JSON.stringify(ytByStatus)}`);
  console.log(`  with segments       : ${ytWithSegments}`);

  // ── What the ASR exporter can currently see ──────────────────────────────
  const asrVisible = await prisma.episode.count({
    where: { youtubeVideoId: { not: null }, segments: { none: {} } },
  });
  const rumbleOnlyPending = await prisma.episode.count({
    where: { youtubeVideoId: null, rumbleVideoId: { not: null }, segments: { none: {} } },
  });

  console.log("\n=== Pipeline reachability (whole DB) ===");
  console.log(`  asr-export-pending currently sees : ${asrVisible}`);
  console.log(`  rumble-only, no segments (unseen) : ${rumbleOnlyPending}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
