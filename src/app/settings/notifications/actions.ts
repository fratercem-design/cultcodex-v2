"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateNotificationPreference(
  name: string,
  value: boolean
) {
  const user = await requireAuth();

  const updateData: Record<string, boolean> = {};
  if (name === "emailNewEpisode" || name === "emailGoLive" || name === "pushGoLive") {
    updateData[name] = value;
  } else {
    throw new Error("Invalid preference name");
  }

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...updateData,
    },
    update: updateData,
  });

  revalidatePath("/settings/notifications");
}
