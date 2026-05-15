"use server";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  ContentStatus,
  ContentType,
  PersonType,
  CanonStatus,
  SeriesType,
} from "@/generated/prisma/client";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export async function createEpisode(formData: FormData) {
  await requireAdmin();

  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);
  const episodeNumber = formData.get("episodeNumber")
    ? parseInt(formData.get("episodeNumber") as string, 10)
    : null;
  const airDate = formData.get("airDate")
    ? new Date(formData.get("airDate") as string)
    : null;
  const status = ((formData.get("status") as string) || "draft") as ContentStatus;
  const contentType = ((formData.get("contentType") as string) || "original") as ContentType;
  const summaryShort = (formData.get("summaryShort") as string) || null;
  const summaryLong = (formData.get("summaryLong") as string) || null;
  const youtubeVideoId = (formData.get("youtubeVideoId") as string) || null;
  const thumbnailUrl = (formData.get("thumbnailUrl") as string) || null;

  const episode = await prisma.episode.create({
    data: {
      title,
      slug,
      episodeNumber,
      airDate,
      status,
      contentType,
      summaryShort,
      summaryLong,
      youtubeVideoId,
      thumbnailUrl,
    },
  });

  revalidatePath("/admin/episodes");
  revalidatePath("/episodes");
  redirect(`/admin/episodes/${episode.id}/edit`);
}

export async function createPerson(formData: FormData) {
  await requireAdmin();

  const displayName = formData.get("displayName") as string;
  const slug = (formData.get("slug") as string) || slugify(displayName);
  const personType = ((formData.get("personType") as string) || "guest") as PersonType;
  const shortBio = (formData.get("shortBio") as string) || null;
  const loreSummary = (formData.get("loreSummary") as string) || null;
  const avatarUrl = (formData.get("avatarUrl") as string) || null;
  const altNamesRaw = (formData.get("altNames") as string) || "";
  const altNames = altNamesRaw
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);

  const person = await prisma.person.create({
    data: {
      displayName,
      slug,
      personType,
      shortBio,
      loreSummary,
      avatarUrl,
      altNames,
    },
  });

  revalidatePath("/admin/people");
  revalidatePath("/people");
  redirect(`/admin/people/${person.id}/edit`);
}

export async function createLoreEntry(formData: FormData) {
  await requireAdmin();

  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);
  const summary = (formData.get("summary") as string) || null;
  const fullEntry = (formData.get("fullEntry") as string) || null;
  const category = (formData.get("category") as string) || null;
  const canonStatus = ((formData.get("canonStatus") as string) || "speculative") as CanonStatus;

  const entry = await prisma.loreEntry.create({
    data: {
      title,
      slug,
      summary,
      fullEntry,
      category,
      canonStatus,
    },
  });

  revalidatePath("/admin/lore");
  revalidatePath("/lore");
  redirect(`/admin/lore/${entry.id}/edit`);
}

export async function createTopic(formData: FormData) {
  await requireAdmin();

  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);
  const description = (formData.get("description") as string) || null;

  const topic = await prisma.topic.create({
    data: {
      title,
      slug,
      description,
    },
  });

  revalidatePath("/admin/topics");
  revalidatePath("/topics");
  redirect(`/admin/topics/${topic.id}/edit`);
}

export async function createSeries(formData: FormData) {
  await requireAdmin();

  const title = formData.get("title") as string;
  const slug = (formData.get("slug") as string) || slugify(title);
  const description = (formData.get("description") as string) || null;
  const seriesType = ((formData.get("seriesType") as string) || "other") as SeriesType;
  const status = ((formData.get("status") as string) || "draft") as ContentStatus;
  const coverImageUrl = (formData.get("coverImageUrl") as string) || null;

  const series = await prisma.series.create({
    data: {
      title,
      slug,
      description,
      type: seriesType,
      status,
      coverImageUrl,
    },
  });

  revalidatePath("/admin/series");
  revalidatePath("/series");
  redirect(`/admin/series/${series.id}/edit`);
}

export async function bulkCreateEpisodes(
  rows: Array<{
    title: string;
    episodeNumber?: number;
    airDate?: string;
    youtubeVideoId?: string;
    summaryShort?: string;
    status?: string;
  }>
) {
  await requireAdmin();

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      if (!row.title) {
        errors.push(`Row skipped: missing title`);
        continue;
      }

      const slug = slugify(row.title);

      // Check for duplicate slug
      const existing = await prisma.episode.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await prisma.episode.create({
        data: {
          title: row.title,
          slug,
          episodeNumber: row.episodeNumber ?? null,
          airDate: row.airDate ? new Date(row.airDate) : null,
          youtubeVideoId: row.youtubeVideoId ?? null,
          summaryShort: row.summaryShort ?? null,
          status: ((row.status as string) ?? "draft") as ContentStatus,
        },
      });

      created++;
    } catch (err) {
      errors.push(
        `Failed to create "${row.title}": ${err instanceof Error ? err.message : "Unknown error"}`
      );
    }
  }

  revalidatePath("/admin/episodes");
  revalidatePath("/episodes");

  return { created, skipped, errors };
}
