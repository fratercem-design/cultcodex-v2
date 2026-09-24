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
  if (context && context.length > 2000) throw new Error("Context too long");

  await prisma.signalProposal.create({
    data: { userId: user.id, question, context },
  });

  revalidatePath("/signals");
}

export async function voteOnProposal(proposalId: string) {
  const user = await requireAuth();
  const oracle = await hasSystemTier(user.id);
  if (!oracle) throw new Error("Oracle access required");

  const proposal = await prisma.signalProposal.findUnique({
    where: { id: proposalId },
    select: { userId: true },
  });
  if (!proposal) throw new Error("Proposal not found");
  // The author's vote is already counted (votes defaults to 1).
  if (proposal.userId === user.id) return;

  try {
    await prisma.$transaction([
      prisma.signalProposalVote.create({ data: { proposalId, userId: user.id } }),
      prisma.signalProposal.update({
        where: { id: proposalId },
        data: { votes: { increment: 1 } },
      }),
    ]);
  } catch (err) {
    // Primary key on (proposalId, userId): this member already voted.
    if ((err as { code?: unknown })?.code === "P2002") return;
    throw err;
  }

  revalidatePath("/signals");
}
