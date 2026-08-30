"use client";

import { useEffect, useRef } from "react";

const GIFT_URL = "/gospel-of-psyches-nightmares.pdf";

/**
 * Download button for the Gospel. When `autostart` is true (arriving fresh from
 * sign-up) it triggers the download once on mount; the button is always the
 * manual fallback / re-download.
 */
export function GiftDownloadCta({ autostart = false }: { autostart?: boolean }) {
  const fired = useRef(false);

  useEffect(() => {
    if (!autostart || fired.current) return;
    fired.current = true;
    const a = document.createElement("a");
    a.href = GIFT_URL;
    a.download = "";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [autostart]);

  return (
    <div className="flex flex-col items-center gap-2">
      <a
        href={GIFT_URL}
        download
        className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/20 px-9 py-4 font-mono text-sm font-bold text-accent-gold-text transition hover:bg-accent-gold/30"
      >
        ↓ &nbsp;Download the Gospel (PDF)
      </a>
      {autostart && (
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-muted/50">
          Your download should start automatically
        </p>
      )}
    </div>
  );
}
