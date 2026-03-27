import { prisma } from "@/lib/db";
import { PageHero } from "@/components/ui/page-hero";
import { cleanTitle } from "@/lib/format/text";
import { formatDate } from "@/lib/format/date";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Timeline — CULT CODEX",
  description: "A chronological journey through every Cult of Psyche episode",
};

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

function groupByYear(episodes: TimelineEpisode[]) {
  const groups = new Map<number, Map<number, TimelineEpisode[]>>();

  for (const ep of episodes) {
    if (!ep.airDate) continue;
    const d = new Date(ep.airDate);
    const year = d.getFullYear();
    const month = d.getMonth();

    if (!groups.has(year)) groups.set(year, new Map());
    const yearMap = groups.get(year)!;
    if (!yearMap.has(month)) yearMap.set(month, []);
    yearMap.get(month)!.push(ep);
  }

  return groups;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function TimelinePage() {
  const episodes = await prisma.episode.findMany({
    where: { airDate: { not: null } },
    select: {
      id: true,
      slug: true,
      title: true,
      episodeNumber: true,
      airDate: true,
      summaryShort: true,
      contentType: true,
      _count: { select: { segments: true, guests: true, quotes: true } },
    },
    orderBy: { airDate: "asc" },
  });

  const undated = await prisma.episode.count({ where: { airDate: null } });
  const yearGroups = groupByYear(episodes as TimelineEpisode[]);
  const years = [...yearGroups.keys()].sort((a, b) => b - a);

  return (
    <>
      <PageHero
        title="TIMELINE"
        subtitle={`${episodes.length} episodes across ${years.length} years`}
        backgroundImage="/articles-bacgkground.jpg"
      />
      <main id="main-content" className="mx-auto max-w-5xl px-4 py-8">
        {/* Year navigation */}
        <nav className="mb-8 flex flex-wrap gap-2">
          {years.map((year) => (
            <a
              key={year}
              href={`#year-${year}`}
              className="rounded border border-border bg-surface px-3 py-1.5 font-mono text-xs text-text-muted transition-colors hover:border-accent-gold/30 hover:text-accent-gold"
            >
              {year}
            </a>
          ))}
        </nav>

        {/* Timeline */}
        <div className="relative">
          {/* Central line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-accent-gold/50 via-accent-purple/30 to-accent-green/50" />

          {years.map((year) => {
            const monthMap = yearGroups.get(year)!;
            const months = [...monthMap.keys()].sort((a, b) => b - a);
            const yearTotal = months.reduce((sum, m) => sum + monthMap.get(m)!.length, 0);

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
                  const eps = monthMap.get(month)!;

                  return (
                    <div key={month} className="relative mb-4 pl-10">
                      {/* Month dot */}
                      <div className="absolute left-[13px] top-1 h-1.5 w-1.5 rounded-full bg-accent-purple" />

                      <h3 className="mb-2 font-display text-sm font-semibold text-accent-purple">
                        {MONTH_NAMES[month]}
                        <span className="ml-2 font-mono text-[10px] font-normal text-text-muted">
                          ({eps.length})
                        </span>
                      </h3>

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
                                <span className="flex-shrink-0 font-mono text-[10px] font-bold text-accent-green">
                                  {epNum}
                                </span>
                              )}
                              <span className="flex-shrink-0 font-mono text-[10px] text-text-muted">
                                {formatDate(ep.airDate)}
                              </span>
                              <span className="text-sm text-text-primary group-hover:text-accent-green transition-colors truncate">
                                {cleanTitle(ep.title)}
                              </span>
                              {/* Indicators */}
                              <span className="ml-auto flex flex-shrink-0 items-center gap-1.5">
                                {ep._count.segments > 0 && (
                                  <span className="font-mono text-[9px] text-accent-green/60" title="Has transcript">
                                    TXT
                                  </span>
                                )}
                                {ep._count.quotes > 0 && (
                                  <span className="font-mono text-[9px] text-accent-gold/60" title={`${ep._count.quotes} quotes`}>
                                    Q{ep._count.quotes}
                                  </span>
                                )}
                                {ep._count.guests > 0 && (
                                  <span className="font-mono text-[9px] text-accent-purple/60" title={`${ep._count.guests} guests`}>
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
