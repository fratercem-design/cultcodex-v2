import Image from "next/image";
import { SacredBorder } from "@/components/graphics/mystical-divider";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-border overflow-hidden py-10">
      <Image
        src="/footer-artwork.jpg"
        alt=""
        fill
        className="object-cover opacity-20"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-void to-transparent" />

      {/* Decorative top border */}
      <SacredBorder className="absolute top-0 left-0 right-0" />

      <div className="relative z-10 mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/codex-seal-stamp-mark.jpg"
            alt="Codex Seal"
            width={48}
            height={48}
            className="rounded-full border border-accent-gold/30 opacity-80"
          />

          {/* Ornamental glyphs */}
          <svg width="120" height="8" viewBox="0 0 120 8" fill="none" className="text-accent-gold/20" aria-hidden="true">
            <circle cx="20" cy="4" r="1" fill="currentColor" />
            <circle cx="35" cy="4" r="1.5" fill="currentColor" />
            <path d="M55 0l5 4-5 4" stroke="currentColor" strokeWidth="0.8" fill="none" />
            <path d="M65 0l-5 4 5 4" stroke="currentColor" strokeWidth="0.8" fill="none" />
            <circle cx="85" cy="4" r="1.5" fill="currentColor" />
            <circle cx="100" cy="4" r="1" fill="currentColor" />
          </svg>

          <p className="font-mono text-xs text-accent-gold">
            CULT OF PSYCHE — MATRIX ARCHIVE
          </p>
          <p className="font-mono text-[10px] text-text-muted/50">
            CultCodex v2 · The sacred intelligence terminal
          </p>
        </div>
      </div>
    </footer>
  );
}
