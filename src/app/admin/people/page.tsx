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
    recurring: "purple",
    guest: "muted",
    mentioned: "muted",
  };

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
              className={`rounded-full border px-3 py-1 font-mono text-[10px] transition-colors ${
                (typeFilter ?? "all") === t || (!typeFilter && t === "all")
                  ? "border-accent-gold text-accent-gold bg-accent-gold/10"
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
                  <Link href={`/admin/people/${person.id}/edit`} className="font-mono text-[10px] text-accent-gold hover:underline">
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
