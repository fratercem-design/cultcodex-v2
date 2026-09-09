import { Skeleton } from "@/components/ui/skeleton";

export default function TopicsLoading() {
  return (
    <>
      <Skeleton className="h-[160px] sm:h-[200px] w-full rounded-none" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </main>
    </>
  );
}
