import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/tarot/oracle" },
  title: "Arcanum Oracle — Cult of Psyche Tarot — CultCodex",
  description:
    "Pull a reading from the Cult of Psyche archive. 80 cards across Major Arcana, Signals, Mirrors, Relics, and Glitches. Single signal, triad, or full protocol spreads.",
  openGraph: {
    title: "Arcanum Oracle — Cult of Psyche Tarot",
    description:
      "Pull a reading from the Cult of Psyche archive. 80 cards, every transmission drawn from the codex.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Arcanum Oracle — Cult of Psyche Tarot",
    description:
      "Pull a reading from the Cult of Psyche archive. 80 cards, every transmission drawn from the codex.",
  },
};

export default function OracleLayout({ children }: { children: React.ReactNode }) {
  return children;
}
