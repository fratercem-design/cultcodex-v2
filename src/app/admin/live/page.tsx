import { prisma } from "@/lib/db";
import { SectionCard } from "@/components/ui/section-card";
import { formatDate } from "@/lib/format/date";
import { LiveToggleForm } from "./live-toggle-form";

export const dynamic = "force-dynamic";

export default async function AdminLivePage() {
  const [copStatus, pnStatus, nfStatus] = await Promise.all([
    prisma.liveStatus.findUnique({ where: { id: "singleton" } }),
    prisma.liveStatus.findUnique({ where: { id: "psyches-nightmares" } }),
    prisma.liveStatus.findUnique({ where: { id: "nightmare-frequencies" } }),
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

      {/* Psyche's Nightmares */}
      <div>
        <h2 className="font-mono text-sm font-bold text-text-primary mb-4 uppercase tracking-widest">
          Psyche&apos;s Nightmares <span className="text-text-muted">@psychesnightmares</span>
        </h2>
        <SectionCard title="Current Status">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`h-4 w-4 rounded-full ${
                pnStatus?.isLive ? "bg-red-500 animate-pulse" : "bg-text-muted"
              }`}
            />
            <span className="font-mono text-lg font-bold text-text-primary">
              {pnStatus?.isLive ? "LIVE" : "OFFLINE"}
            </span>
          </div>
          {pnStatus && (
            <div className="space-y-1 font-mono text-xs text-text-muted">
              {pnStatus.videoId && <p>Video ID: {pnStatus.videoId}</p>}
              {pnStatus.title && <p>Title: {pnStatus.title}</p>}
              {pnStatus.startedAt && <p>Started: {formatDate(pnStatus.startedAt)}</p>}
              {pnStatus.endedAt && <p>Ended: {formatDate(pnStatus.endedAt)}</p>}
            </div>
          )}
        </SectionCard>
        <div className="mt-4">
          <LiveToggleForm
            channel="psychesNightmares"
            isLive={pnStatus?.isLive ?? false}
            currentVideoId={pnStatus?.videoId}
            currentTitle={pnStatus?.title}
          />
        </div>
      </div>

      {/* Nightmare Frequencies */}
      <div>
        <h2 className="font-mono text-sm font-bold text-text-primary mb-4 uppercase tracking-widest">
          Nightmare Frequencies
        </h2>
        <SectionCard title="Current Status">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`h-4 w-4 rounded-full ${
                nfStatus?.isLive ? "bg-red-500 animate-pulse" : "bg-text-muted"
              }`}
            />
            <span className="font-mono text-lg font-bold text-text-primary">
              {nfStatus?.isLive ? "LIVE" : "OFFLINE"}
            </span>
          </div>
          {nfStatus && (
            <div className="space-y-1 font-mono text-xs text-text-muted">
              {nfStatus.videoId && <p>Video ID: {nfStatus.videoId}</p>}
              {nfStatus.title && <p>Title: {nfStatus.title}</p>}
              {nfStatus.startedAt && <p>Started: {formatDate(nfStatus.startedAt)}</p>}
              {nfStatus.endedAt && <p>Ended: {formatDate(nfStatus.endedAt)}</p>}
            </div>
          )}
        </SectionCard>
        <div className="mt-4">
          <LiveToggleForm
            channel="nightmareFrequencies"
            isLive={nfStatus?.isLive ?? false}
            currentVideoId={nfStatus?.videoId}
            currentTitle={nfStatus?.title}
          />
        </div>
      </div>
    </main>
  );
}
