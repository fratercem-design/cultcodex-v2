import Link from "next/link";
import { listSavedSearches } from "@/lib/queries/saved-searches";
import { getEraById } from "@/lib/eras";
import { SavedSearchRunButton } from "./saved-search-run-button";

interface Props {
  userId: string;
  /** Max saved searches to show in the preview strip (rest visible via "View all") */
  limit?: number;
}

export async function SavedSearchesBlock({ userId, limit = 4 }: Props) {
  const all = await listSavedSearches(userId);
  const visible = all.slice(0, limit);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet">
            {"/// saved_searches"}
          </p>
          <h2 className="font-display text-xl font-bold text-accent-violet">
            Searches{" "}
            <span className="font-mono text-sm font-normal text-text-muted">
              · {all.length}
            </span>
          </h2>
        </div>
      </div>

      {all.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface/50 p-8 text-center space-y-3">
          <p className="text-sm text-text-muted">
            No saved searches yet. Save complex queries from <Link href="/search/deep" className="text-accent-violet hover:underline">Deep Search</Link> or the Oracle.
          </p>
          <Link
            href="/search/deep"
            className="inline-flex items-center gap-2 rounded border border-border px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-text-primary transition-colors hover:border-text-muted/50 hover:bg-surface"
          >
            Open Deep Search <span aria-hidden>→</span>
          </Link>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {visible.map((s) => {
            const eraLabel = s.eraId ? getEraById(s.eraId)?.label : null;
            return (
              <li
                key={s.id}
                className="group flex items-start justify-between gap-3 rounded-lg border border-accent-violet/10 bg-surface p-3 hover:border-accent-violet/40 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {s.pinned && (
                      <span className="text-[10px] text-accent-violet" aria-label="Pinned">★</span>
                    )}
                    <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                      {s.kind}
                    </span>
                    {eraLabel && (
                      <span className="font-mono text-[10px] text-text-muted">
                        · {eraLabel}
                      </span>
                    )}
                  </div>
                  <p className="font-sans text-sm text-text-primary line-clamp-2">{s.label}</p>
                  {s.kind === "deep" && s.concepts.length > 0 && (
                    <p className="font-mono text-[10px] text-text-muted line-clamp-1">
                      {s.concepts.join(" × ")}
                    </p>
                  )}
                </div>
                <SavedSearchRunButton id={s.id} kind={s.kind} payload={{
                  query: s.query,
                  concepts: s.concepts,
                  thresholds: s.thresholds,
                  eraId: s.eraId,
                  personSlug: s.personSlug,
                  archetype: s.archetype,
                }} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
