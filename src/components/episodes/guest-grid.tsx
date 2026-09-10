import Link from "next/link";
import Image from "next/image";
import { SectionCard } from "@/components/ui/section-card";
import { PersonSigil } from "@/components/ui/person-sigil";
import { archetypeHex } from "@/lib/archetype-colors";
import { archetypeToSlug } from "@/lib/queries/archetypes";
import type { PersonType } from "@/generated/prisma/client";

interface Guest {
  displayName: string;
  slug: string;
  avatarUrl: string | null;
  personType: PersonType;
}

interface GuestGridProps {
  guests: Guest[];
  /** Optional map: person slug → primary archetype (first canonical token). */
  archetypes?: Map<string, string>;
  /** When true, renders just the grid with no SectionCard wrapper. */
  bare?: boolean;
}

export function GuestGrid({ guests, archetypes, bare = false }: GuestGridProps) {
  if (guests.length === 0) return null;

  const grid = (
    <div className="grid grid-cols-4 gap-3">
      {guests.map((guest) => {
        const archetype = archetypes?.get(guest.slug);
        const archetypeHexColor = archetype ? archetypeHex(archetype) : null;
        return (
          <div key={guest.slug} className="flex flex-col items-center gap-1.5">
            <Link
              href={`/people/${guest.slug}`}
              className="group flex flex-col items-center gap-1.5"
            >
              {guest.avatarUrl ? (
                <Image
                  src={guest.avatarUrl}
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full border-2 border-transparent object-cover transition-colors group-hover:border-accent-gold"
                  style={
                    archetypeHexColor
                      ? { borderColor: `${archetypeHexColor}55` }
                      : undefined
                  }
                />
              ) : (
                <PersonSigil
                  slug={guest.slug}
                  name={guest.displayName}
                  personType={guest.personType}
                  size={40}
                  decorative
                  className="rounded-full border-2 border-transparent transition-colors group-hover:border-accent-gold"
                />
              )}
              <span className="w-full truncate text-center font-mono text-[10px] text-text-muted transition-colors group-hover:text-accent-gold-text">
                {guest.displayName}
              </span>
            </Link>
            {archetype && archetypeHexColor && (
              <Link
                href={`/psychenomicon/archetypes/${archetypeToSlug(archetype)}`}
                className="font-mono text-[9px] hover:underline truncate max-w-full px-1"
                style={{ color: archetypeHexColor }}
                title={`Atlas: ${archetype}`}
              >
                {archetype}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );

  if (bare) return grid;

  return (
    <SectionCard title={`Guests (${guests.length})`} accent="gold">
      {grid}
    </SectionCard>
  );
}
