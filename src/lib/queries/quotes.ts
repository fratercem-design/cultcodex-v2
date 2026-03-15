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
  take?: number;
  skip?: number;
}) {
  const { speakerSlug, take = 24, skip = 0 } = options ?? {};

  return prisma.quote.findMany({
    where: speakerSlug
      ? { speaker: { slug: speakerSlug } }
      : undefined,
    include: buildQuoteInclude(),
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });
}

export async function getQuoteCount(speakerSlug?: string) {
  return prisma.quote.count({
    where: speakerSlug
      ? { speaker: { slug: speakerSlug } }
      : undefined,
  });
}
