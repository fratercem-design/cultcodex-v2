import Link from "next/link";
import type { ReactNode } from "react";
import { StairForm } from "./stair-form";

/**
 * One landing on the Stairwell. The answer to each riddle is the next path
 * segment, so the only way down is solving it: a wrong word 404s, and the
 * answers never reach the browser.
 */
export function StairPage({
  level,
  heading,
  children,
  base,
  prompt = "Say the word, and the stairs continue.",
}: {
  level: string;
  heading: string;
  children: ReactNode;
  /** Path the answer is appended to. Omit on the bottom landing. */
  base?: string;
  prompt?: string;
}) {
  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-lg space-y-8 text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.3em] text-amber-300/50">{`▼ ${level}`}</p>
        <h1 className="font-display text-2xl font-bold text-text-primary">{heading}</h1>
        <div className="font-mono text-[13px] leading-relaxed text-text-muted space-y-3">{children}</div>
        {base && (
          <>
            <p className="font-mono text-[12px] text-text-muted/70">{prompt}</p>
            <StairForm base={base} />
          </>
        )}
        <Link href="/basement" className="inline-block font-mono text-[12px] text-text-muted hover:text-amber-300 transition-colors">
          ↑ Climb back to the basement
        </Link>
      </div>
    </main>
  );
}
