"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import type { DailyTransmission as DailyTransmissionData } from "@/lib/queries/daily";
import { fixThumbnailUrl } from "@/lib/format/thumbnail";
import { formatDate } from "@/lib/format/date";
import { cleanTranscriptText } from "@/lib/format/text";
import {
  QuoteReactionBar,
  type QuoteReactionInitial,
} from "@/components/quotes/quote-reaction-bar";
import { QuoteShareButton } from "./quote-share-button";

interface Props {
  data: DailyTransmissionData;
  quoteReactions?: QuoteReactionInitial;
}

function formatDateHuman(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function DailyTransmission({
  data,
  quoteReactions,
}: Props) {
  const { data: session } = useSession();
  const isAuthenticated = session?.user != null;
  const { date, quote, spotlightEpisode, pulse } = data;
  const hasAnything = quote || spotlightEpisode || pulse.newEpisodes > 0;
  if (!hasAnything) return null;

  return (
    <section className="rounded-2xl border border-accent-gold/20 bg-gradient-to-b from-accent-gold/5 via-surface to-surface px-6 py-7 sm:px-8 sm:py-9 space-y-6 relative overflow-hidden">
      {/* Subtle radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,175,55,0.08), transparent 70%)",
        }}
      />

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="relative flex flex-wrap items-baseline justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.5em] text-accent-gold/70">
            ✦ today&rsquo;s signal
          </p>
          <p className="font-mono text-[10px] text-text-muted/50 tabular-nums">
            {formatDateHuman(date)} · transmission #{date.replace(/-/g, "")}
          </p>
        </div>
        <p className="font-mono text-[9px] uppercase tracking-widest text-text-muted/40">
          rotates daily
        </p>
      </div>

      {/* ── Quote of the day ─────────────────────────────────────── */}
      {quote && quote.episode && (
        <div className="relative space-y-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold/50">
            {"/// quote_of_the_day"}
          </p>
          <blockquote className="font-display text-xl sm:text-2xl leading-snug text-text-primary border-l-2 border-accent-gold/40 pl-5 italic">
            &ldquo;{cleanTranscriptText(quote.text)}&rdquo;
          </blockquote>
          <div className="flex flex-wrap items-center gap-3 pl-5">
            {quote.speaker && (
              <Link
                href={`/people/${quote.speaker.slug}`}
                className="group flex items-center gap-2 hover:text-accent-gold transition-colors"
              >
                {quote.speaker.avatarUrl ? (
                  <Image
                    src={quote.speaker.avatarUrl}
                    alt=""
                    width={26}
                    height={26}
                    className="h-6.5 w-6.5 rounded-full object-cover border border-border group-hover:border-accent-gold/40 transition-colors"
                    style={{ height: 26, width: 26 }}
                  />
                ) : (
                  <span
                    className="h-6.5 w-6.5 rounded-full bg-accent-gold/10 border border-accent-gold/30 flex items-center justify-center font-mono text-[10px] text-accent-gold"
                    style={{ height: 26, width: 26 }}
                  >
                    {quote.speaker.displayName[0]}
                  </span>
                )}
                <span className="font-mono text-[11px] text-text-muted group-hover:text-accent-gold transition-colors">
                  {quote.speaker.displayName}
                </span>
              </Link>
            )}
            <span className="font-mono text-[10px] text-text-muted/40">·</span>
            <Link
              href={
                quote.timestampSeconds != null
                  ? `/episodes/${quote.episode.slug}?t=${quote.timestampSeconds}#quote-${quote.id}`
                  : `/episodes/${quote.episode.slug}#quote-${quote.id}`
              }
              className="font-mono text-[10px] text-text-muted/70 hover:text-accent-gold transition-colors"
            >
              {quote.episode.episodeNumber != null
                ? `EP.${String(quote.episode.episodeNumber).padStart(3, "0")} · `
                : ""}
              {quote.episode.title}
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-4 pl-5">
            {quoteReactions && (
              <QuoteReactionBar
                quoteId={quote.id}
                initial={quoteReactions}
                isAuthenticated={isAuthenticated}
                variant="full"
              />
            )}
            <QuoteShareButton
              text={quote.text}
              speakerName={quote.speaker?.displayName}
              episodeSlug={quote.episode.slug}
              episodeNumber={quote.episode.episodeNumber ?? null}
            />
          </div>
        </div>
      )}

      {/* ── Two-column: pulse + spotlight ───────────────────────── */}
      <div className="relative grid gap-5 md:grid-cols-2 pt-2">

        {/* Weekly pulse */}
        <div className="rounded-xl border border-border bg-void/40 backdrop-blur-sm p-5 space-y-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold/50">
            {"/// week_in_review"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <PulseStat
              value={pulse.newEpisodes}
              label="new transmissions"
              accent="text-accent-gold"
              href={pulse.newEpisodes > 0 ? "/episodes" : undefined}
            />
            <PulseStat
              value={pulse.newQuotes}
              label="quotes captured"
              accent="text-accent-violet"
              href={pulse.newQuotes > 0 ? "/quotes" : undefined}
            />
            <PulseStat
              value={pulse.newLoreEntries}
              label="lore expanded"
              accent="text-accent-cyan"
              href={pulse.newLoreEntries > 0 ? "/lore" : undefined}
            />
            <PulseStat
              value={pulse.activeThreads}
              label="threads alive"
              accent="text-accent-violet"
              href="/psychenomicon/threads"
            />
          </div>
          <p className="font-mono text-[9px] text-text-muted/40 uppercase tracking-widest pt-1">
            past 7 days
          </p>
        </div>

        {/* Spotlight episode */}
        {spotlightEpisode ? (
          <Link
            href={`/episodes/${spotlightEpisode.slug}`}
            className="group rounded-xl border border-border bg-void/40 backdrop-blur-sm overflow-hidden hover:border-accent-gold/40 hover:bg-accent-gold/5 transition-colors flex flex-col"
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-accent-gold/50 px-5 pt-5">
              {"/// transmission_from_the_vault"}
            </p>
            <div className="px-5 py-4 flex items-start gap-4 flex-1">
              {spotlightEpisode.thumbnailUrl && (
                <Image
                  src={fixThumbnailUrl(spotlightEpisode.thumbnailUrl)!}
                  alt=""
                  width={120}
                  height={68}
                  unoptimized
                  className="w-28 h-16 rounded-md object-cover flex-shrink-0 group-hover:opacity-90 transition-opacity"
                />
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {spotlightEpisode.episodeNumber != null && (
                    <span className="font-mono text-[10px] text-accent-gold font-bold">
                      EP.{String(spotlightEpisode.episodeNumber).padStart(3, "0")}
                    </span>
                  )}
                  {spotlightEpisode.airDate && (
                    <span className="font-mono text-[10px] text-text-muted">
                      {formatDate(spotlightEpisode.airDate)}
                    </span>
                  )}
                </div>
                <p className="font-sans text-sm text-text-primary group-hover:text-accent-gold transition-colors line-clamp-3 leading-snug">
                  {spotlightEpisode.title}
                </p>
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-void/40 p-5 flex items-center justify-center text-center">
            <p className="font-mono text-[10px] text-text-muted/40">
              vault offline
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

interface PulseStatProps {
  value: number;
  label: string;
  accent: string;
  href?: string;
}

function PulseStat({ value, label, accent, href }: PulseStatProps) {
  const inner = (
    <>
      <span className={`font-display text-2xl font-bold tabular-nums ${accent}`}>
        {value.toLocaleString()}
      </span>
      <span className="block font-mono text-[10px] uppercase tracking-widest text-text-muted/60">
        {label}
      </span>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="block rounded-lg border border-transparent px-3 py-2 hover:border-border hover:bg-surface/60 transition-colors"
      >
        {inner}
      </Link>
    );
  }
  return <div className="px-3 py-2">{inner}</div>;
}
