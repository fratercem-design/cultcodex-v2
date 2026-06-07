"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { hasSystemTier } from "@/lib/subscription";
import { prisma } from "@/lib/db";

export async function submitSignalProposal(formData: FormData) {
  const user = await requireAuth();
  const oracle = await hasSystemTier(user.id);
  if (!oracle) throw new Error("Oracle access required");

  const question = (formData.get("question") as string)?.trim();
  const context = (formData.get("context") as string)?.trim() || null;

  if (!question || question.length < 10) throw new Error("Question too short");
  if (question.length > 1000) throw new Error("Question too long");

  await prisma.signalProposal.create({
    data: { userId: user.id, question, context },
  });

  revalidatePath("/signals");
}

export async function voteOnProposal(proposalId: string) {
  const user = await requireAuth();
  const oracle = await hasSystemTier(user.id);
  if (!oracle) throw new Error("Oracle access required");

  await prisma.signalProposal.update({
    where: { id: proposalId },
    data: { votes: { increment: 1 } },
  });

  revalidatePath("/signals");
}
