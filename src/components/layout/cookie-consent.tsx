"use client";

import { useState, useEffect } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";

const KEY = "cookie_consent";

type ConsentState = "pending" | "accepted" | "declined";

export function CookieConsent({ gaId }: { gaId: string }) {
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    // Reading from localStorage requires setState-in-effect; this is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsent(stored === "accepted" ? "accepted" : stored === "declined" ? "declined" : "pending");
  }, []);

  function accept() {
    localStorage.setItem(KEY, "accepted");
    setConsent("accepted");
  }

  function decline() {
    localStorage.setItem(KEY, "declined");
    setConsent("declined");
  }

  return (
    <>
      {consent === "accepted" && <GoogleAnalytics gaId={gaId} />}

      {consent === "pending" && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-accent-gold/30 bg-void/95 backdrop-blur-sm"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between px-4 py-4">
            <div className="space-y-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-gold-text/80">
                {"/// signal_intercept"}
              </p>
              <p className="font-mono text-xs text-text-muted leading-relaxed max-w-xl">
                This archive uses Google Analytics to understand which transmissions resonate.{" "}
                <span className="text-text-primary">No data is sold.</span>{" "}
                Accept to help improve the signal, or decline to opt out entirely.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                onClick={decline}
                className="font-mono text-[11px] uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors px-3 py-1.5"
              >
                Decline
              </button>
              <button
                onClick={accept}
                className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 rounded border border-accent-gold/50 text-accent-gold-text hover:bg-accent-gold/10 transition-colors"
              >
                Accept ✦
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
