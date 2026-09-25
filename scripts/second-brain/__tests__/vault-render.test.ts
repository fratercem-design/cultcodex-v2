import { describe, it, expect } from "vitest";
import {
  assignNoteNames,
  renderEpisode,
  renderIndex,
  renderPerson,
  renderTranscript,
  sanitizeNoteName,
  type VaultEpisode,
  type VaultPerson,
} from "../vault-render";

function episode(overrides: Partial<VaultEpisode> = {}): VaultEpisode {
  return {
    id: "e1",
    title: "Cult of Psyche - The Veil's Edge",
    slug: "the-veils-edge",
    episodeNumber: 5,
    airDate: new Date("2025-05-15T20:00:00Z"),
    duration: "1:02:03",
    youtubeVideoId: "abc123",
    rumbleVideoId: null,
    contentType: "livestream",
    seriesTitle: null,
    summaryShort: "Psyche reads cards.",
    summaryLong: null,
    summaryFacts: null,
    summaryThemes: null,
    guestIds: ["p1"],
    mentionedIds: [],
    topicIds: [],
    loreIds: [],
    quotes: [{ text: "Bring receipts.", speakerId: "p1", timestampSeconds: 3734 }],
    hasTranscript: true,
    ...overrides,
  };
}

const psyche: VaultPerson = {
  id: "p1",
  displayName: "Psyche",
  altNames: ["Psy"],
  shortBio: "Host.",
  loreSummary: null,
  personType: "host",
};

describe("sanitizeNoteName", () => {
  it("removes characters that break links or filenames", () => {
    expect(sanitizeNoteName('What? "Yes" | No [1] #2 a/b')).toBe("What Yes No 1 2 a b");
  });

  it("never returns an empty name", () => {
    expect(sanitizeNoteName("???")).toBe("Untitled");
  });
});

describe("assignNoteNames", () => {
  it("prefixes episodes with the air date and strips the channel brand", () => {
    const names = assignNoteNames([episode()], [], [], []);
    expect(names.episode.get("e1")).toBe("2025-05-15 The Veil's Edge");
    expect(names.transcript.get("e1")).toBe("2025-05-15 The Veil's Edge (transcript)");
  });

  it("keeps names unique case-insensitively across kinds", () => {
    const names = assignNoteNames(
      [],
      [psyche, { ...psyche, id: "p2", displayName: "psyche" }],
      [{ id: "t1", title: "Psyche", description: null }],
      []
    );
    expect(names.person.get("p1")).toBe("Psyche");
    expect(names.person.get("p2")).toBe("psyche (person)");
    expect(names.topic.get("t1")).toBe("Psyche (topic)");
  });
});

describe("renderTranscript", () => {
  const names = assignNoteNames([episode()], [psyche], [], []);

  it("groups segments into timestamped paragraphs linked to YouTube", () => {
    const md = renderTranscript(
      episode(),
      names,
      [
        { startSeconds: 0, speakerLabel: null, text: "Hello" },
        { startSeconds: 5, speakerLabel: null, text: "  everyone " },
        { startSeconds: 70, speakerLabel: null, text: "Next bit" },
      ],
      null
    );
    expect(md).toContain("**[0:00](https://www.youtube.com/watch?v=abc123&t=0s)** Hello everyone");
    expect(md).toContain("**[1:10](https://www.youtube.com/watch?v=abc123&t=70s)** Next bit");
    expect(md).toContain('episode: "[[2025-05-15 The Veil\'s Edge]]"');
  });

  it("starts a new paragraph when the speaker changes", () => {
    const md = renderTranscript(
      episode(),
      names,
      [
        { startSeconds: 0, speakerLabel: "A", text: "Hi" },
        { startSeconds: 2, speakerLabel: "B", text: "Hey" },
      ],
      null
    );
    expect(md).toContain("t=0s)** A: Hi\n\n**[0:02]");
  });

  it("falls back to the raw transcript when there are no segments", () => {
    const md = renderTranscript(episode(), names, [], "plain text transcript");
    expect(md.trimEnd().endsWith("plain text transcript")).toBe(true);
  });
});

describe("renderEpisode", () => {
  it("links guests, the transcript, and timestamped quotes", () => {
    const names = assignNoteNames([episode()], [psyche], [], []);
    const md = renderEpisode(episode(), names);
    expect(md).toContain("[[2025-05-15 The Veil's Edge (transcript)]]");
    expect(md).toContain("## Guests\n\n- [[Psyche]]");
    expect(md).toContain("> — [[Psyche]] · [1:02:14](https://www.youtube.com/watch?v=abc123&t=3734s)");
  });
});

describe("renderPerson", () => {
  it("lists appearances, aliases and quotes", () => {
    const names = assignNoteNames([episode()], [psyche], [], []);
    const md = renderPerson(psyche, names, [episode()]);
    expect(md).toContain('aliases:\n  - "Psy"');
    expect(md).toContain("## Appearances (1)\n\n- [[2025-05-15 The Veil's Edge]]");
    expect(md).toContain("> — [[2025-05-15 The Veil's Edge]] · [1:02:14]");
  });
});

describe("renderIndex", () => {
  it("includes hand-written concept notes found on disk", () => {
    const names = assignNoteNames([episode()], [psyche], [], []);
    const md = renderIndex(names, [episode()], [psyche], [], [], {
      concepts: ["The Great Ban Wave"],
      analyses: [],
    });
    expect(md).toContain("## Concepts\n\n- [[The Great Ban Wave]]");
    expect(md).toContain("## Analyses\n\n_None yet._");
    expect(md).toContain("### 2025\n\n- [[2025-05-15 The Veil's Edge]] Psyche reads cards.");
  });
});
