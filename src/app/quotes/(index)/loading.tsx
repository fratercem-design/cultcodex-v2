import { Skeleton } from "@/components/ui/skeleton";

export default function QuotesLoading() {
  return (
    <>
      <Skeleton className="h-[160px] sm:h-[200px] w-full rounded-none" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </main>
    </>
  );
}
