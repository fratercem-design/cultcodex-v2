export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { CodexSigil } from "@/components/graphics/codex-sigil";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { buildMetadata } from "@/lib/seo";
import { curateReportPeople, PINNED_REPORT_PEOPLE } from "@/lib/content-hygiene";

export const revalidate = 600;

export const metadata: Metadata = buildMetadata({
  title: "Codex Reports — Intelligence on Demand",
  description:
    "Guest Intelligence Reports and Codex Reports: AI-synthesized behavioral profiles, conflict maps, and pattern analyses drawn from the full Cult of Psyche archive. An Initiate+ feature.",
  path: "/reports",
});

const CODEX_REPORTS = [
  {
    glyph: "◉",
    title: "The Pattern Report",
    cadence: "Monthly",
    body: "What repeated across the archive this month — the recurring dynamics, the dominant signals, the behavioral structures that kept resurfacing. The forest, not the trees.",
    accent: "gold" as const,
  },
  {
    glyph: "⚔",
    title: "The Conflict Report",
    cadence: "On major events",
    body: "A full reconstruction of a saga: who escalated, who de-escalated, the receipts, the turning points. Drama rendered as intelligence — timelines, not takes.",
    accent: "crimson" as const,
  },
  {
    glyph: "◈",
    title: "The Transmission Digest",
    cadence: "Weekly",
    body: "Everything that mattered in the week's streams, synthesized: the moments worth your time, the lore that dropped, the threads now worth watching.",
    accent: "cyan" as const,
  },
  {
    glyph: "▲",
    title: "The Relationship Report",
    cadence: "Quarterly",
    body: "How the power structure shifted — new alliances, broken ones, who moved toward the center and who drifted out. The social physics of the Psycheverse.",
    accent: "violet" as const,
  },
];

const ACCENT: Record<string, string> = {
  gold: "text-accent-gold-text", crimson: "text-accent-crimson", cyan: "text-accent-cyan", violet: "text-accent-violet-text",
};

export default async function ReportsPage() {
  const user = await getCurrentUser();
  const hasAccess = user
    ? user.role === "admin" || (await isSubscribed(user.id).catch(() => false))
    : false;

  type GuestRow = {
    slug: string;
    displayName: string;
    avatarUrl: string | null;
    _count: { guestAppearances: number };
  };
  const guestSelect = {
    slug: true,
    displayName: true,
    avatarUrl: true,
    _count: { select: { guestAppearances: true } },
  } as const;

  // Two fetches, then curate in-process (dedup + pin), because "who's listed"
  // is an editorial decision, not just a rank:
  //  - ranked candidates, over-fetched so parenthetical variants ("Psyche
  //    (Trix)") and junk names can be folded out without leaving the grid short
  //  - pinned people fetched by name IGNORING personType, so a pin always lands
  //    even if that figure is typed `mentioned` rather than `guest`/`recurring`
  const [ranked, pinnedRows] = await Promise.all([
    prisma.person
      .findMany({
        where: { personType: { in: ["guest", "host", "recurring"] } },
        select: guestSelect,
        orderBy: { guestAppearances: { _count: "desc" } },
        take: 40,
      })
      .catch(() => [] as GuestRow[]),
    prisma.person
      .findMany({
        where: {
          OR: PINNED_REPORT_PEOPLE.map((name) => ({
            displayName: { equals: name, mode: "insensitive" as const },
          })),
        },
        select: guestSelect,
      })
      .catch(() => [] as GuestRow[]),
  ]);

  const topGuests = curateReportPeople(ranked, pinnedRows, PINNED_REPORT_PEOPLE, 9);

  return (
    <>
      <PageHero
        title="CODEX REPORTS"
        subtitle="The archive, synthesized into intelligence."
        backgroundImage="/hero-bg.jpg"
        label="reports"
      />

      <main id="main-content" className="mx-auto max-w-4xl px-4 py-12 space-y-16">

        {/* Intro */}
        <section className="max-w-2xl mx-auto text-center space-y-4">
          <div className="flex justify-center text-accent-gold-text"><CodexSigil size={48} glow /></div>
          <p className="text-sm text-text-muted leading-relaxed">
            The archive holds {topGuests.length > 0 ? "thousands of hours" : "everything"} of raw
            material. <span className="text-text-primary font-semibold">Reports</span> turn it into
            something you can use — behavioral profiles, conflict maps, pattern analyses, synthesized
            by AI from the full corpus and cited back to the source.
          </p>
          {!hasAccess && (
            <p className="font-mono text-[11px] text-accent-gold-text/70">
              An Initiate+ feature · $10/mo
            </p>
          )}
        </section>

        {/* Guest Intelligence Reports */}
        <section className="space-y-5">
          <div className="text-center space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-cyan/60">
              {"/// guest_intelligence_reports"}
            </p>
            <h2 className="font-display text-xl font-bold text-text-primary">Every recurring figure has a signature.</h2>
            <p className="font-mono text-[11px] text-text-muted max-w-xl mx-auto leading-relaxed">
              Not a bio — a behavioral dossier. Tactics, escalation triggers, alliances, and how they
              act under pressure, traced across every appearance.
            </p>
          </div>

          {topGuests.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {topGuests.map((g) => {
                const card = (
                  <div className="group relative h-full rounded-xl border border-border bg-surface p-4 transition-all hover:border-accent-cyan/40 hover:-translate-y-0.5">
                    <div className="flex items-center gap-3">
                      {g.avatarUrl ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border">
                          <Image src={g.avatarUrl} alt={g.displayName} fill className="object-cover" sizes="40px" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-elevated font-mono text-sm text-text-muted">
                          {g.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs font-bold text-text-primary">{g.displayName}</p>
                        <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted/50">
                          {g._count.guestAppearances} appearance{g._count.guestAppearances === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                    <p className={`mt-3 font-mono text-[10px] uppercase tracking-widest ${hasAccess ? "text-accent-cyan/70" : "text-text-muted/60"}`}>
                      {hasAccess ? "Open report →" : "🔒 Initiate+"}
                    </p>
                  </div>
                );
                return (
                  <Link key={g.slug} href={`/reports/${g.slug}`} className="block h-full">{card}</Link>
                );
              })}
            </div>
          )}

          {!hasAccess && (
            <div className="rounded-xl border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-surface p-6 text-center space-y-3">
              <p className="font-mono text-[11px] text-text-muted max-w-md mx-auto leading-relaxed">
                Full Guest Intelligence Reports — behavioral signatures, appearance histories, and
                pattern analysis — open with Initiate+.
              </p>
              <Link href="/premium" className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-2.5 font-mono text-xs font-bold text-accent-gold-text transition-all hover:bg-accent-gold/25">
                Unlock the reports — $10/mo →
              </Link>
            </div>
          )}
        </section>

        <MysticalDivider />

        {/* Codex Reports */}
        <section className="space-y-5">
          <div className="text-center space-y-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-accent-gold-text/60">
              {"/// codex_reports"}
            </p>
            <h2 className="font-display text-xl font-bold text-text-primary">Standing intelligence on the archive.</h2>
            <p className="font-mono text-[11px] text-text-muted max-w-xl mx-auto leading-relaxed">
              Recurring AI syntheses that watch the whole archive so you don&apos;t have to.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {CODEX_REPORTS.map((r) => (
              <div key={r.title} className="rounded-xl border border-border bg-surface p-5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg ${ACCENT[r.accent]}`}>{r.glyph}</span>
                    <h3 className="font-display text-base font-bold text-text-primary">{r.title}</h3>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-text-muted/60">{r.cadence}</span>
                </div>
                <p className="font-mono text-[11px] text-text-muted leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        {!hasAccess ? (
          <section className="rounded-2xl border border-accent-gold/40 bg-gradient-to-b from-[#1a0033] via-[#0d001a] to-[#0d001a] p-8 text-center space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-accent-cyan/70">✦ &nbsp; intelligence on demand &nbsp; ✦</p>
            <h3 className="font-display text-2xl font-bold text-accent-gold">Stop scrubbing. Start reading the reports.</h3>
            <p className="font-mono text-[11px] text-text-muted max-w-sm mx-auto leading-relaxed">
              Initiate+ opens Guest Intelligence Reports, the Oracle, full transcripts, and the
              Psychenomicon — for $10/month.
            </p>
            <Link href="/premium" className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-7 py-3 font-mono text-sm font-bold text-accent-gold-text transition-all hover:bg-accent-gold/25">
              Become Initiate+ →
            </Link>
          </section>
        ) : (
          <section className="rounded-2xl border border-accent-violet/30 bg-gradient-to-b from-accent-violet/5 to-surface p-6 text-center space-y-3">
            <h3 className="font-display text-lg font-bold text-text-primary">Want a report run on demand?</h3>
            <p className="font-mono text-[11px] text-text-muted max-w-md mx-auto leading-relaxed">
              Ask the Oracle for a behavioral profile, a conflict timeline, or a pattern analysis —
              it answers from the full archive with citations.
            </p>
            <Link href="/oracle" className="inline-flex items-center gap-2 rounded-lg border border-accent-violet bg-accent-violet/15 px-6 py-3 font-mono text-xs font-bold text-accent-violet-text transition-all hover:bg-accent-violet/25">
              Ask the Oracle →
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
