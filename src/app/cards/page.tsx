export const dynamic = "force-dynamic";

import { getCurrentUser } from "@/lib/auth";
import { getUserCollection, getUserCollectionStats } from "@/lib/queries/cards";
import { CollectionView } from "./collection-view";

export const metadata = {
  alternates: { canonical: "/cards" },
  title: "Card Collection — CultCodex",
  description: "Your Codex trading card collection.",
};

export default async function CardsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div style={{ padding: "48px 28px", maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
        <p style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 10,
          color: "var(--neon)",
          letterSpacing: "0.4em",
          textShadow: "var(--glow-neon)",
          marginBottom: 16,
        }}>
          {"// ACCESS_REQUIRED"}
        </p>
        <h1 style={{ fontFamily: "var(--font-mono), monospace", fontSize: 20, color: "var(--term-fg)", marginBottom: 12 }}>
          Sign in to collect cards
        </h1>
        <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--term-fg-dim)", marginBottom: 24, lineHeight: 1.7 }}>
          Build your Codex collection, open signal packs, and track every voice and transmission in the archive.
        </p>
        <a href="/auth/signin" style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11,
          letterSpacing: "0.12em",
          color: "var(--neon)",
          border: "1px solid var(--neon)",
          borderRadius: 4,
          padding: "8px 20px",
          textDecoration: "none",
          textShadow: "var(--glow-neon)",
        }}>
          SIGN IN →
        </a>
      </div>
    );
  }

  const [collection, stats] = await Promise.all([
    getUserCollection(user.id),
    getUserCollectionStats(user.id),
  ]);

  return <CollectionView collection={collection} stats={stats} />;
}
