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
        /* Compact and even-handed (2026-09 audit, G-02/MO-01): one line, two
           equal-weight buttons, and it sits ABOVE the mobile bottom nav rather
           than stacking a third fixed layer over the content. */
        <div
          className="cookie-consent fixed left-0 right-0 z-[85] border-t border-line bg-void/95 backdrop-blur-sm"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
            <p className="font-display text-[13px] leading-snug text-ink-2">
              Google Analytics helps us see which episodes people use.{" "}
              <span className="text-ink">No data is sold.</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={decline}
                className="min-h-11 rounded-sm border border-line-strong px-4 text-[13px] font-semibold text-ink transition-colors hover:border-ink"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={accept}
                className="min-h-11 rounded-sm border border-line-strong px-4 text-[13px] font-semibold text-ink transition-colors hover:border-ink"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
