// One-off: set Shan Camp avatar
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const SLUGS = ["shan", "shan-camp"];
const AVATAR_URL = "https://i.imgur.com/VI75zT6.jpeg";

async function run() {
  const p = getPrisma();
  let updated = 0;
  for (const slug of SLUGS) {
    const person = await p.person.findUnique({ where: { slug } });
    if (!person) continue;
    await p.person.update({ where: { slug }, data: { avatarUrl: AVATAR_URL } });
    console.log(`✓ Set avatar for ${person.displayName} (${slug})`);
    updated++;
  }
  if (updated === 0) console.error("No person found for slugs:", SLUGS.join(", "));
  await disconnect();
}

run().catch((e) => { console.error(e.message || e); process.exit(1); });
