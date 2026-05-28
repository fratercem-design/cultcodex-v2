import { prisma } from "@/lib/db";

export type Interest = "consciousness" | "ai" | "occult" | "behavior" | "wild";
export type Depth = "fresh" | "familiar" | "deep";
export type Intent = "episodes" | "people" | "oracle";

const INTEREST_KEYWORDS: Record<Interest, string[]> = {
  consciousness: ["consciousness", "non-duality", "psychedelics", "simulation", "ego", "awareness"],
  ai: ["artificial intelligence", "AI", "technology", "future", "transhumanism", "singularity"],
  occult: ["occult", "tarot", "alchemy", "hermeticism", "magick", "astrology"],
  behavior: ["narcissism", "psychology", "shadow", "relationships", "addiction", "trauma"],
  wild: ["chaos", "drama", "tribunal", "panel", "conflict"],
};

export const ORACLE_PROMPTS: Record<Interest, [string, string]> = {
  consciousness: [
    "What patterns repeat in Psyche's explorations of consciousness and ego death?",
    "What has the archive witnessed about the relationship between psychedelics and transformation?",
  ],
  ai: [
    "What does the archive reveal about AI, consciousness, and what's coming for us?",
    "How has the conversation about technology and the future evolved across the transmissions?",
  ],
  occult: [
    "What occult traditions does the archive return to most obsessively, and what does that reveal?",
    "What patterns emerge across the esoteric and magical discussions in thousands of transmissions?",
  ],
  behavior: [
    "What behavioral patterns does the archive document most relentlessly?",
    "What has the archive captured about narcissism and the people who embody it?",
  ],
  wild: [
    "What are the most pivotal chaotic moments the archive has witnessed?",
    "Who keeps appearing in the wildest transmissions and what does their presence reveal?",
  ],
};

export async function getPersonalizedGuide(interest: Interest, depth: Depth) {
  const keywords = INTEREST_KEYWORDS[interest];
  const [kw0, kw1, kw2] = keywords;

  const episodeOrderBy =
    depth === "fresh"
      ? { episodeNumber: "asc" as const }
      : { airDate: "desc" as const };

  const episodeSkip = depth === "deep" ? 5 : 0;

  const [episodes, people] = await Promise.all([
    prisma.episode.findMany({
      where: {
        status: "published",
        OR: [
          { title: { contains: kw0, mode: "insensitive" } },
          { summaryShort: { contains: kw0, mode: "insensitive" } },
          { summaryLong: { contains: kw0, mode: "insensitive" } },
          ...(kw1 ? [{ title: { contains: kw1, mode: "insensitive" as const } }] : []),
          ...(kw2 ? [{ summaryShort: { contains: kw2, mode: "insensitive" as const } }] : []),
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        episodeNumber: true,
        summaryShort: true,
        airDate: true,
        thumbnailUrl: true,
      },
      orderBy: episodeOrderBy,
      skip: episodeSkip,
      take: 5,
    }),
    prisma.person.findMany({
      where: {
        OR: [
          { searchText: { contains: kw0, mode: "insensitive" } },
          { shortBio: { contains: kw0, mode: "insensitive" } },
          { loreSummary: { contains: kw0, mode: "insensitive" } },
          ...(kw1 ? [{ searchText: { contains: kw1, mode: "insensitive" as const } }] : []),
        ],
      },
      select: {
        id: true,
        displayName: true,
        slug: true,
        shortBio: true,
        avatarUrl: true,
      },
      take: 3,
    }),
  ]);

  return {
    episodes,
    people,
    oraclePrompts: ORACLE_PROMPTS[interest],
  };
}

export type PersonalizedGuide = Awaited<ReturnType<typeof getPersonalizedGuide>>;
