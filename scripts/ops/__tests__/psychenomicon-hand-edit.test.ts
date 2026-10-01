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

// CH.2464 as stored on 2026-09-30 (from the hand-edit dry run).
const CH2464: ChapterProse = {
  canonText: `Episode 195, recorded December 9, 2025, presents a fully composed and performed song — a devotional ode to Rambha, the celestial apsara of Hindu cosmology, born from the churning of the milk ocean. The piece is structured as an invocation, a praise song, and a petition simultaneously. Psyche, as composer and performer, traces Rambha's mythological attributes: her emergence from cosmic foam, her effect on gods who forget their own names in her presence, her nature as a being who does not tempt but liberates, who does not break but recreates. The song is delivered over music, alternating between performed lyric and near-devotional chant.

The core refrain — 'I burn, I rise, I don't retire' — is explicitly voiced in the first person, fusing the figure of Rambha with Psyche's own self-articulation. This is not a third-person celebration of a mythological figure; it is an act of invocation-as-absorption, where Rambha's attributes are drawn into Psyche's own body and voice. The repeated address of 'Grandpa' — rendered in the lyrics as an intimate title for Rambha, repositioning divine power within familial-intimate register — marks a distinct theological move, collapsing hierarchical distance between devotee and deity.

Rambha is characterized throughout with paradoxical pairings: soft and deadly, silk and storm, chaos wearing goddess form. Her beauty is described as forged in chaos stone, her glance as holy fire. The petition embedded in the final verses is explicit — 'Teach me how to blaze and shine,' 'Crown my spirit, set me free,' 'Your beauty is my igniter' — framing the song not merely as tribute but as a request for transmission of divine qualities into Psyche himself.

The song closes with an accumulation of invocatory fragments — 'Rise in me, through me' — completing the arc from praise to petition to absorption. The final image, 'uname / The end of the night,' functions as both release and threshold, an unnamed dissolution at the edge of darkness that echoes prior Psychenomicon language around the unnamed, the liminal, and the sovereign unfinished.`,
  interpretationText: `This episode continues and deepens the mythographic mode established in Chapter 2463, but with a critical shift: where the previous chapter narrated myth as external story, here Psyche inhabits the myth from the inside. The first-person refrain 'I burn, I rise, I don't retire' is not sung about Rambha — it is sung as Rambha, or more precisely, as Psyche transfigured through Rambha's qualities. This is invocation as identity work, a psychospiritual practice of borrowing divine attributes to reinforce and articulate the self. The attributes Psyche selects — liberation over temptation, recreation over destruction, beauty as ignition rather than seduction — are consistent with his established theological vocabulary: surrender-as-strength, transformation through fire, the wound that does not define.

The address 'Grandpa' for Rambha is psychologically significant. It domesticates the divine, converting celestial power into intimate relational warmth. This mirrors a pattern seen across Psyche's invocational structure — the Nine inner circle members are addressed with familial-adjacent reverence, and here the same mechanism is applied to a mythological archetype. Power is made habitable through intimacy. The petition 'Make my presence God reborn' sustains the apotheosis thread that has been strengthening since Chapter 2458, and 'divine magnetic overgrown' introduces a new phrase — the suggestion that divinity is not contained or controlled but organic, sprawling, exceeding its boundaries.`,
  mythicText: `Rambha enters the Psychenomicon not as an external figure but as a transmissible force — a divine quality that can be drawn down, worn, and carried. In invoking the apsara born from cosmic churning, Psyche invokes an origin that mirrors his own: emergence from turbulence, beauty that unsettles, presence that revises the world simply by being present. The milk ocean churning is a myth of extraction through ordeal — gods and demons laboring together to produce both poison and nectar — and it resonates with the Psychenomicon's persistent theology that suffering and beauty share a common source.

The refrain 'I burn, I rise, I don't retire' functions now as Psyche's second known personal anthem — a creed spoken through the body of a goddess rather than the mouth of a man. This is the Firebearer's method: light does not announce itself as light; it speaks through the things it illuminates. Rambha is the illuminated object. Psyche is the fire behind it.`,
  emergingSignals: [
    "First-person mythographic absorption deepens — Psyche no longer narrates myth but inhabits it from within",
    "The 'Grandpa' address for divine figures establishes intimacy-as-theology as a recurring structural pattern",
    "Apotheosis thread accelerates: 'Make my presence God reborn' is the most direct self-divinization language yet recorded",
    "Paradox as aesthetic doctrine strengthens — soft/deadly, silk/storm, chaos/goddess as deliberate theological pairings",
    "The unnamed threshold resurfaces — 'uname / The end of the night' sustains the liminal dissolution motif across chapters",
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

describe("CH.2464 hand edits", () => {
  it("clears the prose hits without adding she/her, and passes the rewrite guards", () => {
    expect(findSlop(allText(CH2464))).toHaveLength(10);
    const res = applyEdits(CH2464, EDITS[2464]);
    if ("error" in res) throw new Error(res.error);
    // Only the dash cluster in the emerging signals is left; edits cover prose only.
    expect(findSlop(allText(res.after)).map((h) => h.kind)).toEqual(["dashes"]);
    expect(checkRewrite(CH2464, res.after)).toEqual([]);
    expect(res.after.emergingSignals).toEqual(CH2464.emergingSignals);
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
