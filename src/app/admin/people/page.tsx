export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/db";
import type { PersonType } from "@/generated/prisma/client";
import { StatusBadge } from "@/components/ui/status-badge";
import { PERSON_TYPE_BADGE } from "@/lib/people/person-type";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  DEFAULT_PAGE_SIZE,
  parsePage,
  paginationArgs,
  buildPaginationMeta,
} from "@/lib/pagination";

interface PageProps {
  searchParams: Promise<{ page?: string; type?: string; q?: string }>;
}

export default async function AdminPeoplePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const typeFilter = params.type;
  const search = params.q;

  const where = {
    ...(typeFilter ? { personType: typeFilter as PersonType } : {}),
    ...(search
      ? { displayName: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  // Global enrichment stats (always across all people, not filtered)
  const [totalAll, withLoreSummary, withShortBio, withAvatar] = await Promise.all([
    prisma.person.count(),
    prisma.person.count({ where: { loreSummary: { not: null } } }),
    prisma.person.count({ where: { shortBio:    { not: null } } }),
    prisma.person.count({ where: { avatarUrl:   { not: null } } }),
  ]);

  const enrichPct = totalAll > 0 ? Math.round((withLoreSummary / totalAll) * 100) : 0;
  const bioPct    = totalAll > 0 ? Math.round((withShortBio    / totalAll) * 100) : 0;
  const avatarPct = totalAll > 0 ? Math.round((withAvatar      / totalAll) * 100) : 0;
  // "complete" = has all three fields
  const completeCount = await prisma.person.count({
    where: { loreSummary: { not: null }, shortBio: { not: null }, avatarUrl: { not: null } },
  });
  const completePct = totalAll > 0 ? Math.round((completeCount / totalAll) * 100) : 0;

  const totalCount = await prisma.person.count({ where });
  const page = parsePage(params.page, Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
  const { skip, take } = paginationArgs(page);

  const people = await prisma.person.findMany({
    where,
    orderBy: { displayName: "asc" },
    skip,
    take,
    select: {
      id: true,
      displayName: true,
      slug: true,
      personType: true,
      shortBio: true,
      loreSummary: true,
      avatarUrl: true,
      _count: { select: { guestAppearances: true, quotes: true } },
    },
  });

  const paginationMeta = buildPaginationMeta(page, take, totalCount);


  return (
    <main id="main-content" className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-accent-gold">People</h1>
          <Link
            href="/admin/people/new"
            className="rounded bg-accent-gold px-3 py-1.5 font-mono text-xs font-bold text-void uppercase tracking-wider hover:bg-accent-gold/90 transition-colors"
          >
            + New Person
          </Link>
        </div>
        <span className="font-mono text-xs text-text-muted">{totalCount} total</span>
      </div>

      {/* ── Enrichment stats ── */}
      <div className="mb-6 rounded-lg border border-border bg-elevated p-4">
        <p className="font-mono text-[12px] uppercase tracking-widest text-text-muted mb-3">
          Profile Enrichment — all {totalAll.toLocaleString("en-US")} people
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <EnrichStat label="Lore Summary" count={withLoreSummary} total={totalAll} pct={enrichPct} color="text-accent-violet-text" barColor="bg-accent-violet" />
          <EnrichStat label="Short Bio"    count={withShortBio}    total={totalAll} pct={bioPct}    color="text-accent-cyan"   barColor="bg-accent-cyan"   />
          <EnrichStat label="Avatar"       count={withAvatar}      total={totalAll} pct={avatarPct} color="text-accent-gold-text"   barColor="bg-accent-gold"   />
          <EnrichStat label="Fully Complete" count={completeCount} total={totalAll} pct={completePct} color="text-green-400" barColor="bg-green-400" highlight />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <form className="flex-1 max-w-sm">
          <input
            name="q"
            type="search"
            defaultValue={search ?? ""}
            placeholder="Search people..."
            className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none"
          />
        </form>
        <div className="flex gap-1.5">
          {["all", "host", "recurring", "guest", "mentioned"].map((t) => (
            <Link
              key={t}
              href={`/admin/people${t !== "all" ? `?type=${t}` : ""}`}
              className={`rounded-full border px-3 py-1 font-mono text-[12px] transition-colors ${
                (typeFilter ?? "all") === t || (!typeFilter && t === "all")
                  ? "border-accent-gold text-accent-gold-text bg-accent-gold/10"
                  : "border-border text-text-muted hover:border-accent-gold/50"
              }`}
            >
              {t.replace("_", " ")}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-elevated">
              <th className="px-3 py-2 text-left font-mono text-[12px] uppercase tracking-wider text-text-muted">Name</th>
              <th className="px-3 py-2 text-left font-mono text-[12px] uppercase tracking-wider text-text-muted">Type</th>
              <th className="px-3 py-2 text-left font-mono text-[12px] uppercase tracking-wider text-text-muted">Appearances</th>
              <th className="px-3 py-2 text-left font-mono text-[12px] uppercase tracking-wider text-text-muted">Quotes</th>
              {/* Profile completeness dots */}
              <th className="px-3 py-2 text-center font-mono text-[12px] uppercase tracking-wider text-text-muted" title="Bio / Lore / Avatar">
                Profile
              </th>
              <th className="px-3 py-2 text-right font-mono text-[12px] uppercase tracking-wider text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {people.map((person) => {
              const hasBio   = Boolean(person.shortBio);
              const hasLore  = Boolean(person.loreSummary);
              const hasPhoto = Boolean(person.avatarUrl);
              const isComplete = hasBio && hasLore && hasPhoto;
              return (
                <tr key={person.id} className="hover:bg-elevated/50 transition-colors">
                  <td className="px-3 py-2 text-xs text-text-primary">{person.displayName}</td>
                  <td className="px-3 py-2">
                    <StatusBadge label={person.personType.replace("_", " ")} variant={PERSON_TYPE_BADGE[person.personType] ?? "muted"} />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-text-muted">{person._count.guestAppearances}</td>
                  <td className="px-3 py-2 font-mono text-xs text-text-muted">{person._count.quotes}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1" title={`Bio:${hasBio ? "✓" : "✗"} Lore:${hasLore ? "✓" : "✗"} Photo:${hasPhoto ? "✓" : "✗"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${hasBio   ? "bg-accent-cyan"   : "bg-border"}`} title="Short bio" />
                      <span className={`h-1.5 w-1.5 rounded-full ${hasLore  ? "bg-accent-violet" : "bg-border"}`} title="Lore summary" />
                      <span className={`h-1.5 w-1.5 rounded-full ${hasPhoto ? "bg-accent-gold"   : "bg-border"}`} title="Avatar" />
                      {isComplete && (
                        <span className="ml-1 font-mono text-[12px] text-green-400">✓</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/admin/people/${person.id}/edit`} className="font-mono text-[12px] text-accent-gold-text hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <PaginationControls meta={paginationMeta} basePath="/admin/people" />
    </main>
  );
}

function EnrichStat({
  label, count, total, pct, color, barColor, highlight = false,
}: {
  label: string; count: number; total: number; pct: number;
  color: string; barColor: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded border p-3 ${highlight ? "border-green-400/30 bg-green-400/5" : "border-border bg-surface"}`}>
      <div className={`font-mono text-lg font-bold leading-tight ${color}`}>
        {count.toLocaleString("en-US")}
        <span className="text-xs text-text-muted font-normal ml-1">/ {total.toLocaleString("en-US")}</span>
      </div>
      <div className="font-mono text-[12px] text-text-muted mt-0.5 mb-2">{label}</div>
      <div className="h-1 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={`mt-1 font-mono text-[12px] ${color}`}>{pct}%</div>
    </div>
  );
}
