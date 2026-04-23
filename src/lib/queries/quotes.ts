import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export function buildQuoteInclude() {
  return {
    speaker: true,
    episode: true,
  } satisfies Prisma.QuoteInclude;
}

export type QuoteWithRelations = Prisma.QuoteGetPayload<{
  include: ReturnType<typeof buildQuoteInclude>;
}>;

export async function getQuotes(options?: {
  speakerSlug?: string;
  search?: string;
  take?: number;
  skip?: number;
}) {
  const { speakerSlug, search, take = 24, skip = 0 } = options ?? {};

  const where: Prisma.QuoteWhereInput = {};
  if (speakerSlug) {
    where.speaker = { slug: speakerSlug };
  }
  if (search) {
    where.text = { contains: search, mode: "insensitive" };
  }

  return prisma.quote.findMany({
    where,
    include: buildQuoteInclude(),
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });
}

export async function getQuoteCount(options?: {
  speakerSlug?: string;
  search?: string;
}) {
  const { speakerSlug, search } = options ?? {};

  const where: Prisma.QuoteWhereInput = {};
  if (speakerSlug) {
    where.speaker = { slug: speakerSlug };
  }
  if (search) {
    where.text = { contains: search, mode: "insensitive" };
  }

  return prisma.quote.count({ where });
}

/** Get top speakers by quote count for the filter sidebar */
export async function getTopSpeakers(limit = 20) {
  const speakers = await prisma.person.findMany({
    where: {
      quotes: { some: {} },
    },
    select: {
      slug: true,
      displayName: true,
      avatarUrl: true,
      personType: true,
      _count: { select: { quotes: true } },
    },
    orderBy: {
      quotes: { _count: "desc" },
    },
    take: limit,
  });

  return speakers.map((s) => ({
    slug: s.slug,
    displayName: s.displayName,
    avatarUrl: s.avatarUrl,
    personType: s.personType,
    quoteCount: s._count.quotes,
  }));
}
