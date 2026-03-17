import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";

interface Guest {
  displayName: string;
  slug: string;
  avatarUrl: string | null;
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
              <img
                src={guest.avatarUrl}
                alt={guest.displayName}
                className="h-10 w-10 rounded-full border-2 border-transparent object-cover transition-colors group-hover:border-accent-gold"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-transparent bg-accent-gold/20 text-sm font-bold text-accent-gold transition-colors group-hover:border-accent-gold">
                {guest.displayName[0]?.toUpperCase()}
              </div>
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
