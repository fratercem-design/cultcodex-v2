import Image from "next/image";

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
      <div className="relative z-10 mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/codex-seal-stamp-mark.jpg"
            alt="Codex Seal"
            width={48}
            height={48}
            className="rounded-full border border-accent-gold/30 opacity-80"
          />
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
