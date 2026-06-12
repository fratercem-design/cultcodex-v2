// scripts/enrich/full-pipeline.ts
import "dotenv/config";
import { execSync } from "child_process";

function run(cmd: string, env?: Record<string, string>) {
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
}

async function main() {
  const batch = process.argv[2] ?? "100";

  console.log("═══ STEP 1: Enrich episodes ═══");
  run(`npx tsx scripts/enrich/enrich-episodes.ts --batch ${batch}`);

  console.log("\n═══ STEP 2: Import to DB ═══");
  run("npx tsx scripts/enrich/import-enriched.ts");

  console.log("\n✅ Full pipeline complete!");
}

main().catch((err) => {
  console.error("Pipeline failed:", err.message);
  process.exit(1);
});
