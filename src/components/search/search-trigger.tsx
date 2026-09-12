"use client";

export function SearchTrigger() {
  function open() {
    window.dispatchEvent(new Event("cultcodex:openCommandPalette"));
  }

  return (
    <button
      onClick={open}
      className="inline-flex items-center gap-2 font-mono text-xs text-text-muted hover:text-accent-gold-text border border-border rounded px-3 py-1 transition-colors"
      aria-label="Search the archive (⌘K)"
    >
      <span className="text-[13px]">⌕</span>
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden md:inline-flex items-center font-mono text-[9px] text-text-muted border border-border/60 rounded px-1 py-0.5 leading-none">
        ⌘K
      </kbd>
    </button>
  );
}
