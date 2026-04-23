import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PersonType } from "@/generated/prisma/client";
import type { SectionAccent } from "./section-group";

interface PersonCardProps {
  person: {
    displayName: string;
    slug: string;
    shortBio: string | null;
    avatarUrl?: string | null;
    personType: PersonType;
    appearanceCount: number;
  };
  /** Optional override — used by sections view to match the section's color. */
  accent?: SectionAccent;
}

const typeVariant: Record<PersonType, "green" | "purple" | "gold" | "muted"> = {
  host: "gold",
  recurring: "purple",
  guest: "green",
  mentioned: "muted",
};

const ACCENT_STYLES: Record<
  SectionAccent,
  { avatar: string; dot: string; hover: string; name: string }
> = {
  gold: {
    avatar: "bg-accent-gold/15 text-accent-gold border-accent-gold/20",
    dot: "bg-accent-gold/60",
    hover: "hover:border-accent-gold/40",
    name: "group-hover:text-accent-gold",
  },
  cyan: {
    avatar: "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/20",
    dot: "bg-accent-cyan/60",
    hover: "hover:border-accent-cyan/40",
    name: "group-hover:text-accent-cyan",
  },
  violet: {
    avatar: "bg-accent-violet/15 text-accent-violet border-accent-violet/20",
    dot: "bg-accent-violet/60",
    hover: "hover:border-accent-violet/40",
    name: "group-hover:text-accent-violet",
  },
  crimson: {
    avatar: "bg-accent-crimson/15 text-accent-crimson border-accent-crimson/20",
    dot: "bg-accent-crimson/60",
    hover: "hover:border-accent-crimson/40",
    name: "group-hover:text-accent-crimson",
  },
  muted: {
    avatar: "bg-elevated text-text-muted border-border",
    dot: "bg-text-muted/40",
    hover: "hover:border-border",
    name: "group-hover:text-text-primary",
  },
};

// Default accent derived from personType when no override given
const TYPE_DEFAULT: Record<PersonType, SectionAccent> = {
  host: "gold",
  recurring: "cyan",
  guest: "violet",
  mentioned: "muted",
};

export function PersonCard({ person, accent }: PersonCardProps) {
  const initial = person.displayName[0]?.toUpperCase() ?? "?";
  const a = ACCENT_STYLES[accent ?? TYPE_DEFAULT[person.personType]];

  return (
    <Link
      href={`/people/${person.slug}`}
      className={`group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-elevated ${a.hover}`}
    >
      {person.avatarUrl ? (
        <img
          src={person.avatarUrl}
          alt={person.displayName}
          className={`h-10 w-10 flex-shrink-0 rounded-full object-cover border ${a.avatar.split(" ").filter((c) => c.startsWith("border")).join(" ")}`}
        />
      ) : (
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border font-mono text-sm font-bold ${a.avatar}`}
        >
          {initial}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3
            className={`font-sans text-sm font-medium text-text-primary transition-colors truncate ${a.name}`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${a.dot} mr-1.5 align-middle`}
            />
            {person.displayName}
          </h3>
          <StatusBadge
            label={person.personType}
            variant={typeVariant[person.personType]}
          />
        </div>
        {person.shortBio && (
          <p className="mt-1 text-xs text-text-muted line-clamp-2">
            {person.shortBio}
          </p>
        )}
        <p className="mt-1.5 font-mono text-[10px] text-text-muted">
          {person.appearanceCount} appearance
          {person.appearanceCount !== 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  );
}
