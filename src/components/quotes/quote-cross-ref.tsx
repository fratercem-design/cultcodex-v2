import Link from "next/link";
import { semanticSearch } from "@/lib/queries/semantic";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface QuoteCrossRefProps {
  quoteText: string;
  excludeEpisodeId?: string;
}

export async function QuoteCrossRef({ quoteText, excludeEpisodeId }: QuoteCrossRefProps) {
  if (!quoteText?.trim()) return null;

  let results;
  try {
    results = await semanticSearch(
      [{ concept: quoteText.slice(0, 400), threshold: 0.62 }],
      { limit: 4, excludeEpisodeId }
    );
  } catch {
    return null;
  }

  if (results.length === 0) return null;

  return (
    <section className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
        {"/// resonant_moments"}
      </p>
      <p className="font-mono text-[11px] text-text-muted">
        Where this idea echoes elsewhere in the archive
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {results.map((r) => (
          <Link
            key={r.segmentId}
            href={`/episodes/${r.episodeSlug}?t=${r.startSeconds}`}
            className="group rounded-lg border border-border bg-surface p-4 hover:border-accent-violet/30 hover:bg-accent-violet/5 transition-colors space-y-2"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="line-clamp-1 font-mono text-[10px] text-accent-violet-text/80 group-hover:text-accent-violet-text transition-colors">
                {r.episodeNumber != null
                  ? `EP.${String(r.episodeNumber).padStart(3, "0")}`
                  : r.episodeTitle}
              </span>
              <span className="shrink-0 font-mono text-[9px] text-text-muted/60">
                {formatTime(r.startSeconds)}
              </span>
            </div>
            <p className="font-sans text-xs text-text-primary leading-snug line-clamp-3 italic">
              &ldquo;{r.text}&rdquo;
            </p>
            {r.episodeNumber != null && (
              <p className="font-mono text-[9px] text-text-muted line-clamp-1">
                {r.episodeTitle}
              </p>
            )}
          </Link>
        ))}
      </div>
      <Link
        href={`/search/deep?concept=${encodeURIComponent(quoteText.slice(0, 100))}`}
        className="font-mono text-[10px] text-accent-violet-text/50 hover:text-accent-violet-text transition-colors"
      >
        Search deeper in the archive →
      </Link>
    </section>
  );
}
