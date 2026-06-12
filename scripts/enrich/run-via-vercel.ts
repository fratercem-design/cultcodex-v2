/**
 * Calls the live /api/admin/enrich-topics endpoint in a loop.
 *
 * Usage:
 *   npx tsx scripts/enrich/run-via-vercel.ts [--batch N] [--min-episodes N]
 *
 * Env vars required (in .env or shell):
 *   ENRICH_SECRET      — must match ENRICH_SECRET on the server
 *   APP_URL            — base URL, defaults to https://cultcodex.me
 */
import "dotenv/config";
import * as https from "https";

const BASE_URL = process.env.APP_URL ?? "https://cultcodex.me";
const SECRET = process.env.ENRICH_SECRET ?? "";

function parseArgs() {
  const args = process.argv.slice(2);
  let batch = 8;
  let minEpisodes = 2;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch" && args[i + 1]) { batch = parseInt(args[i + 1]); i++; }
    if (args[i] === "--min-episodes" && args[i + 1]) { minEpisodes = parseInt(args[i + 1]); i++; }
  }
  return { batch, minEpisodes };
}

async function callEnrich(batch: number, minEpisodes: number): Promise<{
  processed: number; remaining: number; done: boolean;
  results: { title: string; ok: boolean; error?: string }[];
}> {
  const url = `${BASE_URL}/api/admin/enrich-topics`;
  const body = JSON.stringify({ batch, minEpisodes });

  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        "x-enrich-secret": SECRET,
      },
    };

    const req = https.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          resolve(JSON.parse(data));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(90000, () => { req.destroy(); reject(new Error("Request timeout")); });
    req.write(body);
    req.end();
  });
}

async function main() {
  if (!SECRET) { console.error("ENRICH_SECRET not set in .env"); process.exit(1); }

  const { batch, minEpisodes } = parseArgs();
  console.log(`\n── Enrich Topics ──`);
  console.log(`   Endpoint: ${BASE_URL}/api/admin/enrich-topics`);
  console.log(`   Batch: ${batch} | Min episodes: ${minEpisodes}\n`);

  let round = 1;
  let totalProcessed = 0;

  while (true) {
    process.stdout.write(`Round ${round}: calling endpoint... `);
    try {
      const res = await callEnrich(batch, minEpisodes);
      totalProcessed += res.processed;
      console.log(`✓ processed=${res.processed} remaining=${res.remaining}`);

      for (const r of res.results) {
        const icon = r.ok ? "  ✓" : "  ✗";
        console.log(`${icon} ${r.title}${r.error ? ` (${r.error})` : ""}`);
      }

      if (res.done || res.remaining <= 0) {
        console.log(`\n✅ Done — total processed: ${totalProcessed}`);
        break;
      }

      round++;
      // Brief pause between rounds
      await new Promise((r) => setTimeout(r, 1000));
    } catch (err) {
      console.error(`\n✗ Error in round ${round}:`, err instanceof Error ? err.message : err);
      console.log("Retrying in 5s...");
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
