import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <>
      <Skeleton className="h-[160px] sm:h-[200px] w-full rounded-none" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="h-10 w-full mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </main>
    </>
  );
}
