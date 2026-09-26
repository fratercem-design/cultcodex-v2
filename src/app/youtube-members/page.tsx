import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { buildMetadata } from "@/lib/seo";

// YouTube channel memberships on @cultofpsyche. Separate from Initiate+ / Oracle
// (CultCodex's own Stripe tiers, /premium): these are billed and delivered by
// YouTube, so every join button goes to the channel's join page.
const JOIN_URL = "https://www.youtube.com/@cultofpsyche/join";

export const metadata: Metadata = buildMetadata({
  title: "YouTube Channel Membership",
  description:
    "Join the Cult of Psyche on YouTube for $5 or $10 a month: a loyalty badge, custom member emojis, members-only chat, and priority for open-panel spots.",
  path: "/youtube-members",
});

// Every member gets every emoji. Order is display order.
const EMOJIS = [
  { src: "/images/youtube-members/angel-cat.webp", name: "Angel Cat" },
  { src: "/images/youtube-members/laughing-moon.webp", name: "Laughing Moon" },
  { src: "/images/youtube-members/tarot.webp", name: "Tarot" },
  { src: "/images/youtube-members/cosmic-egg.webp", name: "Cosmic Egg" },
  { src: "/images/youtube-members/seal.webp", name: "Seal of Approval" },
  { src: "/images/youtube-members/heart-butterfly.webp", name: "Heart Butterfly" },
  { src: "/images/youtube-members/third-eye-kitten.webp", name: "Third-Eye Kitten" },
  { src: "/images/youtube-members/witch-moon.webp", name: "Witch Moon" },
  { src: "/images/youtube-members/sacred-heart.webp", name: "Sacred Heart" },
  { src: "/images/youtube-members/moon-moth.webp", name: "Moon Moth" },
];

const TIERS = [
  {
    price: 5,
    name: "Initiate",
    accent: "gold",
    perks: [
      "Loyalty badge next to your name in chat",
      `All ${EMOJIS.length} member emojis in chat and comments`,
      "Keep your voice when chat goes members-only",
    ],
  },
  {
    price: 10,
    name: "Adept",
    accent: "violet",
    perks: [
      "Everything in Initiate",
      "Priority for open-panel spots on the live show",
    ],
  },
] as const;

export default function YouTubeMembersPage() {
  return (
    <>
      <PageHero
        title="JOIN ON YOUTUBE"
        subtitle="Cult of Psyche channel memberships: $5 or $10 a month"
        backgroundImage="/hero-bg.jpg"
        label="members"
      />

      <main id="main-content" className="mx-auto max-w-5xl space-y-16 px-4 py-12">
        {/* Emojis first: they are the thing people want to see. */}
        <section aria-labelledby="emoji-heading" className="space-y-6 text-center">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-cyan/60">
            {"/// member_emojis"}
          </p>
          <h2 id="emoji-heading" className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
            Say it in the chat the way only members can
          </h2>
          <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
            {EMOJIS.map((e) => (
              <li key={e.name} className="flex flex-col items-center gap-3">
                <div className="relative aspect-square w-full max-w-[180px]">
                  <Image
                    src={e.src}
                    alt={`${e.name} member emoji`}
                    fill
                    sizes="(max-width: 640px) 45vw, 180px"
                    className="object-contain drop-shadow-[0_6px_18px_rgba(110,75,174,0.35)] transition-transform duration-200 hover:scale-105"
                  />
                </div>
                <p className="font-mono text-[12px] uppercase tracking-widest text-text-muted">{e.name}</p>
              </li>
            ))}
          </ul>
        </section>

        <MysticalDivider />

        <section aria-labelledby="tiers-heading" className="space-y-6">
          <h2 id="tiers-heading" className="text-center font-display text-2xl font-bold text-text-primary">
            Monthly membership
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {TIERS.map((t) => {
              const gold = t.accent === "gold";
              return (
                <div
                  key={t.name}
                  className={`flex flex-col rounded-xl border bg-surface p-6 ${gold ? "border-accent-gold/40" : "border-accent-violet/50"}`}
                >
                  <p className={`font-mono text-[12px] uppercase tracking-[0.12em] ${gold ? "text-accent-gold-text" : "text-accent-violet-text"}`}>
                    {t.name}
                  </p>
                  <p className="mt-2 font-display text-4xl font-bold text-text-primary">
                    ${t.price}
                    <span className="text-base font-normal text-text-muted"> / month</span>
                  </p>
                  <ul className="mt-5 flex-1 space-y-2 text-sm leading-relaxed text-text-muted">
                    {t.perks.map((p) => (
                      <li key={p} className="flex gap-2">
                        <span aria-hidden="true" className={gold ? "text-accent-gold-text" : "text-accent-violet-text"}>◆</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={JOIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border px-6 font-mono text-sm font-bold transition-colors ${
                      gold
                        ? "border-accent-gold bg-accent-gold/15 text-accent-gold-text hover:bg-accent-gold/25"
                        : "border-accent-violet bg-accent-violet/15 text-accent-violet-text hover:bg-accent-violet/25"
                    }`}
                  >
                    Join for ${t.price}/month on YouTube →
                  </a>
                </div>
              );
            })}
          </div>
          <p className="mx-auto max-w-2xl text-center font-mono text-[12px] leading-relaxed text-text-muted">
            Memberships are billed and managed by YouTube, which may show the price in your local
            currency. Cancel any time from your YouTube purchases page. This is separate from{" "}
            <Link href="/premium" className="text-accent-gold-text hover:underline">Initiate+</Link>, the
            CultCodex archive membership.
          </p>
        </section>
      </main>
    </>
  );
}
