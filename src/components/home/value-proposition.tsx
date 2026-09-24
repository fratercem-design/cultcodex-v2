import Link from "next/link";

type Stat = { value: number; suffix?: string; label: string };

/**
 * One consistent line of archive scale, with the date it's true as of.
 *
 * This used to count up from 0 on scroll. Anyone reading (or screenshotting)
 * mid-animation saw numbers that disagreed with the sidebar — the 2026-09
 * audit logged "2,690 transmissions" against a sidebar of 3,073 for exactly
 * this reason. An archive's counts should be read, not performed, so the
 * numbers now render final on the server.
 */
export function ArchiveStatsLine({ stats, asOf }: { stats: Stat[]; asOf: string }) {
  return (
    <section
      aria-label="Archive scale"
      className="border-y border-line px-4 py-4"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-baseline justify-center gap-x-6 gap-y-2 font-mono text-[15px] tabular-nums">
        {stats.map((stat) => (
          <p key={stat.label} className="text-ink-2">
            <span className="font-bold text-ink">
              {stat.value.toLocaleString("en-US")}
              {stat.suffix ?? ""}
            </span>{" "}
            {stat.label}
          </p>
        ))}
        <p className="text-[13px] text-ink-3">
          as of {asOf} ·{" "}
          <Link href="/about/methodology" className="underline underline-offset-4 hover:text-ink">
            how we count
          </Link>
        </p>
      </div>
    </section>
  );
}

// The three verbs are the site's navigation grammar: Search finds a moment,
// People/Map traces a pattern, the Oracle answers a question with citations.
const reasons = [
  {
    verb: "Find",
    title: "a moment",
    body: "Search every word by person, subject, symbol or exact phrase — then jump to the timestamp.",
    href: "/search",
    action: "Search the archive",
  },
  {
    verb: "Trace",
    title: "a pattern",
    body: "Follow recurring guests, shifting alliances and the themes the show keeps returning to.",
    href: "/people",
    action: "Browse people & connections",
  },
  {
    verb: "Ask",
    title: "the archive",
    body: "The Oracle answers from transcripts, lore and profiles — and cites the episodes and timestamps it used.",
    href: "/oracle",
    action: "Ask 3 questions free",
  },
] as const;

export function WhyCultCodex() {
  return (
    <section aria-labelledby="why-cultcodex" className="space-y-6">
      <div className="max-w-2xl space-y-2">
        <p className="font-mono text-[12px] uppercase tracking-[0.08em] text-ink-3">
          {"///"} Three ways in
        </p>
        <h2 id="why-cultcodex" className="font-display text-2xl font-bold text-ink sm:text-3xl">
          Watch the show. Then see what the show reveals.
        </h2>
      </div>

      {/* Hairline columns, not boxes: the verbs are the structure. */}
      <div className="grid border-y border-line md:grid-cols-3 md:divide-x md:divide-line">
        {reasons.map((reason) => (
          <Link
            key={reason.verb}
            href={reason.href}
            className="group block border-b border-line py-5 last:border-b-0 md:border-b-0 md:px-6 md:first:pl-0 md:last:pr-0"
          >
            <h3 className="font-display text-lg text-ink">
              <span className="font-mono font-bold uppercase tracking-[0.08em] text-brand-ink">{reason.verb}</span>{" "}
              {reason.title}
            </h3>
            <p className="mt-2 font-display text-[15px] leading-relaxed text-ink-2">{reason.body}</p>
            <p className="mt-4 font-display text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 group-hover:decoration-ink">
              {reason.action} <span aria-hidden="true">→</span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
