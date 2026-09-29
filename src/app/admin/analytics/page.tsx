export const dynamic = "force-dynamic";

import { requireAdminPage } from "@/lib/auth";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { SectionCard } from "@/components/ui/section-card";
import {
  getEngagementOverview,
  getDailyActivity,
  getTopEpisodesByReactions,
  getTopEpisodesByComments,
  getMostActiveUsers,
} from "@/lib/queries/analytics";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Analytics — CultCodex Admin" };

export default async function AdminAnalyticsPage() {
  await requireAdminPage();

  const [overview, dailyActivity, topReacted, topDiscussed, activeUsers] =
    await Promise.all([
      getEngagementOverview(),
      getDailyActivity(30),
      getTopEpisodesByReactions(10),
      getTopEpisodesByComments(10),
      getMostActiveUsers(10),
    ]);

  const maxDaily = Math.max(
    ...dailyActivity.map((d) => d.reactions + d.comments),
    1
  );

  const maxReactions = Math.max(...topReacted.map((e) => e.count), 1);
  const maxComments = Math.max(...topDiscussed.map((e) => e.count), 1);

  return (
    <div className="space-y-8">
      <h1 className="font-mono text-xl font-bold text-text-primary">
        Analytics
      </h1>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="Total Reactions"
          value={overview.totalReactions}
          icon="🔥"
        />
        <AdminStatCard
          label="Total Comments"
          value={overview.totalComments}
          icon="💬"
        />
        <AdminStatCard
          label="Active Users (30d)"
          value={overview.activeUsers}
          icon="👤"
        />
        <AdminStatCard
          label="Total Favorites"
          value={overview.totalFavorites}
          icon="♥"
        />
      </div>

      {/* Daily Activity Chart */}
      <SectionCard title="ENGAGEMENT — LAST 30 DAYS">
        <div className="flex items-end gap-[2px] h-48">
          {dailyActivity.map((day, i) => {
            const total = day.reactions + day.comments;
            const heightPct = (total / maxDaily) * 100;
            const reactionPct =
              total > 0 ? (day.reactions / total) * 100 : 0;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className="w-full rounded-t-sm relative overflow-hidden"
                  style={{ height: `${heightPct}%`, minHeight: total > 0 ? "2px" : "0" }}
                  title={`${day.date}: ${day.reactions} reactions, ${day.comments} comments`}
                >
                  {/* Reactions segment (bottom, gold) */}
                  <div
                    className="absolute bottom-0 w-full bg-accent-gold/80"
                    style={{ height: `${reactionPct}%` }}
                  />
                  {/* Comments segment (top, cyan) */}
                  <div
                    className="absolute top-0 w-full bg-accent-cyan/80"
                    style={{ height: `${100 - reactionPct}%` }}
                  />
                </div>
                {i % 5 === 0 && (
                  <span className="font-mono text-[7px] text-text-muted -rotate-45 origin-top-left whitespace-nowrap">
                    {day.date.slice(5)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 justify-end">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-accent-gold/80" />
            <span className="font-mono text-[12px] text-text-muted">Reactions</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-accent-cyan/80" />
            <span className="font-mono text-[12px] text-text-muted">Comments</span>
          </div>
        </div>
      </SectionCard>

      {/* Top Episodes */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="MOST REACTED EPISODES">
          <div className="space-y-2">
            {topReacted.map((ep, i) => (
              <Link
                key={ep.slug}
                href={`/episodes/${ep.slug}`}
                className="flex items-center gap-3 group"
              >
                <span className="shrink-0 font-mono text-[12px] text-text-muted w-4 text-right">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {ep.episodeNumber != null && (
                      <span className="font-mono text-[12px] text-accent-gold-text font-bold">
                        EP.{String(ep.episodeNumber).padStart(3, "0")}
                      </span>
                    )}
                    <span className="font-mono text-xs text-text-primary truncate group-hover:text-accent-gold-text transition-colors">
                      {ep.title}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-gold/70"
                      style={{ width: `${(ep.count / maxReactions) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[12px] text-accent-gold-text font-bold">
                  {ep.count}
                </span>
              </Link>
            ))}
            {topReacted.length === 0 && (
              <p className="py-4 text-center font-mono text-xs text-text-muted">
                No reactions yet
              </p>
            )}
          </div>
        </SectionCard>

        <SectionCard title="MOST DISCUSSED EPISODES">
          <div className="space-y-2">
            {topDiscussed.map((ep, i) => (
              <Link
                key={ep.slug}
                href={`/episodes/${ep.slug}`}
                className="flex items-center gap-3 group"
              >
                <span className="shrink-0 font-mono text-[12px] text-text-muted w-4 text-right">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {ep.episodeNumber != null && (
                      <span className="font-mono text-[12px] text-accent-gold-text font-bold">
                        EP.{String(ep.episodeNumber).padStart(3, "0")}
                      </span>
                    )}
                    <span className="font-mono text-xs text-text-primary truncate group-hover:text-accent-gold-text transition-colors">
                      {ep.title}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-elevated overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-cyan/70"
                      style={{ width: `${(ep.count / maxComments) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="shrink-0 font-mono text-[12px] text-accent-cyan font-bold">
                  {ep.count}
                </span>
              </Link>
            ))}
            {topDiscussed.length === 0 && (
              <p className="py-4 text-center font-mono text-xs text-text-muted">
                No comments yet
              </p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Most Active Users */}
      <SectionCard title="MOST ACTIVE USERS">
        <div className="space-y-2">
          {activeUsers.map((user, i) => (
            <Link
              key={user.id}
              href={`/user/${user.id}`}
              className="flex items-center gap-3 group py-1"
            >
              <span className="shrink-0 font-mono text-[12px] text-text-muted w-4 text-right">
                {i + 1}
              </span>
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt=""
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-accent-purple/30 flex items-center justify-center">
                  <span className="text-[12px] text-accent-violet-text font-bold">
                    {user.displayName[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <span className="flex-1 font-mono text-xs text-text-primary group-hover:text-accent-gold-text transition-colors truncate">
                {user.displayName}
              </span>
              <span className="shrink-0 font-mono text-[12px] text-accent-gold-text">
                {user.commentCount} 💬
              </span>
              <span className="shrink-0 font-mono text-[12px] text-accent-cyan">
                {user.reactionCount} 🔥
              </span>
            </Link>
          ))}
          {activeUsers.length === 0 && (
            <p className="py-4 text-center font-mono text-xs text-text-muted">
              No user activity yet
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
