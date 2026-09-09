export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import {
  getPersonalizedGuide,
  ORACLE_PROMPTS,
  type Interest,
  type Depth,
  type Intent,
} from "@/lib/queries/start-here";
import { formatDate } from "@/lib/format/date";
import type { Metadata } from "next";

const INTEREST_LABELS: Record<Interest, string> = {
  consciousness: "Consciousness & the Self",
  ai: "AI & The Future",
  occult: "The Occult & Hidden Knowledge",
  behavior: "Human Behavior & Psychology",
  wild: "Chaos, Drama & Wild Conversations",
};

const DEPTH_LABELS: Record<Depth, string> = {
  fresh: "Fresh arrival",
  familiar: "Familiar with the archive",
  deep: "Deep in the archive",
};

const INTEREST_ACCENTS: Record<Interest, { text: string; border: string; bg: string }> = {
  consciousness: { text: "text-accent-violet-text", border: "border-accent-violet/30", bg: "bg-accent-violet/5" },
  ai: { text: "text-accent-cyan", border: "border-accent-cyan/30", bg: "bg-accent-cyan/5" },
  occult: { text: "text-accent-gold-text", border: "border-accent-gold/30", bg: "bg-accent-gold/5" },
  behavior: { text: "text-accent-crimson", border: "border-accent-crimson/30", bg: "bg-red-950/10" },
  wild: { text: "text-accent-gold-text", border: "border-accent-gold/30", bg: "bg-accent-gold/5" },
};

const VALID_INTERESTS: Interest[] = ["consciousness", "ai", "occult", "behavior", "wild"];
const VALID_DEPTHS: Depth[] = ["fresh", "familiar", "deep"];
const VALID_INTENTS: Intent[] = ["episodes", "people", "oracle"];

interface Props {
  searchParams: Promise<{ interest?: string; depth?: string; intent?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const p = await searchParams;
  const interest = p.interest as Interest | undefined;
  const label = interest && INTEREST_LABELS[interest] ? INTEREST_LABELS[interest] : "the archive";
  return {
    title: `Your Path Into ${label} — CULT CODEX`,
    description: `A personalized entry point into the Cult of Psyche archive, calibrated for ${label}.`,
    // Consolidate all ?interest/?depth/?intent permutations to one canonical.
    alternates: { canonical: "/start-here/results" },
  };
}

export default async function ResultsPage({ searchParams }: Props) {
  const p = await searchParams;

  const interest = p.interest as Interest;
  const depth = p.depth as Depth;
  const intent = p.intent as Intent;

  if (
    !VALID_INTERESTS.includes(interest) ||
    !VALID_DEPTHS.includes(depth) ||
    !VALID_INTENTS.includes(intent)
  ) {
    redirect("/start-here/quiz");
  }

  const { episodes, people, oraclePrompts } = await getPersonalizedGuide(interest, depth);

  const accent = INTEREST_ACCENTS[interest];
  const interestLabel = INTEREST_LABELS[interest];
  const depthLabel = DEPTH_LABELS[depth];

  // Section order by intent
  const sectionOrder: Intent[] = intent === "episodes"
    ? ["episodes", "people", "oracle"]
    : intent === "people"
    ? ["people", "episodes", "oracle"]
    : ["oracle", "episodes", "people"];

  const sections = {
    episodes: (
      <section key="episodes" className="space-y-4">
        <div className="space-y-1">
          <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${accent.text}/60`}>
            {"/// transmissions"}
          </p>
          <h2 className={`font-display text-lg font-bold ${accent.text}`}>
            Episodes to start with
          </h2>
          <p className="font-mono text-[11px] text-text-muted">
            {depth === "fresh"
              ? "Early transmissions — foundational material for this territory."
              : depth === "familiar"
              ? "Recent transmissions — what the archive has been building toward."
              : "Buried material — less obvious, more specific."}
          </p>
        </div>

        {episodes.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-center">
            <p className="font-mono text-xs text-text-muted">
              No direct matches found.{" "}
              <Link href="/search" className={`${accent.text} underline`}>
                Search the full archive →
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {episodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/episodes/${ep.slug}`}
                className={`group flex items-start gap-4 rounded-lg border border-border bg-surface p-4 transition-all hover:${accent.border.replace("border-", "border-")} hover:bg-elevated`}
              >
                {ep.thumbnailUrl ? (
                  <Image
                    src={ep.thumbnailUrl}
                    alt=""
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 flex-shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className={`h-16 w-16 flex-shrink-0 rounded ${accent.bg}`} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {ep.episodeNumber && (
                      <span className={`font-mono text-[10px] font-bold ${accent.text}`}>
                        EP.{String(ep.episodeNumber).padStart(3, "0")}
                      </span>
                    )}
                    {ep.airDate && (
                      <time
                        dateTime={ep.airDate.toISOString()}
                        className="font-mono text-[10px] text-text-muted"
                      >
                        {formatDate(ep.airDate)}
                      </time>
                    )}
                  </div>
                  <h3 className={`font-sans text-sm font-medium text-text-primary group-hover:${accent.text} transition-colors`}>
                    {ep.title}
                  </h3>
                  {ep.summaryShort && (
                    <p className="mt-1 text-xs text-text-muted line-clamp-2">
                      {ep.summaryShort}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="pt-1">
          <Link
            href={`/episodes`}
            className={`font-mono text-[10px] uppercase tracking-widest ${accent.text} hover:opacity-80 transition-opacity inline-flex items-center gap-1.5`}
          >
            Full archive → <span aria-hidden>(nearly 3,000 episodes)</span>
          </Link>
        </div>
      </section>
    ),

    people: (
      <section key="people" className="space-y-4">
        <div className="space-y-1">
          <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${accent.text}/60`}>
            {"/// voices"}
          </p>
          <h2 className={`font-display text-lg font-bold ${accent.text}`}>
            People in this territory
          </h2>
          <p className="font-mono text-[11px] text-text-muted">
            Figures the archive has profiled and linked to this area.
          </p>
        </div>

        {people.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-6 text-center">
            <p className="font-mono text-xs text-text-muted">
              No profiles match directly.{" "}
              <Link href="/people" className={`${accent.text} underline`}>
                Browse all voices →
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {people.map((person) => (
              <Link
                key={person.id}
                href={`/people/${person.slug}`}
                className="group flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-all hover:border-border-strong hover:bg-elevated"
              >
                {person.avatarUrl ? (
                  <img
                    src={person.avatarUrl}
                    alt={person.displayName}
                    className="h-12 w-12 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className={`h-12 w-12 rounded-full ${accent.bg} border ${accent.border}`} />
                )}
                <div>
                  <p className={`font-display text-sm font-bold text-text-primary group-hover:${accent.text} transition-colors`}>
                    {person.displayName}
                  </p>
                  {person.shortBio && (
                    <p className="mt-1 font-mono text-[10px] text-text-muted line-clamp-3 leading-relaxed">
                      {person.shortBio}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="pt-1">
          <Link
            href="/people"
            className={`font-mono text-[10px] uppercase tracking-widest ${accent.text} hover:opacity-80 transition-opacity`}
          >
            All voices in the archive →
          </Link>
        </div>
      </section>
    ),

    oracle: (
      <section key="oracle" className="space-y-4">
        <div className="space-y-1">
          <p className={`font-mono text-[10px] uppercase tracking-[0.3em] ${accent.text}/60`}>
            {"/// oracle prompts"}
          </p>
          <h2 className={`font-display text-lg font-bold ${accent.text}`}>
            Ask the Oracle
          </h2>
          <p className="font-mono text-[11px] text-text-muted">
            The Oracle synthesizes across all nearly 3,000 transmissions. These
            questions are calibrated for what you told the archive.
          </p>
        </div>

        <div className="space-y-3">
          {oraclePrompts.map((prompt) => (
            <Link
              key={prompt}
              href={`/oracle?q=${encodeURIComponent(prompt)}`}
              className={`group flex items-start gap-4 rounded-xl border ${accent.border} ${accent.bg} p-5 transition-all hover:opacity-90`}
            >
              <span className={`font-mono text-lg mt-0.5 shrink-0 ${accent.text}`}>◇</span>
              <div className="min-w-0">
                <p className={`font-display text-sm font-bold ${accent.text} leading-snug`}>
                  &ldquo;{prompt}&rdquo;
                </p>
                <p className="mt-1.5 font-mono text-[10px] text-text-muted">
                  Ask the Oracle → requires Initiate+
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="pt-1 flex flex-wrap gap-3">
          <Link
            href="/oracle"
            className={`font-mono text-[10px] uppercase tracking-widest ${accent.text} hover:opacity-80 transition-opacity`}
          >
            Open the Oracle →
          </Link>
          <Link
            href="/premium"
            className="font-mono text-[10px] uppercase tracking-widest text-accent-gold-text hover:opacity-80 transition-opacity"
          >
            Get Initiate+ →
          </Link>
        </div>
      </section>
    ),
  };

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-12 space-y-12">
      {/* Header */}
      <section className="space-y-4">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-text-muted/50">
            {"/// your_path"}
          </p>
          <h1 className="font-display text-3xl font-bold text-text-primary">
            Your Entry Point
          </h1>
        </div>

        <div className={`rounded-xl border ${accent.border} ${accent.bg} p-5 flex flex-wrap gap-4`}>
          <div className="space-y-0.5">
            <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Territory</p>
            <p className={`font-display text-sm font-bold ${accent.text}`}>{interestLabel}</p>
          </div>
          <div className="w-px bg-border self-stretch hidden sm:block" />
          <div className="space-y-0.5">
            <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted">Your position</p>
            <p className="font-display text-sm font-bold text-text-primary">{depthLabel}</p>
          </div>
          <div className="ml-auto self-center">
            <Link
              href="/start-here/quiz"
              className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
            >
              Retake quiz →
            </Link>
          </div>
        </div>
      </section>

      <MysticalDivider />

      {/* Sections in intent-driven order */}
      {sectionOrder.map((key) => (
        <div key={key}>{sections[key]}</div>
      ))}

      <MysticalDivider />

      {/* Escape hatches */}
      <section className="space-y-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-text-muted">
          {"/// not what you were looking for?"}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/start-here/quiz"
            className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded border border-border text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
          >
            Retake the quiz →
          </Link>
          <Link
            href="/search"
            className={`font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded border ${accent.border} ${accent.text} hover:opacity-80 transition-opacity`}
          >
            Search the archive →
          </Link>
          <Link
            href="/episodes"
            className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded border border-border text-text-muted hover:border-border-strong hover:text-text-primary transition-colors"
          >
            Full archive →
          </Link>
        </div>
      </section>
    </main>
  );
}
