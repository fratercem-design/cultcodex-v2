import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { semanticSearch } from "@/lib/queries/semantic";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface PersonCrossRefProps {
  personName: string;
  shortBio?: string;
}

export async function PersonCrossRef({ personName, shortBio }: PersonCrossRefProps) {
  const concept = shortBio
    ? `${personName} — ${shortBio.slice(0, 200)}`
    : personName;

  let results;
  try {
    results = await semanticSearch(
      [{ concept, threshold: 0.56 }],
      { limit: 5 }
    );
  } catch {
    return null;
  }

  if (results.length === 0) return null;

  return (
    <SectionCard title="Archive Moments" accent="violet">
      <p className="mb-3 font-mono text-[12px] text-text-muted">
        Transcript moments across the archive about {personName}
      </p>
      <div className="space-y-3">
        {results.map((r) => (
          <div key={r.segmentId} className="group">
            <Link
              href={`/episodes/${r.episodeSlug}?t=${r.startSeconds}`}
              className="block space-y-0.5"
            >
              <div className="flex items-baseline gap-1.5">
                <span className="line-clamp-1 text-[12px] font-medium text-violet-300 transition-colors group-hover:text-violet-200">
                  {r.episodeNumber != null
                    ? `EP.${String(r.episodeNumber).padStart(3, "0")}`
                    : r.episodeTitle}
                </span>
                <span className="shrink-0 font-mono text-[12px] text-text-muted">
                  {formatTime(r.startSeconds)}
                </span>
              </div>
              <p className="line-clamp-2 text-[12px] leading-relaxed text-text-muted">
                {r.text}
              </p>
              {r.episodeNumber != null && (
                <p className="font-mono text-[12px] text-text-muted line-clamp-1">
                  {r.episodeTitle}
                </p>
              )}
            </Link>
          </div>
        ))}
      </div>
      <Link
        href={`/search/deep?concept=${encodeURIComponent(personName)}`}
        className="mt-3 block font-mono text-[12px] text-violet-400/60 transition-colors hover:text-violet-400"
      >
        Search all mentions →
      </Link>
    </SectionCard>
  );
}
