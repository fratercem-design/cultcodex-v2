import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/ui/page-hero";
import { LivePlayer } from "./live-player";
import { SubscribeForm } from "@/components/live/subscribe-form";

export const metadata: Metadata = {
  title: "Live — CultCodex",
  description: "Watch Cult of Psyche live streams",
};

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const status = await prisma.liveStatus.findUnique({
    where: { id: "singleton" },
  });

  const isLive = status?.isLive ?? false;
  const videoId = status?.videoId ?? null;
  const title = status?.title ?? "Cult of Psyche Live Stream";

  return (
    <>
      <PageHero
        title={isLive ? "🔴 LIVE NOW" : "LIVE STREAM"}
        subtitle={isLive ? title : "Next stream coming soon..."}
        backgroundImage="/hero-bg.jpg"
      />

      <main className="mx-auto max-w-7xl px-4 py-6">
        {isLive && videoId ? (
          <LivePlayer videoId={videoId} />
        ) : videoId ? (
          /* Offline but has a last-played video — show replay */
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="mb-3 font-mono text-xs text-text-muted">
                LAST STREAM REPLAY
              </p>
              <div className="aspect-video w-full overflow-hidden rounded">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            <SubscribeForm />
          </div>
        ) : (
          /* No video at all */
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-surface p-8 text-center">
              <p className="font-mono text-lg text-[#ffd700]">
                No stream scheduled yet
              </p>
              <p className="mt-2 font-mono text-xs text-text-muted">
                Subscribe below to get notified when we go live
              </p>
            </div>
            <SubscribeForm />
          </div>
        )}
      </main>
    </>
  );
}
