import Link from "next/link";
import { SubscriptionCTA } from "./subscription-cta";
import { formatSeconds } from "@/lib/format/duration";

interface Segment {
  id: string;
  startSeconds: number;
  endSeconds: number;
  speakerLabel: string | null;
  text: string;
}

interface PaywallGateProps {
  previewSegments: Segment[];
  totalCount: number;
  isAuthenticated: boolean;
}

export function PaywallGate({
  previewSegments,
  totalCount,
  isAuthenticated,
}: PaywallGateProps) {
  return (
    <div className="relative">
      {/* Preview segments — blurred + faded */}
      <div
        className="relative overflow-hidden"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
        }}
      >
        <div className="space-y-1 pointer-events-none select-none">
          {previewSegments.map((seg) => (
            <div
              key={seg.id}
              className="flex gap-3 rounded px-2 py-1.5 border-l-2 border-transparent"
            >
              <span className="shrink-0 font-mono text-[10px] text-accent-gold/60 w-14 text-right pt-0.5">
                {formatSeconds(seg.startSeconds)}
              </span>
              <div className="min-w-0 flex-1">
                {seg.speakerLabel && (
                  <span className="font-mono text-[10px] font-bold uppercase text-accent-gold">
                    {seg.speakerLabel}
                  </span>
                )}
                <p className="text-sm text-text-primary">{seg.text}</p>
              </div>
            </div>
          ))}
        </div>
        {/* Blur + lock overlay on last third */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 backdrop-blur-[2px]" aria-hidden="true" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-gold/40 bg-surface/80 shadow-lg backdrop-blur-sm">
            <span className="text-lg text-accent-gold" aria-hidden>🔒</span>
          </div>
        </div>
      </div>

      {/* Paywall CTA */}
      <div className="relative mt-4 pt-4">
        {isAuthenticated ? (
          <SubscriptionCTA />
        ) : (
          <div className="rounded-lg border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-transparent p-6 text-center space-y-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold/60">
              /// observer_mode
            </p>
            <h3 className="font-display text-xl font-bold text-accent-gold">
              Observers see the surface.
            </h3>
            <p className="font-mono text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
              Initiates see everything underneath.{" "}
              <span className="text-text-primary">{totalCount.toLocaleString()} segments</span>{" "}
              — searchable, timestamped, clickable. Sign in to become one.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-2.5 font-mono text-sm font-bold text-accent-gold transition-all hover:bg-accent-gold/25"
              >
                Sign in to unlock →
              </Link>
              <Link
                href="/premium"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 font-mono text-xs text-text-muted hover:text-text-primary hover:border-text-muted/40 transition-colors"
              >
                See what opens
              </Link>
            </div>
          </div>
        )}

        <p className="mt-3 text-center font-mono text-[10px] text-text-muted/50">
          Showing {previewSegments.length} of {totalCount} segments
        </p>
      </div>
    </div>
  );
}
