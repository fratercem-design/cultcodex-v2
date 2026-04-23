"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface AlphabetFilterProps {
  basePath: string;
  currentLetter?: string;
}

export function AlphabetFilter({ basePath, currentLetter }: AlphabetFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (letter: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      // Reset to page 1 whenever letter changes
      params.delete("page");
      if (letter) {
        params.set("letter", letter);
      } else {
        params.delete("letter");
      }
      const qs = params.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    },
    [router, searchParams, basePath],
  );

  const active = "bg-accent-gold/20 text-accent-gold border-accent-gold/40";
  const idle =
    "text-text-muted hover:text-text-primary hover:bg-elevated border-transparent";

  return (
    <div className="flex flex-wrap items-center gap-0.5" role="navigation" aria-label="Filter by letter">
      {/* All */}
      <button
        onClick={() => navigate(null)}
        className={`h-7 min-w-[1.75rem] rounded border px-1.5 font-mono text-[11px] font-bold transition-colors ${
          !currentLetter ? active : idle
        }`}
        aria-current={!currentLetter ? "true" : undefined}
      >
        All
      </button>

      {/* A–Z */}
      {LETTERS.map((letter) => (
        <button
          key={letter}
          onClick={() => navigate(letter)}
          className={`h-7 w-7 rounded border text-center font-mono text-[11px] font-bold transition-colors ${
            currentLetter === letter ? active : idle
          }`}
          aria-current={currentLetter === letter ? "true" : undefined}
          aria-label={`Filter by ${letter}`}
        >
          {letter}
        </button>
      ))}

      {/* # — non-letter starters */}
      <button
        onClick={() => navigate("#")}
        className={`h-7 min-w-[1.75rem] rounded border px-1.5 font-mono text-[11px] font-bold transition-colors ${
          currentLetter === "#" ? active : idle
        }`}
        aria-current={currentLetter === "#" ? "true" : undefined}
        aria-label="Filter names starting with a number or symbol"
      >
        #
      </button>
    </div>
  );
}
