import { getPrisma, disconnect } from "./scripts/ingest/lib";

async function main() {
  const prisma = getPrisma();
  console.log("Connected to database");

  // Find user by displayName containing Alexandra (case-insensitive)
  const user = await prisma.codexUser.findFirst({
    where: {
      displayName: { contains: 'Alexandra', mode: 'insensitive' }
    },
    select: { id: true, email: true, displayName: true, isLifetimeMember: true, subscriptionTier: true, subscriptionStatus: true, currentPeriodEnd: true }
  });

  console.log('User:', user);

  // Check LiveStatus for alexandra-mayers
  const liveStatus = await prisma.liveStatus.findUnique({ where: { id: 'alexandra-mayers' } });
  console.log('LiveStatus for alexandra-mayers:', liveStatus);

  await disconnect();
  console.log('Disconnected');
}

main().catch(e => { console.error(e); process.exit(1); });