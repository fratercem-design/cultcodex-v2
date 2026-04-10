import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/ui/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format/date";
import Link from "next/link";

export const metadata = {
  title: "My Favorites — CultCodex",
};

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/signin");

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      episode: {
        select: {
          id: true,
          title: true,
          slug: true,
          episodeNumber: true,
          airDate: true,
          summaryShort: true,
          thumbnailUrl: true,
          status: true,
        },
      },
    },
  });

  const publishedFavorites = favorites;

  return (
    <div>
      <PageHero
        title="MY FAVORITES"
        subtitle={`${publishedFavorites.length} saved episode${publishedFavorites.length !== 1 ? "s" : ""}`}
        backgroundImage="/wiki-page-header.jpg"
      />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {publishedFavorites.length === 0 ? (
          <>
            <EmptyState
              message="No favorites yet"
              suggestion="Browse episodes and tap ♥ to start collecting your favorites"
            />
            <div className="mt-4 text-center">
              <Link
                href="/episodes"
                className="font-mono text-sm text-accent-gold hover:underline"
              >
                Browse Episodes
              </Link>
            </div>
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publishedFavorites.map((fav) => (
              <Link
                key={fav.id}
                href={`/episodes/${fav.episode.slug}`}
                className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-gold/30 hover:bg-elevated"
              >
                {fav.episode.thumbnailUrl && (
                  <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-md">
                    <Image
                      src={fav.episode.thumbnailUrl}
                      alt=""
                      fill
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
                <h3 className="font-mono text-sm font-medium text-text-primary group-hover:text-accent-gold transition-colors line-clamp-2">
                  {fav.episode.title}
                </h3>
                {fav.episode.summaryShort && (
                  <p className="mt-1 text-xs text-text-muted line-clamp-2">
                    {fav.episode.summaryShort}
                  </p>
                )}
                <p className="mt-2 font-mono text-[9px] text-text-muted/50">
                  Saved {formatDate(fav.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
