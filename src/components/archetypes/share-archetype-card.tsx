"use client";

import { useState } from "react";

interface ShareArchetypeCardProps {
  slug: string;
  color: string;
  name: string;
}

export function ShareArchetypeCard({ slug, color, name }: ShareArchetypeCardProps) {
  const [copied, setCopied] = useState(false);

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://cultcodex.me";

  const cardUrl = `${siteUrl}/archetypes/${slug}`;
  const ogImageUrl = `${siteUrl}/api/archetype/${slug}/og`;

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <div className="space-y-3">
      {/* OG image preview */}
      <a
        href={ogImageUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative block w-full overflow-hidden rounded-xl border border-border transition-all hover:border-border/60"
        title={`View ${name} archetype card`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ogImageUrl}
          alt={`${name} archetype shareable card`}
          className="w-full transition-transform duration-300 group-hover:scale-[1.01]"
          style={{ aspectRatio: "1200 / 630" }}
        />
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{ backgroundColor: "rgba(7,6,10,0.5)" }}
        >
          <span className="font-mono text-xs uppercase tracking-widest text-white/80">
            Open full size ↗
          </span>
        </div>
      </a>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleCopyLink}
          className="flex-1 rounded-lg border py-2.5 font-mono text-[12px] uppercase tracking-[0.12em] transition-all"
          style={{
            borderColor: copied ? color : `${color}40`,
            color: copied ? color : `${color}90`,
            backgroundColor: copied ? `${color}12` : "transparent",
          }}
        >
          {copied ? "Link copied ✓" : "Copy share link"}
        </button>
        <a
          href={ogImageUrl}
          download={`cultcodex-${slug}.png`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 rounded-lg border py-2.5 text-center font-mono text-[12px] uppercase tracking-[0.12em] transition-all"
          style={{
            borderColor: `${color}40`,
            color: `${color}90`,
          }}
        >
          Save image ↓
        </a>
      </div>
    </div>
  );
}
