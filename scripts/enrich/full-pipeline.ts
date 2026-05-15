// scripts/enrich/full-pipeline.ts
import "dotenv/config";
import { execSync } from "child_process";

const NEON_URL = "postgresql://neondb_owner:npg_tkoGPp10JQwx@ep-wandering-mud-akzidlw0-pooler.c-3.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

function run(cmd: string, env?: Record<string, string>) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

async function main() {
  const batch = process.argv[2] ?? "100";

  console.log("═══ STEP 1: Enrich episodes ═══");
  run(`npx tsx scripts/enrich/enrich-episodes.ts --batch ${batch}`);

  console.log("\n═══ STEP 2: Import to local DB ═══");
  run("npx tsx scripts/enrich/import-enriched.ts");

  console.log("\n═══ STEP 3: Import to Neon ═══");
  run("npx tsx scripts/enrich/import-enriched.ts", { DATABASE_URL: NEON_URL });

  console.log("\n═══ STEP 4: Deploy to Vercel ═══");
  run("npx vercel --prod --yes");

  console.log("\n✅ Full pipeline complete!");
}

main().catch((err) => {
  console.error("Pipeline failed:", err.message);
  process.exit(1);
});
