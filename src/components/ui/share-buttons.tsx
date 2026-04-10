"use client";

import { useState } from "react";

interface ShareButtonsProps {
  url: string;
  title: string;
  type: "episode" | "quote" | "person";
  quoteText?: string;
}

export function ShareButtons({ url, title, type, quoteText }: ShareButtonsProps) {
  const [copied, setCopied] = useState<"link" | "embed" | null>(null);

  const fullUrl = url.startsWith("http") ? url : `https://cultcodex.me${url}`;

  function shareToTwitter() {
    const text = type === "quote" && quoteText
      ? `"${quoteText.slice(0, 200)}${quoteText.length > 200 ? "..." : ""}" — ${title}`
      : title;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(fullUrl)}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(fullUrl);
    setCopied("link");
    setTimeout(() => setCopied(null), 2000);
  }

  async function copyEmbed() {
    if (!quoteText) return;
    const embed = `<iframe src="${fullUrl}/embed" width="100%" height="200" frameborder="0" style="border-radius:8px;background:#0a0a0a;"></iframe>`;
    await navigator.clipboard.writeText(embed);
    setCopied("embed");
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={shareToTwitter}
        className="rounded px-2 py-1 font-mono text-[10px] text-text-muted hover:text-accent-gold hover:bg-elevated transition-colors"
        title="Share on X/Twitter"
      >
        𝕏
      </button>
      <button
        onClick={copyLink}
        className="rounded px-2 py-1 font-mono text-[10px] text-text-muted hover:text-accent-gold hover:bg-elevated transition-colors"
        title="Copy link"
      >
        {copied === "link" ? "✓ Copied" : "🔗 Link"}
      </button>
      {type === "quote" && quoteText && (
        <button
          onClick={copyEmbed}
          className="rounded px-2 py-1 font-mono text-[10px] text-text-muted hover:text-accent-gold hover:bg-elevated transition-colors"
          title="Copy embed code"
        >
          {copied === "embed" ? "✓ Copied" : "⟨/⟩ Embed"}
        </button>
      )}
    </div>
  );
}
