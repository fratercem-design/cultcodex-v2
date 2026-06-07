export const dynamic = "force-dynamic";

import { getCurrentUser } from "@/lib/auth";
import { getUserDecks } from "@/lib/queries/cards";
import { DecksList } from "./decks-list";
import { redirect } from "next/navigation";

export const metadata = {
  alternates: { canonical: "/cards/decks" },
  title: "Signal Arrays — CultCodex",
  description: "Build and manage your curated card arrays.",
};

export default async function DecksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const decks = await getUserDecks(user.id);

  return <DecksList decks={decks} />;
}
