import { describe, it, expect } from "vitest";
import { planRumbleTranscripts } from "../rumble-srt";
import type { VaultEpisode } from "../vault-render";

function episode(overrides: Partial<VaultEpisode>): VaultEpisode {
  return {
    id: "e1",
    title: "I DECLARE INDEPENDENCE",
    slug: "x",
    episodeNumber: null,
    airDate: new Date("2026-08-31T00:00:00Z"),
    duration: null,
    youtubeVideoId: null,
    rumbleVideoId: null,
    contentType: "livestream",
    seriesTitle: null,
    summaryShort: null,
    summaryLong: null,
    summaryFacts: null,
    summaryThemes: null,
    guestIds: [],
    mentionedIds: [],
    topicIds: [],
    loreIds: [],
    quotes: [],
    hasTranscript: false,
    ...overrides,
  };
}

const row = (id: string, title: string) => ({
  filename: `${id}.srt`,
  title,
  durationSeconds: 60,
  rumbleUrl: `https://rumble.com/${id}-slug.html`,
});

describe("planRumbleTranscripts", () => {
  it("fills in the transcript of a matching episode that has none", () => {
    const ep = episode({ rumbleVideoId: "v7aaa" });
    const plan = planRumbleTranscripts([row("v7aaa", "08/31/26 Psyche Awakens VOD: \"Anything\"")], [ep]);
    expect(plan.attach.get("e1")).toBe("v7aaa.srt");
    expect(ep.hasTranscript).toBe(true);
    expect(plan.standalone).toHaveLength(0);
  });

  it("matches by title within two days when the Rumble id is unknown", () => {
    const ep = episode({ airDate: new Date("2026-09-01T12:00:00Z") });
    const plan = planRumbleTranscripts(
      [row("v7bbb", "08/31/26 Psyche Awakens VOD: \"I DECLARE INDEPENDENCE\"")],
      [ep]
    );
    expect(plan.attach.get("e1")).toBe("v7bbb.srt");
  });

  it("leaves episodes that already have a database transcript alone", () => {
    const plan = planRumbleTranscripts(
      [row("v7aaa", "08/31/26 Psyche Awakens VOD: \"x\"")],
      [episode({ rumbleVideoId: "v7aaa", hasTranscript: true })]
    );
    expect(plan.skipped).toBe(1);
    expect(plan.attach.size).toBe(0);
    expect(plan.standalone).toHaveLength(0);
  });

  it("turns unmatched files and extra split VODs into caption-only episodes", () => {
    const plan = planRumbleTranscripts(
      [
        row("v7bbb", "08/31/26 Psyche Awakens VOD: \"I DECLARE INDEPENDENCE\""),
        row("v7ccc", "08/31/26 Psyche Awakens VOD: \"I DECLARE INDEPENDENCE\" (Partial)"),
        row("v7ddd", "09/05/26 Psyche Awakens VOD: \"Something New\""),
      ],
      [episode({})]
    );
    expect(plan.attach.get("e1")).toBe("v7bbb.srt");
    expect(plan.standalone.map((e) => e.id)).toEqual(["rumble:v7ccc", "rumble:v7ddd"]);
    expect(plan.standalone[1]).toMatchObject({
      title: "Something New",
      rumbleVideoId: "v7ddd",
      captionsOnly: true,
      hasTranscript: true,
    });
    expect(plan.standaloneFiles.get("rumble:v7ddd")).toBe("v7ddd.srt");
  });
});
