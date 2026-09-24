// Validates .env.fly-production SHAPES without ever printing a value.
// Usage: node scripts/check-fly-env.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { checks, parseEnv, problemsFor } from "./fly-env-checks.mjs";

const env = parseEnv(readFileSync(process.argv[2] ?? fileURLToPath(new URL("../.env.fly-production", import.meta.url)), "utf8"));

let blocking = 0;
for (const name of Object.keys(checks)) {
  const v = env[name];
  if (!v) { console.log(`  [ ] ${name.padEnd(22)} blank`); blocking++; continue; }
  const problems = problemsFor(name, v, env);
  if (problems.length) { console.log(`  [!] ${name.padEnd(22)} ${problems.join("; ")}`); blocking++; }
  else console.log(`  [x] ${name.padEnd(22)} ok`);
}
console.log(blocking ? `\n${blocking} of ${Object.keys(checks).length} still need attention.` : "\nAll minimum values present and well-formed. Ready to import.");
process.exitCode = blocking ? 1 : 0;
