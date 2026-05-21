import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { semanticSearch } from "@/lib/queries/semantic";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface EpisodeCrossRefProps {
  episodeId: string;
  concept: string;
}

export async function EpisodeCrossRef({ episodeId, concept }: EpisodeCrossRefProps) {
  if (!concept?.trim()) return null;

  let results;
  try {
    results = await semanticSearch(
      [{ concept: concept.slice(0, 300), threshold: 0.58 }],
      { limit: 5, excludeEpisodeId: episodeId }
    );
  } catch {
    return null;
  }

  if (results.length === 0) return null;

  return (
    <SectionCard title="Echoes from the Archive" accent="violet">
      <p className="mb-3 font-mono text-[10px] text-text-muted">
        Moments in other episodes that resonate with this one
      </p>
      <div className="space-y-3">
        {results.map((r) => (
          <div key={r.segmentId} className="group">
            <Link
              href={`/episodes/${r.episodeSlug}?t=${r.startSeconds}`}
              className="block space-y-0.5"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="line-clamp-1 text-[11px] font-medium text-violet-300 transition-colors group-hover:text-violet-200">
                  {r.episodeTitle}
                </span>
                <span className="shrink-0 font-mono text-[9px] text-text-muted">
                  {formatTime(r.startSeconds)}
                </span>
              </div>
              <p className="line-clamp-2 text-[11px] leading-relaxed text-text-muted">
                {r.text}
              </p>
            </Link>
          </div>
        ))}
      </div>
      <Link
        href={`/search/deep?concept=${encodeURIComponent(concept.slice(0, 100))}`}
        className="mt-3 block font-mono text-[10px] text-violet-400/60 transition-colors hover:text-violet-400"
      >
        Search deeper →
      </Link>
    </SectionCard>
  );
}
