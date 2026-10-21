import { describe, expect, it } from "vitest";
import { clipMetaDescription, episodeMetaDescription, personMetaDescription, personMetaTitle, socialMetadata } from "@/lib/seo";

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
  it("carries site name, locale and the root generated image by default", () => {
    const m = socialMetadata({ title: "T", description: "D", path: "/topics" });
    expect(m.openGraph).toMatchObject({ siteName: "CultCodex", locale: "en_US", url: "/topics", description: "D" });
    expect(m.openGraph?.images).toMatchObject([{ url: "/opengraph-image" }]);
    expect(m.twitter).toMatchObject({ card: "summary_large_image", description: "D", images: [{ url: "/twitter-image" }] });
  });

  it("points at a route's own generated images when given one", () => {
    const m = socialMetadata({ title: "T", description: "D", path: "/people", image: { route: "/people", alt: "Voices" } });
    expect(m.openGraph?.images).toMatchObject([{ url: "/people/opengraph-image", alt: "Voices" }]);
    expect(m.twitter?.images).toMatchObject([{ url: "/people/twitter-image" }]);
  });
});

describe("personMetaTitle", () => {
  it("names the show and the episode count", () => {
    expect(personMetaTitle("Ziggy", 11)).toBe("Ziggy on Cult of Psyche — 11 Episodes");
    expect(personMetaTitle("Otto", 1)).toBe("Otto on Cult of Psyche — 1 Episode");
    expect(personMetaTitle("Psyche", 1999)).toBe("Psyche on Cult of Psyche — 1,999 Episodes");
  });

  it("drops the count when there are no appearances", () => {
    expect(personMetaTitle("Mary", 0)).toBe("Mary on Cult of Psyche");
  });
});

describe("personMetaDescription", () => {
  it("leads with the bio and appends the count when it fits", () => {
    expect(
      personMetaDescription({ name: "Ziggy", typeLabel: "guest", appearanceCount: 11, bio: "Panelist known for banter" }),
    ).toBe("Panelist known for banter. 11 appearances in the Cult of Psyche archive.");
  });

  it("keeps a long bio within 155 characters and drops the count", () => {
    const bio = "Host of Cult of Psyche, also known as Trix. Leads tarot readings, panel discussions, and explorations of consciousness, spirituality and the strange edges of human behavior.";
    const out = personMetaDescription({ name: "Psyche", typeLabel: "host", appearanceCount: 1999, bio });
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.startsWith("Host of Cult of Psyche")).toBe(true);
    expect(out).not.toContain("appearances");
  });

  it("falls back to name, role and count without a bio", () => {
    expect(personMetaDescription({ name: "Mary", typeLabel: "guest", appearanceCount: 3, bio: null })).toBe(
      "Mary, guest: 3 appearances in the Cult of Psyche archive. Profile, quotes and episodes on CultCodex.",
    );
  });
});

describe("clipMetaDescription", () => {
  it("collapses whitespace and clips to 155 characters", () => {
    const out = clipMetaDescription(`The serpent   that devours its own tail. ${"word ".repeat(60)}`);
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out).not.toMatch(/\s{2}/);
  });
});
