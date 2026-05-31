"use client";

import { useState, useEffect, useRef } from "react";
import { RedactedText } from "./redacted-text";
import { injectEntityTooltips, type EntityRef } from "./archetype-tooltip";

type Layer = "canon" | "interpretation" | "mythic" | "all";

interface LayerViewerProps {
  canonText: string;
  interpretationText: string;
  mythicText: string;
  viewerTier?: "access" | "system" | null;
  entities?: EntityRef[];
}

// ── Line-by-line reveal for mythic text ─────────────────────────────────────

function MythicLine({
  text,
  index,
  entities,
  viewerTier,
}: {
  text: string;
  index: number;
  entities: EntityRef[];
  viewerTier?: "access" | "system" | null;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), index * 60);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  const hasRedacted = text.includes("[[");
  const tooltipContent = entities.length ? injectEntityTooltips(text, entities) : text;

  return (
    <span
      ref={ref}
      className="block leading-relaxed"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      {text.trim() === "" ? (
        <span className="block h-3" />
      ) : hasRedacted ? (
        <RedactedText text={text} viewerTier={viewerTier} />
      ) : (
        tooltipContent
      )}
    </span>
  );
}

function MythicReveal({
  text,
  entities,
  viewerTier,
}: {
  text: string;
  entities: EntityRef[];
  viewerTier?: "access" | "system" | null;
}) {
  const lines = text.split("\n");
  return (
    <div className="space-y-0 font-serif italic text-sm text-text-primary/85 [text-shadow:0_0_20px_rgba(139,92,246,0.12)] leading-relaxed">
      {lines.map((line, i) => (
        <MythicLine key={i} text={line} index={i} entities={entities} viewerTier={viewerTier} />
      ))}
    </div>
  );
}

// ── Rich paragraph renderer (canon + interpretation) ────────────────────────

function RichParagraphs({
  text,
  entities,
  viewerTier,
  className = "text-sm text-text-primary leading-relaxed",
}: {
  text: string;
  entities: EntityRef[];
  viewerTier?: "access" | "system" | null;
  className?: string;
}) {
  const paragraphs = text.split(/\n{2,}/).filter(Boolean);
  return (
    <>
      {paragraphs.map((para, i) => {
        const trimmed = para.trim();
        const hasRedacted = trimmed.includes("[[");
        const withTooltips = entities.length ? injectEntityTooltips(trimmed, entities) : trimmed;

        return (
          <p key={i} className={`mb-4 last:mb-0 ${className}`}>
            {hasRedacted ? (
              <RedactedText text={trimmed} viewerTier={viewerTier} />
            ) : (
              withTooltips
            )}
          </p>
        );
      })}
    </>
  );
}

// ── Main LayerViewer ─────────────────────────────────────────────────────────

export function LayerViewer({
  canonText,
  interpretationText,
  mythicText,
  viewerTier,
  entities = [],
}: LayerViewerProps) {
  const [activeLayer, setActiveLayer] = useState<Layer>("mythic");
  const [pulseLayer, setPulseLayer] = useState<Layer | null>(null);

  function switchLayer(layer: Layer) {
    setPulseLayer(layer);
    setActiveLayer(layer);
    setTimeout(() => setPulseLayer(null), 600);
  }

  const layers: Array<{ id: Layer; label: string; badge: string; color: string; activeCls: string }> = [
    {
      id: "mythic",
      label: "Myth",
      badge: "default",
      color: "text-accent-violet",
      activeCls: "border-accent-violet/60 bg-accent-violet/10 text-accent-violet",
    },
    {
      id: "canon",
      label: "Record",
      badge: "70%",
      color: "text-accent-cyan",
      activeCls: "border-accent-cyan/60 bg-accent-cyan/10 text-accent-cyan",
    },
    {
      id: "interpretation",
      label: "Analysis",
      badge: "20%",
      color: "text-accent-gold",
      activeCls: "border-accent-gold/60 bg-accent-gold/10 text-accent-gold",
    },
    {
      id: "all",
      label: "All Layers",
      badge: "",
      color: "text-text-muted",
      activeCls: "border-text-muted/60 bg-elevated text-text-primary",
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
            {l.badge && <span className="opacity-50 text-[8px]">{l.badge}</span>}
          </button>
        ))}
      </div>

      {/* Mythic */}
      {(activeLayer === "all" || activeLayer === "mythic") && (
        <div
          className={`transition-opacity ${pulseLayer === "mythic" ? "opacity-0" : "opacity-100"}`}
          style={{ transition: "opacity 0.3s" }}
        >
          {activeLayer === "all" && (
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-accent-violet/20" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-violet">{"/// myth — the symbolic layer"}</span>
              <div className="h-px flex-1 bg-accent-violet/20" />
            </div>
          )}
          <div className={activeLayer === "all" ? "pl-4 border-l-2 border-accent-violet/30" : ""}>
            <MythicReveal text={mythicText} entities={entities} viewerTier={viewerTier} />
          </div>
        </div>
      )}

      {/* Canon */}
      {(activeLayer === "all" || activeLayer === "canon") && (
        <div
          className={`transition-opacity ${pulseLayer === "canon" ? "opacity-0" : "opacity-100"}`}
          style={{ transition: "opacity 0.3s" }}
        >
          {activeLayer === "all" && (
            <div className="flex items-center gap-2 mb-3 mt-6">
              <div className="h-px flex-1 bg-accent-cyan/20" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-cyan">{"/// record — what happened"}</span>
              <div className="h-px flex-1 bg-accent-cyan/20" />
            </div>
          )}
          <div className={activeLayer === "all" ? "pl-4 border-l-2 border-accent-cyan/30" : ""}>
            <RichParagraphs text={canonText} entities={entities} viewerTier={viewerTier} />
          </div>
        </div>
      )}

      {/* Interpretation */}
      {(activeLayer === "all" || activeLayer === "interpretation") && (
        <div
          className={`transition-opacity ${pulseLayer === "interpretation" ? "opacity-0" : "opacity-100"}`}
          style={{ transition: "opacity 0.3s" }}
        >
          {activeLayer === "all" && (
            <div className="flex items-center gap-2 mb-3 mt-6">
              <div className="h-px flex-1 bg-accent-gold/20" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold">{"/// analysis — beneath the surface"}</span>
              <div className="h-px flex-1 bg-accent-gold/20" />
            </div>
          )}
          <div className={activeLayer === "all" ? "pl-4 border-l-2 border-accent-gold/30" : ""}>
            <RichParagraphs
              text={interpretationText}
              entities={entities}
              viewerTier={viewerTier}
              className="text-sm text-text-primary/90 leading-relaxed"
            />
          </div>
        </div>
      )}
    </div>
  );
}
