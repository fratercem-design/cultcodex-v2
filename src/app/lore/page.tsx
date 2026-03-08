import { PageShell } from "@/components/ui/page-shell";
import { LoreCard } from "@/components/archive/lore-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getLoreEntries } from "@/lib/queries/lore";

export const metadata = {
  title: "Lore — CultCodex",
  description: "Concepts, doctrines, and myths of the Cult of Psyche",
};

export default async function LorePage() {
  const entries = await getLoreEntries({ take: 100 });

  return (
    <PageShell title="LORE ARCHIVE" subtitle="Concepts, doctrines, myths, and memes">
      {entries.length === 0 ? (
        <EmptyState message="No lore entries yet" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {entries.map((entry) => (
            <LoreCard
              key={entry.id}
              lore={{
                title: entry.title,
                slug: entry.slug,
                category: entry.category,
                summary: entry.summary,
                canonStatus: entry.canonStatus,
              }}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
