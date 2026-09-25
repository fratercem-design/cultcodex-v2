import Link from "next/link";
import { formatSeconds } from "@/lib/format/duration";
import { momentPath } from "@/lib/format/moment";
import { monthDayLabel, type MonthDay, type OnThisDayEpisode } from "@/lib/queries/on-this-day";

/** Homepage strip: up to three past streams from today's date, newest year first. */
export function OnThisDayStrip({ day, episodes }: { day: MonthDay; episodes: OnThisDayEpisode[] }) {
  if (episodes.length === 0) return null;
  const shown = episodes.slice(0, 3);
  return (
    <section aria-labelledby="on-this-day-heading" className="space-y-4 border-t border-line pt-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="on-this-day-heading" className="font-display text-2xl font-bold text-ink">
          <span className="block font-mono text-[12px] font-normal uppercase tracking-[0.08em] text-ink-3">
            {"///"} {monthDayLabel(day)}, in years past
          </span>
          On this day
        </h2>
        <Link href="/on-this-day" className="text-[15px] text-ink underline underline-offset-4 hover:text-brand-ink">
          {episodes.length > shown.length ? `All ${episodes.length} →` : "More →"}
        </Link>
      </div>
      <ol className="grid gap-3 sm:grid-cols-3">
        {shown.map((ep) => (
          <li key={ep.id} className="border border-line p-4">
            <p className="font-mono text-[13px] font-bold text-brand-ink">{ep.airDate.getUTCFullYear()}</p>
            <Link href={`/episodes/${ep.slug}`} className="mt-1 block font-display text-lg font-semibold text-ink hover:underline hover:underline-offset-4">
              {ep.title}
            </Link>
            {ep.quote && (
              <Link href={momentPath(ep.slug, ep.quote.timestampSeconds)} className="group mt-2 block text-[14px] leading-relaxed text-ink-2">
                <span className="line-clamp-3">“{ep.quote.text}”</span>
                <span className="mt-1 block font-mono text-[12px] text-ink-3 group-hover:text-brand-ink">
                  {ep.quote.speaker ?? "Unknown"}
                  {ep.quote.timestampSeconds != null && ` · ▶ ${formatSeconds(ep.quote.timestampSeconds)}`}
                </span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
