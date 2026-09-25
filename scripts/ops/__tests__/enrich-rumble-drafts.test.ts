import { describe, expect, it } from "vitest";
import { transcriptText } from "../enrich-rumble-drafts";

const seg = (startSeconds: number, text: string) => ({ startSeconds, speakerLabel: null, text });

describe("transcriptText", () => {
  it("timestamps every line when it fits", () => {
    expect(transcriptText([seg(5, "hi"), seg(3725, "bye")])).toBe("[0:05] hi\n[1:02:05] bye");
  });

  it("thins long transcripts evenly so the end of the stream survives", () => {
    const segs = Array.from({ length: 1000 }, (_, i) => seg(i * 10, `line ${i}`));
    const out = transcriptText(segs, 5000);
    expect(out.length).toBeLessThanOrEqual(5000);
    expect(out).toContain("line 0");
    expect(out.split("\n").at(-1)).toMatch(/line 9\d\d/);
  });
});
