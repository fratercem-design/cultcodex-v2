"use client";

import { useState, useCallback } from "react";

interface ShareButtonProps {
  quoteId: string;
  quoteText: string;
  speakerName?: string;
}

export function QuoteShareButton({ quoteId, quoteText, speakerName }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const permalink = useCallback(() => `${window.location.origin}/quotes/${quoteId}`, [quoteId]);

  const handleTwitter = useCallback(() => {
    const url = permalink();
    const truncated = quoteText.length > 200 ? quoteText.slice(0, 197) + "…" : quoteText;
    const attribution = speakerName ? ` — ${speakerName}` : "";
    // Keep tweet under 280 chars: quote + attribution + newline + URL (~23 chars t.co)
    const available = 280 - 23 - 1 - attribution.length - 2; // 2 for the quotes
    const tweetText =
      `"${truncated.slice(0, available)}"${attribution}\n`;
    const twitterUrl =
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, "_blank", "noopener,noreferrer,width=550,height=420");
  }, [quoteId, quoteText, speakerName, permalink]);

  const handleCopy = useCallback(async () => {
    const url = permalink();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Copy this URL:", url);
    }
  }, [permalink]);

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return false;
    try {
      await navigator.share({ text: quoteText, url: permalink() });
      return true;
    } catch {
      return false;
    }
  }, [quoteText, permalink]);

  return (
    <div className="flex items-center gap-3">
      {/* X / Twitter */}
      <button
        onClick={handleTwitter}
        title="Share on X / Twitter"
        className="inline-flex items-center gap-1.5 font-mono text-[12px] text-text-muted hover:text-accent-gold-text transition-colors"
      >
        <XIcon />
        Post
      </button>

      {/* Copy link — falls back to native share on mobile */}
      <button
        onClick={async () => {
          const shared = await handleNativeShare();
          if (!shared) handleCopy();
        }}
        title="Copy link"
        className="font-mono text-[12px] text-text-muted hover:text-accent-gold-text transition-colors"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}

function XIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
