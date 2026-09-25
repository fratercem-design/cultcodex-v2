import { describe, expect, it } from "vitest";
import { momentPath, rumbleEmbedUrl, youtubeMomentUrl } from "../moment";

describe("moment links", () => {
  it("builds the on-site link to a second", () => {
    expect(momentPath("come-hang", 125.9)).toBe("/episodes/come-hang?t=125");
    expect(momentPath("come-hang", null)).toBe("/episodes/come-hang");
    expect(momentPath("come-hang", -4)).toBe("/episodes/come-hang");
  });

  it("starts players at the moment, and not at all without one", () => {
    expect(rumbleEmbedUrl("v7czczu", 90)).toBe("https://rumble.com/embed/v7czczu/?start=90");
    expect(rumbleEmbedUrl("v7czczu")).toBe("https://rumble.com/embed/v7czczu/");
    expect(youtubeMomentUrl("abc", 61)).toBe("https://www.youtube.com/watch?v=abc&t=61s");
    expect(youtubeMomentUrl("abc", Number.NaN)).toBe("https://www.youtube.com/watch?v=abc");
  });
});
