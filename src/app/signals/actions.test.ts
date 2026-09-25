import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  hasSystemTier: vi.fn(),
  findUnique: vi.fn(),
  voteCreate: vi.fn(),
  proposalUpdate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/subscription", () => ({ hasSystemTier: mocks.hasSystemTier }));
vi.mock("@/lib/db", () => ({
  prisma: {
    signalProposal: { findUnique: mocks.findUnique, update: mocks.proposalUpdate },
    signalProposalVote: { create: mocks.voteCreate },
    $transaction: mocks.transaction,
  },
}));

import { voteOnProposal } from "./actions";

describe("voteOnProposal", () => {
  beforeEach(() => {
    mocks.requireAuth.mockResolvedValue({ id: "voter" });
    mocks.hasSystemTier.mockResolvedValue(true);
    mocks.findUnique.mockResolvedValue({ userId: "author" });
    mocks.transaction.mockResolvedValue([]);
  });
  afterEach(() => vi.clearAllMocks());

  it("records the vote and the increment together", async () => {
    await voteOnProposal("p1");
    expect(mocks.voteCreate).toHaveBeenCalledWith({ data: { proposalId: "p1", userId: "voter" } });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when the member already voted", async () => {
    mocks.transaction.mockRejectedValue(Object.assign(new Error("dup"), { code: "P2002" }));
    await expect(voteOnProposal("p1")).resolves.toBeUndefined();
  });

  it("does not let the author vote again on their own proposal", async () => {
    mocks.requireAuth.mockResolvedValue({ id: "author" });
    await voteOnProposal("p1");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
