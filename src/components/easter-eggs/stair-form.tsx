"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StairForm({ base }: { base: string }) {
  const router = useRouter();
  const [word, setWord] = useState("");
  return (
    <form
      className="flex justify-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const w = word.trim().toLowerCase().replace(/[^a-z]/g, "");
        if (w) router.push(`${base}/${w}`);
      }}
    >
      <input
        value={word}
        onChange={(e) => setWord(e.target.value)}
        aria-label="Your answer"
        autoComplete="off"
        spellCheck={false}
        className="w-48 rounded border border-border bg-surface px-3 py-2 font-mono text-sm text-text-primary text-center tracking-[0.2em] lowercase focus:outline-none focus:border-amber-300/60"
      />
      <button type="submit" className="rounded border border-amber-300/40 px-4 py-2 font-mono text-[12px] uppercase tracking-wider text-amber-300 hover:bg-amber-300/10">
        Descend
      </button>
    </form>
  );
}
