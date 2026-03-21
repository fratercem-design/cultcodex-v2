import Link from "next/link";
import { prisma } from "@/lib/db";
import { getArchiveStats } from "@/lib/queries/stats";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/format/date";

export default async function AdminDashboard() {
  const [stats, flaggedCount, recentEpisodes, liveStatus] = await Promise.all([
    getArchiveStats(),
    prisma.codexComment.count({ where: { flagged: true } }),
    prisma.episode.findMany({
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        episodeNumber: true,
        status: true,
        updatedAt: true,
      },
    }),
    prisma.liveStatus.findUnique({ where: { id: "singleton" } }),
  ]);

  return (
    <main id="main-content" className="p-8">
      <h1 className="font-display text-2xl font-bold text-accent-gold mb-6">
        Dashboard
      </h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <AdminStatCard icon="🎬" label="Episodes" value={stats.episodes} href="/admin/episodes" />
        <AdminStatCard icon="👤" label="People" value={stats.people} href="/admin/people" />
        <AdminStatCard icon="📜" label="Lore" value={stats.loreEntries} href="/admin/lore" />
        <AdminStatCard icon="🏷️" label="Topics" value={stats.topics} href="/admin/topics" />
        <AdminStatCard icon="📚" label="Series" value={stats.series} href="/admin/series" />
        <AdminStatCard icon="💬" label="Quotes" value={stats.quotes} />
        <AdminStatCard icon="📝" label="Comments" value={0} href="/admin/comments" />
        <AdminStatCard
          icon={flaggedCount > 0 ? "⚠️" : "✅"}
          label="Flagged"
          value={flaggedCount}
          href="/admin/comments"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent episodes */}
        <SectionCard title="Recently Updated Episodes">
          <div className="divide-y divide-border">
            {recentEpisodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/admin/episodes/${ep.id}/edit`}
                className="flex items-center justify-between py-2 px-1 hover:bg-elevated rounded transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {ep.episodeNumber && (
                    <span className="font-mono text-[10px] text-accent-green font-bold">
                      EP.{String(ep.episodeNumber).padStart(3, "0")}
                    </span>
                  )}
                  <span className="text-xs text-text-primary truncate">
                    {ep.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <StatusBadge
                    label={ep.status}
                    variant={ep.status === "published" ? "green" : "muted"}
                  />
                  <span className="font-mono text-[10px] text-text-muted">
                    {formatDate(ep.updatedAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Quick actions + Live status */}
        <div className="space-y-6">
          <SectionCard title="Live Stream Status">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${liveStatus?.isLive ? "bg-red-500 animate-pulse" : "bg-text-muted"}`} />
                <span className="font-mono text-sm text-text-primary">
                  {liveStatus?.isLive ? "LIVE" : "Offline"}
                </span>
              </div>
              <Link
                href="/admin/live"
                className="font-mono text-[10px] text-accent-green hover:underline"
              >
                Manage →
              </Link>
            </div>
            {liveStatus?.isLive && liveStatus.title && (
              <p className="mt-2 text-xs text-text-muted">{liveStatus.title}</p>
            )}
          </SectionCard>

          <SectionCard title="Quick Actions">
            <div className="grid gap-2">
              <Link
                href="/admin/episodes"
                className="flex items-center gap-2 rounded border border-border bg-elevated px-3 py-2 font-mono text-xs text-text-primary hover:border-accent-green/30 transition-colors"
              >
                <span>🎬</span> Manage Episodes
              </Link>
              <Link
                href="/admin/comments"
                className="flex items-center gap-2 rounded border border-border bg-elevated px-3 py-2 font-mono text-xs text-text-primary hover:border-accent-green/30 transition-colors"
              >
                <span>💬</span> Moderate Comments
                {flaggedCount > 0 && (
                  <span className="ml-auto rounded-full bg-red-500/20 px-2 py-0.5 font-mono text-[10px] text-red-400">
                    {flaggedCount}
                  </span>
                )}
              </Link>
              <Link
                href="/admin/live"
                className="flex items-center gap-2 rounded border border-border bg-elevated px-3 py-2 font-mono text-xs text-text-primary hover:border-accent-green/30 transition-colors"
              >
                <span>🔴</span> Live Stream Controls
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>
    </main>
  );
}
