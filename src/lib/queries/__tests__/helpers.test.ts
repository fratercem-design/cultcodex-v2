import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {},
}));

import { buildPersonInclude } from "../people";
import { buildLoreInclude } from "../lore";

describe("buildPersonInclude", () => {
  it("returns include with expected relations", () => {
    const include = buildPersonInclude();
    expect(include).toHaveProperty("guestAppearances");
    expect(include).toHaveProperty("quotes");
    expect(include).toHaveProperty("topics");
  });
});

describe("buildLoreInclude", () => {
  it("returns include with expected relations", () => {
    const include = buildLoreInclude();
    expect(include).toHaveProperty("episodes");
    expect(include).toHaveProperty("people");
    expect(include).toHaveProperty("topics");
  });
});
