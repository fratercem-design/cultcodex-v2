"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Stat = { value: number; suffix?: string; label: string };

function AnimatedNumber({ value, suffix = "" }: Stat) {
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      const frame = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(frame);
    }

    let frame = 0;
    let started = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started) return;
      started = true;
      setDisplay(0);
      const start = performance.now();
      const duration = 1100;
      const tick = (now: number) => {
        const progress = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(value * eased));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      observer.disconnect();
    }, { threshold: 0.25 });

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref} className="text-accent-gold-text font-bold tabular-nums">
      {display.toLocaleString("en-US")}{suffix}
    </span>
  );
}

export function AnimatedArchiveStats({ stats }: { stats: Stat[] }) {
  return (
    <section aria-label="Archive scale" className="border-b border-border/40 bg-void/80 px-4 py-4 backdrop-blur-sm">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-mono text-lg sm:text-xl">
              <AnimatedNumber {...stat} />
            </p>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

const reasons = [
  {
    index: "01",
    title: "Find the moment.",
    body: "Search years of unscripted conversations by person, subject, conflict, symbol, or exact phrase — then jump back to the source.",
    href: "/search",
    action: "Search the archive",
    accent: "border-accent-cyan/25 hover:border-accent-cyan/60",
  },
  {
    index: "02",
    title: "See what repeats.",
    body: "Follow recurring guests, shifting alliances, tarot archetypes, and behavioral patterns across thousands of transmissions.",
    href: "/graph",
    action: "Explore connections",
    accent: "border-accent-violet/30 hover:border-accent-violet/70",
  },
  {
    index: "03",
    title: "Ask the whole archive.",
    body: "The Oracle searches transcripts, lore, profiles, and decoded patterns, then answers with citations to real episodes and timestamps.",
    href: "/oracle",
    action: "Ask 3 questions free",
    accent: "border-accent-gold/30 hover:border-accent-gold/70",
  },
] as const;

export function WhyCultCodex() {
  return (
    <section aria-labelledby="why-cultcodex" className="space-y-5">
      <div className="max-w-2xl space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-accent-cyan/80">
          {"/// why_enter"}
        </p>
        <h2 id="why-cultcodex" className="font-display text-2xl font-bold text-text-primary sm:text-3xl">
          Watch the show. Then see what the show reveals.
        </h2>
        <p className="font-mono text-xs leading-relaxed text-text-muted">
          CultCodex turns years of live conversation into an explorable map of people, ideas, conflict, humor, and transformation.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {reasons.map((reason) => (
          <Link
            key={reason.index}
            href={reason.href}
            className={`group relative overflow-hidden rounded-xl border bg-surface p-5 transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30 ${reason.accent}`}
          >
            <span aria-hidden="true" className="absolute right-4 top-3 font-mono text-4xl font-bold text-text-muted/10">
              {reason.index}
            </span>
            <h3 className="relative font-display text-lg font-bold text-text-primary">{reason.title}</h3>
            <p className="relative mt-3 font-mono text-[11px] leading-relaxed text-text-muted">{reason.body}</p>
            <p className="relative mt-5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-gold-text">
              {reason.action} <span aria-hidden="true">→</span>
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
