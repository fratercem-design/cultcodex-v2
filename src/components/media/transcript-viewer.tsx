"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { formatSeconds } from "@/lib/format/duration";

interface Segment {
  id: string;
  startSeconds: number;
  endSeconds: number;
  speakerLabel: string | null;
  text: string;
}

interface TranscriptViewerProps {
  segments: Segment[];
  hasVideoEmbed?: boolean;
  initialSearchQuery?: string;
  initialTimestamp?: number;
}

const SPEAKER_COLORS = [
  "text-accent-gold",
  "text-accent-gold",
  "text-accent-cyan",
  "text-accent-purple",
];

export function TranscriptViewer({
  segments,
  hasVideoEmbed,
  initialSearchQuery,
  initialTimestamp,
}: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery ?? "");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Build speaker color map
  const speakerColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueSpeakers = [...new Set(segments.map((s) => s.speakerLabel).filter(Boolean))] as string[];
    uniqueSpeakers.forEach((speaker, i) => {
      map.set(speaker, SPEAKER_COLORS[i % SPEAKER_COLORS.length]);
    });
    return map;
  }, [segments]);

  // Filter segments by search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return segments;
    const q = searchQuery.toLowerCase();
    return segments.filter(
      (s) =>
        s.text.toLowerCase().includes(q) ||
        (s.speakerLabel && s.speakerLabel.toLowerCase().includes(q))
    );
  }, [segments, searchQuery]);

  // Scroll to initial timestamp
  useEffect(() => {
    if (initialTimestamp != null) {
      const idx = segments.findIndex(
        (s) => s.startSeconds <= initialTimestamp && s.endSeconds > initialTimestamp
      );
      if (idx >= 0) {
        setActiveIndex(idx);
        setTimeout(() => {
          segmentRefs.current.get(idx)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  }, [initialTimestamp, segments]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = Math.min(prev + 1, filtered.length - 1);
          segmentRefs.current.get(next)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          return next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => {
          const next = Math.max(prev - 1, 0);
          segmentRefs.current.get(next)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          return next;
        });
      } else if (e.key === "Enter" && activeIndex >= 0 && hasVideoEmbed) {
        e.preventDefault();
        const seg = filtered[activeIndex];
        if (seg) seekTo(seg.startSeconds);
      }
    },
    [activeIndex, filtered, hasVideoEmbed]
  );

  function seekTo(seconds: number) {
    const iframe = document.querySelector<HTMLIFrameElement>(
      'iframe[src*="youtube-nocookie.com"]'
    );
    if (iframe) {
      const baseUrl = iframe.src.split("?")[0];
      iframe.src = `${baseUrl}?start=${seconds}&autoplay=1`;
    }
  }

  async function copySegment(seg: Segment) {
    const text = `[${formatSeconds(seg.startSeconds)}]${seg.speakerLabel ? ` ${seg.speakerLabel}:` : ""} ${seg.text}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(seg.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function highlightText(text: string, query: string) {
    if (!query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-accent-gold/20 text-accent-gold rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0} className="outline-none">
      {/* Search bar */}
      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setActiveIndex(-1);
          }}
          placeholder="Search transcript..."
          className="flex-1 rounded border border-border bg-elevated px-3 py-1.5 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none"
        />
        {searchQuery && (
          <span className="font-mono text-[10px] text-text-muted whitespace-nowrap">
            {filtered.length} of {segments.length}
          </span>
        )}
      </div>

      {/* Segment list */}
      <div ref={containerRef} className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
        {filtered.map((seg, idx) => {
          const isActive = idx === activeIndex;
          return (
            <div
              key={seg.id}
              ref={(el) => {
                if (el) segmentRefs.current.set(idx, el);
              }}
              className={`group flex gap-3 rounded px-2 py-1.5 transition-colors ${
                isActive
                  ? "border-l-2 border-accent-gold bg-accent-gold/5"
                  : "border-l-2 border-transparent hover:bg-elevated"
              }`}
              onClick={() => setActiveIndex(idx)}
            >
              {/* Timestamp */}
              {hasVideoEmbed ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    seekTo(seg.startSeconds);
                  }}
                  className="shrink-0 font-mono text-[10px] text-accent-gold/60 w-14 text-right pt-0.5 hover:text-accent-gold transition-colors cursor-pointer"
                  title={`Jump to ${formatSeconds(seg.startSeconds)}`}
                >
                  {formatSeconds(seg.startSeconds)}
                </button>
              ) : (
                <span className="shrink-0 font-mono text-[10px] text-accent-gold/60 w-14 text-right pt-0.5">
                  {formatSeconds(seg.startSeconds)}
                </span>
              )}

              {/* Content */}
              <div className="min-w-0 flex-1">
                {seg.speakerLabel && (
                  <span
                    className={`font-mono text-[10px] font-bold uppercase ${
                      speakerColorMap.get(seg.speakerLabel) ?? "text-accent-purple"
                    }`}
                  >
                    {seg.speakerLabel}
                  </span>
                )}
                <p className="text-sm text-text-primary">
                  {searchQuery ? highlightText(seg.text, searchQuery) : seg.text}
                </p>
              </div>

              {/* Copy button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copySegment(seg);
                }}
                className="shrink-0 self-start pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Copy segment"
              >
                <span className="font-mono text-[10px] text-text-muted hover:text-accent-gold transition-colors">
                  {copiedId === seg.id ? "✓" : "⎘"}
                </span>
              </button>
            </div>
          );
        })}

        {filtered.length === 0 && searchQuery && (
          <p className="py-4 text-center font-mono text-xs text-text-muted">
            No segments match &ldquo;{searchQuery}&rdquo;
          </p>
        )}
      </div>

      {/* Keyboard hint */}
      <p className="mt-2 font-mono text-[9px] text-text-muted/50">
        ↑↓ navigate{hasVideoEmbed ? " · Enter seek" : ""} · Click to select
      </p>
    </div>
  );
}
