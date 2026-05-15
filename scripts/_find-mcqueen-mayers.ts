import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

(async () => {
  const p = getPrisma();
  const m = await p.person.findMany({
    where: {
      OR: [
        { displayName: { contains: "mayer", mode: "insensitive" } },
        { displayName: { contains: "alexandra", mode: "insensitive" } },
        { displayName: { contains: "neon priestess", mode: "insensitive" } },
        { displayName: { contains: "monica peters", mode: "insensitive" } },
        { slug: { contains: "mayer" } },
        { slug: { contains: "alexandra" } },
        { slug: { contains: "neon" } },
      ],
    },
    select: {
      id: true,
      displayName: true,
      slug: true,
      personType: true,
      shortBio: true,
      _count: { select: { guestAppearances: true, quotes: true } },
    },
    orderBy: { displayName: "asc" },
  });
  console.log("FOUND", m.length);
  for (const r of m) console.log(JSON.stringify(r));
  await disconnect();
})();
