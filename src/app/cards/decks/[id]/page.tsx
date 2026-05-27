import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getDeckById, getUserCollection } from "@/lib/queries/cards";
import { DeckBuilder } from "./deck-builder";
import { redirect, notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  // getDeckById requires auth — use a minimal prisma fetch just for title
  const { prisma } = await import("@/lib/db");
  const deck = await prisma.deck.findUnique({
    where: { id },
    select: { name: true },
  });

  const name = deck?.name ?? "Deck Builder";
  return {
    title: `${name} — Deck Builder — CultCodex`,
    description: `Build and manage your "${name}" deck in the CultCodex card collection.`,
  };
}

export default async function DeckBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const { id } = await params;
  const [deck, collection] = await Promise.all([
    getDeckById(id, user.id),
    getUserCollection(user.id),
  ]);

  if (!deck) notFound();

  return <DeckBuilder deck={deck} collection={collection} />;
}
