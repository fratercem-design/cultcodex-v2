"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export interface EntityRef {
  name: string;
  slug: string;
  primaryArchetype: string | null;
  behaviorPatterns?: string[];
}

interface TooltipProps {
  entity: EntityRef;
  children: React.ReactNode;
}

export function ArchetypeTooltip({ entity, children }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <span ref={ref} className="relative inline-block">
      <span
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="cursor-help border-b border-dashed border-accent-violet/40 text-accent-violet-text/90 hover:text-accent-violet-text transition-colors"
      >
        {children}
      </span>

      {open && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <span className="block w-56 rounded-lg border border-accent-violet/30 bg-void/98 backdrop-blur-sm p-3 shadow-2xl shadow-accent-violet/10 space-y-2">
            <span className="block font-mono text-[9px] uppercase tracking-[0.3em] text-accent-violet-text/70">{"/// entity"}</span>
            <span className="block font-mono text-xs font-bold text-text-primary">{entity.name}</span>
            {entity.primaryArchetype && (
              <span className="block font-mono text-[10px] text-accent-violet-text">{entity.primaryArchetype}</span>
            )}
            {entity.behaviorPatterns && entity.behaviorPatterns.length > 0 && (
              <span className="block flex flex-wrap gap-1 mt-1">
                {entity.behaviorPatterns.slice(0, 3).map((p) => (
                  <span key={p} className="inline-block rounded border border-border px-1.5 py-0.5 font-mono text-[8px] text-text-muted">
                    {p}
                  </span>
                ))}
              </span>
            )}
            <Link
              href={`/psychenomicon/entities/${entity.slug}`}
              className="pointer-events-auto block font-mono text-[9px] text-accent-violet-text/70 hover:text-accent-violet-text transition-colors mt-1"
            >
              View full profile →
            </Link>
          </span>
          {/* Arrow */}
          <span className="block w-2 h-2 mx-auto -mt-1 rotate-45 border-b border-r border-accent-violet/30 bg-void" />
        </span>
      )}
    </span>
  );
}

/**
 * Given a text string and a list of known entities, replaces exact name matches
 * with ArchetypeTooltip wrappers. Returns an array of React nodes.
 */
export function injectEntityTooltips(text: string, entities: EntityRef[]): React.ReactNode[] {
  if (!entities.length) return [text];

  // Build regex from entity names, longest first to avoid partial matches
  const sorted = [...entities].sort((a, b) => b.name.length - a.name.length);
  const pattern = sorted.map((e) => e.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
  const re = new RegExp(`(${pattern})`, "g");

  const parts = text.split(re);
  return parts.map((part, i) => {
    const entity = entities.find((e) => e.name === part);
    if (entity) {
      return (
        <ArchetypeTooltip key={i} entity={entity}>
          {part}
        </ArchetypeTooltip>
      );
    }
    return part;
  });
}
