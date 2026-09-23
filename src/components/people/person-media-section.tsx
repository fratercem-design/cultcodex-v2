"use client";

import Image from "next/image";
import { useState } from "react";
import { SectionCard } from "@/components/ui/section-card";

export interface PersonMediaItem {
  id: string;
  source: string;
  sourceId: string | null;
  sourceUrl: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  publishedAt: string | null;
  durationStr: string | null;
  viewCount: number | null;
  rawContent: string | null;
  channelHandle: string | null;
}

interface Props {
  personName: string;
  videos: PersonMediaItem[];
  wiki: PersonMediaItem | null;
}

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" });
}

function WikiCard({ item }: { item: PersonMediaItem }) {
  const [expanded, setExpanded] = useState(false);
  const text = item.rawContent ?? "";
  const preview = text.slice(0, 400);
  const hasMore = text.length > 400;

  return (
    <div className="rounded-lg border border-accent-cyan/20 bg-accent-cyan/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent-cyan/70 mb-1">
            {"/// ip2wiki.info"}
          </p>
          <p className="font-mono text-xs font-bold text-text-primary">{item.title}</p>
        </div>
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-1 rounded border border-accent-cyan/30 bg-accent-cyan/10 px-2 py-1 font-mono text-[12px] text-accent-cyan hover:bg-accent-cyan/20 transition-colors"
        >
          Full article ↗
        </a>
      </div>

      {text && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted leading-relaxed whitespace-pre-line">
            {expanded ? text : preview}
            {!expanded && hasMore && "…"}
          </p>
          {hasMore && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="font-mono text-[12px] text-accent-cyan hover:underline"
            >
              {expanded ? "Show less ▲" : "Read more ▼"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function VideoCard({ item }: { item: PersonMediaItem }) {
  const videoId = item.sourceId;
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <a
      href={youtubeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-lg border border-border bg-surface hover:border-red-800/50 hover:bg-red-950/20 transition-all overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-void overflow-hidden">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt=""
            fill
            unoptimized
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl opacity-30">▶</span>
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="rounded-full bg-red-600/90 p-3">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* Duration badge */}
        {item.durationStr && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[12px] text-white">
            {item.durationStr}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 p-3 space-y-1.5">
        <p className="font-mono text-xs font-medium text-text-primary group-hover:text-red-400 transition-colors line-clamp-2 leading-relaxed">
          {item.title}
        </p>
        <div className="flex items-center gap-2 font-mono text-[12px] text-text-muted">
          {item.publishedAt && <span>{formatDate(item.publishedAt)}</span>}
          {item.viewCount != null && (
            <>
              <span className="opacity-40">·</span>
              <span>{formatViewCount(item.viewCount)} views</span>
            </>
          )}
        </div>
      </div>
    </a>
  );
}

const PAGE_SIZE = 12;

function VideoChannelSection({
  handle,
  label,
  channelUrl,
  videos,
  personName,
}: {
  handle: string;
  label: string;
  channelUrl: string;
  videos: PersonMediaItem[];
  personName: string;
}) {
  const [page, setPage] = useState(0);
  const sorted = [...videos].sort(
    (a, b) =>
      (b.publishedAt ? new Date(b.publishedAt).getTime() : 0) -
      (a.publishedAt ? new Date(a.publishedAt).getTime() : 0),
  );
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const visible = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <SectionCard title={`${label} (${videos.length} videos)`}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded border border-red-800/50 bg-red-950/30 px-2.5 py-1 font-mono text-[12px] text-red-400">
            <span>▶</span>
            <a href={channelUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {handle}
            </a>
          </span>
          <span className="font-mono text-[12px] text-text-muted">{personName}&apos;s channel</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((v) => (
            <VideoCard key={v.id} item={v} />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded border border-border px-3 py-1.5 font-mono text-[12px] text-text-muted hover:text-text-primary hover:border-accent-violet/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span className="font-mono text-[12px] text-text-muted">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="rounded border border-border px-3 py-1.5 font-mono text-[12px] text-text-muted hover:text-text-primary hover:border-accent-violet/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </SectionCard>
  );
}

const KNOWN_CHANNELS: Record<string, { label: string; url: string }> = {
  "@irlnewstime": { label: "irlnewstime", url: "https://www.youtube.com/@irlnewstime" },
  "@alexandramayers": { label: "AlexandraMayers", url: "https://www.youtube.com/@AlexandraMayers" },
};

function channelMeta(handle: string | null): { label: string; url: string } {
  const key = (handle ?? "").toLowerCase();
  return KNOWN_CHANNELS[key] ?? { label: handle ?? "unknown", url: `https://www.youtube.com/${handle ?? ""}` };
}

export function PersonMediaSection({ personName, videos, wiki }: Props) {
  if (videos.length === 0 && !wiki) {
    return (
      <p className="text-xs text-text-muted italic text-center py-6">
        No external content imported yet. Run the sync workflow.
      </p>
    );
  }

  // Group videos by channelHandle (null → fallback "@irlnewstime")
  const byChannel = new Map<string, PersonMediaItem[]>();
  for (const v of videos) {
    const key = v.channelHandle ?? "@irlnewstime";
    const existing = byChannel.get(key) ?? [];
    existing.push(v);
    byChannel.set(key, existing);
  }

  // Stable channel order: irlnewstime first, then others alphabetically.
  // Filter out @alexandramayers
  const channelOrder = [...byChannel.keys()]
    .filter((handle) => !["@alexandramayers", "@irlnewstime", "@ip2wikiinfo"].includes(handle))
    .sort((a, b) => {
      if (a === "@irlnewstime") return -1;
      if (b === "@irlnewstime") return 1;
      return a.localeCompare(b);
    });

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">
          alexandra mayers — external content
        </p>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* ip2wiki card */}
      {wiki && (
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted mb-2">
            {"/// wiki_profile"}
          </p>
          <WikiCard item={wiki} />
        </div>
      )}

      {/* One section per channel */}
      {channelOrder.map((handle) => {
        const channelVideos = byChannel.get(handle)!;
        const meta = channelMeta(handle);
        return (
          <VideoChannelSection
            key={handle}
            handle={handle}
            label={meta.label}
            channelUrl={meta.url}
            videos={channelVideos}
            personName={personName}
          />
        );
      })}
    </div>
  );
}

