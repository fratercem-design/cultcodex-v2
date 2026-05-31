"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { grantStarterCard } from "@/lib/queries/cards";
import { getArchetype } from "@/lib/archetypes";

const SIGILS = [
  "⊕","⊗","⊘","⊙","⊛","⊚","◈","◎","◉","◐",
  "◑","◒","◓","☿","♆","♇","⚶","⚷","⚸","⚺",
  "✦","✧","✶","✷","✸","✹",
];

function computeSigil(handle: string): string {
  let sum = 0;
  for (let i = 0; i < handle.length; i++) sum += handle.charCodeAt(i);
  return SIGILS[sum % SIGILS.length];
}

const VIBE_ARCHETYPE: Record<string, string> = {
  consciousness: "oracle",
  synthetic: "architect",
  esoteric: "alchemist",
  human: "mirror-walker",
  unknown: "trickster",
};

const VIBE_CARD_TYPES: Record<string, string> = {
  consciousness: "SIGNAL",
  synthetic: "CIPHER",
  esoteric: "LORE",
  human: "VOICE",
  unknown: "ORACLE",
};

const VIBE_TOPIC_KEYWORDS: Record<string, string> = {
  consciousness: "consciousness",
  synthetic: "ai",
  esoteric: "occult",
  human: "psychology",
  unknown: "mystery",
};

export type OnboardingResult =
  | { error: string }
  | {
      success: true;
      sigilGlyph: string;
      handle: string;
      starterCard: { title: string; cardType: string; rarity: string } | null;
      firstEpisode: {
        slug: string;
        title: string;
        thumbnailUrl: string | null;
        summaryShort: string | null;
        episodeNumber: number | null;
      } | null;
      archetype: { slug: string; name: string; glyph: string; color: string; summary: string } | null;
    };

export async function completeOnboarding(data: {
  handle: string;
  vibeChoice: string;
  firstQuestion: string;
}): Promise<OnboardingResult> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };

  const handle = data.handle.toLowerCase().trim();
  const { vibeChoice, firstQuestion } = data;

  if (!/^[a-z0-9_]{2,20}$/.test(handle)) {
    return { error: "Handle must be 2–20 characters: lowercase letters, numbers, underscores only" };
  }

  // Check handle uniqueness (allow the user to re-use their own if retrying)
  const conflict = await prisma.codexUser.findUnique({
    where: { handle },
    select: { id: true },
  });
  if (conflict && conflict.id !== user.id) {
    return { error: "That handle is already taken — choose another" };
  }

  const sigil = computeSigil(handle);
  const cardType = VIBE_CARD_TYPES[vibeChoice] ?? "SIGNAL";
  const topicKeyword = VIBE_TOPIC_KEYWORDS[vibeChoice] ?? "";
  const archetypeSlug = VIBE_ARCHETYPE[vibeChoice] ?? null;
  const archetypeData = archetypeSlug ? (getArchetype(archetypeSlug) ?? null) : null;

  const [starterCard, episode] = await Promise.all([
    grantStarterCard(user.id, cardType),
    prisma.episode
      .findFirst({
        where: {
          status: "published",
          ...(topicKeyword
            ? { topics: { some: { topic: { title: { contains: topicKeyword, mode: "insensitive" } } } } }
            : {}),
        },
        orderBy: { airDate: "desc" },
        select: { slug: true, title: true, thumbnailUrl: true, summaryShort: true, episodeNumber: true },
      })
      .then(
        (ep) =>
          ep ??
          prisma.episode.findFirst({
            where: { status: "published" },
            orderBy: { airDate: "desc" },
            select: { slug: true, title: true, thumbnailUrl: true, summaryShort: true, episodeNumber: true },
          })
      ),
  ]);

  // Persist — bio holds their first question as a seed for later Oracle use
  await prisma.codexUser.update({
    where: { id: user.id },
    data: {
      handle,
      sigilGlyph: sigil,
      onboardingCompleted: true,
      bio: firstQuestion || undefined,
      userArchetype: archetypeSlug ?? undefined,
    },
  });

  return {
    success: true,
    sigilGlyph: sigil,
    handle,
    starterCard: starterCard
      ? { title: starterCard.title, cardType: starterCard.cardType, rarity: starterCard.rarity }
      : null,
    firstEpisode: episode ?? null,
    archetype: archetypeData
      ? { slug: archetypeData.slug, name: archetypeData.name, glyph: archetypeData.glyph, color: archetypeData.color, summary: archetypeData.summary }
      : null,
  };
}
