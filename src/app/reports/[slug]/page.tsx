import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import { getPersonBySlug, getCoAppearances } from "@/lib/queries/people";
import { getCurrentUser } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { formatDate } from "@/lib/format/date";
import { cleanTitle } from "@/lib/format/text";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPersonBySlug(slug).catch(() => null);
  return buildMetadata({
    title: person ? `${person.displayName} — Guest Intelligence Report` : "Report Not Found",
    description: person
      ? `Behavioral intelligence report on ${person.displayName}: appearances, recurring patterns, key quotes, and frequent collaborators across the Cult of Psyche archive.`
      : "This report does not exist.",
    path: `/reports/${slug}`,
  });
}

function LockedCard({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 text-center space-y-2">
      <p className="text-3xl text-text-muted/20" aria-hidden="true">🔒</p>
      <p className="font-mono text-[11px] text-text-muted">{label}</p>
      <Link href="/premium" className="inline-block font-mono text-[10px] uppercase tracking-widest text-accent-gold hover:underline">
        Unlock with Initiate+ →
      </Link>
    </div>
  );
}

export default async function GuestReportPage({ params }: Props) {
  const { slug } = await params;
  const person = await getPersonBySlug(slug).catch(() => null);
  if (!person) notFound();

  const user = await getCurrentUser();
  const hasAccess = user
    ? user.role === "admin" || (await isSubscribed(user.id).catch(() => false))
    : false;

  const appearances = person.guestAppearances ?? [];
  const dated = appearances
    .map((a) => a.episode)
    .filter((e): e is NonNullable<typeof e> => Boolean(e?.airDate));
  const latest = dated[0]?.airDate ?? null;
  const earliest = person.firstAppearanceEpisode?.airDate ?? dated[dated.length - 1]?.airDate ?? null;
  const totalAppearances = appearances.length;
  const topics = (person.topics ?? []).slice(0, 10);
  const quotes = (person.quotes ?? []).filter((q) => q.text && q.text.length > 30).slice(0, 5);

  const coStars = hasAccess ? await getCoAppearances(person.id, 6).catch(() => []) : [];

  const spanLabel =
    earliest && latest
      ? `${formatDate(earliest)} → ${formatDate(latest)}`
      : "—";

  return (
    <>
      <PageHero
        title={person.displayName.toUpperCase()}
        subtitle="Guest Intelligence Report"
        backgroundImage="/hero-bg.jpg"
        label="report"
      />

      <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 space-y-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
          <Link href="/reports" className="hover:text-accent-gold transition-colors">Codex Reports</Link>
          <span className="mx-2">/</span>
          <span className="text-accent-cyan">{person.displayName}</span>
        </nav>

        {/* Subject header + always-visible stats */}
        <section className="flex flex-col sm:flex-row items-center gap-5 rounded-2xl border border-border bg-surface p-6">
          {person.avatarUrl ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-accent-cyan/30">
              <Image src={person.avatarUrl} alt={person.displayName} fill className="object-cover" sizes="80px" />
            </div>
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-2 border-accent-cyan/30 bg-elevated font-display text-2xl text-text-muted">
              {person.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 flex-1 text-center sm:text-left">
            <div>
              <p className="font-display text-2xl font-bold text-accent-gold">{totalAppearances}</p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted/60">Appearances</p>
            </div>
            <div className="col-span-2">
              <p className="font-mono text-sm text-text-primary">{spanLabel}</p>
              <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted/60">Active span</p>
            </div>
          </div>
        </section>

        {/* Gate notice for non-members */}
        {!hasAccess && (
          <section className="rounded-xl border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-surface p-5 text-center space-y-2">
            <p className="font-mono text-[11px] text-text-muted leading-relaxed max-w-md mx-auto">
              The full behavioral report — key quotes, recurring patterns, and frequent collaborators —
              opens with Initiate+.
            </p>
            <Link href="/premium" className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-5 py-2.5 font-mono text-xs font-bold text-accent-gold transition-all hover:bg-accent-gold/25">
              Unlock the report — $10/mo →
            </Link>
          </section>
        )}

        {/* Recurring signals */}
        <section className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-cyan/60">{"/// recurring_signals"}</p>
          {hasAccess ? (
            topics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {topics.map((t) => (
                  <Link
                    key={t.topic.slug}
                    href={`/topics/${t.topic.slug}`}
                    className="rounded-full border border-border px-3 py-1.5 font-mono text-[11px] text-accent-cyan hover:border-accent-cyan/40 transition-colors"
                  >
                    {t.topic.title}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="font-mono text-xs text-text-muted/50 italic">No signals tagged for this figure yet.</p>
            )
          ) : (
            <LockedCard label="Recurring themes and signals tied to this figure." />
          )}
        </section>

        {/* Key quotes */}
        <section className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60">{"/// on_the_record"}</p>
          {hasAccess ? (
            quotes.length > 0 ? (
              <div className="space-y-3">
                {quotes.map((q) => (
                  <blockquote key={q.id} className="rounded-xl border border-border bg-surface p-4 font-serif text-[15px] text-text-primary leading-relaxed">
                    &ldquo;{q.text}&rdquo;
                  </blockquote>
                ))}
              </div>
            ) : (
              <p className="font-mono text-xs text-text-muted/50 italic">No quotes captured yet.</p>
            )
          ) : (
            <LockedCard label="Key quotes and on-the-record moments." />
          )}
        </section>

        {/* Frequent collaborators */}
        <section className="space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet/60">{"/// frequent_collaborators"}</p>
          {hasAccess ? (
            coStars.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {coStars.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/reports/${c.slug}`}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 transition-all hover:border-accent-violet/40"
                  >
                    {c.avatarUrl ? (
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border">
                        <Image src={c.avatarUrl} alt={c.displayName} fill className="object-cover" sizes="32px" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-elevated font-mono text-xs text-text-muted">
                        {c.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="min-w-0 flex-1 truncate font-mono text-xs text-text-primary group-hover:text-accent-violet transition-colors">{c.displayName}</span>
                    <span className="shrink-0 font-mono text-[9px] text-text-muted/50">{c.sharedEpisodes}×</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="font-mono text-xs text-text-muted/50 italic">Not enough shared appearances to map collaborators.</p>
            )
          ) : (
            <LockedCard label="Who this figure appears with most — the collaboration map." />
          )}
        </section>

        {/* Appearances */}
        {hasAccess && dated.length > 0 && (
          <section className="space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">{"/// appearance_log"}</p>
            <div className="space-y-2">
              {dated.slice(0, 12).map((e) => (
                <Link
                  key={e.id}
                  href={`/episodes/${e.slug}`}
                  className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5 transition-all hover:border-accent-gold/30"
                >
                  {e.episodeNumber != null && (
                    <span className="shrink-0 font-mono text-[10px] font-bold text-accent-gold/70">EP.{String(e.episodeNumber).padStart(3, "0")}</span>
                  )}
                  <span className="min-w-0 flex-1 truncate text-sm text-text-primary group-hover:text-accent-gold transition-colors">{cleanTitle(e.title)}</span>
                  {e.airDate && <span className="shrink-0 font-mono text-[10px] text-text-muted/50">{formatDate(e.airDate)}</span>}
                </Link>
              ))}
            </div>
          </section>
        )}

        <MysticalDivider />

        <section className="flex flex-wrap items-center justify-center gap-3">
          <Link href={`/people/${person.slug}`} className="font-mono text-[11px] uppercase tracking-widest text-text-muted hover:text-accent-gold transition-colors">
            Full profile →
          </Link>
          {hasAccess && (
            <Link href="/oracle" className="font-mono text-[11px] uppercase tracking-widest text-accent-violet hover:text-accent-violet/80 transition-colors">
              Ask the Oracle about {person.displayName} →
            </Link>
          )}
        </section>
      </main>
    </>
  );
}
