import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Codex Tarot — Waitlist — CultCodex",
  description:
    "A tarot deck drawn from the archetypes of the Cult of Psyche. The Oracle, The Cipher, The Manipulator — every card built from real transmissions. Join the waitlist.",
  openGraph: {
    title: "Codex Tarot — Waitlist",
    description:
      "A tarot deck built from the archetypes of the Cult of Psyche archive. Join the waitlist.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Codex Tarot — Waitlist",
    description:
      "A tarot deck built from the archetypes of the Cult of Psyche archive.",
  },
};

export default function TarotLayout({ children }: { children: React.ReactNode }) {
  return children;
}
