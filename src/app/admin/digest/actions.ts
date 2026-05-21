"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Accept either raw IDs or episode/person slugs — resolve slugs to IDs.
async function resolveEpisodeIds(raw: string[]): Promise<string[]> {
  if (!raw.length) return [];
  // Fetch all matches by ID or slug in one query
  const rows = await prisma.episode.findMany({
    where: { OR: [{ id: { in: raw } }, { slug: { in: raw } }] },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

async function resolvePersonIds(raw: string[]): Promise<string[]> {
  if (!raw.length) return [];
  const rows = await prisma.person.findMany({
    where: { OR: [{ id: { in: raw } }, { slug: { in: raw } }] },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function upsertWeeklyDigest(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string | null;
  const weekOf = new Date(formData.get("weekOf") as string);
  const title = (formData.get("title") as string).trim();
  const blurb = ((formData.get("blurb") as string) || "").trim() || null;
  const published = formData.get("published") === "true";

  const parseTokens = (key: string) =>
    (formData.get(key) as string || "")
      .split(/[\n,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const [quoteIds, episodeIds, personIds] = await Promise.all([
    // Quotes only have IDs (no slugs), so pass through directly
    Promise.resolve(parseTokens("quoteIds")),
    resolveEpisodeIds(parseTokens("episodeIds")),
    resolvePersonIds(parseTokens("personIds")),
  ]);

  const data = { weekOf, title, blurb, published, quoteIds, episodeIds, personIds };

  if (id) {
    await prisma.weeklyDigest.update({ where: { id }, data });
  } else {
    await prisma.weeklyDigest.create({ data });
  }

  revalidatePath("/admin/digest");
  revalidatePath("/this-week");
}

export async function deleteWeeklyDigest(id: string) {
  await requireAdmin();
  await prisma.weeklyDigest.delete({ where: { id } });
  revalidatePath("/admin/digest");
  revalidatePath("/this-week");
}

export async function togglePublished(id: string, published: boolean) {
  await requireAdmin();
  await prisma.weeklyDigest.update({ where: { id }, data: { published } });
  revalidatePath("/admin/digest");
  revalidatePath("/this-week");
}
