/**
 * Vercel build entrypoint.
 *
 * Railway used to apply migrations via `preDeployCommand`. Vercel has no
 * equivalent hook, so schema changes have to ride along with the build.
 *
 * Guard rails:
 *  - Migrations run ONLY when VERCEL_ENV === "production". Preview and
 *    development builds share the same database, and letting a preview branch
 *    migrate the production schema is how you get a Friday night.
 *  - A failed migration FAILS the build on purpose. Vercel keeps the previous
 *    deployment serving when a build fails, so stopping here is strictly safer
 *    than shipping code that expects a schema the database doesn't have.
 *  - `prisma migrate deploy` only applies already-committed migration files and
 *    never generates or resets anything, so it is safe to run on every deploy.
 */
import { spawnSync } from "node:child_process";

function run(label, command, args) {
  console.log(`\n[vercel-build] ${label}: ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    console.error(`[vercel-build] ${label} failed with exit code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

const isProduction = process.env.VERCEL_ENV === "production";

if (isProduction) {
  if (!process.env.DIRECT_URL) {
    // prisma.config.ts falls back to the pooled DATABASE_URL, and `migrate
    // deploy` needs a pg advisory lock that a pooled endpoint can refuse.
    console.warn(
      "[vercel-build] WARNING: DIRECT_URL is not set — migrations will run over the " +
        "pooled DATABASE_URL and may fail to acquire the advisory lock. Add DIRECT_URL " +
        "to the Vercel project's Production environment."
    );
  }
  run("apply migrations", "npx", ["prisma", "migrate", "deploy"]);
} else {
  console.log(
    `\n[vercel-build] VERCEL_ENV=${process.env.VERCEL_ENV ?? "(unset)"} — skipping migrations ` +
      "(they run on production deploys only)."
  );
}

run("build", "npx", ["next", "build"]);
