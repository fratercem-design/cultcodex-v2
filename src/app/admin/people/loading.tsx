import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return <main className="p-8"><Skeleton className="h-8 w-48 mb-6" /><Skeleton className="h-96" /></main>;
}
