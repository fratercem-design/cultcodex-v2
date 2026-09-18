import { describe, it, expect } from "vitest";
import { THIN_PAGE_MIN_EPISODES } from "@/lib/seo";
import {
  normalizeTopicTitle,
  tierFor,
  clusterByNormalizedTitle,
  planConsolidation,
  type TopicQualityInput,
} from "@/lib/topic-quality";

let seq = 0;
function topic(over: Partial<TopicQualityInput> & { slug: string }): TopicQualityInput {
  seq += 1;
  return {
    id: `t${seq}`,
    title: over.slug.replace(/-/g, " "),
    description: null,
    createdAt: new Date("2026-01-01"),
    episodeCount: 0,
    peopleCount: 0,
    loreCount: 0,
    savedCount: 0,
    ...over,
  };
}

describe("normalizeTopicTitle", () => {
  it("collapses the singular/plural pairs the hand-written dedup list encodes", () => {
    // Sampled from scripts/_topic-dedup.ts MERGE_PAIRS — the list this replaces.
    const pairs: [string, string][] = [
      ["Tarot Readings", "Tarot Reading"],
      ["Archetypes", "Archetype"],
      ["Ancient Religions", "Ancient Religion"],
      ["Prophetic Visions", "Prophetic Vision"],
      ["One-on-One Conversations", "One on One Conversation"],
      ["Panelverse", "Panel-Verse"],
      ["Shadow-Banning", "Shadowbanning"],
    ];
    for (const [a, b] of pairs) {
      expect(normalizeTopicTitle(a)).toBe(normalizeTopicTitle(b));
    }
  });

  it("does not strip an 's' that belongs to the stem", () => {
    // Each of these would become a different concept if naively singularized.
    for (const word of ["Chaos", "Bias", "Consensus", "Genesis", "Praxis", "Ethos", "Canvas"]) {
      expect(normalizeTopicTitle(word)).toBe(word.toLowerCase());
    }
  });

  it("still singularizes a plural that merely ends in a vowel + s", () => {
    for (const [plural, singular] of [["Mantras", "Mantra"], ["Ideas", "Idea"], ["Sagas", "Saga"], ["Keys", "Key"]]) {
      expect(normalizeTopicTitle(plural)).toBe(normalizeTopicTitle(singular));
    }
  });

  it("keeps genuinely different topics apart", () => {
    expect(normalizeTopicTitle("Tarot Readings")).not.toBe(normalizeTopicTitle("Tarot Spreads"));
    expect(normalizeTopicTitle("Live Streams")).not.toBe(normalizeTopicTitle("Live Streaming"));
  });

  it("folds case, punctuation and diacritics", () => {
    expect(normalizeTopicTitle("  Déjà-Vu!  ")).toBe("dejavu");
  });

  it("returns empty for a title with no alphanumerics, so it never clusters", () => {
    expect(normalizeTopicTitle("—")).toBe("");
    expect(clusterByNormalizedTitle([topic({ slug: "a", title: "—" }), topic({ slug: "b", title: "!!" })])).toEqual([]);
  });
});

describe("tierFor", () => {
  it("agrees with the sitemap threshold rather than introducing a second one", () => {
    expect(tierFor(THIN_PAGE_MIN_EPISODES)).toBe("canonical");
    expect(tierFor(THIN_PAGE_MIN_EPISODES - 1)).toBe("thin");
    expect(tierFor(0)).toBe("orphan");
  });
});

describe("clusterByNormalizedTitle", () => {
  it("picks the member with the most episodes as survivor", () => {
    const clusters = clusterByNormalizedTitle([
      topic({ slug: "tarot-reading", title: "Tarot Reading", episodeCount: 3 }),
      topic({ slug: "tarot-readings", title: "Tarot Readings", episodeCount: 41 }),
    ]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].survivor.slug).toBe("tarot-readings");
    expect(clusters[0].absorbed.map((t) => t.slug)).toEqual(["tarot-reading"]);
  });

  it("breaks an episode-count tie toward the older row", () => {
    const clusters = clusterByNormalizedTitle([
      topic({ slug: "new", title: "Mantras", episodeCount: 2, createdAt: new Date("2026-06-01") }),
      topic({ slug: "old", title: "Mantra", episodeCount: 2, createdAt: new Date("2026-01-01") }),
    ]);
    expect(clusters[0].survivor.slug).toBe("old");
  });

  it("ignores topics with no twin", () => {
    expect(clusterByNormalizedTitle([topic({ slug: "solo", episodeCount: 5 })])).toEqual([]);
  });
});

describe("planConsolidation", () => {
  it("merges a cluster and keeps only the survivor", () => {
    const { actions, counts } = planConsolidation([
      topic({ slug: "mantras", title: "Mantras", episodeCount: 4 }),
      topic({ slug: "mantra", title: "Mantra", episodeCount: 1 }),
    ]);
    expect(actions).toContainEqual({ kind: "keep", slug: "mantras" });
    expect(actions).toContainEqual({ kind: "merge", slug: "mantra", intoSlug: "mantras" });
    expect(counts.merge).toBe(1);
  });

  it("promotes a survivor over the floor on the merged count", () => {
    // Neither clears the floor alone; together they do. Merging before judging
    // is the reason the rule runs in this order.
    const rows = [
      topic({ slug: "confessions", title: "Confessions", episodeCount: 1, createdAt: new Date("2025-01-01") }),
      topic({ slug: "confession", title: "Confession", episodeCount: 1 }),
    ];
    const withoutResolver = planConsolidation(rows);
    expect(withoutResolver.counts.keep).toBe(0);

    const withResolver = planConsolidation(rows, () => 2);
    expect(withResolver.actions).toContainEqual({ kind: "keep", slug: "confessions" });
  });

  it("sends a lone single-episode topic to its episode", () => {
    const { actions } = planConsolidation([topic({ slug: "one-off", episodeCount: 1 })]);
    expect(actions).toEqual([{ kind: "redirect-to-episode", slug: "one-off" }]);
  });

  it("deletes an unsaved orphan but retains one a member pinned", () => {
    const { actions, counts } = planConsolidation([
      topic({ slug: "artifact", episodeCount: 0, savedCount: 0 }),
      topic({ slug: "pinned", episodeCount: 0, savedCount: 3 }),
    ]);
    expect(actions).toContainEqual({ kind: "delete", slug: "artifact" });
    expect(actions).toContainEqual({ kind: "retain-noindex", slug: "pinned" });
    expect(counts.delete).toBe(1);
  });

  it("assigns exactly one action per topic", () => {
    const rows = [
      topic({ slug: "a", title: "Predictions", episodeCount: 9 }),
      topic({ slug: "b", title: "Prediction", episodeCount: 2 }),
      topic({ slug: "c", episodeCount: 1 }),
      topic({ slug: "d", episodeCount: 0 }),
    ];
    const { actions, counts } = planConsolidation(rows);
    expect(actions).toHaveLength(rows.length);
    expect(new Set(actions.map((a) => a.slug)).size).toBe(rows.length);
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(rows.length);
  });

  it("never deletes or redirects a topic that clears the floor", () => {
    const rows = Array.from({ length: 20 }, (_, i) =>
      topic({ slug: `s${i}`, title: `Signal ${i}`, episodeCount: i })
    );
    const { actions } = planConsolidation(rows);
    for (const [i, action] of actions.entries()) {
      if (rows[i].episodeCount >= THIN_PAGE_MIN_EPISODES) {
        expect(action.kind).toBe("keep");
      }
    }
  });
});
