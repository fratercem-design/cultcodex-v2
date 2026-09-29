"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-ink-3 transition-colors hover:border-line-strong hover:text-ink"
      aria-label={copied ? "Copied" : `${label} to clipboard`}
    >
      {copied ? <Check className="size-3 text-evidence" aria-hidden /> : <Copy className="size-3" aria-hidden />}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  );
}
