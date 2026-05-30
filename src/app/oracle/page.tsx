import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { SacredGeometryOverlay, FloatingParticles } from "@/components/graphics/sacred-geometry";
import { MysticalDivider, OrnamentalBreak } from "@/components/graphics/mystical-divider";
import { OracleConsole } from "@/components/oracle/oracle-console";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Ask the Oracle — AI Search — CULT CODEX",
  description:
    "Ask the archive anything. The Oracle synthesizes 2,600+ transmissions into precise answers — behavioral patterns, guest dynamics, recurring moments — all cited back to the source. Initiate+ feature.",
};

export default async function OraclePage() {
  const user = await getCurrentUser();
  const canAccess = user
    ? user.role === "admin" || (await isSubscribed(user.id))
    : false;

  // Fetch a pool of quality quotes: must have a speaker + context, exclude boilerplate
  const BOILERPLATE = ["vidIQ", "future initiate", "Hello,", "subscribe", "like and share"];
  const qualityPool = await prisma.quote.findMany({
    where: {
      speakerId: { not: null },
      context: { not: null },
      AND: BOILERPLATE.map((phrase) => ({ text: { not: { contains: phrase } } })),
    },
    select: { id: true, text: true },
    take: 500,
    orderBy: { createdAt: "desc" },
  });
  // Filter to quotes with substance (60+ chars)
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

      {/* ── Header — Medallion ── */}
      <header className="relative z-10 flex flex-col items-center pt-16 pb-4 text-center">
        {/* Portrait medallion */}
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
          AI search of the complete archive
        </p>

        {/* Thin gold rule */}
        <div className="mt-5 w-24 h-px bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent" />

        <MysticalDivider className="mt-4 opacity-40 [&_svg]:!text-accent-violet/25" />

        <p className="mx-auto mt-4 max-w-md px-4 font-serif text-sm leading-relaxed text-text-muted italic">
          Ask anything.{" "}
          <span className="text-accent-cyan">{totalQuotes.toLocaleString()}+ archive moments</span>{" "}
          synthesized in real time — with citations back to the source.
        </p>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-20 space-y-12">

        {/* ── Oracle Console ── */}
        <section>
          {canAccess ? (
            <OracleConsole />
          ) : (
            <div className="space-y-6">
              <OracleConsole />
              <p className="text-center font-mono text-[10px] text-text-muted/40 uppercase tracking-widest">
                Initiate+ unlocks the Oracle ·{" "}
                <Link href="/premium" className="text-accent-gold/60 hover:text-accent-gold transition-colors">
                  $10/mo
                </Link>
              </p>
            </div>
          )}
        </section>

        <MysticalDivider className="opacity-40 [&_svg]:!text-accent-violet/20" />

        {/* ── Random quote ── */}
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

            <div className="mt-8 flex justify-center">
              <Link
                href="/oracle"
                className="group relative inline-flex items-center gap-2 rounded-lg border border-accent-violet/30 bg-surface px-6 py-3 font-display text-sm font-semibold text-accent-violet transition-all hover:border-accent-violet/60 hover:bg-accent-violet/5 hover:shadow-[0_0_20px_rgba(110,75,174,0.15)]"
              >
                <span className="inline-block transition-transform group-hover:rotate-12">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-violet/60">
                    <path
                      d="M8 1v3M8 12v3M1 8h3M12 8h3M3.05 3.05l2.12 2.12M10.83 10.83l2.12 2.12M3.05 12.95l2.12-2.12M10.83 5.17l2.12-2.12"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                New transmission
              </Link>
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
