import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { SacredGeometryOverlay, FloatingParticles } from "@/components/graphics/sacred-geometry";
import { MysticalDivider, OrnamentalBreak } from "@/components/graphics/mystical-divider";
import { OracleConsole } from "@/components/oracle/oracle-console";
import { OracleExampleExchanges } from "@/components/oracle/oracle-example-exchanges";
import Link from "next/link";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

const SAMPLE_ANSWERS = [
  {
    question: "What patterns repeat every time there's a major guest conflict?",
    answer: `The archive maps three recurring structures across major conflict episodes. First, a **loyalty test** — the host introduces a topic that implicitly requires the guest to choose a side; guests who hedge are almost always reintroduced in later episodes as "inauthentic." Second, a **status escalation spiral**: one participant makes a low-stakes provocative claim, the other escalates rather than redirects, and the exchange accelerates until someone exits or yields. This structure appears in 78% of identified conflict episodes.\n\nThe third pattern is the most revealing: a **deferred grievance reveal**. In the 12–18 minutes before any major rupture, the archive consistently identifies a shift in verbal cadence — shorter responses, increased hedging language, questions that aren't really questions. The actual conflict is almost never about the stated topic. The stated topic is the permission structure.`,
    citations: ["EP.447", "EP.612", "EP.891", "EP.1104"],
  },
  {
    question: "Who has challenged the host most directly and what happened?",
    answer: `Across 2,600+ transmissions, the archive identifies seven guests who challenged the host's framing directly — not obliquely, not through passive resistance, but by naming the dynamic out loud. Of those seven, four were never invited back. Two returned once, in what the Psychenomicon classifies as **corrective episodes** — transmissions where the prior rupture is addressed through overcorrection.\n\nThe most structurally complete challenge came in EP.834, where the guest explicitly named the host's pattern of reframing criticism as personal attack. The host's response — changing the subject twice, then invoking audience loyalty — is now one of the most-cited sequences in lore. The guest's subsequent disappearance from the archive is itself considered significant: they weren't banned, they simply never returned.`,
    citations: ["EP.212", "EP.834", "EP.1019"],
  },
  {
    question: "What is the Psychenomicon and what does it actually map?",
    answer: `The Psychenomicon is the myth-engine layer of the archive — the system that extracts **behavioral mythology** from raw transcript data. Where standard search returns what was said, the Psychenomicon maps what it means in structural terms: who holds power in a given episode, which archetypes are active, what recurring dynamics are at play, and how the narrative of any given figure evolves across years of appearances.\n\nIt processes each episode through three passes: behavioral signature detection (what patterns of speech and reaction does each person exhibit), archetype assignment (which of the eight system archetypes best describes each participant's function in the transmission), and **mythic threading** (how does this episode connect to the larger narrative arc of the show's history). The result is a living narrative system built from real transcripts — not a fan interpretation, but a structural analysis of 2,600+ data points.`,
    citations: ["Psychenomicon Index", "EP.1 — EP.2652"],
  },
];

export const metadata = {
  title: "Ask the Oracle — AI Search — CULT CODEX",
  description:
    "Ask the archive anything. The Oracle synthesizes 2,600+ transmissions into precise answers — behavioral patterns, guest dynamics, recurring moments — all cited back to the source. Initiate+ feature.",
};

const FREE_QUERY_LIMIT = 3;

export default async function OraclePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const initialQuestion = q ? decodeURIComponent(q).slice(0, 500) : undefined;

  const user = await getCurrentUser();
  const subscribed = user
    ? user.role === "admin" || (await isSubscribed(user.id))
    : false;

  // Quality quote: speaker + context + 60+ chars, no boilerplate
  const BOILERPLATE = ["vidIQ", "future initiate", "Hello,", "subscribe", "like and share"];
  const qualityPool = await prisma.quote.findMany({
    where: {
      speakerPersonId: { not: null },
      context: { not: null },
      AND: BOILERPLATE.map((phrase) => ({ text: { not: { contains: phrase } } })),
    },
    select: { id: true, text: true },
    take: 500,
    orderBy: { createdAt: "desc" },
  });
  const meaningful = qualityPool.filter((q) => q.text.length >= 60);
  const pick = meaningful.length > 0
    ? meaningful[Math.floor(Math.random() * meaningful.length)]
    : qualityPool[0];
  const quotes = pick
    ? await prisma.quote.findMany({
        where: { id: pick.id },
        take: 1,
        include: { speaker: true, episode: true },
      })
    : [];
  const quote = quotes[0] ?? null;

  const archiveSize = await prisma.transcriptSegment.count();

  return (
    <div className="relative min-h-screen bg-void">
      <SacredGeometryOverlay />
      <FloatingParticles count={20} />

      {/* Ambient violet glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 20%, rgba(110,75,174,0.14) 0%, transparent 70%)",
        }}
      />

      {/* ── Header ── */}
      <header className="relative z-10 flex flex-col items-center pt-16 pb-4 text-center">
        <div className="animate-float mb-8">
          <div
            className="relative h-44 w-44 sm:h-52 sm:w-52 rounded-full overflow-hidden animate-ring-pulse"
            style={{
              boxShadow: [
                "0 0 0 3px #6E4BAE",
                "0 0 0 6px #5DB7D8",
                "0 0 0 9px rgba(110,75,174,0.15)",
                "0 0 40px rgba(110,75,174,0.35)",
                "0 0 80px rgba(93,183,216,0.15)",
              ].join(", "),
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/oracle-throne.jpg"
              alt="The Oracle of the Codex"
              className="h-full w-full object-cover object-top"
            />
          </div>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-[0.08em] text-accent-gold drop-shadow-lg">
          THE ORACLE
        </h1>
        <p className="mt-1.5 font-mono text-xs uppercase tracking-[0.45em] text-accent-violet/60">
          AI synthesis of the complete archive
        </p>

        <div className="mt-5 w-24 h-px bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent" />
        <MysticalDivider className="mt-4 opacity-40 [&_svg]:!text-accent-violet/25" />

        <p className="mx-auto mt-4 max-w-md px-4 font-serif text-sm leading-relaxed text-text-muted italic">
          Ask anything.{" "}
          <span className="text-accent-cyan">{archiveSize.toLocaleString()}+ archive moments</span>{" "}
          synthesized in real time — with citations back to the source.
        </p>

        {/* Trial callout for non-subscribers */}
        {!canAccess && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent-gold/30 bg-accent-gold/5 px-5 py-2">
            <span className="text-accent-gold text-sm">✦</span>
            <p className="font-mono text-[11px] text-accent-gold/80">
              3 free questions — no account required to start
            </p>
          </div>
        )}
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-20 space-y-12">

        {/* ── For non-subscribers: show examples FIRST, then console ── */}
        {!canAccess && (
          <>
            <section>
              <OracleExampleExchanges />
            </section>

            <div className="relative">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-violet/30 to-transparent" />
              <p className="pt-6 text-center font-mono text-[10px] uppercase tracking-[0.35em] text-accent-violet/40">
                {"/// now_ask_yours"}
              </p>
            </div>
          </>
        )}

        {/* ── Oracle Console ── */}
        <section>
          <OracleConsole />
          {!canAccess && (
            <p className="mt-3 text-center font-mono text-[10px] text-text-muted/40 uppercase tracking-widest">
              Initiate+ — unlimited Oracle access ·{" "}
              <Link href="/premium" className="text-accent-gold/60 hover:text-accent-gold transition-colors">
                $10/mo
              </Link>
            </p>
          )}
        </section>

        {/* ── For subscribers: show what they've unlocked ── */}
        {canAccess && (
          <section className="rounded-xl border border-accent-violet/15 bg-surface/60 px-6 py-5 space-y-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-violet/50">
              {"/// oracle_capabilities"}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                "Behavioral patterns across episodes",
                "Guest dynamics over time",
                "Recurring moments & archetypes",
                "Relationship map synthesis",
                "Transcript citations with timestamps",
                "Cross-episode theme tracking",
              ].map((cap) => (
                <div key={cap} className="flex items-start gap-2">
                  <span className="text-accent-violet/50 mt-0.5 shrink-0">◈</span>
                  <p className="font-mono text-[10px] text-text-muted leading-snug">{cap}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <MysticalDivider className="opacity-40 [&_svg]:!text-accent-violet/20" />

        {/* ── Transmission fragment (quality-filtered random quote) ── */}
        {quote && (
          <section>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-violet/40 text-center mb-4">
              {"/// transmission_fragment"}
            </p>
            <div className="relative rounded-xl border border-accent-violet/20 bg-surface/80 backdrop-blur-sm p-1">
              <div
                className="pointer-events-none absolute -inset-px rounded-xl"
                aria-hidden="true"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(110,75,174,0.15) 0%, transparent 30%, transparent 70%, rgba(110,75,174,0.10) 100%)",
                }}
              />
              <div className="relative rounded-lg border border-border bg-elevated p-6 sm:p-8">
                <div
                  className="pointer-events-none select-none text-center font-serif text-6xl leading-none text-accent-violet/20"
                  aria-hidden="true"
                >
                  &ldquo;
                </div>
                <blockquote className="mt-2 text-center font-serif text-lg sm:text-xl leading-relaxed text-text-primary">
                  {quote.text}
                </blockquote>
                <div
                  className="pointer-events-none select-none text-center font-serif text-6xl leading-none text-accent-violet/20 mt-2"
                  aria-hidden="true"
                >
                  &rdquo;
                </div>
                <OrnamentalBreak className="my-4 [&_svg]:!text-accent-violet/25" />
                {quote.speaker && (
                  <p className="text-center">
                    <Link
                      href={`/people/${quote.speaker.slug}`}
                      className="font-display text-sm font-semibold text-accent-gold hover:text-accent-gold/80 transition-colors"
                    >
                      {quote.speaker.displayName}
                    </Link>
                  </p>
                )}
                {quote.context && (
                  <p className="mt-3 text-center font-mono text-xs text-text-muted/70 italic">
                    {quote.context}
                  </p>
                )}
                {quote.episode && (
                  <p className="mt-3 text-center">
                    <Link
                      href={`/episodes/${quote.episode.slug}`}
                      className="font-mono text-xs text-text-muted hover:text-accent-cyan transition-colors"
                    >
                      Episode {quote.episode.episodeNumber ?? quote.episode.slug}
                      {quote.episode.title ? ` — ${quote.episode.title}` : ""}
                    </Link>
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Non-subscriber conversion close ── */}
        {!canAccess && (
          <section className="relative overflow-hidden rounded-2xl border border-accent-violet/30 bg-gradient-to-b from-[#120020] via-[#0d001a] to-[#0d001a] p-8 text-center space-y-5 shadow-xl shadow-accent-violet/10">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-12 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full bg-accent-violet/10 blur-3xl" />
            </div>
            <div className="relative space-y-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-violet/60">
                ✦ &nbsp; unlock the full archive &nbsp; ✦
              </p>
              <h3 className="font-display text-2xl font-bold text-white sm:text-3xl">
                The Oracle answers{" "}
                <span className="text-accent-violet">everything.</span>
              </h3>
              <p className="font-mono text-[11px] text-text-muted max-w-sm mx-auto leading-relaxed">
                Unlimited questions. Every transcript, every behavioral profile, every pattern
                the archive has identified — synthesized on demand, with citations.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/premium"
                  className="inline-flex items-center gap-2 rounded-lg border border-accent-violet bg-accent-violet/15 px-7 py-3 font-mono text-sm font-bold text-accent-violet transition-all hover:bg-accent-violet/25 hover:shadow-lg hover:shadow-accent-violet/20"
                >
                  Become Initiate+ — $10/mo →
                </Link>
                <Link
                  href="/premium"
                  className="font-mono text-[11px] text-text-muted/50 hover:text-accent-violet/70 transition-colors"
                >
                  See what opens →
                </Link>
              </div>
              <p className="font-mono text-[10px] text-text-muted/40">
                Cancel any time · Instant access · Includes transcripts, Psychenomicon & more
              </p>
            </div>
          </section>
        )}

        <OrnamentalBreak className="mt-4 opacity-30 [&_svg]:!text-accent-violet/20" />
        <p className="mt-4 text-center font-serif text-xs text-text-muted/30 italic">
          What is remembered, lives.
        </p>
      </main>
    </div>
  );
}
