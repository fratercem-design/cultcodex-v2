"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { prisma } from "@/lib/db";

const VALID_TARGETS = new Set(["episode", "lore", "person", "topic"]);

/**
 * Submit a community annotation on an archive entity.
 * Requires an active subscriber (Initiate+) or admin. Lands in "pending"
 * for moderation at /admin/annotations.
 */
export async function submitAnnotation(formData: FormData) {
  const user = await requireAuth();
  const allowed = user.role === "admin" || (await isSubscribed(user.id).catch(() => false));
  if (!allowed) throw new Error("Initiate+ required to annotate");

  const targetType = String(formData.get("targetType") ?? "").trim();
  const targetId = String(formData.get("targetId") ?? "").trim().slice(0, 200);
  const body = String(formData.get("body") ?? "").trim();
  const returnPath = String(formData.get("returnPath") ?? "/").trim();

  if (!VALID_TARGETS.has(targetType)) throw new Error("Invalid target");
  if (!targetId) throw new Error("Missing target");
  if (body.length < 10) throw new Error("Annotation too short");
  if (body.length > 1500) throw new Error("Annotation too long");

  // Auto-approve admins; everyone else is queued for moderation.
  const status = user.role === "admin" ? "approved" : "pending";

  await prisma.annotation.create({
    data: { userId: user.id, targetType, targetId, body, status },
  });

  if (returnPath.startsWith("/")) revalidatePath(returnPath);
}

/** Upvote an approved annotation. Any authenticated user. */
export async function voteAnnotation(annotationId: string, returnPath: string) {
  await requireAuth();
  await prisma.annotation.update({
    where: { id: annotationId },
    data: { votes: { increment: 1 } },
  });
  if (returnPath.startsWith("/")) revalidatePath(returnPath);
}

/** Admin moderation: set an annotation's status. */
export async function moderateAnnotation(annotationId: string, status: "approved" | "hidden" | "pending") {
  const user = await requireAuth();
  if (user.role !== "admin") throw new Error("Admin only");
  await prisma.annotation.update({ where: { id: annotationId }, data: { status } });
  revalidatePath("/admin/annotations");
}
