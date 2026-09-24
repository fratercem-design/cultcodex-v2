"use client";

import { useState } from "react";

interface Props {
  data: Record<string, number>; // { "2024-10-05": 3, ... }
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getColor(count: number, max: number): string {
  if (count === 0) return "bg-elevated border border-border";
  const intensity = count / max;
  if (intensity > 0.75) return "bg-accent-gold";
  if (intensity > 0.5) return "bg-accent-gold/70";
  if (intensity > 0.25) return "bg-accent-gold/40";
  return "bg-accent-gold/20";
}

export function BroadcastCalendar({ data }: Props) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  // Build 52-week grid ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDay = new Date(today);
  startDay.setDate(today.getDate() - 7 * 52 + 1);
  // Align to Sunday
  startDay.setDate(startDay.getDate() - startDay.getDay());

  const weeks: Array<Array<{ date: string; count: number; inRange: boolean }>> = [];
  const cursor = new Date(startDay);

  while (cursor <= today) {
    const week: Array<{ date: string; count: number; inRange: boolean }> = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().slice(0, 10);
      week.push({
        date: dateStr,
        count: data[dateStr] ?? 0,
        inRange: cursor >= new Date("2024-10-01") && cursor <= today,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  const maxCount = Math.max(...Object.values(data), 1);

  // Month label positions
  const monthLabels: Array<{ label: string; weekIndex: number }> = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    const m = new Date(week[0].date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ label: MONTH_ABBR[m], weekIndex: i });
      lastMonth = m;
    }
  });

  return (
    <div className="relative">
      {/* Month labels */}
      <div className="flex mb-1 pl-8">
        {weeks.map((_, i) => {
          const label = monthLabels.find((ml) => ml.weekIndex === i);
          return (
            <div key={i} className="w-3 shrink-0">
              {label && (
                <span className="font-mono text-[12px] text-text-muted">{label.label}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-0.5">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-0.5 mr-1 w-7 shrink-0">
          {DAY_LABELS.map((d, i) => (
            <div key={d} className="h-3 flex items-center justify-end">
              {i % 2 === 1 && (
                <span className="font-mono text-[7px] text-text-muted">{d}</span>
              )}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-0.5 overflow-x-auto">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`w-3 h-3 rounded-[2px] cursor-default transition-opacity ${
                    day.inRange ? getColor(day.count, maxCount) : "bg-transparent"
                  }`}
                  onMouseEnter={(e) => {
                    if (!day.inRange) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ date: day.date, count: day.count, x: rect.left, y: rect.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-surface border border-border rounded px-2 py-1 font-mono text-[12px] text-text-primary shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y - 36 }}
        >
          {tooltip.count === 0 ? "No streams" : `${tooltip.count} stream${tooltip.count > 1 ? "s" : ""}`}
          <span className="text-text-muted ml-1">— {tooltip.date}</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="font-mono text-[12px] text-text-muted">less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <div key={v} className={`w-3 h-3 rounded-[2px] ${getColor(v * maxCount, maxCount)}`} />
        ))}
        <span className="font-mono text-[12px] text-text-muted">more</span>
      </div>
    </div>
  );
}
