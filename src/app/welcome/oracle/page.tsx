import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "Welcome, Oracle — CULT CODEX",
  description: "You are inside the system now. Not just watching it.",
  path: "/welcome/oracle",
});

const ORACLE_BENEFITS = [
  {
    icon: "🌐",
    title: "Personal Codex Page",
    body: "A permanent page in the archive under your name. Public or private — your call. Your own place in the Psycheverse.",
  },
  {
    icon: "🗳️",
    title: "Vote on Future Guests & Topics",
    body: "Your signal shapes the archive. Vote on who gets analyzed next, which topics get deep-dived, and what experiments run.",
  },
  {
    icon: "📋",
    title: "Submit Investigations",
    body: "Flag a guest, a pattern, or a behavioral thread. Submit it for structured analysis. You decide what gets examined.",
  },
  {
    icon: "🔴",
    title: "Red Room Sessions",
    body: "No-filter analysis. Nothing held back. Raw unedited segments and behind-the-scenes breakdowns not available anywhere else.",
  },
  {
    icon: "🕸️",
    title: "Relationship Map",
    body: "A visual graph of every person, topic, and conflict in the archive. See the web of connections across 1,000+ episodes.",
  },
  {
    icon: "🧬",
    title: "Guest Intelligence Files",
    body: "Deep behavioral profiles for every recurring guest. Patterns, tactics, psychological signatures — built across their full archive run.",
  },
  {
    icon: "👁️",
    title: "Named Oracle Role",
    body: "You hold a role in the system — Oracle, Architect, or Watcher. Named. Listed as a contributor to the Codex.",
  },
  {
    icon: "📜",
    title: "Everything in Initiate+",
    body: "Full transcripts, Decode Mode, advanced search, Key Moments, personal Codex, and curated playlists — all included.",
  },
];

const STARTING_POINTS = [
  { label: "Set up your personal codex page", href: "/settings/profile" },
  { label: "Browse the full episode archive", href: "/episodes" },
  { label: "Explore the Psychenomicon", href: "/psychenomicon" },
  { label: "View the members roll", href: "/members" },
  { label: "Search transcripts by archetype", href: "/search" },
];

export default function WelcomeOraclePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 space-y-16">

      {/* ── Hero ── */}
      <section className="text-center space-y-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-accent-violet/60">
          ✦ &nbsp; you are inside now &nbsp; ✦
        </p>
        <h1
          className="font-serif text-4xl sm:text-5xl font-black text-accent-violet"
          style={{ textShadow: "0 0 30px rgba(139,92,246,0.4), 0 0 60px rgba(139,92,246,0.2)" }}
        >
          Welcome, Oracle.
        </h1>
        <p className="font-mono text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
          You&rsquo;re not watching the system anymore.
          You&rsquo;re inside it — and your signal shapes what happens next.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/settings/profile"
            className="rounded-lg border border-accent-violet bg-accent-violet/15 px-6 py-2.5 font-mono text-xs font-bold text-accent-violet transition-all hover:bg-accent-violet/25"
          >
            Set Up Your Codex Page →
          </Link>
          <Link
            href="/episodes"
            className="rounded-lg border border-border bg-surface px-6 py-2.5 font-mono text-xs text-text-muted transition-all hover:border-accent-violet/40 hover:text-text-primary"
          >
            Enter the Archive
          </Link>
        </div>
      </section>

      <MysticalDivider />

      {/* ── What just opened ── */}
      <section className="space-y-6">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-accent-violet/60">
          /// what just opened
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ORACLE_BENEFITS.map((b) => (
            <div
              key={b.title}
              className="rounded-xl border border-accent-violet/15 bg-surface p-5 space-y-2.5 transition-colors hover:border-accent-violet/30"
            >
              <span className="text-2xl">{b.icon}</span>
              <h3 className="font-display text-sm font-bold text-accent-violet">{b.title}</h3>
              <p className="font-mono text-[11px] text-text-muted leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      <MysticalDivider />

      {/* ── Where to go first ── */}
      <section className="max-w-2xl mx-auto space-y-5">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/60">
          /// where to go first
        </p>
        <div className="space-y-2">
          {STARTING_POINTS.map((s, i) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-4 rounded-xl border border-border bg-surface px-5 py-3.5 transition-all hover:border-accent-violet/40 hover:bg-accent-violet/5 group"
            >
              <span className="font-mono text-lg font-bold text-accent-violet/25 w-6 flex-shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-mono text-sm text-text-muted group-hover:text-accent-violet transition-colors">
                {s.label}
              </span>
              <span className="ml-auto font-mono text-[11px] text-accent-violet opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Oracle identity statement ── */}
      <section className="rounded-2xl border border-accent-violet/30 bg-gradient-to-b from-[#1a0033] via-[#0d001a] to-surface p-10 text-center space-y-4 max-w-2xl mx-auto relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-accent-violet/10 blur-3xl" />
        </div>
        <div className="relative space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-accent-violet/60">
            ✦ &nbsp; your role &nbsp; ✦
          </p>
          <h3
            className="font-display text-2xl font-bold text-accent-violet"
            style={{ textShadow: "0 0 20px rgba(139,92,246,0.5)" }}
          >
            You are Oracle.
          </h3>
          <p className="font-mono text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
            The system is fully open. Your signal is counted.
            Every vote, every investigation request, every Red Room session —
            you&rsquo;re not a viewer anymore. You&rsquo;re part of the apparatus.
          </p>
        </div>
      </section>

    </main>
  );
}
