import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();
  console.log("Connected to database");

  // Check for Alexandra Mayers
  const alexandraUser = await prisma.codexUser.findFirst({
    where: {
      OR: [
        { displayName: { contains: "Alexandra", mode: "insensitive" } },
        { email: { contains: "alexandra", mode: "insensitive" } }
      ]
    },
    select: {
      id: true,
      email: true,
      displayName: true,
      isLifetimeMember: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      currentPeriodEnd: true
    }
  });

  if (alexandraUser) {
    console.log("❌ Alexandra Mayers user found:", alexandraUser);
    if (alexandraUser.isLifetimeMember) {
      console.log("   - Still has lifetime membership!");
    } else {
      console.log("   - Lifetime membership removed.");
    }
  } else {
    console.log("✅ No Alexandra Mayers user found.");
  }

  // Check LiveStatus for alexandra-mayers
  const liveStatus = await prisma.liveStatus.findUnique({ where: { id: "alexandra-mayers" } });
  if (liveStatus) {
    console.log("❌ LiveStatus entry for alexandra-mayers still exists:", liveStatus);
  } else {
    console.log("✅ No LiveStatus entry for alexandra-mayers.");
  }

  // Check Oracle user (ip2wikiinfo@gmail.com)
  const oracleUser = await prisma.codexUser.findFirst({
    where: { email: "ip2wikiinfo@gmail.com" },
    select: {
      id: true,
      email: true,
      displayName: true,
      isLifetimeMember: true,
      subscriptionTier: true,
      subscriptionStatus: true,
      currentPeriodEnd: true
    }
  });

  if (oracleUser) {
    console.log("❌ Oracle user found:", oracleUser);
    if (oracleUser.isLifetimeMember) {
      console.log("   - Still has lifetime membership!");
    } else {
      console.log("   - Lifetime membership removed.");
    }
  } else {
    console.log("✅ No Oracle user found with email ip2wikiinfo@gmail.com.");
  }

  await disconnect();
  console.log("Disconnected from database");
}

main().catch(e => { console.error(e); process.exit(1); });