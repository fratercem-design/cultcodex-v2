import { prisma } from "@/lib/db";
import { SectionCard } from "@/components/ui/section-card";
import { formatDate } from "@/lib/format/date";
import { LiveToggleForm } from "./live-toggle-form";

export const dynamic = "force-dynamic";

export default async function AdminLivePage() {
  const status = await prisma.liveStatus.findUnique({
    where: { id: "singleton" },
  });

  const isLive = status?.isLive ?? false;

  return (
    <main id="main-content" className="p-8 max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-accent-gold mb-6">
        Live Stream Controls
      </h1>

      {/* Status card */}
      <SectionCard title="Current Status">
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`h-4 w-4 rounded-full ${
              isLive ? "bg-red-500 animate-pulse" : "bg-text-muted"
            }`}
          />
          <span className="font-mono text-lg font-bold text-text-primary">
            {isLive ? "LIVE" : "OFFLINE"}
          </span>
        </div>

        {status && (
          <div className="space-y-1 font-mono text-xs text-text-muted">
            {status.videoId && <p>Video ID: {status.videoId}</p>}
            {status.title && <p>Title: {status.title}</p>}
            {status.startedAt && <p>Started: {formatDate(status.startedAt)}</p>}
            {status.endedAt && <p>Ended: {formatDate(status.endedAt)}</p>}
          </div>
        )}
      </SectionCard>

      {/* Toggle form */}
      <div className="mt-6">
        <LiveToggleForm isLive={isLive} currentVideoId={status?.videoId} currentTitle={status?.title} />
      </div>
    </main>
  );
}
