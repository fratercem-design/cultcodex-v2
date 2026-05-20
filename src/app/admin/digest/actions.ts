"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function upsertWeeklyDigest(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string | null;
  const weekOf = new Date(formData.get("weekOf") as string);
  const title = (formData.get("title") as string).trim();
  const blurb = ((formData.get("blurb") as string) || "").trim() || null;
  const published = formData.get("published") === "true";

  const parseIds = (key: string) =>
    (formData.get(key) as string || "")
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const quoteIds = parseIds("quoteIds");
  const episodeIds = parseIds("episodeIds");
  const personIds = parseIds("personIds");

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
