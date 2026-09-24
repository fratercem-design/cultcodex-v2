"use server";

/**
 * Admin server actions for the clap-token board (#cultofpsyche).
 * Every action re-verifies the admin role — the /admin layout gate alone
 * is not sufficient for mutations.
 */
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function requireAdmin(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Unauthorized");
}

/** Add (or subtract, with a negative amount) tokens for a nickname — creates the holder if new. */
export async function grantClapTokens(formData: FormData): Promise<void> {
  await requireAdmin();
  const nickname = String(formData.get("nickname") ?? "").trim();
  const amount = Math.trunc(Number(formData.get("amount") ?? 0));
  const note = String(formData.get("note") ?? "").trim() || null;
  const spotlight = formData.get("spotlight") === "on";
  if (!nickname || nickname.length > 32 || amount === 0) return;

  const holder = await prisma.clapHolder.upsert({
    where: { nickname },
    create: { nickname, tokens: Math.max(amount, 0) },
    update: { tokens: { increment: amount } },
  });
  // Never let a manual adjustment take the total negative.
  if (amount < 0) {
    await prisma.clapHolder.updateMany({
      where: { id: holder.id, tokens: { lt: 0 } },
      data: { tokens: 0 },
    });
  }
  await prisma.clapToken.create({
    data: {
      holderId: holder.id,
      quantity: amount,
      source: note?.toLowerCase().includes("cashapp") ? "cashapp" : "admin",
      note,
      spotlightUntil: spotlight ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null,
    },
  });
  revalidatePath("/claps");
  revalidatePath("/admin/claps");
}

/** Rename a holder (keeps their tokens/history). */
export async function renameClapHolder(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const nickname = String(formData.get("nickname") ?? "").trim();
  if (!id || !nickname || nickname.length > 32) return;
  await prisma.clapHolder.update({ where: { id }, data: { nickname } }).catch(() => {
    /* duplicate nickname — ignore */
  });
  revalidatePath("/claps");
  revalidatePath("/admin/claps");
}

/** Toggle a holder's visibility on the public board. */
export async function toggleClapHolderHidden(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const holder = await prisma.clapHolder.findUnique({ where: { id }, select: { hidden: true } });
  if (!holder) return;
  await prisma.clapHolder.update({ where: { id }, data: { hidden: !holder.hidden } });
  revalidatePath("/claps");
  revalidatePath("/admin/claps");
}
