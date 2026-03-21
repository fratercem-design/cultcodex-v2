import { Skeleton } from "@/components/ui/skeleton";

export default function SeriesLoading() {
  return (
    <>
      <Skeleton className="h-[160px] sm:h-[200px] w-full rounded-none" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </main>
    </>
  );
}
