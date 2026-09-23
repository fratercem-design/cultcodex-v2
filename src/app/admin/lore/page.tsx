export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import type { CanonStatus } from "@/generated/prisma/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";

interface PageProps {
  searchParams: Promise<{ page?: string; canonStatus?: string; q?: string }>;
}

export default async function AdminLorePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const canonFilter = params.canonStatus;
  const search = params.q;

  const where = {
    ...(canonFilter ? { canonStatus: canonFilter as CanonStatus } : {}),
    ...(search
      ? { title: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const totalCount = await prisma.loreEntry.count({ where });
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const entries = await prisma.loreEntry.findMany({
    where,
    orderBy: { title: "asc" },
    skip,
    take,
    select: {
      id: true,
      title: true,
      canonStatus: true,
      category: true,
      _count: { select: { episodes: true, people: true } },
    },
  });

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  return (
    <main id="main-content" className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-accent-gold">
            Lore
          </h1>
          <Link
            href="/admin/lore/new"
            className="rounded bg-accent-gold px-3 py-1.5 font-mono text-xs font-bold text-void uppercase tracking-wider hover:bg-accent-gold/90 transition-colors"
          >
            + New Lore Entry
          </Link>
        </div>
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
            placeholder="Search lore..."
            className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none"
          />
        </form>
        <div className="flex gap-1.5">
          {["all", "canonical", "speculative", "community_myth"].map((s) => (
            <Link
              key={s}
              href={`/admin/lore${s !== "all" ? `?canonStatus=${s}` : ""}`}
              className={`rounded-full border px-3 py-1 font-mono text-[12px] transition-colors ${
                (canonFilter ?? "all") === s || (!canonFilter && s === "all")
                  ? "border-accent-gold text-accent-gold-text bg-accent-gold/10"
                  : "border-border text-text-muted hover:border-accent-gold/50"
              }`}
            >
              {s === "community_myth"
                ? "Community Myth"
                : s.charAt(0).toUpperCase() + s.slice(1)}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-elevated">
              <th className="px-3 py-2 text-left font-mono text-[12px] uppercase tracking-wider text-text-muted">Title</th>
              <th className="px-3 py-2 text-left font-mono text-[12px] uppercase tracking-wider text-text-muted">Canon Status</th>
              <th className="px-3 py-2 text-left font-mono text-[12px] uppercase tracking-wider text-text-muted">Category</th>
              <th className="px-3 py-2 text-left font-mono text-[12px] uppercase tracking-wider text-text-muted">Episodes</th>
              <th className="px-3 py-2 text-right font-mono text-[12px] uppercase tracking-wider text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-elevated/50 transition-colors">
                <td className="px-3 py-2 text-xs text-text-primary max-w-xs truncate">
                  {entry.title}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge
                    label={entry.canonStatus}
                    variant={entry.canonStatus === "canonical" ? "green" : "muted"}
                  />
                </td>
                <td className="px-3 py-2 font-mono text-xs text-text-muted">
                  {entry.category ?? "\u2014"}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-text-muted">
                  {entry._count.episodes}
                </td>
                <td className="px-3 py-2 text-right">
                  <Link
                    href={`/admin/lore/${entry.id}/edit`}
                    className="font-mono text-[12px] text-accent-gold-text hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls meta={paginationMeta} basePath="/admin/lore" />
    </main>
  );
}
