"use client";

import Link from "next/link";
import { useRef } from "react";

interface TimelineNode {
  slug: string;
  chapterNumber: number;
  title: string;
  isMajorEvent: boolean;
  isRead?: boolean;
  isNewest?: boolean;
}

interface TimelineStripProps {
  chapters: TimelineNode[];
  currentSlug?: string;
}

export function TimelineStrip({ chapters, currentSlug }: TimelineStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (chapters.length === 0) return null;

  return (
    <div className="relative">
      {/* Fade edges */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-void to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-void to-transparent z-10" />

      <div
        ref={scrollRef}
        className="flex items-center gap-0 overflow-x-auto scrollbar-none py-4 px-8"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Timeline line */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-border -translate-y-1/2 pointer-events-none" />

        {chapters.map((ch, i) => {
          const isCurrent = ch.slug === currentSlug;
          const isLast = i === chapters.length - 1;

          const dotCls = ch.isMajorEvent
            ? "w-4 h-4 bg-accent-gold border-2 border-accent-gold/60 shadow-lg shadow-accent-gold/20"
            : ch.isNewest
            ? "w-3.5 h-3.5 bg-accent-violet border-2 border-accent-violet/60 shadow-lg shadow-accent-violet/20"
            : isCurrent
            ? "w-3 h-3 bg-accent-cyan border-2 border-accent-cyan/60"
            : "w-2.5 h-2.5 bg-border border-2 border-border hover:bg-text-muted transition-colors";

          return (
            <div key={ch.slug} className="flex items-center flex-shrink-0">
              <Link
                href={`/psychenomicon/chapters/${ch.slug}`}
                className="group relative flex flex-col items-center gap-1.5"
                title={ch.title}
              >
                <div className={`relative z-10 rounded-full transition-all ${dotCls} group-hover:scale-125`} />
                <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 w-32 -translate-x-1/2 left-1/2 pointer-events-none z-20">
                  <div className="rounded border border-border bg-void/95 px-2 py-1.5 shadow-lg text-center">
                    <p className="font-mono text-[12px] text-text-muted">CH.{String(ch.chapterNumber).padStart(3, "0")}</p>
                    <p className="font-mono text-[12px] text-text-primary leading-tight line-clamp-2">{ch.title}</p>
                  </div>
                </div>
              </Link>
              {!isLast && <div className="w-6 h-px bg-border flex-shrink-0" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
