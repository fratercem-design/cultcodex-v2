import { prisma } from "@/lib/db";
import type { SearchKind } from "@/generated/prisma/client";

export interface SaveSearchInput {
  userId: string;
  label: string;
  kind: SearchKind;
  query?: string;
  concepts?: string[];
  thresholds?: number[];
  eraId?: string | null;
  personSlug?: string | null;
  archetype?: string | null;
}

export async function createSavedSearch(input: SaveSearchInput) {
  return prisma.savedSearch.create({
    data: {
      userId: input.userId,
      label: input.label.slice(0, 120),
      kind: input.kind,
      query: input.query ?? "",
      concepts: input.concepts ?? [],
      thresholds: input.thresholds ?? [],
      eraId: input.eraId ?? null,
      personSlug: input.personSlug ?? null,
      archetype: input.archetype ?? null,
    },
  });
}

export async function listSavedSearches(userId: string) {
  return prisma.savedSearch.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
}

export async function deleteSavedSearch(userId: string, id: string) {
  // Scope delete to owner — never trust the id alone
  const result = await prisma.savedSearch.deleteMany({
    where: { id, userId },
  });
  return result.count > 0;
}

export interface PatchSavedSearchInput {
  label?: string;
  pinned?: boolean;
  markRun?: boolean;
}

export async function updateSavedSearch(
  userId: string,
  id: string,
  patch: PatchSavedSearchInput
) {
  const existing = await prisma.savedSearch.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!existing) return null;

  return prisma.savedSearch.update({
    where: { id },
    data: {
      ...(patch.label !== undefined ? { label: patch.label.slice(0, 120) } : {}),
      ...(patch.pinned !== undefined ? { pinned: patch.pinned } : {}),
      ...(patch.markRun ? { lastRunAt: new Date() } : {}),
    },
  });
}
