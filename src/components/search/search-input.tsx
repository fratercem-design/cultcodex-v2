"use client";

import { useRouter } from "next/navigation";
import { useRef, useCallback } from "react";

interface SearchInputProps {
  defaultValue?: string;
}

export function SearchInput({ defaultValue = "" }: SearchInputProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const value = inputRef.current?.value.trim();
      if (value) {
        router.push(`/search?q=${encodeURIComponent(value)}`);
      }
    },
    [router],
  );

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        ref={inputRef}
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder="Search episodes, people, lore…"
        autoComplete="off"
        className="w-full rounded-lg border border-border bg-surface px-4 py-3 pl-10 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-green focus:outline-none focus:ring-1 focus:ring-accent-green transition-colors"
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
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-accent-green/10 px-3 py-1.5 font-mono text-xs text-accent-green hover:bg-accent-green/20 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
