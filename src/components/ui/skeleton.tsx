export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-surface ${className ?? ""}`}
    />
  );
}

export function EntityHeroSkeleton() {
  return <div className="h-[200px] w-full animate-pulse bg-surface" />;
}

export function CardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="h-16 w-16 flex-shrink-0 animate-pulse rounded bg-elevated" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-elevated" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-elevated" />
        <div className="h-3 w-full animate-pulse rounded bg-elevated" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6, cols = 1 }: { count?: number; cols?: number }) {
  const gridClass = cols === 2 ? "grid gap-3 sm:grid-cols-2" : "grid gap-3";
  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatsBarSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-3">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-7 w-28 animate-pulse rounded-full bg-surface" />
        ))}
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 w-20 animate-pulse rounded bg-elevated" />
            <div className="h-3 w-8 animate-pulse rounded bg-elevated" />
          </div>
        ))}
      </div>
    </div>
  );
}
