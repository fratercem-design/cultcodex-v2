
import Link from "next/link";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { CodexSigil } from "@/components/graphics/codex-sigil";
import { getCounts } from "@/lib/queries/stats";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 600;

export const metadata: Metadata = buildMetadata({
  title: "Media Kit",
  description:
    "Press and media resources for Cult of Psyche and CultCodex — what the show is, key facts, the archive at a glance, brand language, and contact.",
  path: "/media-kit",
});

const BOILERPLATE_SHORT =
  "Cult of Psyche is a live, unscripted internet show exploring tarot, consciousness, spirituality, open-panel debates, and the strange edges of human behavior. CultCodex is its complete searchable archive.";

const BOILERPLATE_LONG =
  "Cult of Psyche is a live streaming show that returned in October 2024 — unscripted open-panel conversations between a host and rotating guests, spanning tarot, consciousness, the occult, AI, psychology, and internet culture. CultCodex is the structured intelligence archive built on top of it: every transmission indexed, every recurring figure profiled, every pattern extracted, with an AI Oracle that answers questions from inside the full corpus. Together they form an ongoing, searchable mythology of an internet community.";

const BRAND_WORDS = [
  "Transmission (an episode)",
  "Signal (a topic/theme)",
  "The Codex (the archive)",
  "Initiate+ (membership)",
  "The Oracle (the AI layer)",
  "Psychenomicon (the myth-engine)",
];

const PALETTE = [
  { name: "Void", hex: "#040608" },
  { name: "Gold", hex: "#C8392E" },
  { name: "Cyan", hex: "#62E4C8" },
  { name: "Violet", hex: "#4A2D6E" },
  { name: "Crimson", hex: "#A94A4A" },
];

export default async function MediaKitPage() {
  const stats = await getCounts().catch(() => ({
    episodes: 0, segments: 0, people: 0, topics: 0,
    lore: 0, quotes: 0, totalHours: 0, transcribedEpisodes: 0, transcribedPct: 0,
  }));

  const FACTS = [
    { value: stats.episodes.toLocaleString("en-US") + "+", label: "Episodes archived" },
    { value: stats.totalHours.toLocaleString("en-US") + "+", label: "Hours of content" },
    { value: stats.people.toLocaleString("en-US"), label: "People profiled" },
    { value: stats.segments.toLocaleString("en-US"), label: "Transcript segments" },
    { value: stats.quotes.toLocaleString("en-US"), label: "Notable quotes" },
    { value: stats.lore.toLocaleString("en-US"), label: "Lore entries" },
  ];

  return (
    <>
      <PageHero
        title="MEDIA KIT"
        subtitle="Everything you need to write about the Psycheverse."
        backgroundImage="/hero-bg.jpg"
        label="press"
      />

      <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 space-y-14">

        {/* What it is */}
        <section className="space-y-4">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-gold-text/80">
            {"/// what_it_is"}
          </p>
          <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
            <div className="space-y-1.5">
              <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">One-liner</p>
              <p className="text-sm text-text-primary leading-relaxed">{BOILERPLATE_SHORT}</p>
            </div>
            <div className="space-y-1.5">
              <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">Full description</p>
              <p className="text-sm text-text-muted leading-relaxed">{BOILERPLATE_LONG}</p>
            </div>
          </div>
        </section>

        {/* Facts */}
        <section className="space-y-4">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-cyan/60">
            {"/// the_archive_at_a_glance"}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FACTS.map((f) => (
              <div key={f.label} className="rounded-lg border border-border bg-surface p-4 text-center">
                <p className="font-mono text-xl font-bold text-accent-gold-text">{f.value}</p>
                <p className="mt-1 font-mono text-[12px] text-text-muted">{f.label}</p>
              </div>
            ))}
          </div>
          <p className="font-mono text-[12px] text-text-muted text-center">
            Figures update live from the archive database.
          </p>
        </section>

        <MysticalDivider />

        {/* Brand */}
        <section className="space-y-5">
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-violet-text/70">
            {"/// brand_language"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
              <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">Names &amp; spelling</p>
              <ul className="space-y-1.5 font-mono text-[12px] text-text-muted">
                <li><span className="text-text-primary">Cult of Psyche</span> — the show</li>
                <li><span className="text-text-primary">CultCodex</span> — one word, the archive (cultcodex.me)</li>
                <li><span className="text-text-primary">Psycheverse</span> — the whole universe of the show</li>
                <li><span className="text-text-primary">Psyche</span> (also &ldquo;Trix&rdquo;) — the host. He/him.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
              <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">Signature terms</p>
              <ul className="space-y-1.5 font-mono text-[12px] text-text-muted">
                {BRAND_WORDS.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </div>
          </div>

          {/* Sigil + palette */}
          <div className="rounded-xl border border-border bg-surface p-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center gap-2 text-accent-gold-text">
              <CodexSigil size={72} glow />
              <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">The Codex sigil</p>
            </div>
            <div className="flex-1 space-y-2 w-full">
              <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">Palette</p>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 rounded border border-border px-2 py-1">
                    <span className="h-4 w-4 rounded-sm" style={{ backgroundColor: c.hex }} />
                    <span className="font-mono text-[12px] text-text-muted">{c.name} {c.hex}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <MysticalDivider />

        {/* Contact */}
        <section className="rounded-2xl border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-surface p-7 text-center space-y-4">
          <h2 className="font-display text-xl font-bold text-text-primary">Press &amp; collaboration</h2>
          <p className="font-mono text-[12px] text-text-muted max-w-md mx-auto leading-relaxed">
            For interviews, features, or collaboration inquiries, reach out through the show&apos;s
            channels or the about page. Watch a live stream to see the format firsthand.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/about" className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-3 font-mono text-sm font-bold text-accent-gold-text transition-all hover:bg-accent-gold/25">
              About &amp; contact →
            </Link>
            <Link href="/cult-live" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-mono text-xs text-text-muted transition-all hover:border-accent-gold/30 hover:text-text-primary">
              Watch live
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
