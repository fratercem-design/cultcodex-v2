import Image from "next/image";
import Link from "next/link";
import { getCounts } from "@/lib/queries/stats";
import { SacredGeometryOverlay, FloatingParticles } from "@/components/graphics/sacred-geometry";
import { EmailCapture } from "@/components/marketing/email-capture";

export const dynamic = "force-dynamic";

export const metadata = {
  alternates: { canonical: "/from-youtube" },
  title: "You followed the signal — CultCodex, the memory of Cult of Psyche",
  description:
    "You just watched Cult of Psyche. CultCodex is its permanent memory: every broadcast, every voice, every pattern — indexed, searchable, and readable by an AI Oracle. Even the episodes YouTube dropped.",
  openGraph: {
    title: "YouTube forgets. The Codex remembers.",
    description:
      "The complete searchable archive of Cult of Psyche — transcripts, guest profiles, lore, and an AI Oracle. Ask it anything, 3 free.",
    type: "website" as const,
    url: "/from-youtube",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "YouTube forgets. The Codex remembers.",
    description: "The permanent, searchable memory of Cult of Psyche. Ask the Oracle 3 free.",
  },
};

export default async function FromYouTubePage() {
  const stats = await getCounts().catch(() => ({
    episodes: 0, segments: 0, people: 0, topics: 0,
    lore: 0, quotes: 0, totalHours: 0,
    transcribedEpisodes: 0, transcribedPct: 0,
  }));

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[560px] sm:min-h-[640px] items-center justify-center overflow-hidden">
        <Image src="/hero-bg.jpg" alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/65 to-void" />
        <SacredGeometryOverlay />
        <FloatingParticles count={20} />

        <div className="relative z-10 flex flex-col items-center gap-6 px-4 text-center max-w-3xl mx-auto">
          <Image
            src="/logo.jpg"
            alt="Cult of Psyche"
            width={80}
            height={80}
            className="rounded-full border-2 border-accent-gold/60 shadow-xl shadow-accent-gold/20 opacity-90"
          />
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.5em] text-accent-cyan/80">
                ✦ &nbsp; You followed the signal &nbsp; ✦
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold-text/60">
                From the broadcast — into the archive
              </p>
            </div>
            <h1
              className="font-display text-4xl sm:text-6xl font-bold leading-tight text-white"
              style={{ textShadow: "0 0 60px rgba(200, 57, 46,0.3)" }}
            >
              YouTube forgets.
              <br />
              <span className="text-accent-gold-text" style={{ textShadow: "0 0 40px rgba(200, 57, 46,0.6)" }}>
                The Codex remembers.
              </span>
            </h1>
            <p className="font-mono text-sm text-text-primary/90 max-w-xl mx-auto leading-relaxed">
              You just watched <span className="text-white font-bold">Cult of Psyche</span>. This is its
              permanent memory — every broadcast, every voice, every pattern, indexed and searchable.
              Even the transmissions YouTube dropped.
            </p>
          </div>

          <p className="font-mono text-[12px] text-text-muted max-w-lg mx-auto leading-relaxed">
            <span className="text-accent-gold-text font-bold">CultCodex</span> holds{" "}
            <span className="text-accent-cyan">{stats.episodes.toLocaleString()}+ episodes</span> with full
            transcripts, guest profiles, lore, and an AI Oracle that answers questions from inside all of it.
          </p>

          <div className="flex flex-col items-center gap-2">
            <Link
              href="/oracle"
              className="inline-flex items-center gap-2 rounded-lg border border-accent-violet bg-accent-violet/15 px-10 py-4 font-mono text-sm font-bold text-accent-violet-text transition-all hover:bg-accent-violet/25 hover:shadow-xl hover:shadow-accent-violet/20"
            >
              🔮 Ask the Oracle — 3 free →
            </Link>
            <Link
              href="/start-here"
              className="font-mono text-[11px] text-text-muted/50 hover:text-accent-gold-text/70 transition-colors underline underline-offset-4"
            >
              Or just enter the Codex →
            </Link>
          </div>

          <EmailCapture compact source="youtube_landing" />
        </div>
      </section>

      <main id="main-content" className="space-y-0">
        {/* ── STATS STRIP ──────────────────────────────────────────────── */}
        <div className="border-b border-border/40 bg-void/80 backdrop-blur-sm py-3 px-4">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-x-8 gap-y-1">
            {[
              { value: stats.episodes.toLocaleString(), label: "transmissions archived" },
              { value: stats.segments.toLocaleString(), label: "transcript segments" },
              { value: stats.people.toLocaleString(), label: "voices profiled" },
              { value: `${stats.totalHours.toLocaleString()}+`, label: "hours decoded" },
            ].map((s) => (
              <span key={s.label} className="font-mono text-[11px] text-text-muted whitespace-nowrap">
                <span className="text-accent-gold-text font-bold">{s.value}</span>{" "}{s.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-12 space-y-12">
          {/* ── THE BRIDGE: what this is, for someone who knows the show ── */}
          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold-text/60">
              {"/// why_you're_here"}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  glyph: "🔍",
                  label: "Every episode, searchable",
                  desc: "Transcripts for 97% of broadcasts since October 2024. Find the exact moment something was said — by episode and timestamp.",
                  accent: "border-accent-gold/25 hover:border-accent-gold/50",
                },
                {
                  glyph: "🔮",
                  label: "An AI Oracle",
                  desc: "Ask a real question and get an answer grounded in the actual archive — with citations to the episodes it came from. Not a guess. Evidence.",
                  accent: "border-accent-violet/25 hover:border-accent-violet/50",
                },
                {
                  glyph: "🗄️",
                  label: "Nothing gets lost",
                  desc: "YouTube dropped 2,000+ VODs. CultCodex kept every one. This is the permanent record the platform won't hold.",
                  accent: "border-accent-cyan/25 hover:border-accent-cyan/50",
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className={`rounded-xl border bg-surface px-4 py-5 space-y-2 transition-colors ${c.accent}`}
                >
                  <p className="text-2xl leading-none">{c.glyph}</p>
                  <p className="font-mono text-xs font-bold text-text-primary">{c.label}</p>
                  <p className="font-mono text-[11px] text-text-muted leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── ORACLE HOOK ──────────────────────────────────────────── */}
          <div className="rounded-xl border border-accent-violet/25 bg-gradient-to-b from-accent-violet/5 to-surface px-6 py-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="space-y-1.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-violet-text/60">{"/// ai_oracle"}</p>
                <h2 className="font-display text-lg font-bold text-white">Ask about the episode you just watched.</h2>
                <p className="font-mono text-[11px] text-text-muted leading-relaxed max-w-lg">
                  The Oracle is trained on every transcript, lore entry, and behavioral profile in the archive.
                  Ask what a guest actually said, how a panel turned, or what pattern keeps repeating — and get
                  a cited answer.
                </p>
              </div>
              <Link
                href="/oracle"
                className="shrink-0 self-start inline-flex items-center gap-1.5 rounded-lg border border-accent-violet bg-accent-violet/15 px-4 py-2.5 font-mono text-xs font-bold text-accent-violet-text transition-all hover:bg-accent-violet/25 whitespace-nowrap"
              >
                Ask the Oracle — 3 free →
              </Link>
            </div>
            <div className="space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-violet-text/50">
                {"/// try_asking"}
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "What did they say about tarot in the last panel?",
                  "How has this guest changed across appearances?",
                  "What patterns show up when a panel turns hostile?",
                ].map((q) => (
                  <Link
                    key={q}
                    href={`/oracle?q=${encodeURIComponent(q)}`}
                    className="rounded-full border border-accent-violet/20 bg-surface px-3 py-1.5 font-mono text-[10px] text-text-muted hover:border-accent-violet/50 hover:text-accent-violet-text transition-colors"
                  >
                    ↳ {q}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── WHAT YOU GET ─────────────────────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface px-5 py-5 space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/60">{"/// free"}</p>
              <p className="font-display text-base font-bold text-text-primary">Start decoding — no account needed</p>
              <ul className="space-y-1.5 font-mono text-[11px] text-text-muted">
                <li>✦ Browse {stats.episodes.toLocaleString()}+ episodes &amp; transcripts</li>
                <li>✦ Ask the Oracle 3 questions</li>
                <li>✦ Symbol Codex &amp; the Archetype Quiz</li>
                <li>✦ The weekly Signal newsletter</li>
              </ul>
            </div>
            <div className="rounded-xl border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-surface px-5 py-5 space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold-text/70">{"/// initiate+ · $10/mo"}</p>
              <p className="font-display text-base font-bold text-white">Open the whole archive</p>
              <ul className="space-y-1.5 font-mono text-[11px] text-text-muted">
                <li className="text-accent-gold-text/90">✦ Unlimited AI Oracle</li>
                <li>✦ Full transcript access + Decode Mode</li>
                <li>✦ Your member identity profile</li>
                <li>✦ No contracts — cancel anytime</li>
              </ul>
            </div>
          </div>

          {/* ── SUBSCRIBE CTA ────────────────────────────────────────── */}
          <div className="rounded-xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-surface px-6 py-8 text-center space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold-text/60">{"/// unlock_the_archive"}</p>
            <p className="font-display text-xl font-bold text-white">Full transcripts. Unlimited Oracle. The Psychenomicon.</p>
            <p className="font-mono text-xs text-text-muted max-w-md mx-auto">
              Initiate+ opens the AI Oracle, every transcript, Decode Mode, and your member identity — $10/mo. No contracts.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/premium"
                className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-7 py-3 font-mono text-sm font-bold text-accent-gold-text transition-all hover:bg-accent-gold/25 hover:shadow-lg hover:shadow-accent-gold/20"
              >
                Become Initiate+ — $10/mo →
              </Link>
              <Link
                href="/episodes"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-mono text-xs text-text-muted transition-all hover:border-accent-gold/30 hover:text-text-primary"
              >
                Browse the archive first
              </Link>
            </div>
          </div>

          {/* ── EMAIL CAPTURE ────────────────────────────────────────── */}
          <EmailCapture
            source="youtube_landing"
            eyebrow="/// weekly_signal"
            heading="Not ready to dive in? Get the signal weekly."
            subheading="One transmission per week: the pattern that surfaced most, a voice you missed, and what the Oracle flagged — straight from the archive."
          />
        </div>
      </main>
    </>
  );
}
