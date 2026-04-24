import Link from "next/link";
import Image from "next/image";
import { SectionCard } from "@/components/ui/section-card";
import { PersonSigil } from "@/components/ui/person-sigil";
import type { PersonType } from "@/generated/prisma/client";

interface Guest {
  displayName: string;
  slug: string;
  avatarUrl: string | null;
  personType: PersonType;
}

interface GuestGridProps {
  guests: Guest[];
}

export function GuestGrid({ guests }: GuestGridProps) {
  if (guests.length === 0) return null;

  return (
    <SectionCard title={`Guests (${guests.length})`}>
      <div className="grid grid-cols-4 gap-3">
        {guests.map((guest) => (
          <Link
            key={guest.slug}
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
              />
            ) : (
              <PersonSigil
                slug={guest.slug}
                name={guest.displayName}
                personType={guest.personType}
                size={40}
                className="rounded-full border-2 border-transparent transition-colors group-hover:border-accent-gold"
              />
            )}
            <span className="w-full truncate text-center font-mono text-[10px] text-text-muted transition-colors group-hover:text-accent-gold">
              {guest.displayName}
            </span>
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}
