import { Skeleton } from "@/components/ui/skeleton";

export default function SubscribeLoading() {
  return (
    <>
      <Skeleton className="h-[160px] sm:h-[200px] w-full rounded-none" />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Skeleton className="mx-auto h-8 w-64 mb-4" />
        <Skeleton className="mx-auto h-4 w-96 mb-8" />
        <Skeleton className="mx-auto h-48 w-full max-w-md" />
      </main>
    </>
  );
}
