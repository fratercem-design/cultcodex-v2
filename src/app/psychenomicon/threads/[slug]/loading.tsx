import { Skeleton } from "@/components/ui/skeleton";

export default function ThreadLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      {/* Title + status badge */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
      {/* Chapter list */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    </main>
  );
}
