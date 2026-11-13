import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));

import { emptyOnlyAtBuild } from "@/lib/sitemap";

describe("emptyOnlyAtBuild", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rethrows at runtime so ISR keeps the last good sitemap", () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-server");
    const err = new Error("timeout exceeded when trying to connect");
    expect(() => emptyOnlyAtBuild(err)).toThrow(err);
  });

  it("returns an empty segment during the build, which has no previous render", () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    expect(emptyOnlyAtBuild(new Error("no database in CI"))).toEqual([]);
  });
});
