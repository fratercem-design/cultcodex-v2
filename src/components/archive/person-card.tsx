import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "@/components/ui/status-badge";
import { PersonSigil } from "@/components/ui/person-sigil";
import { PERSON_TYPE_BADGE, PERSON_TYPE_LABEL } from "@/lib/people/person-type";
import type { PersonType } from "@/generated/prisma/client";

interface PersonCardProps {
  person: {
    displayName: string;
    slug: string;
    shortBio: string | null;
    loreSummary?: string | null;
    avatarUrl?: string | null;
    personType: PersonType;
    appearanceCount: number;
  };
}

/** Unprofiled guests/mentioned → compiled "the rest" entry instead of individual page */
function personHref(p: PersonCardProps["person"]): string {
  const isProfiled = Boolean(p.loreSummary) || Boolean(p.shortBio);
  if (!isProfiled && (p.personType === "guest" || p.personType === "mentioned")) {
    return "/people/the-rest";
  }
  return `/people/${p.slug}`;
}

export function PersonCard({ person }: PersonCardProps) {
  const isProfileComplete =
    Boolean(person.loreSummary) && Boolean(person.shortBio) && Boolean(person.avatarUrl);

  return (
    <Link
      href={personHref(person)}
      className="group flex items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-gold/30 hover:bg-elevated"
    >
      {person.avatarUrl ? (
        <Image
          src={person.avatarUrl}
          alt={person.displayName}
          width={40}
          height={40}
          unoptimized
          className="h-10 w-10 flex-shrink-0 rounded-full object-cover border border-accent-gold/20"
        />
      ) : (
        <PersonSigil
          slug={person.slug}
          name={person.displayName}
          personType={person.personType}
          size={40}
          decorative
          className="flex-shrink-0 rounded-full border border-accent-gold/20 p-0.5"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-gold transition-colors truncate">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-gold/60 mr-1.5 align-middle" />
            {person.displayName}
          </h3>
          <StatusBadge label={PERSON_TYPE_LABEL[person.personType]} variant={PERSON_TYPE_BADGE[person.personType]} />
        </div>
        {person.shortBio && (
          <p className="mt-1 text-xs text-text-muted line-clamp-2">
            {person.shortBio}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-2">
          <span className="font-mono text-[10px] text-text-muted">
            {person.appearanceCount} appearance{person.appearanceCount !== 1 ? "s" : ""}
          </span>
          {isProfileComplete && (
            <span
              className="font-mono text-[9px] text-accent-violet border border-accent-violet/30 rounded px-1 py-px leading-none"
              title="Full profile — bio, lore summary, and photo all present"
            >
              PROFILE
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
