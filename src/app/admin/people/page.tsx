import Link from "next/link";
import { prisma } from "@/lib/db";
import type { PersonType } from "@/generated/prisma/client";
import { StatusBadge } from "@/components/ui/status-badge";
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
      _count: { select: { guestAppearances: true, quotes: true } },
    },
  });

  const paginationMeta = buildPaginationMeta(page, take, totalCount);

  const typeVariant: Record<string, "green" | "purple" | "muted"> = {
    host: "green",
    recurring_guest: "purple",
    guest: "muted",
    mentioned: "muted",
  };

  return (
    <main id="main-content" className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-accent-gold">People</h1>
        <span className="font-mono text-xs text-text-muted">{totalCount} total</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <form className="flex-1 max-w-sm">
          <input
            name="q"
            type="search"
            defaultValue={search ?? ""}
            placeholder="Search people..."
            className="w-full rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-green focus:outline-none"
          />
        </form>
        <div className="flex gap-1.5">
          {["all", "host", "recurring_guest", "guest", "mentioned"].map((t) => (
            <Link
              key={t}
              href={`/admin/people${t !== "all" ? `?type=${t}` : ""}`}
              className={`rounded-full border px-3 py-1 font-mono text-[10px] transition-colors ${
                (typeFilter ?? "all") === t || (!typeFilter && t === "all")
                  ? "border-accent-green text-accent-green bg-accent-green/10"
                  : "border-border text-text-muted hover:border-accent-green/50"
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
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Name</th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Type</th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Appearances</th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-text-muted">Quotes</th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {people.map((person) => (
              <tr key={person.id} className="hover:bg-elevated/50 transition-colors">
                <td className="px-3 py-2 text-xs text-text-primary">{person.displayName}</td>
                <td className="px-3 py-2">
                  <StatusBadge label={person.personType.replace("_", " ")} variant={typeVariant[person.personType] ?? "muted"} />
                </td>
                <td className="px-3 py-2 font-mono text-xs text-text-muted">{person._count.guestAppearances}</td>
                <td className="px-3 py-2 font-mono text-xs text-text-muted">{person._count.quotes}</td>
                <td className="px-3 py-2 text-right">
                  <Link href={`/admin/people/${person.id}/edit`} className="font-mono text-[10px] text-accent-green hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls meta={paginationMeta} basePath="/admin/people" />
    </main>
  );
}
