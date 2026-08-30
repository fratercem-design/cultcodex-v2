import { notFound } from "next/navigation";
import Image from "next/image";
import { fixThumbnailUrl } from "@/lib/format/thumbnail";
import { Suspense } from "react";
import { EntityGlanceBar } from "@/components/ui/entity-glance-bar";
import { formatDate } from "@/lib/format/date";
import { relativeTime } from "@/lib/format/relative-time";
import {
  getUserProfile,
  getUserActivity,
  getUserComments,
  getUserFavorites,
} from "@/lib/queries/user-profile";
import { UserProfileTabs } from "./user-profile-tabs";
import Link from "next/link";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getUserProfile(id);
  if (!profile) return { title: "User Not Found — CultCodex" };
  return { title: `${profile.displayName} — CultCodex` };
}

const REACTION_EMOJI: Record<string, string> = {
  fire: "\uD83D\uDD25",
  eye: "\uD83D\uDC41\uFE0F",
  moon: "\uD83C\uDF19",
  skull: "\uD83D\uDC80",
  wildcard: "\uD83C\uDCCF",
};

export default async function UserProfilePage({ params }: PageProps) {
  const { id } = await params;
  const profile = await getUserProfile(id);
  if (!profile) notFound();

  const [activity, comments, favorites] = await Promise.all([
    getUserActivity(id),
    getUserComments(id),
    getUserFavorites(id),
  ]);

  const publishedFavorites = favorites;

  const tabs = [
    { id: "activity", label: "Activity", count: activity.length },
    { id: "comments", label: "Comments", count: comments.length },
    { id: "favorites", label: "Favorites", count: publishedFavorites.length },
  ];

  return (
    <div>
      {/* Profile Header */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
              <Image
                src={profile.avatarUrl}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-gold/20">
                <span className="text-2xl font-bold text-accent-gold">
                  {profile.displayName[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h1 className="font-mono text-xl font-bold text-text-primary">
                {profile.displayName}
              </h1>
              <p className="font-mono text-[10px] text-text-muted">
                Member since {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>

          <EntityGlanceBar
            items={[
              { label: `${profile.commentCount} Comments` },
              { label: `${profile.reactionCount} Reactions` },
              { label: `${profile.favoriteCount} Favorites` },
            ]}
          />
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Suspense fallback={<div className="h-40" />}>
          <UserProfileTabs tabs={tabs}>
            {{
              activity: (
                <div className="space-y-2">
                  {activity.length === 0 ? (
                    <p className="py-8 text-center font-mono text-xs text-text-muted">
                      No activity yet
                    </p>
                  ) : (
                    activity.map((item) => (
                      <Link
                        key={item.id}
                        href={`/episodes/${item.episodeSlug}`}
                        className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent-gold/30 hover:bg-elevated"
                      >
                        <span className="shrink-0 text-sm">
                          {item.type === "comment"
                            ? "\uD83D\uDCAC"
                            : REACTION_EMOJI[item.reactionType ?? "fire"] ?? "\uD83D\uDD25"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs text-text-primary">
                            {item.type === "comment"
                              ? "Commented on"
                              : `Reacted to`}{" "}
                            {item.episodeNumber != null && (
                              <span className="text-accent-gold-text font-bold">
                                EP.{String(item.episodeNumber).padStart(3, "0")}
                              </span>
                            )}{" "}
                            <span className="text-text-primary">
                              {item.episodeTitle}
                            </span>
                          </p>
                          {item.commentContent && (
                            <p className="mt-1 text-xs text-text-muted line-clamp-2">
                              {item.commentContent}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-[9px] text-text-muted">
                          {relativeTime(item.createdAt)}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              ),
              comments: (
                <div className="space-y-2">
                  {comments.length === 0 ? (
                    <p className="py-8 text-center font-mono text-xs text-text-muted">
                      No comments yet
                    </p>
                  ) : (
                    comments.map((c) => (
                      <Link
                        key={c.id}
                        href={`/episodes/${c.episode.slug}`}
                        className="block rounded-lg border border-border bg-surface p-3 transition-colors hover:border-accent-gold/30 hover:bg-elevated"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {c.episode.episodeNumber != null && (
                            <span className="font-mono text-[10px] text-accent-gold-text font-bold">
                              EP.{String(c.episode.episodeNumber).padStart(3, "0")}
                            </span>
                          )}
                          <span className="font-mono text-xs text-text-primary">
                            {c.episode.title}
                          </span>
                          <span className="ml-auto font-mono text-[9px] text-text-muted">
                            {relativeTime(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-text-muted line-clamp-3 whitespace-pre-wrap">
                          {c.content}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              ),
              favorites: (
                <div>
                  {publishedFavorites.length === 0 ? (
                    <p className="py-8 text-center font-mono text-xs text-text-muted">
                      No favorites yet
                    </p>
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
                              <span className="font-mono text-[10px] text-accent-gold-text font-bold">
                                EP.{String(fav.episode.episodeNumber).padStart(3, "0")}
                              </span>
                            )}
                          </div>
                          <h3 className="font-mono text-sm font-medium text-text-primary group-hover:text-accent-gold-text transition-colors line-clamp-2">
                            {fav.episode.title}
                          </h3>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ),
            }}
          </UserProfileTabs>
        </Suspense>
      </div>
    </div>
  );
}
