"use client";

import { useState } from "react";

interface QuoteShareButtonProps {
  text: string;
  speakerName?: string | null;
  episodeSlug?: string | null;
  episodeNumber?: number | null;
}

export function QuoteShareButton({ text, speakerName, episodeSlug, episodeNumber }: QuoteShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = episodeSlug
    ? `https://cultcodex.me/episodes/${episodeSlug}`
    : "https://cultcodex.me";

  const attribution = speakerName ? `— ${speakerName}` : "";
  const epLabel = episodeNumber ? ` (EP.${String(episodeNumber).padStart(3, "0")})` : "";
  const tweetText = `"${text}" ${attribution}${epLabel}\n\n${shareUrl}`;
  const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(tweetText)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`"${text}" ${attribution} — ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text via prompt
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-full border border-accent-gold/20 bg-surface px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-text-muted/60 transition-all hover:border-accent-gold/40 hover:text-accent-gold-text"
        title="Copy quote link"
      >
        {copied ? (
          <>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-accent-gold-text">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Copied
          </>
        ) : (
          <>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="text-current">
              <rect x="4" y="1" width="7" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
              <path d="M1 4h2M1 4v7h7v-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Copy
          </>
        )}
      </button>
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-full border border-accent-gold/20 bg-surface px-3 py-1 font-mono text-[9px] uppercase tracking-widest text-text-muted/60 transition-all hover:border-accent-gold/40 hover:text-accent-gold-text"
        title="Share on X"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Post
      </a>
    </div>
  );
}
