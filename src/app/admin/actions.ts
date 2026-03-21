"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type {
  ContentStatus,
  ContentType,
  PersonType,
  CanonStatus,
  SeriesType,
} from "@/generated/prisma/client";

// ── Episodes ─────────────────────────────────────────────

export async function updateEpisode(id: string, formData: FormData) {
  await requireAdmin();

  await prisma.episode.update({
    where: { id },
    data: {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      episodeNumber: formData.get("episodeNumber")
        ? Number(formData.get("episodeNumber"))
        : null,
      airDate: formData.get("airDate")
        ? new Date(formData.get("airDate") as string)
        : null,
      status: formData.get("status") as ContentStatus,
      summaryShort: (formData.get("summaryShort") as string) || null,
      summaryLong: (formData.get("summaryLong") as string) || null,
      youtubeVideoId: (formData.get("youtubeVideoId") as string) || null,
      thumbnailUrl: (formData.get("thumbnailUrl") as string) || null,
      contentType: (formData.get("contentType") as ContentType) || null,
    },
  });

  revalidatePath("/admin/episodes");
  revalidatePath("/episodes");
}

export async function bulkUpdateEpisodeStatus(
  ids: string[],
  status: ContentStatus,
) {
  await requireAdmin();

  await prisma.episode.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });

  revalidatePath("/admin/episodes");
  revalidatePath("/episodes");
}

// ── People ───────────────────────────────────────────────

export async function updatePerson(id: string, formData: FormData) {
  await requireAdmin();

  const altNamesStr = formData.get("altNames") as string;
  const altNames = altNamesStr
    ? altNamesStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  await prisma.person.update({
    where: { id },
    data: {
      displayName: formData.get("displayName") as string,
      slug: formData.get("slug") as string,
      shortBio: (formData.get("shortBio") as string) || null,
      loreSummary: (formData.get("loreSummary") as string) || null,
      personType: formData.get("personType") as PersonType,
      avatarUrl: (formData.get("avatarUrl") as string) || null,
      altNames,
    },
  });

  revalidatePath("/admin/people");
  revalidatePath("/people");
}

export async function mergePeople(sourceId: string, targetId: string) {
  await requireAdmin();

  // Reassign all relations from source to target
  await prisma.$transaction(async (tx) => {
    // Move guest appearances
    await tx.episodeGuest.updateMany({
      where: { personId: sourceId },
      data: { personId: targetId },
    });

    // Move mentions
    await tx.episodeMentionedPerson.updateMany({
      where: { personId: sourceId },
      data: { personId: targetId },
    });

    // Move quotes
    await tx.quote.updateMany({
      where: { speakerPersonId: sourceId },
      data: { speakerPersonId: targetId },
    });

    // Move topic connections
    await tx.personTopic.updateMany({
      where: { personId: sourceId },
      data: { personId: targetId },
    });

    // Move lore connections
    await tx.personLore.updateMany({
      where: { personId: sourceId },
      data: { personId: targetId },
    });

    // Soft-delete source by renaming
    const source = await tx.person.findUnique({
      where: { id: sourceId },
      select: { displayName: true },
    });

    await tx.person.update({
      where: { id: sourceId },
      data: {
        displayName: `[MERGED] ${source?.displayName}`,
        slug: `merged-${sourceId}`,
      },
    });
  });

  revalidatePath("/admin/people");
  revalidatePath("/people");
}

// ── Lore ─────────────────────────────────────────────────

export async function updateLoreEntry(id: string, formData: FormData) {
  await requireAdmin();

  await prisma.loreEntry.update({
    where: { id },
    data: {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      summary: (formData.get("summary") as string) || null,
      fullEntry: (formData.get("fullEntry") as string) || null,
      category: (formData.get("category") as string) || null,
      canonStatus: formData.get("canonStatus") as CanonStatus,
    },
  });

  revalidatePath("/admin/lore");
  revalidatePath("/lore");
}

// ── Topics ───────────────────────────────────────────────

export async function updateTopic(id: string, formData: FormData) {
  await requireAdmin();

  await prisma.topic.update({
    where: { id },
    data: {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      description: (formData.get("description") as string) || null,
    },
  });

  revalidatePath("/admin/topics");
  revalidatePath("/topics");
}

// ── Series ───────────────────────────────────────────────

export async function updateSeries(id: string, formData: FormData) {
  await requireAdmin();

  await prisma.series.update({
    where: { id },
    data: {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      description: (formData.get("description") as string) || null,
      type: formData.get("type") as SeriesType,
      status: formData.get("status") as ContentStatus,
      coverImageUrl: (formData.get("coverImageUrl") as string) || null,
    },
  });

  revalidatePath("/admin/series");
  revalidatePath("/series");
}

// ── Comments ─────────────────────────────────────────────

export async function moderateComment(
  id: string,
  action: "approve" | "delete",
) {
  await requireAdmin();

  if (action === "approve") {
    await prisma.codexComment.update({
      where: { id },
      data: { flagged: false, flaggedReason: null },
    });
  } else {
    await prisma.codexComment.delete({ where: { id } });
  }

  revalidatePath("/admin/comments");
}

export async function bulkModerateComments(
  ids: string[],
  action: "approve" | "delete",
) {
  await requireAdmin();

  if (action === "approve") {
    await prisma.codexComment.updateMany({
      where: { id: { in: ids } },
      data: { flagged: false, flaggedReason: null },
    });
  } else {
    await prisma.codexComment.deleteMany({
      where: { id: { in: ids } },
    });
  }

  revalidatePath("/admin/comments");
}

// ── Live Stream ──────────────────────────────────────────

export async function toggleLiveStream(formData: FormData) {
  await requireAdmin();

  const current = await prisma.liveStatus.findUnique({
    where: { id: "singleton" },
  });

  const isLive = current?.isLive ?? false;

  if (isLive) {
    // Going offline
    await prisma.liveStatus.upsert({
      where: { id: "singleton" },
      update: { isLive: false, endedAt: new Date() },
      create: { id: "singleton", isLive: false },
    });

    // Clear chat messages when stream ends
    await prisma.chatMessage.deleteMany({});
  } else {
    // Going live
    const videoId = (formData.get("videoId") as string) || null;
    const title =
      (formData.get("title") as string) || "Cult of Psyche Live Stream";

    await prisma.liveStatus.upsert({
      where: { id: "singleton" },
      update: {
        isLive: true,
        videoId,
        title,
        startedAt: new Date(),
        endedAt: null,
      },
      create: {
        id: "singleton",
        isLive: true,
        videoId,
        title,
        startedAt: new Date(),
      },
    });
  }

  revalidatePath("/admin/live");
  revalidatePath("/live");
}
