import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { formatSeconds } from "@/lib/format/duration";
import { fixThumbnailUrl } from "@/lib/format/thumbnail";
import { momentPath } from "@/lib/format/moment";
import {
  formatMonthDay,
  getOnThisDay,
  monthDayLabel,
  parseMonthDay,
  shiftMonthDay,
  todayMonthDay,
} from "@/lib/queries/on-this-day";

export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<{ date?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { date } = await searchParams;
  const day = parseMonthDay(date) ?? todayMonthDay();
  return {
    alternates: { canonical: date ? `/on-this-day?date=${formatMonthDay(day)}` : "/on-this-day" },
    title: `On This Day: ${monthDayLabel(day)} — CULT CODEX`,
    description: `Streams, quotes and feuds from ${monthDayLabel(day)} in Cult of Psyche history.`,
  };
}

export default async function OnThisDayPage({ searchParams }: PageProps) {
  const { date } = await searchParams;
  const today = todayMonthDay();
  const day = parseMonthDay(date) ?? today;
  const isToday = day.month === today.month && day.day === today.day;
  const prev = shiftMonthDay(day, -1);
  const next = shiftMonthDay(day, 1);
  // Prerendering runs without a database; an empty day is the honest fallback.
  const { episodes, events } = await getOnThisDay(day).catch(() => ({ episodes: [], events: [] }));

  const dayHref = (d: typeof day) =>
    d.month === today.month && d.day === today.day ? "/on-this-day" : `/on-this-day?date=${formatMonthDay(d)}`;

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-10">
      <header className="space-y-3 text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">
          {"/// on_this_day"}{isToday ? " · today" : ""}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-text-primary">{monthDayLabel(day)}</h1>
        <p className="text-sm text-text-muted">
          What the archive was doing on this date in years past.
        </p>
        <nav className="flex items-center justify-center gap-4 pt-1 font-mono text-[12px]" aria-label="Change day">
          <Link href={dayHref(prev)} className="text-text-muted hover:text-accent-gold-text transition-colors">
            ← {monthDayLabel(prev)}
          </Link>
          {!isToday && (
            <Link href="/on-this-day" className="text-text-muted hover:text-accent-gold-text transition-colors">
              Today
            </Link>
          )}
          <Link href={dayHref(next)} className="text-text-muted hover:text-accent-gold-text transition-colors">
            {monthDayLabel(next)} →
          </Link>
        </nav>
      </header>

      {episodes.length === 0 && events.length === 0 ? (
        <p className="mt-12 rounded border border-border bg-surface px-6 py-12 text-center text-sm text-text-muted">
          Nothing in the archive for {monthDayLabel(day)} yet. Try the day before or after.
        </p>
      ) : (
        <ol className="mt-10 space-y-4">
          {episodes.map((ep) => (
            <li key={ep.id} className="flex gap-4 rounded border border-border bg-surface p-4">
              {ep.thumbnailUrl && (
                <div className="relative hidden h-20 w-32 flex-shrink-0 overflow-hidden rounded border border-border sm:block">
                  <Image src={fixThumbnailUrl(ep.thumbnailUrl)!} alt="" fill sizes="128px" className="object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="font-mono text-[12px] font-bold text-accent-gold-text">{ep.airDate.getUTCFullYear()}</p>
                <Link href={`/episodes/${ep.slug}`} className="block font-display text-lg font-bold text-text-primary hover:text-accent-gold-text transition-colors">
                  {ep.title}
                </Link>
                {ep.quote ? (
                  <Link href={momentPath(ep.slug, ep.quote.timestampSeconds)} className="group block text-sm text-text-muted">
                    <span className="line-clamp-2">“{ep.quote.text}”</span>
                    <span className="font-mono text-[12px] group-hover:text-accent-gold-text">
                      {ep.quote.speaker ?? "Unknown"}
                      {ep.quote.timestampSeconds != null && ` · ▶ ${formatSeconds(ep.quote.timestampSeconds)}`}
                    </span>
                  </Link>
                ) : (
                  ep.summaryShort && <p className="line-clamp-2 text-sm text-text-muted">{ep.summaryShort}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}

      {events.length > 0 && (
        <section className="mt-10 border-t border-border pt-8">
          <h2 className="font-mono text-[12px] uppercase tracking-[0.12em] text-red-400/70">{"/// feuds_and_turns"}</h2>
          <ul className="mt-4 space-y-3">
            {events.map((ev) => (
              <li key={ev.id} className="rounded border border-red-500/20 bg-red-500/5 p-4">
                <p className="font-mono text-[12px] text-red-400/70">
                  {ev.occurredAt.getUTCFullYear()} ·{" "}
                  {ev.people.map((p, i) => (
                    <span key={p.slug}>
                      {i > 0 && " × "}
                      <Link href={`/people/${p.slug}`} className="hover:text-red-300">{p.displayName}</Link>
                    </span>
                  ))}
                </p>
                <p className="mt-1 text-sm text-text-primary">{ev.headline}</p>
                {ev.episode && (
                  <Link href={`/episodes/${ev.episode.slug}`} className="mt-1 block font-mono text-[12px] text-text-muted hover:text-accent-gold-text">
                    {ev.episode.title} →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
