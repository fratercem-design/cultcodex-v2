export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { ReadingApp } from "./reading-app";

export const metadata: Metadata = {
  title: "The Oracle — Draw a Reading — CultCodex",
  description:
    "Draw a divinatory reading from the CultCodex deck. Arcana, Archive, or Hybrid — tarot and archive cards in one spread. The card does not predict; it reveals.",
  alternates: { canonical: "/cards/reading" },
};

export default async function ReadingPage() {
  const user = await getCurrentUser().catch(() => null);
  return <ReadingApp signedIn={!!user} />;
}
