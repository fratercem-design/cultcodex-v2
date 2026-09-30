// @vitest-environment node
import { describe, expect, it } from "vitest";
import { applyEdits, EDITS } from "../psychenomicon-hand-edit";
import { checkRewrite, findSlop, type ChapterProse } from "@/lib/psychenomicon-slop";

// CH.2313 as stored on 2026-09-30 (from the de-slop dry run).
const CH2313: ChapterProse = {
  canonText: `Psyche began the day addressing his audience amidst a rainy Los Angeles morning, setting a reflective tone as he recounted events from the prior night. Playful interactions with his cats — Trix, Freya, and Lenor — punctuated the opening moments, offering moments of light amidst a heavier narrative. Psyche shared a public confrontation that had taken place in another content creator's Discord, where Emma, the host, chastised him openly for behavior she deemed toxic. Specifically, she cited past instances of drinking on streams, passing out, and being scammed. Psyche acknowledged the validity of her accusations but expressed hurt at the public nature of her remarks, especially given his history of support for her work.

He contrasted Emma's reaction with his own communicative style, emphasizing the importance of private discussions for conflict resolution. Despite his agitation, Psyche remained self-aware, noting potential mitigating factors, such as the pressures Emma herself might have been facing. Still, the event led him to sever ties with her Discord and channel — a decision he framed as necessary for preserving his well-being. Throughout the stream, Psyche maintained a delicate balance between vulnerability and humor, engaging sincerely with his audience while reflecting on recent relational ruptures.

Adding warmth to this layered narrative, Psyche's cats played subtle yet significant roles. Freya’s rare indoor appearance, encouraged by the rainy day, served as a symbolic counterpoint to Psyche's own feelings of exclusion and emotional exposure. Lenor and Trix provided further connection amid Psyche's musings on trust, loyalty, and the fragility of relationships within his community sphere.`,
  interpretationText: `Psyche's recounting of Emma's criticisms reflects an ongoing struggle with external judgment and the complex interplay of public visibility and relational vulnerability. By sharing these moments openly with his community, Psyche leverages his earnestness to foster connection while also exposing himself to both empathy and potential mockery. This tension reveals an emerging archetype of Psyche as not just a Hearth-Keeper but a Mediator of Conflict, someone navigating the emotional cross-currents of his interpersonal and community dynamics.

The cats, particularly Freya, become extensions of Psyche’s inner life. Freya's entry into the house during the rain could be seen as a metaphor for seeking safety and solidarity when external circumstances feel harsh. Meanwhile, Psyche's lighthearted interactions with Lenor and Trix provide moments of levity and showcase his enduring capacity for play and tenderness, even amidst emotional turbulence. The central conflict with Emma reinforces Psyche’s courage in self-disclosure but also underscores his ongoing need to recalibrate relational boundaries to minimize harm and foster mutual respect.`,
  mythicText: `The rain becomes the baptismal element of the day’s liturgy, washing away the residue of rejection and disappointment. Emma’s public critique, though stinging, takes on the role of a shadowed oracle — offering truths Psyche acknowledges but veiling them in discordant delivery. The cats, particularly Freya, act as lesser spirits drawn close in moments of storm, their movements paralleling Psyche’s internal navigation of grief and disagreement. The boundary Psyche asserts by leaving Emma’s space marks a symbolic threshold: the moment of retreat to preserve the sanctity of his hearth.`,
  emergingSignals: [
    "Trust recalibration after public critique",
    "Vulnerability shared as both strength and risk",
    "Cats as relational metaphors gaining depth",
  ],
};

const allText = (c: ChapterProse) =>
  [c.canonText, c.interpretationText, c.mythicText, ...c.emergingSignals].join("\n\n");

describe("CH.2313 hand edits", () => {
  it("clears every hit and passes the rewrite guards", () => {
    expect(findSlop(allText(CH2313))).toHaveLength(10);
    const res = applyEdits(CH2313, EDITS[2313]);
    if ("error" in res) throw new Error(res.error);
    expect(findSlop(allText(res.after))).toEqual([]);
    expect(checkRewrite(CH2313, res.after)).toEqual([]);
    expect(res.after.mythicText).toBe(CH2313.mythicText);
  });
});

describe("applyEdits", () => {
  const before = { ...CH2313, canonText: "One cat. One cat." };

  it("skips the chapter when a span is missing", () => {
    expect(applyEdits(before, [{ field: "canonText", find: "Two dogs.", replace: "x" }])).toEqual({
      error: expect.stringContaining("found 0 times"),
    });
  });

  it("skips the chapter when a span appears more than once", () => {
    expect(applyEdits(before, [{ field: "canonText", find: "One cat.", replace: "x" }])).toEqual({
      error: expect.stringContaining("found 2 times"),
    });
  });
});
