import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { SacredGeometryOverlay, FloatingParticles } from "@/components/graphics/sacred-geometry";
import { MysticalDivider, OrnamentalBreak } from "@/components/graphics/mystical-divider";
import { OracleConsole } from "@/components/oracle/oracle-console";
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
    "Ask anything about the Cult of Psyche archive. The Oracle is an AI trained on 2,500+ transmissions — it synthesizes answers from actual transcripts, lore entries, and behavioral profiles, with citations.",
};

const FREE_QUERY_LIMIT = 3;

export default async function OraclePage() {
  const user = await getCurrentUser();
  const subscribed = user
    ? user.role === "admin" || (await isSubscribed(user.id))
    : false;

  let initialFreeQueriesRemaining: number | undefined;
  if (user && !subscribed) {
    const cookieStore = await cookies();
    const cookieVal = cookieStore.get("oracle_preview")?.value;
    const currentMonth = new Date().toISOString().slice(0, 7);
    let usedThisMonth = 0;
    if (cookieVal) {
      const [month, countStr] = cookieVal.split(":");
      if (month === currentMonth) usedThisMonth = parseInt(countStr, 10) || 0;
    }
    initialFreeQueriesRemaining = Math.max(0, FREE_QUERY_LIMIT - usedThisMonth);
  }

  const totalQuotes = await prisma.quote.count();
  const randomOffset = Math.floor(Math.random() * Math.max(totalQuotes - 1, 0));
  const quotes = await prisma.quote.findMany({
    take: 1,
    skip: randomOffset,
    include: { speaker: true, episode: true },
  });
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
          <div className="space-y-4">
            <OracleConsole initialFreeQueriesRemaining={initialFreeQueriesRemaining} />
            {!subscribed && (
              <p className="text-center font-mono text-[10px] text-text-muted/40 uppercase tracking-widest">
                Initiate+ unlocks unlimited Oracle access ·{" "}
                <Link href="/premium" className="text-accent-gold/60 hover:text-accent-gold transition-colors">
                  $10/mo
                </Link>
              </p>
            )}
          </div>
        </section>

        <MysticalDivider className="opacity-40 [&_svg]:!text-accent-violet/20" />

        {/* ── Sample answers (shown to non-subscribers) ── */}
        {!subscribed && (
          <section className="space-y-6">
            <div className="text-center space-y-1">
              <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-violet/50">
                /// what the oracle actually does
              </p>
              <p className="font-serif text-sm text-text-muted/70 italic">
                Three real questions. Three full answers. This is what Initiate+ unlocks.
              </p>
            </div>
            {SAMPLE_ANSWERS.map((sample) => (
              <div key={sample.question} className="rounded-xl border border-accent-violet/15 bg-surface/60 overflow-hidden">
                {/* Question header */}
                <div className="bg-accent-violet/5 border-b border-accent-violet/10 px-5 py-3 flex items-start gap-2">
                  <span className="mt-0.5 font-mono text-accent-violet/60 text-xs">◉</span>
                  <p className="font-mono text-xs font-bold text-accent-violet/80">{sample.question}</p>
                </div>
                {/* Answer */}
                <div className="px-5 py-4 space-y-3">
                  {sample.answer.split("\n\n").map((para, i) => (
                    <p key={i} className="font-mono text-[11px] text-text-muted leading-relaxed">
                      {para.replace(/\*\*(.*?)\*\*/g, "$1")}
                    </p>
                  ))}
                  {/* Citations */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sample.citations.map((c) => (
                      <span key={c} className="rounded border border-accent-cyan/20 bg-accent-cyan/5 px-2 py-0.5 font-mono text-[9px] text-accent-cyan/70 uppercase tracking-wider">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-surface p-6 text-center space-y-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold/60">
                /// ask your own question
              </p>
              <p className="font-serif text-sm text-text-muted italic">
                Every answer is generated fresh from the full archive — transcripts, lore, behavioral profiles — with citations back to the source.
              </p>
              <Link
                href="/premium"
                className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-2.5 font-mono text-xs font-bold text-accent-gold transition-all hover:bg-accent-gold/25"
              >
                Unlock Initiate+ — $10/mo →
              </Link>
            </div>
          </section>
        )}

        <MysticalDivider className="opacity-40 [&_svg]:!text-accent-violet/20" />

        {/* ── Random quote ── */}
        {quote && (
          <section>
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-violet/40 text-center mb-4">
              /// transmission_fragment
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
                href={`/oracle?t=${Date.now()}`}
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
