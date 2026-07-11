import type { Metadata } from "next";
import Link from "next/link";
import { getDailyTransmission } from "@/lib/queries/daily";
import { cleanTranscriptText } from "@/lib/format/text";
import { formatDate } from "@/lib/format/date";
import { ShareSignalButton } from "@/components/home/share-signal-button";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { date, quote } = await getDailyTransmission().catch(() => ({
    date: new Date().toISOString().slice(0, 10),
    quote: null,
    spotlightEpisode: null,
    pulse: { newEpisodes: 0, newLoreEntries: 0, newQuotes: 0, activeThreads: 0 },
  }));

  const description = quote
    ? `"${cleanTranscriptText(quote.text).slice(0, 160)}"${quote.speaker ? ` — ${quote.speaker.displayName}` : ""}`
    : "The daily transmission from the CultCodex archive.";

  return {
    title: `Today's Signal — ${date} — CultCodex`,
    description,
    alternates: { canonical: "/signal" },
    openGraph: {
      title: "Today's Signal — CultCodex",
      description,
      type: "website",
      url: "/signal",
    },
    twitter: {
      card: "summary_large_image",
      title: "Today's Signal — CultCodex",
      description,
    },
  };
}

export default async function SignalPage() {
  const data = await getDailyTransmission().catch(() => null);
  const quote = data?.quote ?? null;
  const episode = quote?.episode ?? data?.spotlightEpisode ?? null;

  return (
    <main id="main-content" className="mx-auto max-w-2xl px-4 py-16 space-y-8 text-center">
      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-accent-gold/70">
          ✦ today&rsquo;s signal ✦
        </p>
        {data && (
          <p className="font-mono text-[10px] text-text-muted/50 tabular-nums">
            transmission #{data.date.replace(/-/g, "")}
          </p>
        )}
      </div>

      {quote ? (
        <div className="space-y-5">
          <blockquote className="font-display text-2xl sm:text-3xl leading-snug text-text-primary italic">
            &ldquo;{cleanTranscriptText(quote.text)}&rdquo;
          </blockquote>
          <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-xs text-text-muted">
            {quote.speaker && <span className="text-accent-gold">{quote.speaker.displayName}</span>}
            {quote.speaker && episode && <span className="opacity-50">·</span>}
            {episode && (
              <Link href={`/episodes/${episode.slug}`} className="hover:text-accent-gold transition-colors">
                {episode.episodeNumber != null ? `EP.${String(episode.episodeNumber).padStart(3, "0")} · ` : ""}
                {episode.title}
              </Link>
            )}
          </div>
          {episode?.airDate && (
            <p className="font-mono text-[10px] text-text-muted/50">{formatDate(episode.airDate)}</p>
          )}
        </div>
      ) : (
        <p className="font-mono text-sm text-text-muted">The vault is quiet today.</p>
      )}

      <div className="flex flex-col items-center gap-3 pt-4">
        <ShareSignalButton hasQuote={!!quote} />
        <Link href="/" className="font-mono text-[11px] text-text-muted hover:text-accent-gold transition-colors underline underline-offset-4">
          ← back to the archive
        </Link>
      </div>
    </main>
  );
}
