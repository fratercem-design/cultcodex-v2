import { describe, it, expect, vi, beforeEach } from "vitest";

const findUnique = vi.fn();
const create = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    codexUser: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      create: (...args: unknown[]) => create(...args),
    },
  },
}));

const { provisionCodexUser } = await import("../initiate");

/**
 * These pin the guarantees the capture page makes to the visitor: one account
 * per address, never a duplicate, and never an exception thrown back into a
 * flow that has already captured the lead.
 */
describe("provisionCodexUser", () => {
  beforeEach(() => {
    findUnique.mockReset();
    create.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("creates an account for a new address", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: "user_1" });

    const result = await provisionCodexUser({ email: "new@example.test", name: "New Person" });

    expect(result).toEqual({ status: "created", userId: "user_1" });
    expect(create).toHaveBeenCalledWith({
      data: { email: "new@example.test", displayName: "New Person", provider: "initiate" },
      select: { id: true },
    });
  });

  it("never creates a second account for an address that already has one", async () => {
    findUnique.mockResolvedValue({ id: "user_existing" });

    const result = await provisionCodexUser({ email: "known@example.test", name: "Known" });

    expect(result).toEqual({ status: "existing", userId: "user_existing" });
    expect(create).not.toHaveBeenCalled();
  });

  it("normalises the address so casing cannot create a duplicate", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: "user_2" });

    await provisionCodexUser({ email: "  MixedCase@Example.TEST  ", name: "Case" });

    expect(findUnique).toHaveBeenCalledWith({
      where: { email: "mixedcase@example.test" },
      select: { id: true },
    });
  });

  it("falls back to the email local-part when no name is given", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({ id: "user_3" });

    await provisionCodexUser({ email: "someone@example.test" });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ displayName: "someone" }) })
    );
  });

  it("returns failed instead of throwing when the database is down", async () => {
    findUnique.mockRejectedValue(new Error("connection refused"));

    await expect(provisionCodexUser({ email: "down@example.test" })).resolves.toEqual({
      status: "failed",
    });
  });

  it("returns failed on an empty address without touching the database", async () => {
    const result = await provisionCodexUser({ email: "   " });

    expect(result).toEqual({ status: "failed" });
    expect(findUnique).not.toHaveBeenCalled();
  });
});
