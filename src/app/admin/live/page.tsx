import { prisma } from "@/lib/db";
import { SectionCard } from "@/components/ui/section-card";
import { formatDate } from "@/lib/format/date";
import { LiveToggleForm } from "./live-toggle-form";

export const dynamic = "force-dynamic";

export default async function AdminLivePage() {
  const [copStatus, amStatus] = await Promise.all([
    prisma.liveStatus.findUnique({ where: { id: "singleton" } }),
    prisma.liveStatus.findUnique({ where: { id: "alexandra-mayers" } }),
  ]);

  return (
    <main id="main-content" className="p-8 max-w-3xl space-y-8">
      <h1 className="font-display text-2xl font-bold text-accent-gold mb-2">
        Live Stream Controls
      </h1>

      {/* Cult of Psyche */}
      <div>
        <h2 className="font-mono text-sm font-bold text-text-primary mb-4 uppercase tracking-widest">
          Cult of Psyche
        </h2>
        <SectionCard title="Current Status">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`h-4 w-4 rounded-full ${
                copStatus?.isLive ? "bg-red-500 animate-pulse" : "bg-text-muted"
              }`}
            />
            <span className="font-mono text-lg font-bold text-text-primary">
              {copStatus?.isLive ? "LIVE" : "OFFLINE"}
            </span>
          </div>
          {copStatus && (
            <div className="space-y-1 font-mono text-xs text-text-muted">
              {copStatus.videoId && <p>Video ID: {copStatus.videoId}</p>}
              {copStatus.title && <p>Title: {copStatus.title}</p>}
              {copStatus.startedAt && <p>Started: {formatDate(copStatus.startedAt)}</p>}
              {copStatus.endedAt && <p>Ended: {formatDate(copStatus.endedAt)}</p>}
            </div>
          )}
        </SectionCard>
        <div className="mt-4">
          <LiveToggleForm
            channel="cultOfPsyche"
            isLive={copStatus?.isLive ?? false}
            currentVideoId={copStatus?.videoId}
            currentTitle={copStatus?.title}
          />
        </div>
      </div>

      {/* Alexandra Mayers */}
      <div>
        <h2 className="font-mono text-sm font-bold text-text-primary mb-4 uppercase tracking-widest">
          Alexandra Mayers
        </h2>
        <SectionCard title="Current Status">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`h-4 w-4 rounded-full ${
                amStatus?.isLive ? "bg-red-500 animate-pulse" : "bg-text-muted"
              }`}
            />
            <span className="font-mono text-lg font-bold text-text-primary">
              {amStatus?.isLive ? "LIVE" : "OFFLINE"}
            </span>
          </div>
          {amStatus && (
            <div className="space-y-1 font-mono text-xs text-text-muted">
              {amStatus.videoId && <p>Video ID: {amStatus.videoId}</p>}
              {amStatus.title && <p>Title: {amStatus.title}</p>}
              {amStatus.startedAt && <p>Started: {formatDate(amStatus.startedAt)}</p>}
              {amStatus.endedAt && <p>Ended: {formatDate(amStatus.endedAt)}</p>}
            </div>
          )}
        </SectionCard>
        <div className="mt-4">
          <LiveToggleForm
            channel="alexandraMayers"
            isLive={amStatus?.isLive ?? false}
            currentVideoId={amStatus?.videoId}
            currentTitle={amStatus?.title}
          />
        </div>
      </div>
    </main>
  );
}
