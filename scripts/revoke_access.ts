import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();
  console.log("Connected to database");

  // 1. Handle Alexandra Mayers (LIVE sidebar and lifetime membership)
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
    console.log(`Found Alexandra Mayers user:`, alexandraUser);

    // Remove LiveStatus entry for alexandra-mbership and subscription fields
    await prisma.codexUser.update({
      where: { id: alexandraUser.id },
      data: {
        isLifetimeMember: false,
        subscriptionTier: null,
        subscriptionStatus: null,
        currentPeriodEnd: null
      }
    });
    console.log(`Updated user ${alexandraUser.id} to remove lifetime membership`);

    // Remove LiveStatus entry if exists
    try {
      await prisma.liveStatus.delete({ where: { id: "alexandra-mayers" } });
      console.log("Deleted LiveStatus entry for alexandra-mayers");
    } catch (e) {
      console.log("No LiveStatus entry for alexandra-mayers to delete:", e.message);
    }
  } else {
    console.log("No user found matching Alexandra Mayers");
  }

  // 2. Handle Oracle lifetime member (ip2wikiinfo@gmail.com)
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
    console.log(`Found Oracle user:`, oracleUser);

    // Remove lifetime membership and subscription fields
    await prisma.codexUser.update({
      where: { id: oracleUser.id },
      data: {
        isLifetimeMember: false,
        subscriptionTier: null,
        subscriptionStatus: null,
        currentPeriodEnd: null
      }
    });
    console.log(`Updated user ${oracleUser.id} to remove lifetime membership`);
  } else {
    console.log("No user found with email ip2wikiinfo@gmail.com");
  }

  await disconnect();
  console.log("Disconnected from database");
}

main().catch(e => { console.error(e); process.exit(1); });