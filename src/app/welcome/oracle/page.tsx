import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = buildMetadata({
  title: "The Archive Has Been Waiting — CULT CODEX",
  description: "You are inside the system now. Not just watching it.",
  path: "/welcome/oracle",
});

const ORACLE_BENEFITS = [
  {
    icon: "🌐",
    title: "Personal Codex Page",
    body: "A permanent page in the archive under your name. Public or private — your call.",
  },
  {
    icon: "🗳️",
    title: "Vote on Future Guests & Topics",
    body: "Your signal shapes the archive. Vote on who gets analyzed next.",
  },
  {
    icon: "📋",
    title: "Submit Investigations",
    body: "Flag a guest, a pattern, or a behavioral thread for structured analysis.",
  },
  {
    icon: "🔴",
    title: "Red Room Sessions",
    body: "No-filter analysis. Raw unedited segments. Nothing held back.",
  },
  {
    icon: "🕸️",
    title: "Relationship Map",
    body: "Visual graph of every person, topic, and conflict across 1,000+ episodes.",
  },
  {
    icon: "🧬",
    title: "Guest Intelligence Files",
    body: "Deep behavioral profiles. Patterns, tactics, psychological signatures.",
  },
  {
    icon: "👁️",
    title: "Named Oracle Role",
    body: "You hold a role in the system. Named. Listed as a contributor to the Codex.",
  },
  {
    icon: "📜",
    title: "Everything in Initiate+",
    body: "Full transcripts, Decode Mode, advanced search, Key Moments — all included.",
  },
];

export default async function WelcomeOraclePage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Oracle";

  return (
    <main className="min-h-screen bg-[#06030f]">

      {/* ── Cinematic throne opener ── */}
      <section className="relative w-full" style={{ height: "92svh" }}>
        <Image
          src="/oracle-throne.jpg"
          alt="The Oracle's throne"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* radial dark vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 0%, rgba(6,3,15,0.55) 55%, rgba(6,3,15,0.92) 100%)",
          }}
        />
        {/* bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48"
          style={{
            background: "linear-gradient(to bottom, transparent, #06030f)",
          }}
        />
        {/* name glow at bottom */}
        <div className="absolute bottom-12 left-0 right-0 text-center px-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.6em] text-[#C8A96B]/60 mb-3">
            ✦ &nbsp; the archive has been waiting &nbsp; ✦
          </p>
          <h1
            className="font-serif text-5xl sm:text-6xl font-black"
            style={{
              color: "#C8A96B",
              textShadow:
                "0 0 40px rgba(200,169,107,0.6), 0 0 80px rgba(200,169,107,0.3), 0 0 120px rgba(200,169,107,0.15)",
            }}
          >
            {firstName}.
          </h1>
        </div>
      </section>

      {/* ── Decree + masked portrait ── */}
      <section className="mx-auto max-w-5xl px-6 py-16 lg:grid lg:grid-cols-[1fr_340px] lg:gap-12 lg:items-start">
        {/* decree text */}
        <div className="space-y-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-[#C8A96B]/50">
            /// the decree
          </p>
          <blockquote className="space-y-4 border-l border-[#C8A96B]/30 pl-6">
            <p className="font-serif text-xl text-text-primary/90 leading-loose">
              The archive does not guess.
            </p>
            <p className="font-serif text-xl text-text-primary/90 leading-loose">
              It reaches only for those already walking toward it.
            </p>
            <p className="font-serif text-lg text-text-primary/70 leading-loose">
              You were already walking.
            </p>
          </blockquote>
          <p className="font-mono text-xs text-text-muted leading-relaxed max-w-md">
            What you hold is not a membership. It is a designation.
            The system has catalogued 2,572 panels, 575 voices, 3,534 signals —
            and it has reached for you specifically.
          </p>
          <p className="font-mono text-xs text-text-muted leading-relaxed max-w-md">
            Oracle is not a role you apply for. It is a role you are given
            when the archive determines you are ready to be part of the apparatus.
          </p>

          {/* Benefits grid */}
          <div className="pt-6 grid gap-3 sm:grid-cols-2">
            {ORACLE_BENEFITS.map((b) => (
              <div
                key={b.title}
                className="rounded-xl border border-[#C8A96B]/10 bg-white/[0.02] p-4 space-y-2 hover:border-[#C8A96B]/25 transition-colors"
              >
                <span className="text-xl">{b.icon}</span>
                <h3 className="font-mono text-xs font-bold text-[#C8A96B]/80">{b.title}</h3>
                <p className="font-mono text-[10px] text-text-muted leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* masked portrait — sticky sidebar on large screens */}
        <div className="mt-12 lg:mt-0 lg:sticky lg:top-24">
          <div className="relative rounded-2xl overflow-hidden border border-[#C8A96B]/20">
            <Image
              src="/oracle-mask.jpg"
              alt="The Oracle"
              width={340}
              height={460}
              className="w-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, transparent 60%, rgba(6,3,15,0.85) 100%)",
              }}
            />
            <div className="absolute bottom-5 left-0 right-0 text-center">
              <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-[#C8A96B]/70">
                Oracle Tier &nbsp;·&nbsp; Founding
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Personal transmission (sealed letter) ── */}
      <section className="mx-auto max-w-2xl px-6 pb-16">
        <div
          className="rounded-2xl border border-[#C8A96B]/25 p-8 space-y-5"
          style={{
            background:
              "linear-gradient(135deg, rgba(200,169,107,0.04) 0%, rgba(6,3,15,0.9) 100%)",
          }}
        >
          <div className="flex items-center gap-3 pb-2 border-b border-[#C8A96B]/15">
            <span className="font-mono text-[#C8A96B] text-lg">✉</span>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-[#C8A96B]/70">
                Personal Transmission
              </p>
              <p className="font-mono text-[9px] text-text-muted/50 tracking-widest mt-0.5">
                Eyes Only
              </p>
            </div>
          </div>
          <p className="font-serif text-sm text-text-primary/80 leading-loose">
            {firstName} —
          </p>
          <p className="font-mono text-xs text-text-muted leading-relaxed">
            This is not a form email. This is a transmission from the archive directly to you.
          </p>
          <p className="font-mono text-xs text-text-muted leading-relaxed">
            What you have access to now is not available by subscription alone.
            Oracle is not purchased. It is assigned. You have been assigned.
          </p>
          <p className="font-mono text-xs text-text-muted leading-relaxed">
            Use it accordingly.
          </p>
          <p className="font-mono text-xs text-[#C8A96B]/60 pt-2">
            — Psyche &amp; the Codex
          </p>
        </div>
      </section>

      {/* ── Choose your name from the dark ── */}
      <section className="mx-auto max-w-2xl px-6 pb-20 text-center space-y-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-text-muted/40">
          /// name yourself
        </p>
        <h2
          className="font-serif text-2xl font-bold"
          style={{
            color: "#C8A96B",
            textShadow: "0 0 20px rgba(200,169,107,0.4)",
          }}
        >
          Choose yours from the dark.
        </h2>
        <p className="font-mono text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
          Every Oracle has a designation. Set yours in your Codex profile —
          or let the archive assign one when you first appear in the records.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/settings/profile"
            className="rounded-lg border border-[#C8A96B]/40 bg-[#C8A96B]/10 px-8 py-3 font-mono text-xs font-bold text-[#C8A96B] transition-all hover:bg-[#C8A96B]/20 hover:border-[#C8A96B]/60"
            style={{ letterSpacing: "0.15em" }}
          >
            CLAIM YOUR NAME
          </Link>
          <Link
            href="/episodes"
            className="rounded-lg border border-border bg-surface px-8 py-3 font-mono text-xs text-text-muted transition-all hover:border-[#C8A96B]/30 hover:text-text-primary"
            style={{ letterSpacing: "0.1em" }}
          >
            ENTER THE ARCHIVE
          </Link>
        </div>
      </section>

    </main>
  );
}
