import Link from "next/link";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/ui/status-badge";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";

interface PageProps {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function AdminSeriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.q;

  const where = {
    ...(search
      ? { title: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const totalCount = await prisma.series.count({ where });
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const seriesList = await prisma.series.findMany({
    where,
    orderBy: { title: "asc" },
    skip,
    take,
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      _count: { select: { episodes: true } },
    },
  });

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  return (
    <main id="main-content" className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-accent-gold">
          Series
        </h1>
        <span className="font-mono text-xs text-text-muted">
          {totalCount} total
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <form className="flex-1 max-w-sm">
          <input
            name="q"
            type="search"
            defaultValue={search ?? ""}
            placeholder="Search series..."
            className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-green focus:outline-none"
          />
        </form>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-elevated">
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Title</th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Type</th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Status</th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Episodes</th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {seriesList.map((s) => (
              <tr key={s.id} className="hover:bg-elevated/50 transition-colors">
                <td className="px-3 py-2 text-xs text-text-primary max-w-xs truncate">
                  {s.title}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge
                    label={s.type.replace(/_/g, " ")}
                    variant="muted"
                  />
                </td>
                <td className="px-3 py-2">
                  <StatusBadge
                    label={s.status}
                    variant={s.status === "published" ? "green" : "muted"}
                  />
                </td>
                <td className="px-3 py-2 font-mono text-xs text-text-muted">
                  {s._count.episodes}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/admin/series/${s.id}/edit`}
                    className="font-mono text-[10px] text-accent-green hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls meta={paginationMeta} basePath="/admin/series" />
    </main>
  );
}
