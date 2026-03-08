import { prisma } from "@/lib/db";
import type { Prisma, PersonType } from "@/generated/prisma/client";

export function buildPersonInclude() {
  return {
    firstAppearanceEpisode: true,
    guestAppearances: { include: { episode: true } },
    mentions: { include: { episode: true } },
    topics: { include: { topic: true } },
    loreConnections: { include: { loreEntry: true } },
    quotes: { include: { episode: true } },
  } satisfies Prisma.PersonInclude;
}

export async function getPeople(options?: {
  type?: PersonType;
  take?: number;
  skip?: number;
}) {
  const { type, take = 50, skip = 0 } = options ?? {};

  return prisma.person.findMany({
    where: type ? { personType: type } : undefined,
    include: buildPersonInclude(),
    orderBy: { displayName: "asc" },
    take,
    skip,
  });
}

export async function getPersonBySlug(slug: string) {
  return prisma.person.findUnique({
    where: { slug },
    include: buildPersonInclude(),
  });
}
