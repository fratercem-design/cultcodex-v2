// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => {
  process.env.GOOGLE_CLIENT_ID ??= "test-id";
  process.env.GOOGLE_CLIENT_SECRET ??= "test-secret";
  return { mockAuth: vi.fn() };
});

vi.mock("next-auth", () => ({
  default: () => ({ handlers: {}, signIn: vi.fn(), signOut: vi.fn(), auth: mockAuth }),
}));
vi.mock("next-auth/providers/google", () => ({ default: () => ({}) }));
vi.mock("@/lib/db", () => ({ prisma: {} }));

import { requireAdmin } from "@/lib/auth";
import { adminDeniedResponse } from "@/lib/admin-api";

async function denial() {
  const err = await requireAdmin().catch((e: unknown) => e);
  const res = adminDeniedResponse(err);
  return { status: res.status, body: (await res.json()) as { error: string } };
}

// Each test sets mockAuth's behaviour itself. (A beforeEach mockReset makes
// Vitest 4 report the throwing implementation below as a failure.)
describe("requireAdmin + adminDeniedResponse", () => {
  it("lets an admin through", async () => {
    mockAuth.mockResolvedValue({ codexUser: { id: "u1", role: "admin" } });
    await expect(requireAdmin()).resolves.toMatchObject({ id: "u1" });
  });

  it("says try again when the account lookup failed, not 'not admin'", async () => {
    mockAuth.mockResolvedValue({ user: { email: "a@b.c" }, accountLookupFailed: true });
    const { status, body } = await denial();
    expect(status).toBe(503);
    expect(body.error).toMatch(/database busy/);
  });

  it("asks to sign in again when there is no session", async () => {
    mockAuth.mockResolvedValue(null);
    expect((await denial()).status).toBe(401);
  });

  it("treats a broken session token as signed out", async () => {
    mockAuth.mockImplementation(async () => {
      throw new Error("JWTSessionError");
    });
    expect((await denial()).status).toBe(401);
  });

  it("still refuses a signed-in non-admin with 403", async () => {
    mockAuth.mockResolvedValue({ codexUser: { id: "u2", role: "member" } });
    const { status, body } = await denial();
    expect(status).toBe(403);
    expect(body.error).toBe("Admin access required");
  });

  it("keeps 403 for errors that are not AdminAccessError (route-level mocks)", async () => {
    expect(adminDeniedResponse(new Error("x")).status).toBe(403);
  });
});
