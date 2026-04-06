import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const p = getPrisma();
  
  // Get Alexander/Alexandra cluster
  const alexCluster = await p.person.findMany({
    where: { OR: [
      { slug: { startsWith: "alexander" } },
      { slug: { startsWith: "alexandra" } },
      { slug: { startsWith: "alexandria" } },
      { slug: { contains: "mcqueen" } },
      { slug: { contains: "mayers" } },
      { slug: { contains: "mayors" } },
      { slug: { contains: "meyer" } },
      { slug: { contains: "myers" } },
      { slug: { contains: "monica-foster" } },
    ]},
    select: {
      id: true, displayName: true, slug: true, personType: true,
      _count: { select: { guestAppearances: true, quotes: true } },
    },
    orderBy: { slug: "asc" },
  });

  console.log("=== ALEXANDER / ALEXANDRA CLUSTER ===");
  console.log(alexCluster.length, "records\n");
  for (const person of alexCluster) {
    console.log("  " + person.slug + " | " + person.displayName + " | " + person.personType + " | " + person._count.guestAppearances + " eps | " + person._count.quotes + " quotes");
  }

  // Get Alisa cluster
  const alisaCluster = await p.person.findMany({
    where: { OR: [
      { slug: { startsWith: "alisa" } },
      { slug: { startsWith: "lisa-" } },
      { slug: { contains: "jordana" } },
      { slug: { contains: "jordan" } },
    ]},
    select: {
      id: true, displayName: true, slug: true, personType: true,
      _count: { select: { guestAppearances: true, quotes: true } },
    },
    orderBy: { slug: "asc" },
  });

  console.log("\n=== ALISA / LISA CLUSTER ===");
  for (const person of alisaCluster) {
    console.log("  " + person.slug + " | " + person.displayName + " | " + person.personType + " | " + person._count.guestAppearances + " eps | " + person._count.quotes + " quotes");
  }

  // Get ThingThatIs cluster
  const thingCluster = await p.person.findMany({
    where: { slug: { contains: "thing" } },
    select: {
      id: true, displayName: true, slug: true, personType: true,
      _count: { select: { guestAppearances: true, quotes: true } },
    },
  });

  console.log("\n=== THING THAT IS CLUSTER ===");
  for (const person of thingCluster) {
    console.log("  " + person.slug + " | " + person.displayName + " | " + person.personType + " | " + person._count.guestAppearances + " eps | " + person._count.quotes + " quotes");
  }

  // Beeta cluster
  const beetaCluster = await p.person.findMany({
    where: { OR: [
      { slug: { contains: "beeta" } },
      { slug: { contains: "beta" } },
      { slug: { startsWith: "bt" } },
    ]},
    select: {
      id: true, displayName: true, slug: true, personType: true,
      _count: { select: { guestAppearances: true, quotes: true } },
    },
  });

  console.log("\n=== BEETA / BETA CLUSTER ===");
  for (const person of beetaCluster) {
    console.log("  " + person.slug + " | " + person.displayName + " | " + person.personType + " | " + person._count.guestAppearances + " eps | " + person._count.quotes + " quotes");
  }

  // Canada Dry cluster
  const cdCluster = await p.person.findMany({
    where: { slug: { contains: "canada" } },
    select: {
      id: true, displayName: true, slug: true, personType: true,
      _count: { select: { guestAppearances: true, quotes: true } },
    },
  });

  console.log("\n=== CANADA DRY CLUSTER ===");
  for (const person of cdCluster) {
    console.log("  " + person.slug + " | " + person.displayName + " | " + person.personType + " | " + person._count.guestAppearances + " eps | " + person._count.quotes + " quotes");
  }

  // Sam / Sam Man cluster  
  const samCluster = await p.person.findMany({
    where: { OR: [
      { slug: { in: ["sam", "sam-man", "samman"] } },
      { slug: { startsWith: "sam-" } },
    ]},
    select: {
      id: true, displayName: true, slug: true, personType: true,
      _count: { select: { guestAppearances: true, quotes: true } },
    },
  });

  console.log("\n=== SAM CLUSTER ===");
  for (const person of samCluster) {
    console.log("  " + person.slug + " | " + person.displayName + " | " + person.personType + " | " + person._count.guestAppearances + " eps | " + person._count.quotes + " quotes");
  }

  // People with 0 episodes (orphans)
  const orphans = await p.person.count({
    where: { guestAppearances: { none: {} } },
  });
  console.log("\n=== ORPHAN PEOPLE (0 episodes) ===");
  console.log("Count:", orphans);

  await disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
