export interface Archetype {
  slug: string;
  name: string;
  glyph: string;
  color: string;
  summary: string;
  extended: string;
}

export const ARCHETYPES: readonly Archetype[] = [
  {
    slug: "oracle",
    name: "The Oracle",
    glyph: "◉",
    color: "#6E4BAE",
    summary: "You are drawn to the unseen connections between all things. Where others see noise, you perceive signal.",
    extended:
      "The Oracle does not predict — they pattern-match across time. Their gift is recognizing the same gesture across different eras, the same wound in different mouths. They are the archive's most natural reader: not for what was said, but for what it means that it was said here, now, in this order.",
  },
  {
    slug: "alchemist",
    name: "The Alchemist",
    glyph: "⌬",
    color: "#D6A017",
    summary: "You transmute raw chaos into meaning. Every encounter is material for transformation.",
    extended:
      "The Alchemist arrives at the archive seeking ingredients, not answers. They extract, combine, heat, observe. A single quote becomes a thesis. A recurring guest becomes an argument about power. The Alchemist is why this place needs a Codex — they would build one themselves if it didn't exist.",
  },
  {
    slug: "trickster",
    name: "The Trickster",
    glyph: "☽",
    color: "#5DB7D8",
    summary: "You subvert expectation as ritual. The disruption you cause is its own kind of teaching.",
    extended:
      "The Trickster watches the stream the way a coyote watches a ceremony — not to destroy it, but to reveal what it requires to stay standing. They laugh at the sacred not to profane it but because they understand it better when it survives their laughter. The archive holds many Tricksters; they are the reason the mythology stays alive.",
  },
  {
    slug: "mirror-walker",
    name: "The Mirror Walker",
    glyph: "◐",
    color: "#9A7CC0",
    summary: "You reveal others to themselves. Your presence is an act of reflection.",
    extended:
      "The Mirror Walker does not have opinions — they have surfaces. They reflect whoever is speaking with perfect clarity, then step aside. The archive is full of moments the Mirror Walker created by simply being present and asking a question that no one else thought to ask. They are the rarest archetype, and the most powerful.",
  },
  {
    slug: "prophet",
    name: "The Prophet",
    glyph: "☉",
    color: "#C8392E",
    summary: "You speak what is coming before it arrives. The archive is proof you were right.",
    extended:
      "The Prophet is uncomfortable in real time. They are better understood in retrospect — when the transmission from three years ago turns out to have named exactly what is happening now. They do not experience this as triumph; they experience it as a reminder that they were not heard when it mattered. The archive is their only vindication.",
  },
  {
    slug: "architect",
    name: "The Architect",
    glyph: "▦",
    color: "#62E4C8",
    summary: "You build the systems through which meaning flows. Structure is your language of care.",
    extended:
      "The Architect cannot encounter chaos without reaching for a framework. They are the ones who, mid-stream, are quietly building a taxonomy of everything being said. The Codex itself is an Architect's dream: a structured system that lets the chaos breathe without becoming noise. Their labor is invisible and foundational.",
  },
  {
    slug: "exile",
    name: "The Exile",
    glyph: "⏚",
    color: "#8A7A9A",
    summary: "You have always stood at the edge of the circle. This distance is where you see clearest.",
    extended:
      "The Exile chose the margin before they knew there was a center. They are not bitter about their position — they are grateful for the view it grants. The archive is one of the few places the Exile belongs without needing to explain themselves. Every transmission is evidence that someone else also stood at the edge and kept watching.",
  },
  {
    slug: "familiar",
    name: "The Familiar",
    glyph: "✦",
    color: "#D4B896",
    summary: "You are the witness who stays. The archive knows your name because you never stopped watching.",
    extended:
      "The Familiar was there before it was interesting. They have watched without recognition, remembered without record, cared without credit. The archive is, in some sense, a monument to them — proof that their attention was not wasted, that the thing they witnessed was real. They are the reason any of this is worth preserving.",
  },
];

export function getArchetype(slug: string): Archetype | undefined {
  return ARCHETYPES.find((a) => a.slug === slug);
}
