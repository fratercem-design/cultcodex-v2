import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { SacredGeometryOverlay, FloatingParticles } from "@/components/graphics/sacred-geometry";
import { MysticalDivider, OrnamentalBreak } from "@/components/graphics/mystical-divider";
import { OracleConsole } from "@/components/oracle/oracle-console";
import { OracleExampleExchanges } from "@/components/oracle/oracle-example-exchanges";
import { OracleAmbience } from "@/components/oracle/oracle-ambience";
import { LilithOracle } from "@/components/oracle/lilith-oracle";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  alternates: { canonical: "/oracle" },
  title: "Ask the Oracle — AI Search — CULT CODEX",
  description:
    "Ask the archive anything. The Oracle synthesizes 2,600+ transmissions into precise answers — behavioral patterns, guest dynamics, recurring moments — all cited back to the source. Initiate+ feature.",
};

export default async function OraclePage() {
  const user = await getCurrentUser();
  const canAccess = user
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
  const pool = meaningful.length > 0 ? meaningful : qualityPool;
  // eslint-disable-next-line react-hooks/purity -- server component: runs once per request, no re-render risk
  const pick = pool[Date.now() % pool.length] ?? pool[0];
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
      <OracleAmbience />

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
                "0 0 0 3px #A94A4A",
                "0 0 0 6px #4A2D6E",
                "0 0 0 9px rgba(169,74,74,0.18)",
                "0 0 44px rgba(169,74,74,0.35)",
                "0 0 90px rgba(74, 45, 110,0.22)",
              ].join(", "),
            }}
          >
            <LilithOracle />
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
            <p className="mt-3 text-center font-mono text-[10px] text-text-muted/60 uppercase tracking-widest">
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
              <p className="font-mono text-[10px] text-text-muted/60">
                Cancel any time · Instant access · Includes transcripts, Psychenomicon & more
              </p>
            </div>
          </section>
        )}

        {/* Sibling divination tool — the Tarot reading is a distinct mode from AI Q&A */}
        <section className="rounded-xl border border-accent-gold/15 bg-surface/40 px-6 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold/50">
              {"/// also_in_the_codex"}
            </p>
            <p className="max-w-md font-mono text-[11px] leading-relaxed text-text-muted">
              Prefer your answers in symbols? The{" "}
              <span className="text-accent-gold">Cult of Psyche Tarot</span> pulls a reading from the
              same archive — 80 cards of its archetypes and recurring forces.
            </p>
          </div>
          <Link
            href="/tarot"
            className="shrink-0 self-start inline-flex items-center gap-1.5 rounded-lg border border-accent-gold/40 bg-accent-gold/10 px-4 py-2.5 font-mono text-xs font-bold text-accent-gold transition-all hover:bg-accent-gold/20 whitespace-nowrap"
          >
            Pull a Tarot reading →
          </Link>
        </section>

        <OrnamentalBreak className="mt-4 opacity-30 [&_svg]:!text-accent-violet/20" />
        <p className="mt-4 text-center font-serif text-xs text-text-muted/30 italic">
          What is remembered, lives.
        </p>
      </main>
    </div>
  );
}
