// One-off: grant lifetime Oracle (system) tier to a user by email
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const EMAIL = "psychetarotchannel@gmail.com";

async function run() {
  const p = getPrisma();
  const user = await p.codexUser.findFirst({ where: { email: EMAIL } });
  if (!user) {
    console.error(`User not found: ${EMAIL}`);
    process.exit(1);
  }
  await p.codexUser.update({
    where: { id: user.id },
    data: {
      isLifetimeMember: true,
      subscriptionTier: "system",
      subscriptionStatus: "active",
    },
  });
  console.log(`✓ Granted lifetime Oracle access to ${EMAIL} (id: ${user.id})`);
  await disconnect();
}

run().catch((e) => { console.error(e.message || e); process.exit(1); });
