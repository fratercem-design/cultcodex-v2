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
  /** First few segments to show as a preview */
  previewSegments: Segment[];
  /** Total number of segments in the full transcript */
  totalCount: number;
  /** Whether the user is signed in */
  isAuthenticated: boolean;
}

export function PaywallGate({
  previewSegments,
  totalCount,
  isAuthenticated,
}: PaywallGateProps) {
  return (
    <div className="relative">
      {/* Preview segments */}
      <div className="space-y-1">
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

      {/* Fade overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-void via-void/90 to-transparent pointer-events-none" />

      {/* Paywall CTA */}
      <div className="relative mt-4 pt-4">
        {isAuthenticated ? (
          <SubscriptionCTA />
        ) : (
          <div className="rounded-lg border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-transparent p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-accent-gold/30 bg-accent-gold/10">
              <span className="text-xl">🔐</span>
            </div>
            <h3 className="font-display text-lg font-bold text-accent-gold">
              Full Transcript Access
            </h3>
            <p className="mt-2 font-mono text-xs text-text-muted">
              {totalCount} searchable segments. Sign in to subscribe.
            </p>
            <Link
              href="/auth/signin"
              className="mt-4 inline-block rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-2.5 font-mono text-sm font-bold text-accent-gold transition-all hover:bg-accent-gold/25"
            >
              Sign in to unlock
            </Link>
          </div>
        )}

        <p className="mt-3 text-center font-mono text-[10px] text-text-muted">
          Preview showing {previewSegments.length} of {totalCount} segments
        </p>
      </div>
    </div>
  );
}
