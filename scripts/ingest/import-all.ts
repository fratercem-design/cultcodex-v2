// scripts/ingest/import-all.ts
import { execSync } from "child_process";
import { existsSync } from "fs";
import { resolve, dirname } from "path";

const scriptDir = decodeURIComponent(dirname(new URL(import.meta.url).pathname)).replace(/^\/([A-Z]:)/, "$1");

function run(script: string, dataFile: string) {
  const fullScript = resolve(scriptDir, script);
  const fullData = resolve(process.cwd(), dataFile);

  if (!existsSync(fullData)) {
    console.log(`Skipping ${script}: ${dataFile} not found`);
    return;
  }

  console.log(`\n--- Running ${script} with ${dataFile} ---`);
  execSync(`npx tsx "${fullScript}" "${fullData}"`, {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}

const dataDir = process.argv[2] || "scripts/ingest/data";

// Import order: leaf entities first, then episodes (which link to them)
run("import-topics.ts", `${dataDir}/topics.json`);
run("import-people.ts", `${dataDir}/people.json`);
run("import-lore.ts", `${dataDir}/lore.json`);
run("import-episodes.ts", `${dataDir}/episodes.json`);

console.log("\nAll imports complete.");
