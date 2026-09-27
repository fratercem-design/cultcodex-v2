import { describe, expect, it } from "vitest";
import { episodeMetaDescription, socialMetadata } from "@/lib/seo";

describe("episodeMetaDescription", () => {
  it("keeps a short summary and adds the transcript note when it fits", () => {
    expect(episodeMetaDescription("Ep 1", "Psyche reads tarot for the panel.")).toBe(
      "Psyche reads tarot for the panel. Transcript and timestamps on CultCodex.",
    );
  });

  it("clips a long summary to at most 155 characters at a boundary", () => {
    const summary =
      "Psyche and Alexandra argue over the ethics of reading tarot for strangers on a live stream, " +
      "then the panel turns to a caller who claims to have predicted the outage, and the chat splits into camps.";
    const out = episodeMetaDescription("Ep 2", summary);
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.startsWith("Psyche and Alexandra argue")).toBe(true);
    expect(out.endsWith("…") || out.endsWith(".")).toBe(true);
    expect(out).not.toMatch(/\s…$/);
  });

  it("prefers a whole sentence when it carries most of the budget", () => {
    const first = "A".repeat(120) + " ends here.";
    const out = episodeMetaDescription("Ep 3", `${first} ${"b ".repeat(60)}`);
    expect(out).toBe(first);
  });

  it("falls back to the title when there is no summary", () => {
    expect(episodeMetaDescription("Night of Knives", null)).toBe(
      "Watch Night of Knives from Cult of Psyche. Browse the transcript, timestamps, guests and related archive entries.",
    );
  });
});

describe("socialMetadata", () => {
  it("carries site name, locale and a default image", () => {
    const m = socialMetadata({ title: "T", description: "D", path: "/people" });
    expect(m.openGraph).toMatchObject({ siteName: "CultCodex", locale: "en_US", url: "/people", description: "D" });
    expect(m.openGraph?.images).toBeTruthy();
    expect(m.twitter).toMatchObject({ card: "summary_large_image", description: "D" });
  });
});
