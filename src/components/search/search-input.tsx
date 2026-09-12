"use client";

import { useRouter } from "next/navigation";
import { useRef, useCallback, useState, useEffect } from "react";
import Link from "next/link";

interface Suggestion {
  label: string;
  href: string;
  type: string;
}

interface SearchInputProps {
  defaultValue?: string;
}

export function SearchInput({ defaultValue = "" }: SearchInputProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const value = inputRef.current?.value.trim();
      if (value) {
        setShowDropdown(false);
        router.push(`/search?q=${encodeURIComponent(value)}`);
      }
    },
    [router],
  );

  const handleInput = useCallback(() => {
    const value = inputRef.current?.value.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value || value.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(value)}`);
        const data: Suggestion[] = await res.json();
        setSuggestions(data);
        setShowDropdown(data.length > 0);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    }, 300);
  }, []);

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const TYPE_LABELS: Record<string, string> = {
    episode: "EP",
    person: "PERSON",
    lore: "LORE",
    topic: "TOPIC",
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="search"
          aria-label="Search the archive"
          name="q"
          defaultValue={defaultValue}
          placeholder="Search episodes, people, lore…"
          autoComplete="off"
          onInput={handleInput}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          className="w-full rounded-lg border border-border bg-surface py-3 pl-10 pr-20 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none focus:ring-1 focus:ring-accent-gold transition-colors"
        />
        {/* Search icon */}
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-accent-gold/10 px-3 py-1.5 font-mono text-xs text-accent-gold-text hover:bg-accent-gold/20 transition-colors"
        >
          Search
        </button>
      </form>

      {/* Autocomplete dropdown */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg">
          <ul className="py-1">
            {suggestions.map((s, i) => (
              <li key={i}>
                <Link
                  href={s.href}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-elevated transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <span className="font-mono text-[10px] text-text-muted w-12">
                    {TYPE_LABELS[s.type] ?? s.type.toUpperCase()}
                  </span>
                  <span className="truncate">{s.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
