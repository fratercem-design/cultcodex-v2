// One-off: grant lifetime Oracle (system) tier to irlnewstime@gmail.com
import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

const EMAIL = "irlnewstime@gmail.com";

async function run() {
  const p = getPrisma();
  const user = await p.codexUser.findFirst({ where: { email: EMAIL } });
  if (!user) {
    console.error(`User not found: ${EMAIL} — they need to sign in at least once first.`);
    process.exit(1);
  }
  await p.codexUser.update({
    where: { id: user.id },
    data: {
      isLifetimeMember: true,
      subscriptionTier: "system",
      subscriptionStatus: "active",
      currentPeriodEnd: new Date("2099-01-01"),
      isPublicMember: true,
    },
  });
  console.log(`✓ Granted lifetime Oracle (system) access to ${EMAIL} (id: ${user.id})`);
  await disconnect();
}

run().catch((e) => { console.error(e.message || e); process.exit(1); });
