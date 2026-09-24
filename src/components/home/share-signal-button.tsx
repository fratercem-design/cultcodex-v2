"use client";

import { useCallback, useState } from "react";

interface Props {
  hasQuote: boolean;
}

const SHARE_CARD_URL = "/api/signal/share-card";

/**
 * "Share this sigil" (Dossier Ch. IV) — the one-tap growth lever the audit
 * flagged directly. Prefers the Web Share API with a file attachment (posts
 * the actual 1080x1350 ember card on mobile); falls back to a plain download
 * link + copy-link + X-post-intent for browsers without file-share support.
 */
export function ShareSignalButton({ hasQuote }: Props) {
  const [state, setState] = useState<"idle" | "sharing" | "copied" | "error">("idle");

  const permalink = useCallback(() => `${window.location.origin}/signal`, []);

  const handleShare = useCallback(async () => {
    setState("sharing");
    try {
      const res = await fetch(SHARE_CARD_URL);
      const blob = await res.blob();
      const file = new File([blob], "cultcodex-signal.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Today's Signal — CultCodex",
          text: "Today's transmission from the CultCodex archive.",
          url: permalink(),
        });
        setState("idle");
        return;
      }

      // No native file-share — trigger a plain download instead.
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = "cultcodex-signal.png";
      a.click();
      URL.revokeObjectURL(objectUrl);
      setState("idle");
    } catch (err) {
      // AbortError fires when the user just cancels the native share sheet —
      // that's not a failure, don't flash an error state for it.
      if (err instanceof Error && err.name === "AbortError") {
        setState("idle");
        return;
      }
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }, [permalink]);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(permalink());
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      prompt("Copy this URL:", permalink());
    }
  }, [permalink]);

  const handleTwitter = useCallback(() => {
    const url = permalink();
    const text = "Today's transmission from the CultCodex archive.";
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer,width=550,height=420");
  }, [permalink]);

  if (!hasQuote) return null;

  return (
    <div className="flex flex-wrap items-center gap-4">
      <button
        onClick={handleShare}
        disabled={state === "sharing"}
        className="inline-flex items-center gap-2 rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-3 font-mono text-xs font-bold text-accent-gold-text transition-all hover:bg-accent-gold/25 disabled:opacity-60"
      >
        {state === "sharing" ? "Preparing…" : state === "error" ? "Failed — try again" : "Share this signal ✦"}
      </button>
      <button
        onClick={handleTwitter}
        className="font-mono text-[12px] text-text-muted hover:text-accent-gold-text transition-colors"
      >
        Post to X
      </button>
      <button
        onClick={handleCopyLink}
        className="font-mono text-[12px] text-text-muted hover:text-accent-gold-text transition-colors"
      >
        {state === "copied" ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
