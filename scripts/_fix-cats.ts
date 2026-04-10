import { getPrisma, disconnect } from "./ingest/lib";

async function main() {
  const prisma = getPrisma();

  // 1. Check current state of psyches-cats
  const cats = await prisma.person.findUnique({
    where: { slug: "psyches-cats" },
    select: { id: true, displayName: true, altNames: true, shortBio: true },
  });
  console.log("Current cats record:", JSON.stringify(cats, null, 2));

  if (!cats) {
    console.log("psyches-cats not found!");
    await disconnect();
    return;
  }

  // 2. Fix: remove Pie, Mr. Kitty, Mr. Trix from altNames — they are NOT cats
  // Correct cats: Trix, Lanore, Lola, Old Man Rudy
  const badAltNames = ["Pie", "Mr. Kitty", "Mr. Trix", "Lenore/Pie/Mr. Kitty", "Lenore", "Psyche's Cat"];
  const cleanedAltNames = cats.altNames.filter(
    (a: string) => !badAltNames.includes(a)
  );

  // Add correct cat names
  const correctAltNames = new Set([
    ...cleanedAltNames,
    "Trix",
    "Lanore",
    "Lola",
    "Old Man Rudy",
  ]);
  correctAltNames.delete(cats.displayName);

  await prisma.person.update({
    where: { slug: "psyches-cats" },
    data: {
      displayName: "Psyche's Cats",
      altNames: [...correctAltNames],
      shortBio: "Psyche's cats: Trix, Lanore, Lola, and Old Man Rudy",
    },
  });

  console.log("\nUpdated psyches-cats:");
  console.log("  altNames:", [...correctAltNames]);
  console.log("  bio: Psyche's cats: Trix, Lanore, Lola, and Old Man Rudy");

  // 3. Check if "pie" person exists separately (Pi/Pie is a person, not a cat)
  const pie = await prisma.person.findUnique({ where: { slug: "pie" } });
  console.log("\npie person record:", pie ? pie.displayName : "NOT FOUND");
  
  const pieP = await prisma.person.findUnique({ where: { slug: "pie-p" } });
  console.log("pie-p person record:", pieP ? pieP.displayName : "NOT FOUND");

  const piranhaPie = await prisma.person.findUnique({ where: { slug: "piranha-pie" } });
  console.log("piranha-pie person record:", piranhaPie ? piranhaPie.displayName : "NOT FOUND");

  const piPie = await prisma.person.findUnique({ where: { slug: "pi-pie" } });
  console.log("pi-pie person record:", piPie ? piPie.displayName : "NOT FOUND");

  // 4. Check Lenor (person, not the cat Lanore)
  const lenor = await prisma.person.findUnique({ where: { slug: "lenor" } });
  console.log("\nlenor person record:", lenor ? `${lenor.displayName} (altNames: ${lenor.altNames})` : "NOT FOUND");

  await disconnect();
}
main();
