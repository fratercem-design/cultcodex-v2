import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Welcome, Initiate — CULT CODEX",
  description: "You're in. The archive is now a tool you can use.",
  path: "/welcome/initiate",
});

const BENEFITS = [
  {
    icon: "📜",
    title: "Full Transcripts",
    body: "Every word spoken — searchable, timestamped, and linked directly to the video. Click any line to jump to that exact moment.",
  },
  {
    icon: "🧠",
    title: "Decode Mode",
    body: "AI psychological breakdowns of every panel. Behavior patterns, conflict dynamics, manipulation tactics — named and mapped.",
  },
  {
    icon: "🔍",
    title: "Advanced Search",
    body: "Search by archetype, behavioral pattern, or conflict type across the entire archive. Find every time a tactic was used.",
  },
  {
    icon: "⚡",
    title: "Key Moments Timeline",
    body: "Every episode has a curated Key Moments strip — the peaks, turns, and revelations — so you can navigate without rewatching.",
  },
  {
    icon: "📚",
    title: "Personal Codex",
    body: "Save episodes, quotes, and signals. Build your own reference layer inside the archive. Your intelligence file, not ours.",
  },
  {
    icon: "🎭",
    title: "Members-Only Playlists",
    body: "Curated sequences you can't build from the public archive. Thematic runs. Guest arcs. Pattern threads.",
  },
];

const STARTING_POINTS = [
  { label: "Browse the full episode archive", href: "/episodes" },
  { label: "Explore topics and signals", href: "/topics" },
  { label: "Search the transcripts", href: "/search" },
  { label: "Read the lore", href: "/lore" },
  { label: "View member profiles", href: "/members" },
];

export default function WelcomeInitiatePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 space-y-16">

      {/* ── Hero ── */}
      <section className="text-center space-y-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-accent-gold-text/60">
          ✦ &nbsp; transmission confirmed &nbsp; ✦
        </p>
        <h1
          className="font-serif text-4xl sm:text-5xl font-black text-accent-gold"
          style={{ textShadow: "0 0 30px rgba(200, 57, 46,0.35)" }}
        >
          Welcome, Initiate.
        </h1>
        <p className="font-mono text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
          You&rsquo;re no longer watching from the outside. The archive is now a tool —
          and you know how to use it.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/episodes"
            className="rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-2.5 font-mono text-xs font-bold text-accent-gold-text transition-all hover:bg-accent-gold/25"
          >
            Enter the Archive →
          </Link>
          <Link
            href="/search"
            className="rounded-lg border border-border bg-surface px-6 py-2.5 font-mono text-xs text-text-muted transition-all hover:border-accent-gold/40 hover:text-text-primary"
          >
            Search Transcripts
          </Link>
        </div>
      </section>

      <MysticalDivider />

      {/* ── What just opened ── */}
      <section className="space-y-6">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold-text/60">
          {"/// what just opened"}
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-accent-gold/15 bg-surface p-5 space-y-2.5 transition-colors hover:border-accent-gold/30"
            >
              <span className="text-2xl">{b.icon}</span>
              <h3 className="font-display text-sm font-bold text-accent-gold-text">{b.title}</h3>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <MysticalDivider />

      {/* ── Where to go first ── */}
      <section className="max-w-2xl mx-auto space-y-5">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/60">
          {"/// where to go first"}
        </p>
        <div className="space-y-2">
          {STARTING_POINTS.map((s, i) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-3.5 transition-all hover:border-accent-gold/40 hover:bg-accent-gold/5 group"
            >
              <span className="font-mono text-lg font-bold text-accent-gold-text/25 w-6 flex-shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-sm text-text-muted group-hover:text-accent-gold-text transition-colors">
                {s.label}
              </span>
              <span className="ml-auto font-mono text-[11px] text-accent-gold-text opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Upgrade tease ── */}
      <section className="rounded-2xl border border-accent-violet/20 bg-gradient-to-b from-accent-violet/5 to-surface p-8 text-center space-y-4 max-w-2xl mx-auto">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-violet-text/60">
          {"/// when you&apos;re ready to go deeper"}
        </p>
        <h3 className="font-display text-xl font-bold text-accent-violet-text">Oracle Tier</h3>
        <p className="font-mono text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
          A personal codex page. Votes on future guests. Red Room Sessions. A named role in the archive.
          $25/month — when you&rsquo;re ready to stop watching and start shaping it.
        </p>
        <Link
          href="/premium#system"
          className="inline-flex items-center gap-2 rounded-lg border border-accent-violet/40 bg-accent-violet/10 px-5 py-2 font-mono text-xs text-accent-violet-text transition-all hover:bg-accent-violet/20"
        >
          See what Oracle opens →
        </Link>
      </section>

    </main>
  );
}
