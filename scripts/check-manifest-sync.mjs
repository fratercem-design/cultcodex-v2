#!/usr/bin/env node
/**
 * Guard against the two ways package.json and package-lock.json have gone
 * wrong here, both of which took all of CI down before any check could run.
 *
 *  1. Duplicate keys. A merge that keeps both sides of a conflict leaves a
 *     dependency listed twice. JSON.parse silently keeps the LAST one, so the
 *     file looks valid, `node -e "require('./package.json')"` looks valid, and
 *     the effective version is quietly the wrong half of the pair. Only a raw
 *     text scan can see it. This hit package.json, and then hit the lockfile's
 *     own mirror of the dependency list a second time.
 *
 *  2. Manifest/lock drift. Editing a version or an override without running
 *     `npm install` leaves the lock behind. `npm ci` refuses to install at all,
 *     so every job dies at "Install dependencies" in ~30s having tested nothing.
 *
 * Runs with no dependencies and no network so it can be the first thing CI
 * does — the failures above all happened *before* npm install could succeed,
 * so a check that needs installed packages is useless here.
 */
import { readFileSync } from "node:fs";

let failed = false;
const fail = (msg) => { failed = true; console.error(`✖ ${msg}`); };
const ok = (msg) => console.log(`✓ ${msg}`);

/**
 * Find duplicate keys within the same JSON object.
 *
 * Tracks nesting depth and the current container path so that a key repeated
 * at two different levels is not a false positive — "prisma" legitimately
 * appears both as a dependency and as the top-level Prisma config block.
 */
function findDuplicateKeys(text, label) {
  const dupes = [];
  const stack = [{ path: "$", keys: new Map() }];
  let inString = false, escaped = false, depth = 0;
  let pendingKey = null, buf = "", collecting = false, line = 1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\n") line++;

    if (inString) {
      if (escaped) { escaped = false; if (collecting) buf += ch; continue; }
      if (ch === "\\") { escaped = true; if (collecting) buf += ch; continue; }
      if (ch === '"') { inString = false; if (collecting) { pendingKey = buf; collecting = false; } continue; }
      if (collecting) buf += ch;
      continue;
    }

    if (ch === '"') { inString = true; buf = ""; collecting = true; continue; }

    if (ch === ":" && pendingKey !== null) {
      const frame = stack[stack.length - 1];
      // Only object members count; array elements have no keys.
      if (frame.isArray !== true) {
        const prev = frame.keys.get(pendingKey);
        if (prev !== undefined) {
          dupes.push({ key: pendingKey, path: frame.path, first: prev, second: line });
        } else {
          frame.keys.set(pendingKey, line);
        }
      }
      stack.lastKey = pendingKey;
      frame.lastKey = pendingKey;
      pendingKey = null;
      continue;
    }

    if (ch === "{" || ch === "[") {
      const parent = stack[stack.length - 1];
      const name = parent.lastKey ?? (parent.isArray ? "[]" : "$");
      stack.push({
        path: parent.path === "$" ? name : `${parent.path}.${name}`,
        keys: new Map(),
        isArray: ch === "[",
      });
      depth++;
      pendingKey = null;
      continue;
    }

    if (ch === "}" || ch === "]") {
      if (stack.length > 1) stack.pop();
      depth--;
      pendingKey = null;
      continue;
    }

    if (ch === ",") { pendingKey = null; continue; }
  }

  if (dupes.length) {
    fail(`${label} has ${dupes.length} duplicate key(s) — JSON keeps the LAST, so the other value is silently ignored:`);
    for (const d of dupes) {
      console.error(`    "${d.key}" in ${d.path}  (lines ${d.first} and ${d.second})`);
    }
    console.error(`    Fix: delete the stale half, then run \`npm install\` and commit the lockfile.`);
  } else {
    ok(`${label}: no duplicate keys`);
  }
}

/** Every dependency range in package.json that the lockfile must agree with. */
function declaredRanges(pkg) {
  const out = new Map();
  for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
    for (const [name, range] of Object.entries(pkg[field] ?? {})) out.set(name, range);
  }
  return out;
}

const pkgText = readFileSync("package.json", "utf8");
const lockText = readFileSync("package-lock.json", "utf8");

findDuplicateKeys(pkgText, "package.json");
findDuplicateKeys(lockText, "package-lock.json");

const pkg = JSON.parse(pkgText);
const lock = JSON.parse(lockText);

// The lockfile mirrors the root manifest's dependency ranges in packages[""].
// When someone edits package.json without reinstalling, that mirror goes stale
// and `npm ci` aborts. Compare them directly rather than shelling out to npm,
// which would need the network.
const root = lock.packages?.[""];
if (!root) {
  fail('package-lock.json has no packages[""] entry — cannot verify sync (lockfileVersion too old?)');
} else {
  const declared = declaredRanges(pkg);
  const mirrored = declaredRanges(root);
  const drift = [];

  for (const [name, range] of declared) {
    const got = mirrored.get(name);
    if (got === undefined) drift.push(`${name}: declared "${range}", missing from lockfile`);
    else if (got !== range) drift.push(`${name}: package.json "${range}" vs lockfile "${got}"`);
  }
  for (const [name, range] of mirrored) {
    if (!declared.has(name)) drift.push(`${name}: lockfile "${range}", no longer in package.json`);
  }

  if (drift.length) {
    fail(`package.json and package-lock.json disagree on ${drift.length} dependency range(s) — \`npm ci\` will refuse to install:`);
    for (const d of drift) console.error(`    ${d}`);
    console.error(`    Fix: run \`npm install\` and commit the updated package-lock.json.`);
  } else {
    ok("package.json and package-lock.json agree on every dependency range");
  }

  // `overrides` is what broke this the second time: it was bumped in
  // package.json while the lock kept resolving the old version.
  const declaredOverrides = pkg.overrides ?? {};
  for (const [name, want] of Object.entries(declaredOverrides)) {
    if (typeof want !== "string") continue;
    const resolved = lock.packages?.[`node_modules/${name}`]?.version;
    if (!resolved) continue;
    const bare = want.replace(/^[\^~>=<\s]*/, "");
    const satisfied = want.startsWith("^") || want.startsWith("~")
      ? resolved.split(".")[0] === bare.split(".")[0] && resolved >= bare
      : resolved === bare;
    if (!satisfied) {
      fail(`override "${name}": package.json wants ${want} but the lockfile resolved ${resolved}`);
      console.error(`    Fix: run \`npm install\` and commit the updated package-lock.json.`);
    }
  }
}

if (failed) {
  console.error("\nManifest check failed. This runs before install because these\nproblems stop `npm ci` from running at all.");
  process.exit(1);
}
console.log("\nManifest check passed.");
