"use client";

import { useEffect, useRef, useState } from "react";

interface StatItem {
  icon: React.ReactNode;
  label: string;
  value: number;
}

interface ArchiveStatsBarProps {
  stats: StatItem[];
}

function AnimatedCounter({ value }: { value: number }) {
  // Start at the real value for SSR — no zeros on first paint
  const [display, setDisplay] = useState(value);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (value === 0 || hasAnimated.current) return;
    hasAnimated.current = true;

    // Reset to 0 and animate up (only on client mount)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplay(0);
    const duration = 1200;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [value]);

  return <span>{display.toLocaleString()}</span>;
}

export function ArchiveStatsBar({ stats }: ArchiveStatsBarProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-lg border border-border bg-surface p-4 text-center transition-colors hover:border-accent-gold/30"
        >
          <div className="flex items-center justify-center">{stat.icon}</div>
          <p className="mt-1 font-mono text-2xl font-bold text-accent-gold">
            <AnimatedCounter value={stat.value} />
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}
