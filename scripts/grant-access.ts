#!/usr/bin/env npx tsx
/**
 * Grant lifetime system-tier (Architect) access to a user by email or name.
 *
 * Usage:
 *   npx dotenvx run -- npx tsx scripts/grant-access.ts --email user@example.com
 *   npx dotenvx run -- npx tsx scripts/grant-access.ts --name "Alexandra Mayers"
 *   npx dotenvx run -- npx tsx scripts/grant-access.ts --list   # list all users
 */

import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();
  const args = process.argv.slice(2);
  const emailIdx = args.indexOf("--email");
  const nameIdx = args.indexOf("--name");
  const list = args.includes("--list");

  if (list) {
    const users = await prisma.codexUser.findMany({
      select: { id: true, email: true, name: true, subscriptionTier: true, subscriptionStatus: true, isLifetimeMember: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    console.table(users);
    await disconnect();
    return;
  }

  let user = null;

  if (emailIdx !== -1 && args[emailIdx + 1]) {
    const email = args[emailIdx + 1];
    user = await prisma.codexUser.findUnique({ where: { email } });
    if (!user) {
      console.error(`No user found with email: ${email}`);
      await disconnect();
      process.exit(1);
    }
  } else if (nameIdx !== -1 && args[nameIdx + 1]) {
    const name = args[nameIdx + 1];
    const matches = await prisma.codexUser.findMany({
      where: { name: { contains: name, mode: "insensitive" } },
    });
    if (matches.length === 0) {
      console.error(`No user found matching name: "${name}"`);
      await disconnect();
      process.exit(1);
    }
    if (matches.length > 1) {
      console.log(`Multiple matches for "${name}" — use --email to be precise:`);
      console.table(matches.map(u => ({ id: u.id, email: u.email, name: u.name })));
      await disconnect();
      process.exit(1);
    }
    user = matches[0];
  } else {
    console.log("Usage:");
    console.log("  npx dotenvx run -- npx tsx scripts/grant-access.ts --email user@example.com");
    console.log("  npx dotenvx run -- npx tsx scripts/grant-access.ts --name \"Full Name\"");
    console.log("  npx dotenvx run -- npx tsx scripts/grant-access.ts --list");
    await disconnect();
    process.exit(1);
  }

  console.log(`Granting Architect (system) lifetime access to: ${user.email} (${user.name ?? "no name"})`);

  await prisma.codexUser.update({
    where: { id: user.id },
    data: {
      isLifetimeMember: true,
      subscriptionStatus: "active",
      subscriptionTier: "system",
      currentPeriodEnd: new Date("2099-01-01"),
      isPublicMember: true,
    },
  });

  console.log("Done. User now has lifetime Architect (system) access.");
  await disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
