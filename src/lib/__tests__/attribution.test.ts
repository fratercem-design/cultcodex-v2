import { describe, expect, it } from "vitest";
import { campaignFromCookieHeader, cleanCampaign } from "@/lib/attribution";

describe("cleanCampaign", () => {
  it("keeps plain slugs and lowercases them", () => {
    expect(cleanCampaign("persona_Sulphur")).toBe("persona_sulphur");
    expect(cleanCampaign(" persona-nyx ")).toBe("persona-nyx");
  });

  it.each([null, undefined, "", "a b", "<script>", "x".repeat(65), "persona;nyx"])(
    "rejects %j",
    (value) => {
      expect(cleanCampaign(value)).toBeNull();
    }
  );
});

describe("campaignFromCookieHeader", () => {
  it("finds the campaign among other cookies", () => {
    expect(campaignFromCookieHeader("a=1; cc_campaign=persona_archivist; b=2")).toBe(
      "persona_archivist"
    );
  });

  it("returns null when the cookie is missing or invalid", () => {
    expect(campaignFromCookieHeader(null)).toBeNull();
    expect(campaignFromCookieHeader("a=1")).toBeNull();
    expect(campaignFromCookieHeader("cc_campaign=%3Cx%3E")).toBeNull();
  });
});
