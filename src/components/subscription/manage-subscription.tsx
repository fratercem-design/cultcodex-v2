"use client";

import { useState } from "react";
import { formatRelativeDate } from "@/lib/format/date";

interface ManageSubscriptionProps {
  status: string | null;
  periodEnd: Date | null;
  isAdmin: boolean;
}

export function ManageSubscription({
  status,
  periodEnd,
  isAdmin,
}: ManageSubscriptionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to open portal");
        setLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (isAdmin) {
    return (
      <div className="rounded-lg border border-accent-gold/30 bg-surface p-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-accent-gold font-bold">ADMIN</span>
          <span className="font-mono text-[10px] text-text-muted">
            Full transcript access (admin bypass)
          </span>
        </div>
      </div>
    );
  }

  if (status === "active" && periodEnd) {
    return (
      <div className="rounded-lg border border-accent-gold/30 bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-xs text-accent-gold font-bold">
              MEMBER
            </span>
            <p className="mt-1 font-mono text-[10px] text-text-muted">
              Renews {formatRelativeDate(periodEnd)}
            </p>
          </div>
          <button
            onClick={openPortal}
            disabled={loading}
            className="rounded border border-border px-3 py-1.5 font-mono text-[11px] text-text-muted transition-colors hover:text-text-primary hover:border-accent-gold/30 disabled:opacity-50"
          >
            {loading ? "..." : "Manage"}
          </button>
        </div>
        {error && (
          <p className="mt-2 font-mono text-[10px] text-red-400">{error}</p>
        )}
      </div>
    );
  }

  return null;
}
