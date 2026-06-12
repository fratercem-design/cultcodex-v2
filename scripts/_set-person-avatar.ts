// One-off: set avatarUrl for a person by slug
// Usage: SLUG=shan URL=https://... npx tsx scripts/_set-person-avatar.ts
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const SLUG = process.env.SLUG ?? "";
const URL_VAL = process.env.URL ?? "";

if (!SLUG || !URL_VAL) {
  console.error("Usage: SLUG=shan URL=https://... npx tsx scripts/_set-person-avatar.ts");
  process.exit(1);
}

async function run() {
  const p = getPrisma();
  const person = await p.person.findUnique({ where: { slug: SLUG } });
  if (!person) {
    console.error(`Person not found: ${SLUG}`);
    process.exit(1);
  }
  await p.person.update({ where: { slug: SLUG }, data: { avatarUrl: URL_VAL } });
  console.log(`✓ Set avatarUrl for ${person.displayName} (${SLUG})`);
  console.log(`  → ${URL_VAL}`);
  await disconnect();
}

run().catch((e) => { console.error(e.message || e); process.exit(1); });
