"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Suggestion {
  label: string;
  href: string;
  type: string;
}

const TYPE_ICONS: Record<string, string> = {
  episode: "📼",
  person: "👤",
  lore: "📜",
  topic: "🏷",
};

const TYPE_LABELS: Record<string, string> = {
  episode: "Episode",
  person: "Person",
  lore: "Lore",
  topic: "Topic",
};

const TYPE_COLORS: Record<string, string> = {
  episode: "text-accent-cyan",
  person: "text-accent-gold",
  lore: "text-accent-violet",
  topic: "text-text-muted",
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Suggestion[]>([]);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResults([]);
    setSelected(0);
  }, []);

  // Global keyboard shortcut + custom event
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") close();
    }
    function onOpen() { setOpen(true); }
    window.addEventListener("keydown", onKey);
    window.addEventListener("cultcodex:openCommandPalette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cultcodex:openCommandPalette", onOpen);
    };
  }, [close]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  // Fetch suggestions
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setSelected(0);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(query.trim())}`);
        const data: Suggestion[] = await res.json();
        setResults(data);
        setSelected(0);
      } catch {
        // ignore
      }
    }, 180);
  }, [query]);

  // Keyboard navigation inside palette
  function onKeyDown(e: React.KeyboardEvent) {
    const total = results.length + 1; // +1 for "Search all" row
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => (s + 1) % total);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => (s - 1 + total) % total);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selected < results.length) {
        router.push(results[selected].href);
        close();
      } else {
        // "Search all" row
        if (query.trim()) {
          router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          close();
        }
      }
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4"
      onClick={close}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <span className="text-text-muted font-mono text-sm select-none">⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search episodes, people, lore, topics…"
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted text-sm font-mono outline-none"
            spellCheck={false}
            autoComplete="off"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-text-muted border border-border rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-72 overflow-y-auto divide-y divide-border/50">
            {results.map((r, i) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  onClick={close}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    i === selected ? "bg-elevated" : "hover:bg-elevated"
                  }`}
                >
                  <span className="text-base w-5 text-center flex-shrink-0">{TYPE_ICONS[r.type] ?? "·"}</span>
                  <span className="flex-1 text-sm text-text-primary font-sans truncate">{r.label}</span>
                  <span className={`font-mono text-[10px] uppercase tracking-wider flex-shrink-0 ${TYPE_COLORS[r.type] ?? "text-text-muted"}`}>
                    {TYPE_LABELS[r.type] ?? r.type}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {query.length >= 2 && results.length === 0 && (
          <div className="px-4 py-6 text-center font-mono text-xs text-text-muted">
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Footer: search all / hint */}
        <div className={`border-t border-border ${results.length === 0 && query.length < 2 ? "py-4" : "py-2"}`}>
          {query.trim() ? (
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              onClick={close}
              className={`flex items-center gap-3 px-4 py-1.5 transition-colors ${
                selected === results.length ? "bg-elevated" : "hover:bg-elevated"
              }`}
            >
              <span className="text-base w-5 text-center">🔍</span>
              <span className="flex-1 text-sm text-text-muted font-mono">
                Search all results for &ldquo;{query}&rdquo;
              </span>
              <span className="font-mono text-[10px] text-accent-gold">→</span>
            </Link>
          ) : (
            <div className="flex items-center justify-between px-4">
              <p className="font-mono text-[10px] text-text-muted tracking-wider">{"// SEARCH THE ARCHIVE"}</p>
              <div className="flex items-center gap-3 font-mono text-[10px] text-text-muted">
                <span><kbd className="border border-border rounded px-1">↑↓</kbd> navigate</span>
                <span><kbd className="border border-border rounded px-1">↵</kbd> open</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
