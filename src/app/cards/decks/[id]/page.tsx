import { getCurrentUser } from "@/lib/auth";
import { getDeckById, getUserCollection } from "@/lib/queries/cards";
import { DeckBuilder } from "./deck-builder";
import { redirect, notFound } from "next/navigation";

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
