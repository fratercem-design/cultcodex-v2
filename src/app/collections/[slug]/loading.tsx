import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionLoading() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12 space-y-10">
      {/* Hero */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-full max-w-lg" />
      </div>
      {/* Signal chips */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-24 rounded-full" />
        ))}
      </div>
      {/* Episode cards */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    </main>
  );
}
