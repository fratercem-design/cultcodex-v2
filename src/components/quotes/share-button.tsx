"use client";

import { useState, useCallback } from "react";

interface ShareButtonProps {
  quoteId: string;
  quoteText: string;
}

export function QuoteShareButton({ quoteId, quoteText }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const siteUrl = window.location.origin;
    const cardUrl = `${siteUrl}/quotes/${quoteId}/og`;

    if (navigator.share) {
      try {
        await navigator.share({ text: quoteText, url: cardUrl });
        return;
      } catch {
        // User cancelled or not supported
      }
    }

    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Copy this URL:", cardUrl);
    }
  }, [quoteId, quoteText]);

  return (
    <button
      onClick={handleShare}
      title="Share this quote"
      className="font-mono text-[10px] text-text-muted hover:text-accent-gold transition-colors"
    >
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
