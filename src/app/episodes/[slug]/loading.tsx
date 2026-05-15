import { Skeleton } from "@/components/ui/skeleton";

export default function EpisodeDetailLoading() {
  return (
    <>
      <Skeleton className="h-[200px] sm:h-[280px] w-full rounded-none" />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-40" />
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </main>
    </>
  );
}
