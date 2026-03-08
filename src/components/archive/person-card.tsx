import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PersonType } from "@/generated/prisma/client";

interface PersonCardProps {
  person: {
    displayName: string;
    slug: string;
    shortBio: string | null;
    personType: PersonType;
    appearanceCount: number;
  };
}

const typeVariant: Record<PersonType, "green" | "purple" | "gold" | "muted"> = {
  host: "green",
  recurring: "purple",
  guest: "muted",
  mentioned: "muted",
};

export function PersonCard({ person }: PersonCardProps) {
  return (
    <Link
      href={`/people/${person.slug}`}
      className="group block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-purple/30 hover:bg-elevated"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-purple transition-colors">
            {person.displayName}
          </h3>
          {person.shortBio && (
            <p className="mt-1 text-xs text-text-muted line-clamp-2">
              {person.shortBio}
            </p>
          )}
        </div>
        <StatusBadge label={person.personType} variant={typeVariant[person.personType]} />
      </div>
      <p className="mt-2 font-mono text-[10px] text-text-muted">
        {person.appearanceCount} appearance{person.appearanceCount !== 1 ? "s" : ""}
      </p>
    </Link>
  );
}
