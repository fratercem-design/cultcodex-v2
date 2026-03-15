"use client";

import { useState } from "react";
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
}

const COLLAPSED_COUNT = 20;

export function TranscriptViewer({ segments, hasVideoEmbed }: TranscriptViewerProps) {
  const [expanded, setExpanded] = useState(segments.length <= COLLAPSED_COUNT);

  const visible = expanded ? segments : segments.slice(0, COLLAPSED_COUNT);

  return (
    <div>
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {visible.map((seg) => (
          <div key={seg.id} className="flex gap-3">
            {hasVideoEmbed ? (
              <a
                href={`?t=${seg.startSeconds}`}
                onClick={(e) => {
                  e.preventDefault();
                  const iframe = document.querySelector("iframe");
                  if (iframe) {
                    const baseUrl = iframe.src.split("?")[0];
                    iframe.src = `${baseUrl}?start=${seg.startSeconds}&autoplay=1`;
                  }
                }}
                className="shrink-0 font-mono text-[10px] text-accent-green/60 w-12 text-right pt-0.5 hover:text-accent-green transition-colors cursor-pointer"
                title={`Jump to ${formatSeconds(seg.startSeconds)}`}
              >
                {formatSeconds(seg.startSeconds)}
              </a>
            ) : (
              <span className="shrink-0 font-mono text-[10px] text-accent-green/60 w-12 text-right pt-0.5">
                {formatSeconds(seg.startSeconds)}
              </span>
            )}
            <div>
              {seg.speakerLabel && (
                <span className="font-mono text-[10px] text-accent-purple font-bold uppercase">
                  {seg.speakerLabel}
                </span>
              )}
              <p className="text-sm text-text-primary">{seg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {segments.length > COLLAPSED_COUNT && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 w-full rounded border border-border px-4 py-2 font-mono text-xs text-text-muted hover:text-accent-green hover:border-accent-green/30 transition-colors"
        >
          {expanded
            ? "Collapse transcript"
            : `Show all ${segments.length} segments`}
        </button>
      )}
    </div>
  );
}
