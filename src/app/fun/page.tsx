import Link from "next/link";
import type { Metadata } from "next";
import { getLoreEntries } from "@/lib/queries/lore";

export const revalidate = 600;

export const metadata: Metadata = {
  alternates: { canonical: "/fun" },
  title: "The Fun Wing — CULT CODEX",
  description:
    "The unserious wing of the archive — humorous lore, the Drama Files, quizzes, oracles, and at least one door that isn't on the map.",
};

const ATTRACTIONS: { label: string; href: string; blurb: string }[] = [
  {
    label: "The Panelverse Game Show",
    href: "/gameshow",
    blurb: "100 questions, five rounds. Screen-share it and let chat play.",
  },
  {
    label: "Draw from the Deck",
    href: "/draw",
    blurb: "Three random cards from the archive. Reload to draw again.",
  },
  {
    label: "Today's Draw",
    href: "/draw/today",
    blurb: "One shared draw a day — the same three cards for everyone.",
  },
  {
    label: "The Bestiary",
    href: "/bestiary",
    blurb: "A field guide to the entities the cult summoned into being.",
  },
  {
    label: "The Trollopedia",
    href: "/trollopedia",
    blurb: "The field guide to the trolls. Do not feed.",
  },
  {
    label: "The Prophecy Ledger",
    href: "/prophecies",
    blurb: "Every omen on record. Accuracy not guaranteed.",
  },
  {
    label: "The Drama Files",
    href: "/drama",
    blurb: "Case files on the least dignified moments in cult history.",
  },
  {
    label: "Articles",
    href: "/articles",
    blurb: "Long-form field reports drawn from the show.",
  },
  {
    label: "Archetype Quiz",
    href: "/archetype-quiz",
    blurb: "Find out which pattern has been wearing you as a costume.",
  },
  {
    label: "Ask the Oracle",
    href: "/oracle",
    blurb: "Pose a question. Receive an answer. Regret is optional.",
  },
  {
    label: "Tarot",
    href: "/tarot",
    blurb: "The cards were here before you and will be here after.",
  },
  {
    label: "Quotes",
    href: "/quotes",
    blurb: "Things that were actually said, on the record, out loud.",
  },
];

export default async function FunPage() {
  const humorous = await getLoreEntries({ canon: "humorous", take: 24 });

  return (
    <main className="min-h-screen bg-void">
      {/* Hero */}
      <section className="border-b border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 to-void py-12 px-4">
        <div className="mx-auto max-w-3xl text-center space-y-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.5em] text-accent-gold-text/60">
            {"/// recreation_level · unserious_by_decree"}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">
            The Fun Wing
          </h1>
          <p className="text-sm text-text-muted max-w-lg mx-auto leading-relaxed">
            The archive keeps the record. This wing keeps the jokes. Humorous
            lore, incident files, quizzes, and oracles — everything the
            serious halls pretend not to know about.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-10 space-y-12">
        {/* Attractions */}
        <section className="space-y-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">
            {"/// attractions"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ATTRACTIONS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group rounded border border-border bg-surface p-4 hover:border-accent-gold/40 hover:bg-accent-gold/5 transition-all space-y-1.5"
              >
                <p className="font-display text-sm font-bold text-text-primary group-hover:text-accent-gold-text transition-colors">
                  {a.label}
                </p>
                <p className="text-[11px] text-text-muted leading-relaxed">{a.blurb}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Humorous lore */}
        <section className="space-y-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted">
            {"/// humorous_canon"}
          </p>
          {humorous.length === 0 ? (
            <div className="rounded border border-border bg-surface px-6 py-12 text-center">
              <p className="text-sm text-text-muted">
                No entries have been declared officially funny yet. The
                committee is deliberating.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {humorous.map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/lore/${entry.slug}`}
                  className="group rounded border border-border bg-surface p-4 hover:border-accent-gold/40 hover:bg-accent-gold/5 transition-all space-y-1"
                >
                  <p className="font-mono text-xs font-medium text-text-primary group-hover:text-accent-gold-text transition-colors">
                    {entry.title}
                  </p>
                  {entry.summary && (
                    <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">
                      {entry.summary}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Hidden-doors tease */}
        <section className="text-center pt-4 border-t border-border">
          <p className="font-mono text-[10px] text-text-muted/50 leading-relaxed">
            Not everything in the archive is on the map.
            <br />
            Some doors only open for those who look at the small things.
          </p>
        </section>
      </div>
    </main>
  );
}
