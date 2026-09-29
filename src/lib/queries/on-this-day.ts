import { prisma } from "@/lib/db";
import { frontDoorTextExclusions } from "@/lib/content-hygiene";

export interface MonthDay {
  month: number; // 1-12
  day: number; // 1-31
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // leap-year Feb: 02-29 is a real date

/** "09-25" → { month: 9, day: 25 }; anything else → null. */
export function parseMonthDay(value: string | undefined | null): MonthDay | null {
  const m = value?.match(/^(\d{2})-(\d{2})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  if (month < 1 || month > 12 || day < 1 || day > DAYS_IN_MONTH[month - 1]) return null;
  return { month, day };
}

export function formatMonthDay({ month, day }: MonthDay): string {
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function monthDayLabel({ month, day }: MonthDay): string {
  return `${MONTHS[month - 1]} ${day}`;
}

/** Today in UTC, the zone air dates are stored in. */
export function todayMonthDay(now = new Date()): MonthDay {
  return { month: now.getUTCMonth() + 1, day: now.getUTCDate() };
}

/** The calendar day before or after, wrapping the year and keeping Feb 29. */
export function shiftMonthDay({ month, day }: MonthDay, by: 1 | -1): MonthDay {
  if (by === 1) {
    if (day < DAYS_IN_MONTH[month - 1]) return { month, day: day + 1 };
    return { month: month === 12 ? 1 : month + 1, day: 1 };
  }
  if (day > 1) return { month, day: day - 1 };
  const prev = month === 1 ? 12 : month - 1;
  return { month: prev, day: DAYS_IN_MONTH[prev - 1] };
}

export interface OnThisDayEpisode {
  id: string;
  slug: string;
  title: string;
  airDate: Date;
  thumbnailUrl: string | null;
  summaryShort: string | null;
  quote: { id: string; text: string; timestampSeconds: number | null; speaker: string | null } | null;
}

export interface OnThisDayEvent {
  id: string;
  headline: string;
  occurredAt: Date;
  people: { slug: string; displayName: string }[];
  episode: { slug: string; title: string } | null;
}

/**
 * Streams, their best quote, and relationship events from this calendar day in
 * earlier years. "Earlier years" keeps today's own stream out of its anniversary.
 */
export async function getOnThisDay(
  md: MonthDay,
  opts: { take?: number; now?: Date } = {},
): Promise<{ episodes: OnThisDayEpisode[]; events: OnThisDayEvent[] }> {
  const { take = 24, now = new Date() } = opts;
  const thisYear = now.getUTCFullYear();

  const idRows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Episode"
    WHERE status = 'published'
      AND "airDate" IS NOT NULL
      AND EXTRACT(MONTH FROM "airDate") = ${md.month}
      AND EXTRACT(DAY FROM "airDate") = ${md.day}
      AND EXTRACT(YEAR FROM "airDate") < ${thisYear}
    ORDER BY "airDate" DESC
    LIMIT ${take}`;
  const eventRows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "RelationshipEvent"
    WHERE "occurredAt" IS NOT NULL
      AND EXTRACT(MONTH FROM "occurredAt") = ${md.month}
      AND EXTRACT(DAY FROM "occurredAt") = ${md.day}
      AND EXTRACT(YEAR FROM "occurredAt") < ${thisYear}
    ORDER BY "occurredAt" DESC
    LIMIT 12`;

  const [episodes, events] = await Promise.all([
    idRows.length
      ? prisma.episode.findMany({
          where: { id: { in: idRows.map((r) => r.id) } },
          select: {
            id: true, slug: true, title: true, airDate: true, thumbnailUrl: true, summaryShort: true,
            quotes: {
              where: { AND: [{ NOT: { text: { contains: "[ __" } } }, ...frontDoorTextExclusions("text")] },
              select: { id: true, text: true, timestampSeconds: true, speaker: { select: { displayName: true } } },
              orderBy: [{ quoteReactions: { _count: "desc" } }, { createdAt: "asc" }],
              take: 1,
            },
          },
          orderBy: { airDate: "desc" },
        })
      : [],
    eventRows.length
      ? prisma.relationshipEvent.findMany({
          where: { id: { in: eventRows.map((r) => r.id) } },
          select: {
            id: true, headline: true, occurredAt: true,
            personA: { select: { slug: true, displayName: true } },
            personB: { select: { slug: true, displayName: true } },
            episode: { select: { slug: true, title: true, status: true } },
          },
          orderBy: { occurredAt: "desc" },
        })
      : [],
  ]);

  return {
    episodes: episodes.map((e) => ({
      id: e.id, slug: e.slug, title: e.title, airDate: e.airDate!, thumbnailUrl: e.thumbnailUrl, summaryShort: e.summaryShort,
      quote: e.quotes[0]
        ? { id: e.quotes[0].id, text: e.quotes[0].text, timestampSeconds: e.quotes[0].timestampSeconds, speaker: e.quotes[0].speaker?.displayName ?? null }
        : null,
    })),
    events: events.map((ev) => ({
      id: ev.id, headline: ev.headline, occurredAt: ev.occurredAt!,
      people: [ev.personA, ev.personB],
      episode: ev.episode?.status === "published" ? { slug: ev.episode.slug, title: ev.episode.title } : null,
    })),
  };
}
