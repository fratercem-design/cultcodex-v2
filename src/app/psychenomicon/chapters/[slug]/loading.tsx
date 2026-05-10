import { Skeleton } from "@/components/ui/skeleton";

export default function ChapterLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      {/* Chapter number + title */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-3 w-40" />
      </div>
      {/* Layer tabs */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded" />
        ))}
      </div>
      {/* Text content */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className={i % 3 === 2 ? "h-4 w-3/4" : "h-4 w-full"} />
        ))}
      </div>
      {/* Entities strip */}
      <div className="flex gap-3 pt-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-16 rounded-lg flex-shrink-0" />
        ))}
      </div>
    </main>
  );
}
