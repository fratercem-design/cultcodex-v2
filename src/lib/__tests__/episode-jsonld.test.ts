import { describe, it, expect } from "vitest";
import { episodeJsonLd, jsonLdScript } from "../seo";

describe("jsonLdScript", () => {
  it("escapes </script> so it cannot break out of the script block", () => {
    const out = jsonLdScript(
      episodeJsonLd({ title: "Evil </script><script>alert(1)</script>", slug: "x" })
    );
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<script>");
    expect(out).toContain("\\u003c");
    // Still valid JSON after escaping.
    expect(() => JSON.parse(out)).not.toThrow();
    expect(JSON.parse(out).name).toBe("Evil </script><script>alert(1)</script>");
  });

  it("escapes ampersands and angle brackets", () => {
    const out = jsonLdScript({ a: "1 < 2 & 3 > 0" });
    expect(out).not.toMatch(/[<>&]/);
    expect(JSON.parse(out).a).toBe("1 < 2 & 3 > 0");
  });
});

describe("episodeJsonLd", () => {
  it("produces a VideoObject with embed/content URLs from a youtube id", () => {
    const ld = episodeJsonLd({
      title: "The First Transmission",
      slug: "first-transmission",
      description: "An opening.",
      airDate: new Date("2024-01-07T00:00:00.000Z"),
      thumbnailUrl: "https://img.test/t.jpg",
      youtubeVideoId: "abc123",
      duration: "1:02:03",
    });

    expect(ld["@type"]).toBe("VideoObject");
    expect(ld.name).toBe("The First Transmission");
    expect(ld.embedUrl).toBe("https://www.youtube.com/embed/abc123");
    expect(ld.contentUrl).toBe("https://www.youtube.com/watch?v=abc123");
    expect(ld.thumbnailUrl).toEqual(["https://img.test/t.jpg"]);
    expect(ld.uploadDate).toBe("2024-01-07T00:00:00.000Z");
    expect(ld.duration).toBe("PT1H2M3S");
  });

  it("converts MM:SS durations and omits empty/invalid ones", () => {
    expect(
      episodeJsonLd({ title: "x", slug: "x", duration: "5:30" }).duration
    ).toBe("PT5M30S");
    expect(
      episodeJsonLd({ title: "x", slug: "x", duration: "0:00" }).duration
    ).toBeUndefined();
    expect(
      episodeJsonLd({ title: "x", slug: "x", duration: "live" }).duration
    ).toBeUndefined();
  });

  it("falls back to a generated description and omits video fields when no id", () => {
    const ld = episodeJsonLd({ title: "Quiet One", slug: "quiet-one" });
    expect(ld.description).toContain("Quiet One");
    expect(ld.embedUrl).toBeUndefined();
    expect(ld.contentUrl).toBeUndefined();
  });
});
