// Moves one secret from the Windows clipboard into .env.fly-production.
// The value is never printed, and the clipboard is cleared afterwards.
//
//   1. Copy the secret in the provider's console.
//   2. node scripts/paste-secret.mjs STRIPE_SECRET_KEY
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { checks, parseEnv, problemsFor } from "./fly-env-checks.mjs";

// Resolved from this script, so it works from any directory (e.g. system32).
const FILE = fileURLToPath(new URL("../.env.fly-production", import.meta.url));
const name = process.argv[2];
const ps = (command) =>
  execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", command], { encoding: "utf8" });

const text = readFileSync(FILE, "utf8");
const line = new RegExp(`^${name}=.*$`, "m");
if (!name || !/^[A-Z_][A-Z0-9_]*$/.test(name) || !line.test(text)) {
  console.error(`Usage: node scripts/paste-secret.mjs <NAME>\nNames it checks: ${Object.keys(checks).join(", ")}`);
  process.exit(1);
}

const value = ps("Get-Clipboard -Raw").trim();
if (!value) { console.error("Clipboard is empty — copy the secret first."); process.exit(1); }
if (/\s/.test(value) && name !== "ADMIN_EMAILS" && name !== "ALERT_FROM") {
  console.error(`${name}: clipboard holds more than one word — copy only the secret itself. Nothing saved.`);
  process.exit(1);
}

const env = { ...parseEnv(text), [name]: value };
const problems = problemsFor(name, value, env);
if (problems.length) {
  console.error(`${name}: ${problems.join("; ")}. Nothing saved; clipboard left as is.`);
  process.exit(1);
}

// A function replacement keeps `$` sequences in the secret literal.
writeFileSync(FILE, text.replace(line, () => `${name}=${value}`));
ps("Set-Clipboard -Value $null");
console.log(`${name}: saved, format ok, clipboard cleared.`);
