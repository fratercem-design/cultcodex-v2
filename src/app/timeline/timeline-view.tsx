import { prisma } from "@/lib/db";
import { PageHero } from "@/components/ui/page-hero";
import { cleanTitle } from "@/lib/format/text";
import { formatDate } from "@/lib/format/date";
import Link from "next/link";

interface TimelineEpisode {
  id: string;
  slug: string;
  title: string;
  episodeNumber: number | null;
  airDate: Date | null;
  summaryShort: string | null;
  contentType: string;
  _count: { segments: number; guests: number; quotes: number };
}

/** Year → Month → Day → episodes (all newest-first) */
function groupByYear(episodes: TimelineEpisode[]) {
  const groups = new Map<number, Map<number, Map<number, TimelineEpisode[]>>>();

  for (const ep of episodes) {
    if (!ep.airDate) continue;
    const d = new Date(ep.airDate);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

    if (!groups.has(year)) groups.set(year, new Map());
    const yearMap = groups.get(year)!;
    if (!yearMap.has(month)) yearMap.set(month, new Map());
    const monthMap = yearMap.get(month)!;
    if (!monthMap.has(day)) monthMap.set(day, []);
    monthMap.get(day)!.push(ep);
  }

  return groups;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];


/**
 * Loads the archived years plus one year of episodes.
 *
 * Split out so /timeline and /timeline/[year] render identically. The year is
 * a route SEGMENT rather than a query string on purpose: a `searchParams` page
 * is dynamic, and making this page render on demand would have traded a large
 * document for an uncacheable one - the same mistake the homepage was making.
 * As segments, every year prerenders.
 */
export async function loadTimeline(requestedYear?: number) {
  const [yearRows, undated] = await Promise.all([
    prisma.episode
      .findMany({ where: { airDate: { not: null } }, select: { airDate: true }, orderBy: { airDate: "desc" } })
      .catch(() => []),
    prisma.episode.count({ where: { airDate: null } }).catch(() => 0),
  ]);

  const years = [
    ...new Set(
      yearRows
        .map((r) => r.airDate?.getUTCFullYear())
        .filter((y): y is number => typeof y === "number")
    ),
  ].sort((a, b) => b - a);

  const activeYear = requestedYear && years.includes(requestedYear) ? requestedYear : years[0];

  // `summaryShort` and `contentType` used to be selected here and were never
  // rendered.
  const episodes = activeYear
    ? await prisma.episode
        .findMany({
          where: {
            airDate: {
              gte: new Date(Date.UTC(activeYear, 0, 1)),
              lt: new Date(Date.UTC(activeYear + 1, 0, 1)),
            },
          },
          select: {
            id: true,
            slug: true,
            title: true,
            episodeNumber: true,
            airDate: true,
            _count: { select: { segments: true, guests: true, quotes: true } },
          },
          orderBy: { airDate: "desc" },
        })
        .catch(() => [])
    : [];

  return { years, activeYear, episodes: episodes as TimelineEpisode[], undated };
}

export async function TimelineView({ requestedYear }: { requestedYear?: number }) {
  const { years, activeYear, episodes, undated } = await loadTimeline(requestedYear);
  const yearGroups = groupByYear(episodes);
  const renderedYears = [...yearGroups.keys()].sort((a, b) => b - a);

  return (
    <>
      <PageHero
        title="TIMELINE"
        subtitle={`${episodes.length} episodes in ${activeYear} · ${years.length} years archived`}
        backgroundImage="/articles-bacgkground.jpg"

      label="timeline"
    />
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-8">
        {/* Interactive explorer link */}
        <div className="mb-6 flex justify-center">
          <Link
            href="/timeline/explore"
            className="inline-flex items-center gap-2 rounded-full border border-accent-cyan/30 bg-accent-cyan/5 px-5 py-2 font-mono text-[12px] uppercase tracking-widest text-accent-cyan transition-colors hover:bg-accent-cyan/10"
          >
            ◆ Try the interactive Timeline Explorer →
          </Link>
        </div>

        {/* Year navigation */}
        <nav className="mb-8 flex flex-wrap gap-2">
          {years.map((year) => {
            const isActive = year === activeYear;
            return (
              <Link
                key={year}
                href={year === years[0] ? "/timeline" : `/timeline/${year}`}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "rounded border border-accent-gold/50 bg-accent-gold/10 px-3 py-1.5 font-mono text-xs text-accent-gold-text"
                    : "rounded border border-border bg-surface px-3 py-1.5 font-mono text-xs text-text-muted transition-colors hover:border-accent-gold/30 hover:text-accent-gold-text"
                }
              >
                {year}
              </Link>
            );
          })}
        </nav>

        {/* Timeline */}
        <div className="relative">
          {/* Central line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-accent-gold/50 via-accent-cyan/30 to-accent-violet/50" />

          {renderedYears.map((year) => {
            const monthMap = yearGroups.get(year)!;
            const months = [...monthMap.keys()].sort((a, b) => b - a);
            const yearTotal = months.reduce((sum, m) => {
              const dayMap = monthMap.get(m)!;
              return sum + [...dayMap.values()].reduce((s, d) => s + d.length, 0);
            }, 0);

            return (
              <section key={year} id={`year-${year}`} className="mb-10 scroll-mt-20">
                {/* Year marker */}
                <div className="relative mb-4 flex items-center gap-3 pl-10">
                  <div className="absolute left-[10px] h-3 w-3 rounded-full border-2 border-accent-gold bg-void" />
                  <h2 className="font-display text-2xl font-bold text-accent-gold">{year}</h2>
                  <span className="font-mono text-xs text-text-muted">
                    {yearTotal} episode{yearTotal !== 1 ? "s" : ""}
                  </span>
                </div>

                {months.map((month) => {
                  const dayMap = monthMap.get(month)!;
                  const days = [...dayMap.keys()].sort((a, b) => b - a);
                  const monthTotal = days.reduce((sum, d) => sum + dayMap.get(d)!.length, 0);

                  return (
                    <div key={month} className="relative mb-4 pl-10">
                      {/* Month dot */}
                      <div className="absolute left-[13px] top-1 h-1.5 w-1.5 rounded-full bg-accent-cyan" />

                      <h3 className="mb-2 font-display text-sm font-semibold text-accent-cyan">
                        {MONTH_NAMES[month]}
                        <span className="ml-2 font-mono text-[12px] font-normal text-text-muted">
                          ({monthTotal})
                        </span>
                      </h3>

                      {days.map((day) => {
                        const eps = dayMap.get(day)!;
                        const showDayHeader = days.length > 1 || eps.length > 1;

                        return (
                          <div key={day} className="mb-2">
                            {showDayHeader && (
                              <div className="mb-1 ml-1 font-mono text-[12px] text-text-muted">
                                {MONTH_NAMES[month].slice(0, 3)} {day}
                              </div>
                            )}
                            <div className="grid gap-1.5">
                              {eps.map((ep) => {
                                const epNum = ep.episodeNumber
                                  ? `EP.${String(ep.episodeNumber).padStart(3, "0")}`
                                  : null;

                                return (
                                  <Link
                                    key={ep.id}
                                    href={`/episodes/${ep.slug}`}
                                    className="group flex items-baseline gap-2 rounded border border-transparent px-2 py-1 transition-colors hover:border-border hover:bg-surface"
                                  >
                                    {epNum && (
                                      <span className="flex-shrink-0 font-mono text-[12px] font-bold text-accent-gold-text">
                                        {epNum}
                                      </span>
                                    )}
                                    <span className="flex-shrink-0 font-mono text-[12px] text-text-muted">
                                      {formatDate(ep.airDate)}
                                    </span>
                                    <span className="text-sm text-text-primary group-hover:text-accent-gold-text transition-colors truncate">
                                      {cleanTitle(ep.title)}
                                    </span>
                                    {/* Indicators */}
                                    <span className="ml-auto flex flex-shrink-0 items-center gap-1.5">
                                      {ep._count.segments > 0 && (
                                        <span className="font-mono text-[12px] text-accent-cyan/60" title="Has transcript">
                                          TXT
                                        </span>
                                      )}
                                      {ep._count.quotes > 0 && (
                                        <span className="font-mono text-[12px] text-accent-gold-text/80" title={`${ep._count.quotes} quotes`}>
                                          Q{ep._count.quotes}
                                        </span>
                                      )}
                                      {ep._count.guests > 0 && (
                                        <span className="font-mono text-[12px] text-accent-violet-text/70" title={`${ep._count.guests} guests`}>
                                          G{ep._count.guests}
                                        </span>
                                      )}
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </section>
            );
          })}

          {undated > 0 && (
            <p className="pl-10 font-mono text-xs text-text-muted">
              + {undated} undated episode{undated !== 1 ? "s" : ""} not shown
            </p>
          )}
        </div>
      </main>
    </>
  );
}
