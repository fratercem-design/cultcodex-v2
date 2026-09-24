import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/safe-redirect";

describe("safeRedirectPath", () => {
  it("keeps same-origin paths with query and hash", () => {
    expect(safeRedirectPath("/tarot/oracle")).toBe("/tarot/oracle");
    expect(safeRedirectPath("/search?q=a#top")).toBe("/search?q=a#top");
  });

  it.each([
    "https://evil.com",
    "//evil.com",
    "/\\evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "\\\\evil.com",
    "javascript:alert(1)",
    "evil.com",
    "",
    undefined,
    null,
    42,
  ])("rejects %j", (raw) => {
    expect(safeRedirectPath(raw)).toBe("/");
  });

  it("uses the given fallback", () => {
    expect(safeRedirectPath("//evil.com", "/account")).toBe("/account");
  });
});
