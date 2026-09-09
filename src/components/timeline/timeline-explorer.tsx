"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ERAS, getEraForEpisode, type EraColor } from "@/lib/eras";

export interface TimelineItem {
  slug: string;
  title: string;
  episodeNumber: number | null;
  date: string; // ISO (YYYY-MM-DD or full)
}

const ERA_HEX: Record<EraColor, string> = {
  gold: "#C8392E",
  violet: "#4A2D6E",
  cyan: "#62E4C8",
  crimson: "#A94A4A",
  muted: "#8a8478",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function labelForKey(key: string): string {
  const [y, m] = key.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export function TimelineExplorer({ items }: { items: TimelineItem[] }) {
  const [eraFilter, setEraFilter] = useState<string | null>(null);

  // Build month buckets, era per month, counts.
  const { months, byMonth, maxCount } = useMemo(() => {
    const byMonth = new Map<string, TimelineItem[]>();
    for (const it of items) {
      const d = new Date(it.date);
      if (isNaN(d.getTime())) continue;
      const k = monthKey(d);
      if (!byMonth.has(k)) byMonth.set(k, []);
      byMonth.get(k)!.push(it);
    }
    const months = [...byMonth.keys()].sort(); // ascending
    const maxCount = months.reduce((m, k) => Math.max(m, byMonth.get(k)!.length), 1);
    return { months, byMonth, maxCount };
  }, [items]);

  const eraForMonth = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const k of months) {
      const era = getEraForEpisode(new Date(`${k}-15`));
      map.set(k, era?.id ?? null);
    }
    return map;
  }, [months]);

  const visibleMonths = eraFilter ? months.filter((k) => eraForMonth.get(k) === eraFilter) : months;

  // Default selection: latest visible month.
  const [selected, setSelected] = useState<string | null>(null);
  const activeKey = selected && visibleMonths.includes(selected) ? selected : visibleMonths[visibleMonths.length - 1] ?? null;

  const selectedItems = activeKey
    ? [...(byMonth.get(activeKey) ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Era filter */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => setEraFilter(null)}
          className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors ${
            eraFilter === null ? "border-accent-gold/60 bg-accent-gold/10 text-accent-gold-text" : "border-border text-text-muted hover:text-text-primary"
          }`}
        >
          All eras
        </button>
        {ERAS.map((era) => {
          const active = eraFilter === era.id;
          const hex = ERA_HEX[era.color];
          return (
            <button
              key={era.id}
              onClick={() => { setEraFilter(era.id); setSelected(null); }}
              className="rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors"
              style={{
                borderColor: active ? `${hex}99` : "var(--term-line)",
                backgroundColor: active ? `${hex}1a` : "transparent",
                color: active ? hex : "var(--text-muted)",
              }}
            >
              {era.sigil} {era.label}
            </button>
          );
        })}
      </div>

      {/* Histogram */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="flex items-end gap-[3px] h-32 overflow-x-auto pb-1">
          {visibleMonths.map((k) => {
            const count = byMonth.get(k)!.length;
            const eraId = eraForMonth.get(k);
            const era = ERAS.find((e) => e.id === eraId);
            const hex = era ? ERA_HEX[era.color] : "#8a8478";
            const isActive = k === activeKey;
            const h = Math.max(6, Math.round((count / maxCount) * 110));
            return (
              <button
                key={k}
                onClick={() => setSelected(k)}
                title={`${labelForKey(k)} — ${count} transmission${count === 1 ? "" : "s"}`}
                className="group relative shrink-0 rounded-t-sm transition-all"
                style={{
                  width: 10,
                  height: h,
                  backgroundColor: hex,
                  opacity: isActive ? 1 : 0.45,
                  boxShadow: isActive ? `0 0 10px ${hex}aa` : "none",
                }}
                aria-label={`${labelForKey(k)}, ${count} transmissions`}
              />
            );
          })}
        </div>
        <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-widest text-text-muted/60">
          {visibleMonths.length} months · click a bar to inspect
        </p>
      </div>

      {/* Selected month */}
      {activeKey && (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-bold text-text-primary">{labelForKey(activeKey)}</h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted/50">
              {selectedItems.length} transmission{selectedItems.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="space-y-2">
            {selectedItems.map((ep) => (
              <Link
                key={ep.slug}
                href={`/episodes/${ep.slug}`}
                className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5 transition-all hover:border-accent-gold/30 hover:bg-elevated"
              >
                {ep.episodeNumber != null && (
                  <span className="shrink-0 font-mono text-[10px] font-bold text-accent-gold-text/80">
                    EP.{String(ep.episodeNumber).padStart(3, "0")}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary group-hover:text-accent-gold-text transition-colors">
                  {ep.title}
                </span>
                <span className="shrink-0 font-mono text-[10px] text-text-muted/50">
                  {new Date(ep.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
