"use client";

import { useState } from "react";
import { OracleConsole } from "@/components/oracle/oracle-console";

const SUGGESTED_PROMPTS = [
  "What patterns show up when a panel turns hostile?",
  "How do recurring guests change across appearances?",
  "What does the archive say about manipulation tactics?",
  "Which episodes mark a real turning point for a guest?",
  "What archetypes keep recurring across the archive?",
];

/**
 * The homepage Oracle section (Dossier Ch. II §03): "a full cathedral...
 * this is the page's centerpiece." Previously a static, fake sample Q&A —
 * now the actual live OracleConsole, with a horizontally-scrolling row of
 * prompt suggestions ("a Rolodex of tarot cards") that feed straight into it.
 */
export function OracleCathedral() {
  const [prefill, setPrefill] = useState<{ question: string; nonce: number }>({
    question: "",
    nonce: 0,
  });

  return (
    <div className="space-y-5">
      {/* Prompt rolodex — click a card to drop it into the console below */}
      <div
        className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => setPrefill((p) => ({ question: prompt, nonce: p.nonce + 1 }))}
            className="shrink-0 max-w-[260px] rounded-lg border border-accent-violet/25 bg-black/30 px-3.5 py-2.5 text-left font-mono text-[11px] leading-snug text-text-muted transition-all hover:border-accent-violet/60 hover:bg-accent-violet/10 hover:text-text-primary"
          >
            <span className="mr-1.5 text-accent-violet/50">◈</span>
            {prompt}
          </button>
        ))}
      </div>

      <OracleConsole prefillQuestion={prefill.question} prefillNonce={prefill.nonce} />
    </div>
  );
}
