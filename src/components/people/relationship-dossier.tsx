import Link from "next/link";
import Image from "next/image";
import { SectionCard } from "@/components/ui/section-card";
import { AiNotice } from "@/components/ui/ai-notice";
import { RELATION_LABELS } from "@/lib/relationships";
import { HOSTILE, feudSlug } from "@/lib/feuds";
import { formatDate } from "@/lib/format/date";
import type { RelationshipDossierEntry } from "@/lib/queries/relationships";
import type { ConfidenceLevel, RelationType } from "@/generated/prisma/client";

const STATE_CLS: Partial<Record<RelationType, string>> = {
  friend: "border-accent-cyan/40 text-accent-cyan bg-accent-cyan/10",
  ally: "border-accent-cyan/40 text-accent-cyan bg-accent-cyan/10",
  frequent_collaborator: "border-accent-cyan/40 text-accent-cyan bg-accent-cyan/10",
  mentor: "border-accent-gold/40 text-accent-gold-text bg-accent-gold/10",
  student: "border-accent-gold/40 text-accent-gold-text bg-accent-gold/10",
  supporter: "border-accent-gold/40 text-accent-gold-text bg-accent-gold/10",
  debate_rival: "border-accent-violet/40 text-accent-violet-text bg-accent-violet/10",
  critic: "border-accent-violet/40 text-accent-violet-text bg-accent-violet/10",
  former_friend: "border-red-400/40 text-red-400 bg-red-500/10",
  enemy: "border-red-400/40 text-red-400 bg-red-500/10",
};

const CONFIDENCE_LABEL: Record<ConfidenceLevel, string> = {
  confirmed: "CONFIRMED",
  strong: "STRONG",
  moderate: "MODERATE",
  weak: "WEAK",
  rumor: "RUMOR",
};

function StateBadge({ state }: { state: RelationType }) {
  const cls = STATE_CLS[state] ?? "border-border text-text-muted bg-elevated";
  return (
    <span className={`rounded border px-1.5 py-0.5 font-mono text-[12px] uppercase tracking-widest ${cls}`}>
      {RELATION_LABELS[state]}
    </span>
  );
}

type DossierEntry = RelationshipDossierEntry;
type Beat = DossierEntry["beats"][number];

// Progressive disclosure (2026-11 audit): long feud histories were one
// unbroken scroll. Each relationship shows its most recent beats — the ones
// that explain its current state — with earlier beats folded away, and only
// the busiest relationships are open by default. Native <details>, so it
// works without JavaScript and the folded text stays in the HTML for search.
const RECENT_BEATS = 3;
const OPEN_ENTRIES = 4;

const DISCLOSURE_SUMMARY =
  "cursor-pointer select-none font-mono text-[12px] text-text-muted hover:text-text-primary transition-colors";

function BeatItem({ beat }: { beat: Beat }) {
  return (
    <li className="relative">
      <span
        className={`absolute -left-[17px] top-1.5 h-2 w-2 rounded-full ${
          beat.isTurn ? "bg-accent-violet" : "bg-border"
        }`}
        aria-hidden
      />
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        {beat.isTurn && <StateBadge state={beat.relationType} />}
        <span className="text-sm text-text-primary leading-snug">{beat.headline}</span>
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[12px] text-text-muted">
        {beat.occurredAt && <span>{formatDate(beat.occurredAt)}</span>}
        {beat.episode && (
          <Link
            href={`/episodes/${beat.episode.slug}`}
            className="text-accent-gold-text/80 hover:text-accent-gold-text transition-colors"
          >
            {beat.episode.episodeNumber != null ? `EP ${beat.episode.episodeNumber} · ` : ""}
            {beat.episode.title}
          </Link>
        )}
        {beat.confidence && (
          <span className="rounded border border-border px-1 py-px tracking-widest text-text-muted/80">
            {CONFIDENCE_LABEL[beat.confidence]}
          </span>
        )}
      </div>
      {beat.details && (
        <p className="mt-1 text-xs text-text-muted leading-relaxed">{beat.details}</p>
      )}
    </li>
  );
}

const BEAT_LIST = "space-y-2 border-l border-border/60 pl-3";

function EntryCard({ entry, personSlug }: { entry: DossierEntry; personSlug: string }) {
  const { counterpart, currentState, beats } = entry;
  const earlier = beats.length > RECENT_BEATS + 1 ? beats.slice(0, -RECENT_BEATS) : [];
  const recent = earlier.length > 0 ? beats.slice(-RECENT_BEATS) : beats;

  return (
    <div className="rounded border border-border/60 bg-elevated/40 p-3">
      <div className="flex items-center gap-2.5">
        {counterpart.avatarUrl ? (
          <Image
            src={counterpart.avatarUrl}
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-violet/15 font-mono text-xs font-bold text-accent-violet-text border border-border">
            {counterpart.displayName[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <Link
          href={`/people/${counterpart.slug}`}
          className="font-mono text-xs text-text-primary hover:text-accent-violet-text transition-colors"
        >
          {counterpart.displayName}
        </Link>
        <span className="ml-auto">
          <StateBadge state={currentState} />
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {earlier.length > 0 && (
          <details className="group">
            <summary className={DISCLOSURE_SUMMARY}>
              <span className="group-open:hidden">
                Show {earlier.length} earlier {earlier.length === 1 ? "beat" : "beats"}
              </span>
              <span className="hidden group-open:inline">Hide earlier beats</span>
            </summary>
            <ol className={`mt-2 ${BEAT_LIST}`}>
              {earlier.map((beat) => (
                <BeatItem key={beat.id} beat={beat} />
              ))}
            </ol>
          </details>
        )}
        <ol className={BEAT_LIST}>
          {recent.map((beat) => (
            <BeatItem key={beat.id} beat={beat} />
          ))}
        </ol>
      </div>
      {beats.some((beat) => HOSTILE.includes(beat.relationType)) && (
        <Link
          href={`/drama/feuds/${feudSlug(personSlug, counterpart.slug)}`}
          className="mt-3 inline-block font-mono text-[12px] text-red-400/80 hover:text-red-300 transition-colors"
        >
          Full feud timeline, with the quotes →
        </Link>
      )}
    </div>
  );
}

/**
 * Book of Trolls: evolving relationship timelines for a person.
 * Renders nothing when the archive holds no relationship events for them.
 */
export function RelationshipDossier({ entries, personName, personSlug }: { entries: RelationshipDossierEntry[]; personName: string; personSlug: string }) {
  if (entries.length === 0) return null;

  // Entries arrive sorted busiest-first, so the folded tail is the quiet ones.
  const open = entries.length > OPEN_ENTRIES + 1 ? entries.slice(0, OPEN_ENTRIES) : entries;
  const folded = open.length < entries.length ? entries.slice(OPEN_ENTRIES) : [];

  return (
    <SectionCard title="Relationship Dossier" accent="violet">
      <p className="mb-4 font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">
        {"/// evolving_states · cited_to_episodes"}
      </p>
      <div className="space-y-5">
        {open.map((entry) => (
          <EntryCard key={entry.counterpart.id} entry={entry} personSlug={personSlug} />
        ))}
      </div>
      {folded.length > 0 && (
        <details className="group mt-5">
          <summary className={DISCLOSURE_SUMMARY}>
            <span className="group-open:hidden">
              Show {folded.length} more {folded.length === 1 ? "relationship" : "relationships"}
            </span>
            <span className="hidden group-open:inline">Hide the rest</span>
          </summary>
          <div className="mt-5 space-y-5">
            {folded.map((entry) => (
              <EntryCard key={entry.counterpart.id} entry={entry} personSlug={personSlug} />
            ))}
          </div>
        </details>
      )}
      <p className="mt-4 font-mono text-[12px] text-text-muted">
        Relationship states are editorial synthesis of {personName}&apos;s archive history — see cited episodes.
      </p>
      <AiNotice className="mt-2" />
    </SectionCard>
  );
}
