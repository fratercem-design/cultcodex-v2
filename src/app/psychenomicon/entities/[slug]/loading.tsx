import { Skeleton } from "@/components/ui/skeleton";

export default function EntityLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 space-y-8">
      {/* Name + archetype */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-36 rounded-full" />
      </div>
      {/* Radar + timeline side by side */}
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-56 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
      </div>
      {/* Behavior patterns */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 rounded" />
        ))}
      </div>
      {/* Chapter appearances */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded" />
        ))}
      </div>
    </main>
  );
}
