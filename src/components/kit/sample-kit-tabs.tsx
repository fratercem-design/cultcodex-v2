"use client";

import { useState } from "react";
import { SAMPLE_KIT } from "@/lib/kit/sample-kit";

const TABS = [
  { id: "chapters", label: "Chapters" },
  { id: "clips", label: "Clips" },
  { id: "description", label: "Description" },
  { id: "hooks", label: "Shorts hooks" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SampleKitTabs() {
  const [tab, setTab] = useState<TabId>("chapters");
  const { stream } = SAMPLE_KIT;

  return (
    <div className="rounded-lg border border-border bg-surface/60">
      <div className="border-b border-border px-4 py-3">
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">
          {"/// sample_kit"}
        </p>
        <p className="mt-1 font-display text-base font-bold text-text-primary">{stream.title}</p>
        <p className="font-mono text-xs text-text-muted">
          {stream.length} live · {stream.chatMessages} chat messages
        </p>
      </div>

      <div role="tablist" aria-label="Sample kit sections" className="flex overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition-colors ${
              tab === t.id
                ? "border-b-2 border-accent-gold text-accent-gold-text"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="max-h-[420px] overflow-y-auto p-4">
        {tab === "chapters" && (
          <ol className="space-y-1.5 font-mono text-sm">
            {SAMPLE_KIT.chapters.map((c) => (
              <li key={c.t} className="flex gap-3">
                <span className="w-16 shrink-0 text-accent-cyan">{c.t}</span>
                <span className="text-text-primary">{c.title}</span>
              </li>
            ))}
          </ol>
        )}

        {tab === "clips" && (
          <ul className="space-y-3">
            {SAMPLE_KIT.clips.map((c) => (
              <li key={c.start} className="rounded-md border border-border/70 p-3">
                <p className="font-mono text-xs text-accent-cyan">
                  {c.start} → {c.end}
                </p>
                <p className="mt-0.5 font-display font-bold text-text-primary">{c.title}</p>
                <p className="mt-0.5 text-sm text-text-muted">{c.why}</p>
              </li>
            ))}
          </ul>
        )}

        {tab === "description" && (
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-text-primary">
            {SAMPLE_KIT.description}
          </pre>
        )}

        {tab === "hooks" && (
          <ul className="space-y-3">
            {SAMPLE_KIT.hooks.map((h) => (
              <li key={h.clipAt} className="flex gap-3">
                <span className="w-16 shrink-0 font-mono text-xs text-accent-cyan">{h.clipAt}</span>
                <span className="text-text-primary">&ldquo;{h.hook}&rdquo;</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
