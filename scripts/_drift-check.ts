/**
 * READ-ONLY: print the SQL diff between the connected database (DATABASE_URL)
 * and prisma/schema.prisma. Run via the "Run DB Script" workflow to measure
 * prod schema drift. Applies nothing.
 */
import { execSync } from "node:child_process";

const out = execSync(
  "npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script",
  { encoding: "utf-8", env: process.env }
);
console.log("── DRIFT (SQL to make DB match schema) ──");
console.log(out.trim() || "(no drift)");
