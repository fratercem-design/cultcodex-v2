import Link from "next/link";
import { prisma } from "@/lib/db";
import { getArchiveStats } from "@/lib/queries/stats";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatRelativeDate } from "@/lib/format/date";

/** Health metric with label, count, severity, and optional link */
interface HealthMetric {
  label: string;
  count: number;
  total: number;
  severity: "good" | "warn" | "bad";
  href?: string;
  scoreWeight?: number; // 0 = shown but excluded from score, default 1
}

export default async function AdminDashboard() {
  const [stats, flaggedCount, recentEpisodes, liveStatus, health] = await Promise.all([
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
    // Archive health queries
    Promise.all([
      prisma.episode.count(),
      prisma.episode.count({ where: { summaryShort: null } }),
      prisma.episode.count({ where: { youtubeVideoId: null, rumbleVideoId: null } }),
      prisma.episode.count({ where: { airDate: null } }),
      prisma.episode.count({ where: { status: "unavailable" } }),
      prisma.episode.count({ where: { segments: { none: {} } } }),
      prisma.person.count(),
      prisma.person.count({ where: { shortBio: null } }),
      prisma.person.count({ where: { avatarUrl: null } }),
      prisma.episode.findFirst({ orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
    ]),
  ]);

  const [
    totalEpisodes, noSummary, noVideo, noAirDate, unavailable,
    noTranscript, totalPeople, noBio, noAvatar, lastUpdate,
  ] = health;

  const healthMetrics: HealthMetric[] = [
    { label: "Episodes without summary", count: noSummary, total: totalEpisodes, severity: noSummary > 50 ? "bad" : noSummary > 10 ? "warn" : "good" },
    { label: "Episodes without video", count: noVideo, total: totalEpisodes, severity: noVideo > 100 ? "bad" : noVideo > 20 ? "warn" : "good" },
    { label: "Episodes without air date", count: noAirDate, total: totalEpisodes, severity: noAirDate > 20 ? "bad" : noAirDate > 5 ? "warn" : "good" },
    { label: "Episodes unavailable", count: unavailable, total: totalEpisodes, severity: unavailable > 50 ? "bad" : unavailable > 10 ? "warn" : "good" },
    { label: "Episodes without transcript", count: noTranscript, total: totalEpisodes, severity: noTranscript > 200 ? "bad" : noTranscript > 50 ? "warn" : "good" },
    { label: "People without bio", count: noBio, total: totalPeople, severity: noBio > 100 ? "bad" : noBio > 30 ? "warn" : "good" },
    { label: "People without avatar", count: noAvatar, total: totalPeople, severity: noAvatar > 200 ? "bad" : noAvatar > 50 ? "warn" : "good", scoreWeight: 0 },
  ];

  // Avatars are cosmetic — excluded from the score so 1300+ missing guest photos
  // don't overwhelm the data-quality signal.
  const scoredMetrics = healthMetrics.filter((m) => (m.scoreWeight ?? 1) > 0);
  const healthScore = Math.round(
    (scoredMetrics.reduce((sum, m) => sum + (m.total - m.count), 0) /
    scoredMetrics.reduce((sum, m) => sum + m.total, 0)) * 100
  );

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
                    <span className="font-mono text-[10px] text-accent-gold font-bold">
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
                className="font-mono text-[10px] text-accent-gold hover:underline"
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
                className="flex items-center gap-2 rounded border border-border bg-elevated px-3 py-2 font-mono text-xs text-text-primary hover:border-accent-gold/30 transition-colors"
              >
                <span>🎬</span> Manage Episodes
              </Link>
              <Link
                href="/admin/comments"
                className="flex items-center gap-2 rounded border border-border bg-elevated px-3 py-2 font-mono text-xs text-text-primary hover:border-accent-gold/30 transition-colors"
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
                className="flex items-center gap-2 rounded border border-border bg-elevated px-3 py-2 font-mono text-xs text-text-primary hover:border-accent-gold/30 transition-colors"
              >
                <span>🔴</span> Live Stream Controls
              </Link>
              <Link
                href="/admin/digest"
                className="flex items-center gap-2 rounded border border-border bg-elevated px-3 py-2 font-mono text-xs text-text-primary hover:border-accent-gold/30 transition-colors"
              >
                <span>📰</span> Weekly Digest
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Archive Health */}
      <div className="mt-8">
        <SectionCard title={`Archive Health — ${healthScore}%`}>
          {lastUpdate?.updatedAt && (
            <p className="mb-3 font-mono text-[10px] text-text-muted">
              Last data change: {formatRelativeDate(lastUpdate.updatedAt)} ({formatDate(lastUpdate.updatedAt)})
            </p>
          )}
          <div className="grid gap-2">
            {healthMetrics.map((m) => {
              const pct = m.total > 0 ? Math.round(((m.total - m.count) / m.total) * 100) : 100;
              const barColor = m.severity === "good" ? "bg-green-500" : m.severity === "warn" ? "bg-yellow-500" : "bg-red-500";
              const textColor = m.severity === "good" ? "text-green-400" : m.severity === "warn" ? "text-yellow-400" : "text-red-400";

              return (
                <div key={m.label} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-mono text-[10px] text-text-muted truncate">
                        {m.label}
                        {(m.scoreWeight ?? 1) === 0 && <span className="ml-1 text-text-muted/40">(cosmetic)</span>}
                      </span>
                      <span className={`font-mono text-[10px] font-bold ${textColor}`}>
                        {m.count > 0 ? m.count : "\u2714"} {m.count > 0 && `/ ${m.total}`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-border overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className={`font-mono text-[10px] w-8 text-right ${textColor}`}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
