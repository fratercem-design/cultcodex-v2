/**
 * /codex/transmissions — full list of the user's saved (favorited) episodes.
 *
 * Backed by the existing Favorite table so the old /favorites page and
 * the new /codex surface point at the same data. Users arriving here
 * from /codex get consistent mythic styling and a "back" breadcrumb.
 */
import Link from "next/link";
import Image from "next/image";
import { fixThumbnailUrl } from "@/lib/format/thumbnail";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getSavedTransmissions } from "@/lib/queries/codex";
import { PageHero } from "@/components/ui/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format/date";

export const metadata: Metadata = {
  alternates: { canonical: "/codex/transmissions" },
  title: "Saved Transmissions — CULT CODEX",
  description: "Episodes you've saved for the return trip.",
};

export default async function CodexTransmissionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin?callbackUrl=/codex/transmissions");

  const rows = await getSavedTransmissions(user.id);

  return (
    <div>
      <PageHero
        title="SAVED TRANSMISSIONS"
        subtitle={
          rows.length === 0
            ? "No transmissions saved yet."
            : `${rows.length} transmission${rows.length === 1 ? "" : "s"} in your codex`
        }
        backgroundImage="/hero-bg.jpg"
      label="saved_transmissions"
      />

      <main
        id="main-content"
        className="mx-auto max-w-6xl px-4 py-10 space-y-6"
      >
        <nav className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
          <Link href="/codex" className="hover:text-accent-gold transition-colors">
            ← Back to your codex
          </Link>
        </nav>

        {rows.length === 0 ? (
          <>
            <EmptyState
              message="No transmissions saved yet"
              suggestion="Browse /episodes and tap the heart on any transmission you want to come back to."
            />
            <div className="text-center">
              <Link
                href="/episodes"
                className="inline-flex items-center gap-2 rounded border border-accent-gold/40 bg-accent-gold/10 px-5 py-2 font-mono text-xs font-bold text-accent-gold transition-all hover:bg-accent-gold/20"
              >
                Browse episodes <span aria-hidden>→</span>
              </Link>
            </div>
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((fav) => (
              <Link
                key={fav.id}
                href={`/episodes/${fav.episode.slug}`}
                className="group rounded-lg border border-accent-gold/10 bg-surface p-4 transition-colors hover:border-accent-gold/40 hover:bg-accent-gold-dim"
              >
                {fav.episode.thumbnailUrl && (
                  <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-md">
                    <Image
                      src={fixThumbnailUrl(fav.episode.thumbnailUrl)!}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-1">
                  {fav.episode.episodeNumber != null && (
                    <span className="font-mono text-[10px] text-accent-gold font-bold">
                      EP.{String(fav.episode.episodeNumber).padStart(3, "0")}
                    </span>
                  )}
                  {fav.episode.airDate && (
                    <span className="font-mono text-[10px] text-text-muted">
                      {formatDate(fav.episode.airDate)}
                    </span>
                  )}
                </div>
                <h2 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-gold transition-colors line-clamp-2">
                  {fav.episode.title}
                </h2>
                {fav.episode.summaryShort && (
                  <p className="mt-1 text-xs text-text-muted line-clamp-2">
                    {fav.episode.summaryShort}
                  </p>
                )}
                <p className="mt-2 font-mono text-[9px] text-text-muted/50">
                  saved {formatDate(fav.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
