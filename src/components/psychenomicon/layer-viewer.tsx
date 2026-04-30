"use client";

import { useState } from "react";

type Layer = "canon" | "interpretation" | "mythic" | "all";

interface LayerViewerProps {
  canonText: string;
  interpretationText: string;
  mythicText: string;
}

function renderParagraphs(text: string, className?: string) {
  return text.split(/\n{2,}/).filter(Boolean).map((para, i) => (
    <p key={i} className={`leading-relaxed mb-4 last:mb-0 ${className ?? "text-sm text-text-primary"}`}>
      {para.trim()}
    </p>
  ));
}

export function LayerViewer({ canonText, interpretationText, mythicText }: LayerViewerProps) {
  const [activeLayer, setActiveLayer] = useState<Layer>("all");
  const [pulseLayer, setPulseLayer] = useState<Layer | null>(null);

  function switchLayer(layer: Layer) {
    setPulseLayer(layer);
    setActiveLayer(layer);
    setTimeout(() => setPulseLayer(null), 600);
  }

  const layers: Array<{ id: Layer; label: string; badge: string; color: string; activeCls: string }> = [
    {
      id: "all",
      label: "Full Read",
      badge: "ALL",
      color: "text-text-muted",
      activeCls: "border-text-muted/60 bg-elevated text-text-primary",
    },
    {
      id: "canon",
      label: "Canon",
      badge: "70%",
      color: "text-accent-cyan",
      activeCls: "border-accent-cyan/60 bg-accent-cyan/10 text-accent-cyan",
    },
    {
      id: "interpretation",
      label: "Interpretation",
      badge: "20%",
      color: "text-accent-gold",
      activeCls: "border-accent-gold/60 bg-accent-gold/10 text-accent-gold",
    },
    {
      id: "mythic",
      label: "Mythic",
      badge: "10%",
      color: "text-accent-violet",
      activeCls: "border-accent-violet/60 bg-accent-violet/10 text-accent-violet",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Layer toggle */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted mr-1">Layer:</span>
        {layers.map((l) => (
          <button
            key={l.id}
            onClick={() => switchLayer(l.id)}
            className={`inline-flex items-center gap-1.5 rounded border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-all ${
              activeLayer === l.id ? l.activeCls : `border-border ${l.color} hover:border-current/40`
            }`}
          >
            {l.label}
            <span className="opacity-50">{l.badge}</span>
          </button>
        ))}
      </div>

      {/* Canon */}
      {(activeLayer === "all" || activeLayer === "canon") && (
        <div
          className={`space-y-1 transition-opacity ${pulseLayer === "canon" ? "opacity-0" : "opacity-100"}`}
          style={{ transition: "opacity 0.3s" }}
        >
          {activeLayer === "all" && (
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-accent-cyan/20" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-cyan">/// canon — what happened</span>
              <div className="h-px flex-1 bg-accent-cyan/20" />
            </div>
          )}
          <div className={activeLayer === "all" ? "pl-4 border-l-2 border-accent-cyan/30" : ""}>
            {renderParagraphs(canonText, "text-sm text-text-primary")}
          </div>
        </div>
      )}

      {/* Interpretation */}
      {(activeLayer === "all" || activeLayer === "interpretation") && (
        <div
          className={`space-y-1 transition-opacity ${pulseLayer === "interpretation" ? "opacity-0" : "opacity-100"}`}
          style={{ transition: "opacity 0.3s" }}
        >
          {activeLayer === "all" && (
            <div className="flex items-center gap-2 mb-3 mt-6">
              <div className="h-px flex-1 bg-accent-gold/20" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold">/// interpretation — beneath the surface</span>
              <div className="h-px flex-1 bg-accent-gold/20" />
            </div>
          )}
          <div className={activeLayer === "all" ? "pl-4 border-l-2 border-accent-gold/30" : ""}>
            {renderParagraphs(interpretationText, "text-sm text-text-primary/90")}
          </div>
        </div>
      )}

      {/* Mythic */}
      {(activeLayer === "all" || activeLayer === "mythic") && (
        <div
          className={`space-y-1 transition-opacity ${pulseLayer === "mythic" ? "opacity-0" : "opacity-100"}`}
          style={{ transition: "opacity 0.3s" }}
        >
          {activeLayer === "all" && (
            <div className="flex items-center gap-2 mb-3 mt-6">
              <div className="h-px flex-1 bg-accent-violet/20" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-violet">/// mythic — the symbolic layer</span>
              <div className="h-px flex-1 bg-accent-violet/20" />
            </div>
          )}
          <div className={`${activeLayer === "all" ? "pl-4 border-l-2 border-accent-violet/30" : ""}`}>
            {renderParagraphs(
              mythicText,
              "text-sm italic text-text-primary/80 [text-shadow:0_0_20px_rgba(139,92,246,0.15)]"
            )}
          </div>
        </div>
      )}
    </div>
  );
}
