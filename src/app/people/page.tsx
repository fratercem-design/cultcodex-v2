import { PageShell } from "@/components/ui/page-shell";
import { PersonCard } from "@/components/archive/person-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getPeople } from "@/lib/queries/people";

export const metadata = {
  title: "People — CultCodex",
  description: "Guests, hosts, and figures of the Cult of Psyche",
};

export default async function PeoplePage() {
  const people = await getPeople({ take: 100 });

  return (
    <PageShell title="PEOPLE" subtitle="Guests, hosts, and figures of the archive">
      {people.length === 0 ? (
        <EmptyState message="No people in the archive yet" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <PersonCard
              key={person.id}
              person={{
                displayName: person.displayName,
                slug: person.slug,
                shortBio: person.shortBio,
                personType: person.personType,
                appearanceCount: person.guestAppearances.length + person.mentions.length,
              }}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
