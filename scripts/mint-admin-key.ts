#!/usr/bin/env npx tsx
/**
 * Mint a short-lived `?key=` token for the key-gated admin routes.
 *
 *   AUTH_SECRET=... npx tsx scripts/mint-admin-key.ts build-book [minutes]
 *   curl -X POST "https://cultcodex.me/api/admin/build-book?key=<token>"
 *
 * Purposes: build-book, migrate-art-r2, db-size. Default lifetime is 15
 * minutes; the routes reject anything valid for more than 24 hours.
 */
import { mintAdminKey } from "../src/lib/admin-key";

const PURPOSES = new Set(["build-book", "migrate-art-r2", "db-size"]);
const [purpose, minutesArg] = process.argv.slice(2);
if (!purpose || !PURPOSES.has(purpose)) {
  console.error(`usage: mint-admin-key.ts <${[...PURPOSES].join("|")}> [minutes]`);
  process.exit(1);
}
const minutes = minutesArg ? Number(minutesArg) : 15;
console.log(mintAdminKey(purpose, minutes * 60_000));
