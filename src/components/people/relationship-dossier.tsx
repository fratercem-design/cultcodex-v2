import Link from "next/link";
import Image from "next/image";
import { SectionCard } from "@/components/ui/section-card";
import { AiNotice } from "@/components/ui/ai-notice";
import { RELATION_LABELS } from "@/lib/relationships";
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
    <span className={`rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ${cls}`}>
      {RELATION_LABELS[state]}
    </span>
  );
}

/**
 * Book of Trolls: evolving relationship timelines for a person.
 * Renders nothing when the archive holds no relationship events for them.
 */
export function RelationshipDossier({ entries, personName }: { entries: RelationshipDossierEntry[]; personName: string }) {
  if (entries.length === 0) return null;

  return (
    <SectionCard title="Relationship Dossier" accent="violet">
      <p className="mb-4 font-mono text-[9px] uppercase tracking-[0.3em] text-text-muted/60">
        {"/// evolving_states · cited_to_episodes"}
      </p>
      <div className="space-y-5">
        {entries.map(({ counterpart, currentState, beats }) => (
          <div key={counterpart.id} className="rounded border border-border/60 bg-elevated/40 p-3">
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

            <ol className="mt-3 space-y-2 border-l border-border/60 pl-3">
              {beats.map((beat) => (
                <li key={beat.id} className="relative">
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
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-mono text-[9px] text-text-muted">
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
              ))}
            </ol>
          </div>
        ))}
      </div>
      <p className="mt-4 font-mono text-[9px] text-text-muted/50">
        Relationship states are editorial synthesis of {personName}&apos;s archive history — see cited episodes.
      </p>
      <AiNotice className="mt-2" />
    </SectionCard>
  );
}
