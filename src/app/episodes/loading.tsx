import { Skeleton } from "@/components/ui/skeleton";

export default function EpisodesLoading() {
  return (
    <>
      <Skeleton className="h-[160px] sm:h-[200px] w-full rounded-none" />
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-24 rounded-full" />
          ))}
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </main>
    </>
  );
}
