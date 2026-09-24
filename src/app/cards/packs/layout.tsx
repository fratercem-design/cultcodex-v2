import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Open Card Packs — CultCodex",
  description:
    "Spend your Signal Credits to open card packs and collect archetypes, voices, lore, and transmissions from the Cult of Psyche archive.",
  openGraph: {
    title: "Open Card Packs — CultCodex",
    description:
      "Spend Signal Credits on card packs from the Cult of Psyche archive.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Card Packs — CultCodex",
  },
};

export default function PacksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
