export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import type { ContentStatus } from "@/generated/prisma/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { formatDate } from "@/lib/format/date";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";
import { EpisodeBulkActions } from "./bulk-actions";
import { EnrichQueueToggle } from "./enrich-queue-toggle";

interface PageProps {
  searchParams: Promise<{ page?: string; status?: string; q?: string; filter?: string }>;
}

export default async function AdminEpisodesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const statusFilter = params.status;
  const search = params.q;
  const filterMode = params.filter; // "enrich" = show only queued-for-enrichment

  const where = {
    ...(statusFilter ? { status: statusFilter as ContentStatus } : {}),
    ...(filterMode === "enrich" ? { enrichmentQueued: true } : {}),
    ...(search
      ? { title: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const totalCount = await prisma.episode.count({ where });
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const episodes = await prisma.episode.findMany({
    where,
    orderBy: { episodeNumber: "desc" },
    skip,
    take,
    select: {
      id: true,
      title: true,
      slug: true,
      episodeNumber: true,
      airDate: true,
      status: true,
      contentType: true,
      enrichmentQueued: true,
      _count: { select: { guests: true, topics: true } },
    },
  });

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  return (
    <main id="main-content" className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-accent-gold">
            Episodes
          </h1>
          <Link
            href="/admin/episodes/new"
            className="rounded bg-accent-gold px-3 py-1.5 font-mono text-xs font-bold text-void uppercase tracking-wider hover:bg-accent-gold/90 transition-colors"
          >
            + New Episode
          </Link>
          <Link
            href="/admin/episodes/import"
            className="rounded bg-accent-cyan px-3 py-1.5 font-mono text-xs font-bold text-void uppercase tracking-wider hover:bg-accent-cyan/90 transition-colors"
          >
            Import CSV
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
            placeholder="Search episodes..."
            className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none"
          />
        </form>
        <div className="flex gap-1.5">
          {["all", "published", "draft", "archived"].map((s) => (
            <Link
              key={s}
              href={`/admin/episodes${s !== "all" ? `?status=${s}` : ""}`}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] transition-colors ${
                !filterMode && ((statusFilter ?? "all") === s || (!statusFilter && s === "all"))
                  ? "border-accent-gold text-accent-gold-text bg-accent-gold/10"
                  : "border-border text-text-muted hover:border-accent-gold/50"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Link>
          ))}
          <Link
            href="/admin/episodes?filter=enrich"
            className={`rounded-full border px-3 py-1 font-mono text-[10px] transition-colors ${
              filterMode === "enrich"
                ? "border-accent-gold text-accent-gold-text bg-accent-gold/10"
                : "border-border text-text-muted hover:border-accent-gold/50"
            }`}
          >
            ⚡ Enrich Queue
          </Link>
        </div>
      </div>

      {/* Table */}
      <EpisodeBulkActions episodeIds={episodes.map((e) => e.id)} />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-elevated">
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">EP#</th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Title</th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Status</th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Air Date</th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Guests</th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Topics</th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {episodes.map((ep) => (
              <tr key={ep.id} className="hover:bg-elevated/50 transition-colors">
                <td className="px-3 py-2 font-mono text-xs text-accent-gold-text font-bold">
                  {ep.episodeNumber ? `EP.${String(ep.episodeNumber).padStart(3, "0")}` : "\u2014"}
                </td>
                <td className="px-3 py-2 text-xs text-text-primary max-w-xs truncate">
                  {ep.title}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge
                    label={ep.status}
                    variant={ep.status === "published" ? "green" : "muted"}
                  />
                </td>
                <td className="px-3 py-2 font-mono text-[10px] text-text-muted">
                  {ep.airDate ? formatDate(ep.airDate) : "\u2014"}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-text-muted">
                  {ep._count.guests}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-text-muted">
                  {ep._count.topics}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <EnrichQueueToggle
                      episodeId={ep.id}
                      queued={ep.enrichmentQueued}
                    />
                    <Link
                      href={`/admin/episodes/${ep.id}/edit`}
                      className="font-mono text-[10px] text-accent-gold-text hover:underline"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls meta={paginationMeta} basePath="/admin/episodes" />
    </main>
  );
}
