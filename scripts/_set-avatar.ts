// One-off: set avatarUrl for a person by slug
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const SLUG = "alexandra-mayers";
const AVATAR_URL = "https://i.imgur.com/MjiRVfb.jpeg";

async function run() {
  const p = getPrisma();
  const person = await p.person.findUnique({ where: { slug: SLUG } });
  if (!person) {
    console.error(`Person not found: ${SLUG}`);
    process.exit(1);
  }
  await p.person.update({ where: { id: person.id }, data: { avatarUrl: AVATAR_URL } });
  console.log(`✓ Set avatarUrl for "${person.displayName}" → ${AVATAR_URL}`);
  await disconnect();
}

run().catch((e) => { console.error(e.message || e); process.exit(1); });
