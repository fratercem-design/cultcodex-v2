import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="p-8 max-w-2xl">
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-48" />
      <Skeleton className="h-32 mt-6" />
    </main>
  );
}
