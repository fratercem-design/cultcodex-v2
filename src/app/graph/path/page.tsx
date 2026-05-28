import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  findConnectionPath,
  getConnectionPicker,
  type PathStep,
} from "@/lib/queries/connection-path";
import { fixThumbnailUrl } from "@/lib/format/thumbnail";
import { formatDate } from "@/lib/format/date";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata: Metadata = buildMetadata({
  title: "Connection Paths — The Network — CULT CODEX",
  description:
    "Find the shortest chain between any two figures in the Cult of Psyche archive. Six-degrees through co-appearance.",
  path: "/graph/path",
});

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ConnectionPathPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const fromSlug = params.from?.trim() ?? "";
  const toSlug = params.to?.trim() ?? "";

  const picker = await getConnectionPicker(300);

  const haveBoth = fromSlug && toSlug;
  const result = haveBoth
    ? await findConnectionPath(fromSlug, toSlug)
    : null;

  // Get display names for both endpoints (so we can show them even if path failed)
  const endpointNames: Record<string, string> = {};
  for (const p of picker) {
    if (p.slug === fromSlug) endpointNames[fromSlug] = p.displayName;
    if (p.slug === toSlug) endpointNames[toSlug] = p.displayName;
  }
  // Fallback for endpoints not in the picker top-N
  const fromName = endpointNames[fromSlug] || fromSlug;
  const toName = endpointNames[toSlug] || toSlug;

  return (
    <main id="main-content" className="mx-auto max-w-4xl px-4 py-10 space-y-10">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="space-y-3 max-w-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/50">
          {"/// connection_paths"}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary">
          How does one figure reach another?
        </h1>
        <p className="font-mono text-sm text-text-muted leading-relaxed">
          Every connection in the archive is a chain of episodes. Pick a
          starting figure and a destination — the network finds the shortest
          path through their shared appearances.
        </p>
        <Link
          href="/graph"
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-accent-gold transition-colors"
        >
          ← Open the full network map
        </Link>
      </div>

      {/* ── Form ────────────────────────────────────────────────── */}
      <form
        method="get"
        className="rounded-xl border border-border bg-surface p-5 space-y-4"
      >
        <datalist id="picker-people">
          {picker.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.displayName}
            </option>
          ))}
        </datalist>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <PathInput
            name="from"
            label="From"
            placeholder="e.g. wanda"
            defaultValue={fromSlug}
          />
          <div
            aria-hidden
            className="hidden sm:flex items-center justify-center pb-2 font-mono text-2xl text-text-muted/40 select-none"
          >
            →
          </div>
          <PathInput
            name="to"
            label="To"
            placeholder="e.g. beetle"
            defaultValue={toSlug}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
          <p className="font-mono text-[10px] text-text-muted/50">
            type a slug (lowercase, no spaces) or pick from the top {picker.length} figures
          </p>
          <button
            type="submit"
            className="rounded-lg border border-accent-violet bg-accent-violet/15 px-5 py-2 font-mono text-xs font-bold text-accent-violet hover:bg-accent-violet/25 transition-colors"
          >
            Trace the path →
          </button>
        </div>
      </form>

      {/* ── Result ──────────────────────────────────────────────── */}
      {!haveBoth ? (
        <EmptyHint picker={picker} />
      ) : !result || !result.found ? (
        <NotFound
          fromName={fromName}
          toName={toName}
          reason={result?.reason ?? "no_path"}
        />
      ) : (
        <PathResult fromName={fromName} toName={toName} result={result} />
      )}
    </main>
  );
}

function PathInput({
  name,
  label,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  placeholder: string;
  defaultValue: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-text-muted">
        {label}
      </span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        list="picker-people"
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-lg border border-border bg-void px-3 py-2 font-mono text-sm text-text-primary placeholder-text-muted/40 focus:border-accent-violet focus:outline-none"
      />
    </label>
  );
}

function EmptyHint({
  picker,
}: {
  picker: { slug: string; displayName: string }[];
}) {
  const samples = picker.slice(0, 6);
  if (samples.length < 2) return null;
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/30 p-8 text-center space-y-4">
      <p className="font-mono text-sm text-text-muted">
        Pick a starting figure and a destination above.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {samples.map((s, i) => (
          <Link
            key={s.slug}
            href={
              i === 0
                ? `/graph/path?from=${encodeURIComponent(s.slug)}`
                : i === 1
                  ? `/graph/path?from=${encodeURIComponent(samples[0].slug)}&to=${encodeURIComponent(s.slug)}`
                  : `/graph/path?from=${encodeURIComponent(samples[0].slug)}&to=${encodeURIComponent(s.slug)}`
            }
            className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-[10px] text-text-muted hover:border-accent-violet/40 hover:text-accent-violet transition-colors"
          >
            {s.displayName}
          </Link>
        ))}
      </div>
      <p className="font-mono text-[10px] text-text-muted/40 uppercase tracking-widest">
        try: {samples[0].displayName} → {samples[1].displayName}
      </p>
    </div>
  );
}

function NotFound({
  fromName,
  toName,
  reason,
}: {
  fromName: string;
  toName: string;
  reason: "same_person" | "missing_endpoint" | "no_path";
}) {
  const messages: Record<typeof reason, { title: string; body: string }> = {
    same_person: {
      title: "That's the same figure.",
      body: "Pick two different people to trace a path between.",
    },
    missing_endpoint: {
      title: "Couldn't find one of those figures.",
      body: "Try picking from the datalist or visit /people to find the right slug.",
    },
    no_path: {
      title: `No path from ${fromName} to ${toName}.`,
      body: "These two have never co-appeared, and the chain between them isn't recorded in the archive. They may live in entirely separate orbits.",
    },
  };
  const msg = messages[reason];
  return (
    <div className="rounded-xl border border-accent-crimson/20 bg-accent-crimson/5 p-8 text-center space-y-3">
      <p className="font-display text-lg font-bold text-accent-crimson">
        {msg.title}
      </p>
      <p className="font-mono text-sm text-text-muted leading-relaxed max-w-md mx-auto">
        {msg.body}
      </p>
    </div>
  );
}

function PathResult({
  fromName,
  toName,
  result,
}: {
  fromName: string;
  toName: string;
  result: { steps: PathStep[]; degree: number };
}) {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted/50">
            {"/// chain_resolved"}
          </p>
          <h2 className="font-display text-lg font-bold text-text-primary">
            {fromName} → {toName}
          </h2>
        </div>
        <div className="rounded-full border border-accent-violet/40 bg-accent-violet/10 px-3 py-1 font-mono text-[11px] text-accent-violet tabular-nums">
          {result.degree} {result.degree === 1 ? "degree" : "degrees"} of separation
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <ol className="space-y-5">
          {result.steps.map((step, i) => (
            <PathRow key={`${step.person.id}-${i}`} step={step} index={i} />
          ))}
        </ol>
      </div>

      <p className="font-mono text-[10px] text-text-muted/40 uppercase tracking-widest text-center">
        the chain connects through shared episodes — each link is real
      </p>
    </section>
  );
}

function PathRow({ step, index }: { step: PathStep; index: number }) {
  return (
    <li className="space-y-3">
      {step.via && (
        <div className="ml-7 sm:ml-9 pl-3 border-l-2 border-accent-violet/30 flex items-center gap-3">
          <Image
            src={step.via.thumbnailUrl ? fixThumbnailUrl(step.via.thumbnailUrl)! : "/hero-bg.jpg"}
            alt=""
            width={48}
            height={28}
            unoptimized
            className="w-12 h-7 rounded object-cover shrink-0 opacity-70"
          />
          <Link
            href={`/episodes/${step.via.slug}`}
            className="min-w-0 flex-1 group"
          >
            <p className="font-mono text-[9px] uppercase tracking-widest text-accent-violet/60">
              via{" "}
              {step.via.episodeNumber != null
                ? `EP.${String(step.via.episodeNumber).padStart(3, "0")}`
                : "episode"}
              {step.via.airDate && ` · ${formatDate(step.via.airDate)}`}
            </p>
            <p className="font-mono text-[11px] text-text-muted group-hover:text-accent-violet transition-colors line-clamp-1">
              {step.via.title}
            </p>
          </Link>
        </div>
      )}

      <Link
        href={`/people/${step.person.slug}`}
        className="group flex items-center gap-3"
      >
        <span className="shrink-0 font-mono text-[10px] text-text-muted/40 w-5 tabular-nums">
          {String(index).padStart(2, "0")}
        </span>
        {step.person.avatarUrl ? (
          <Image
            src={step.person.avatarUrl}
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover shrink-0 border border-border group-hover:border-accent-gold/60 transition-colors"
          />
        ) : (
          <div className="h-9 w-9 rounded-full shrink-0 border border-border bg-accent-violet/10 flex items-center justify-center font-mono text-[12px] text-accent-violet">
            {step.person.displayName[0]}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-gold transition-colors">
            {step.person.displayName}
          </p>
          <p className="font-mono text-[9px] text-text-muted/50 capitalize">
            {step.person.personType}
          </p>
        </div>
      </Link>
    </li>
  );
}
