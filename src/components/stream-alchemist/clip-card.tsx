"use client";

import { Lock } from "lucide-react";
import { formatTime } from "@/lib/stream-alchemist/transcript";
import type { Clip, LockedClip } from "@/lib/stream-alchemist/types";
import { CopyButton } from "./copy-button";

function TimeChip({ start, end }: { start: number | null; end: number | null }) {
  if (start === null) {
    return <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">No timestamps</span>;
  }
  const length = end !== null ? Math.round(end - start) : null;
  return (
    <span className="rounded-md border border-evidence/30 bg-evidence/5 px-2 py-0.5 font-mono text-[12px] text-evidence">
      {formatTime(start)} → {formatTime(end)}
      {length !== null && <span className="text-evidence/70"> · {length}s</span>}
    </span>
  );
}

function ScorePill({ score }: { score: number }) {
  return (
    <span
      className="rounded-full border border-member/30 bg-member/10 px-2 py-0.5 font-mono text-[11px] text-member"
      title="Relative strength within this transcript"
    >
      Signal {score}
    </span>
  );
}

function Field({ label, text, children }: { label: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-3">{label}</h4>
        <CopyButton text={text} />
      </div>
      {children ?? <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">{text}</p>}
    </div>
  );
}

export function ClipCard({ clip }: { clip: Clip }) {
  return (
    <article className="rounded-2xl border border-line bg-gradient-to-b from-oracle/[0.06] to-surface p-5 sm:p-6 space-y-5">
      <header className="flex flex-wrap items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-brand font-mono text-[12px] font-bold text-on-brand">
          {clip.rank}
        </span>
        <TimeChip start={clip.start} end={clip.end} />
        <span className="ml-auto">
          <ScorePill score={clip.score} />
        </span>
      </header>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-snug text-ink sm:text-xl">{clip.title}</h3>
          <CopyButton text={clip.title} label="Title" />
        </div>
        <p className="font-serif text-sm italic text-ink-3">Starts with: “{clip.excerpt}”</p>
      </div>

      <Field label="Hook · first 2 seconds" text={clip.hook}>
        <p className="rounded-lg border border-oracle/25 bg-void px-3 py-2 font-display text-base font-bold uppercase tracking-wide text-oracle">
          {clip.hook}
        </p>
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="YouTube Shorts description" text={clip.shortsDescription} />
        <Field label="TikTok / Reels caption" text={clip.tiktokCaption} />
      </div>

      <Field label="Thumbnail text" text={clip.thumbnailText.join("\n")}>
        <ul className="flex flex-wrap gap-2">
          {clip.thumbnailText.map((t) => (
            <li
              key={t}
              className="rounded-md border border-line-strong/50 bg-elevated px-2.5 py-1 font-display text-sm font-bold uppercase text-ink"
            >
              {t}
            </li>
          ))}
        </ul>
      </Field>

      <Field label="Hashtags" text={clip.hashtags.join(" ")}>
        <p className="font-mono text-[13px] text-brand-ink">{clip.hashtags.join(" ")}</p>
      </Field>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-4 text-[13px] text-ink-3">
        {clip.why.map((w) => (
          <li key={w}>
            <span className="text-member" aria-hidden>✦ </span>
            {w}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function LockedClipCard({ clip }: { clip: LockedClip }) {
  return (
    <article
      className="relative overflow-hidden rounded-2xl border border-dashed border-line-strong/50 bg-surface p-5"
      aria-label={`Clip ${clip.rank}, locked`}
    >
      <header className="flex flex-wrap items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-full border border-line-strong font-mono text-[12px] text-ink-3">
          {clip.rank}
        </span>
        <TimeChip start={clip.start} end={clip.end} />
        <span className="ml-auto">
          <ScorePill score={clip.score} />
        </span>
      </header>
      <div className="mt-4 space-y-2 select-none blur-[3px]" aria-hidden>
        <div className="h-5 w-3/4 rounded bg-elevated" />
        <div className="h-3 w-full rounded bg-elevated" />
        <div className="h-3 w-5/6 rounded bg-elevated" />
      </div>
      <p className="mt-4 flex items-center gap-2 text-[13px] text-ink-3">
        <Lock className="size-3.5" aria-hidden /> Title, hook, captions and hashtags come with Creator.
      </p>
    </article>
  );
}
