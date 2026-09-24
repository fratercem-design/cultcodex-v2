"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { formatSeconds } from "@/lib/format/duration";
import type { TranscriptBlock } from "@/lib/transcript/group-segments";

type SignalClass = "signal" | "noise" | "neutral";
type FilterMode = "all" | "signal" | "highlighted";

interface TranscriptViewerProps {
  /**
   * Paragraph-sized blocks, grouped on the server. Raw caption cues average
   * ~31 characters, so rendering one row per cue costs ~10x the DOM for the
   * same words; see lib/transcript/group-segments.
   */
  blocks: TranscriptBlock[];
  hasVideoEmbed?: boolean;
  initialSearchQuery?: string;
  initialTimestamp?: number;
  signalMap?: Record<string, SignalClass>;
  episodeSlug?: string;
}

const SPEAKER_COLORS = [
  "text-accent-gold-text",
  "text-accent-gold-text",
  "text-accent-cyan",
  "text-accent-violet-text",
];

export function TranscriptViewer({
  blocks,
  hasVideoEmbed,
  initialSearchQuery,
  initialTimestamp,
  signalMap,
  episodeSlug,
}: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery ?? "");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const hasSignalData = signalMap && Object.keys(signalMap).length > 0;
  const containerRef = useRef<HTMLDivElement>(null);
  const segmentRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Build speaker color map
  const speakerColorMap = useMemo(() => {
    const map = new Map<string, string>();
    const uniqueSpeakers = [...new Set(blocks.map((b) => b.speakerLabel).filter(Boolean))] as string[];
    uniqueSpeakers.forEach((speaker, i) => {
      map.set(speaker, SPEAKER_COLORS[i % SPEAKER_COLORS.length]);
    });
    return map;
  }, [blocks]);

  // A block covers several cues, so it counts as signal if any cue in it does.
  const classifyBlock = useCallback(
    (block: TranscriptBlock): SignalClass => {
      if (!signalMap) return "neutral";
      let sawNoise = false;
      for (const start of block.cueStarts) {
        const cls = signalMap[String(start)];
        if (cls === "signal") return "signal";
        if (cls === "noise") sawNoise = true;
      }
      return sawNoise ? "noise" : "neutral";
    },
    [signalMap]
  );

  // Filter blocks by search and signal mode
  const filtered = useMemo(() => {
    let result = blocks;

    // Signal filter
    if (filterMode === "signal" && signalMap) {
      result = result.filter((b) => classifyBlock(b) === "signal");
    }

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.text.toLowerCase().includes(q) ||
          (b.speakerLabel && b.speakerLabel.toLowerCase().includes(q))
      );
    }

    return result;
  }, [blocks, searchQuery, filterMode, signalMap, classifyBlock]);

  // Scroll to initial timestamp
  useEffect(() => {
    if (initialTimestamp != null) {
      const idx = blocks.findIndex(
        (b) => b.startSeconds <= initialTimestamp && b.endSeconds > initialTimestamp
      );
      if (idx >= 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActiveIndex(idx);
        setTimeout(() => {
          segmentRefs.current.get(idx)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  }, [initialTimestamp, blocks]);

  function seekTo(seconds: number) {
    const iframe = document.querySelector<HTMLIFrameElement>(
      'iframe[src*="youtube-nocookie.com"]'
    );
    if (iframe) {
      const baseUrl = iframe.src.split("?")[0];
      // Clamp to a sane range so a malformed DB value can never build a
      // pathological URL (e.g. NaN, negatives, or huge numbers).
      const safeSeconds = Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds) : 0;
      iframe.src = `${baseUrl}?start=${safeSeconds}&autoplay=1`;
    }
  }

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

  async function copySegment(seg: TranscriptBlock) {
    const text = `[${formatSeconds(seg.startSeconds)}]${seg.speakerLabel ? ` ${seg.speakerLabel}:` : ""} ${seg.text}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(seg.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Share a deep link straight to this moment — the growth loop. The ?t= param
  // scrolls a new visitor to this exact line. Uses the Web Share sheet on
  // mobile, clipboard everywhere else.
  async function shareSegment(seg: TranscriptBlock) {
    if (!episodeSlug) return;
    const t = Math.floor(seg.startSeconds);
    const url = `${window.location.origin}/episodes/${episodeSlug}?t=${t}`;
    const shareText = `"${seg.text.slice(0, 140)}${seg.text.length > 140 ? "…" : ""}" — from the Cult of Psyche archive`;
    try {
      if (navigator.share) { await navigator.share({ title: "Cult of Psyche", text: shareText, url }); }
      else { await navigator.clipboard.writeText(url); }
    } catch { /* user dismissed share sheet */ }
    setSharedId(seg.id);
    setTimeout(() => setSharedId(null), 2000);
  }

  function highlightText(text: string, query: string) {
    if (!query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-accent-gold/20 text-accent-gold-text rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0} className="outline-none">
      {/* Signal/Noise filter bar */}
      {hasSignalData && (
        <div className="mb-3 flex items-center gap-1.5">
          <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted mr-1">Filter:</span>
          {(["all", "signal", "highlighted"] as FilterMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-2.5 py-1 rounded font-mono text-[12px] uppercase tracking-wider transition-colors border ${
                filterMode === mode
                  ? mode === "signal"
                    ? "border-green-500/60 bg-green-500/15 text-green-400"
                    : "border-accent-gold/50 bg-accent-gold/10 text-accent-gold-text"
                  : "border-border text-text-muted hover:text-text-primary hover:border-border/60"
              }`}
            >
              {mode === "all" ? "Raw" : mode === "signal" ? "Signal only" : "Highlighted"}
            </button>
          ))}
          {filterMode === "signal" && (
            <span className="font-mono text-[12px] text-text-muted ml-1">
              {filtered.length} signal moment{filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

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
          <span className="font-mono text-[12px] text-text-muted whitespace-nowrap">
            {filtered.length} of {blocks.length}
          </span>
        )}
      </div>

      {/* Segment list */}
      <div ref={containerRef} className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
        {filtered.map((seg, idx) => {
          const isActive = idx === activeIndex;
          const signalClass = classifyBlock(seg);
          const showHighlight = filterMode === "highlighted" && hasSignalData;

          const borderCls = isActive
            ? "border-accent-gold bg-accent-gold/5"
            : showHighlight && signalClass === "signal"
            ? "border-green-500/60 bg-green-500/5 hover:bg-green-500/8"
            : showHighlight && signalClass === "noise"
            ? "border-red-500/30 opacity-50 hover:opacity-70"
            : "border-transparent hover:bg-elevated";

          return (
            <div
              key={seg.id}
              ref={(el) => {
                if (el) segmentRefs.current.set(idx, el);
              }}
              className={`group flex gap-3 rounded px-2 py-1.5 transition-colors border-l-2 ${borderCls}`}
              onClick={() => setActiveIndex(idx)}
            >
              {/* Timestamp */}
              {hasVideoEmbed ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    seekTo(seg.startSeconds);
                  }}
                  className="shrink-0 font-mono text-[12px] text-accent-gold-text/80 w-14 text-right pt-0.5 hover:text-accent-gold-text transition-colors cursor-pointer"
                  title={`Jump to ${formatSeconds(seg.startSeconds)}`}
                >
                  {formatSeconds(seg.startSeconds)}
                </button>
              ) : (
                <span className="shrink-0 font-mono text-[12px] text-accent-gold-text/80 w-14 text-right pt-0.5">
                  {formatSeconds(seg.startSeconds)}
                </span>
              )}

              {/* Content */}
              <div className="min-w-0 flex-1">
                {seg.speakerLabel && (
                  <span
                    className={`font-mono text-[12px] font-bold uppercase ${
                      speakerColorMap.get(seg.speakerLabel) ?? "text-accent-violet-text"
                    }`}
                  >
                    {seg.speakerLabel}
                  </span>
                )}
                <p className="text-sm text-text-primary">
                  {searchQuery ? highlightText(seg.text, searchQuery) : seg.text}
                </p>
              </div>

              {/* Share + copy buttons */}
              <div className="shrink-0 self-start flex items-center gap-1.5 pt-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                {episodeSlug && (
                  <button
                    onClick={(e) => { e.stopPropagation(); shareSegment(seg); }}
                    title="Share a link to this moment"
                    className="font-mono text-[12px] text-text-muted hover:text-accent-cyan transition-colors"
                  >
                    {sharedId === seg.id ? "✓ link" : "🔗"}
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); copySegment(seg); }}
                  title="Copy segment text"
                  className="font-mono text-[12px] text-text-muted hover:text-accent-gold-text transition-colors"
                >
                  {copiedId === seg.id ? "✓" : "⎘"}
                </button>
              </div>
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
      <p className="mt-2 font-mono text-[12px] text-text-muted">
        ↑↓ navigate{hasVideoEmbed ? " · Enter seek" : ""} · Click to select
      </p>
    </div>
  );
}
