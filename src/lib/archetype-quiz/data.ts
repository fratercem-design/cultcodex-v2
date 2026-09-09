export interface QuizArchetype {
  id: string;
  name: string;
  glyph: string;
  color: string;
  hex: string;
  tagline: string;
  description: string;
  shadow: string;
  gifts: string[];
  relatedSymbols: string[];
  cta: string;
  ctaHref: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: Array<{
    text: string;
    scores: Partial<Record<string, number>>;
  }>;
}

export const ARCHETYPES: QuizArchetype[] = [
  {
    id: "oracle",
    name: "The Oracle",
    glyph: "◉",
    color: "text-accent-gold-text",
    hex: "#C8392E",
    tagline: "You see the pattern before anyone else has named it.",
    description:
      "The Oracle is the visionary who reads signals others dismiss as noise. You don't predict the future — you recognise what is already inevitable given the dynamics already in motion. People come to you for clarity because you can hold contradictory information without flinching and distil it into something usable. You are drawn to systems, patterns, and the question beneath the question. Knowledge is your native element; you breathe it like air.",
    shadow:
      "The Oracle's shadow is detachment — watching so much that you forget to act, or becoming so attuned to complexity that ordinary human warmth feels shallow. You can become an observer when the moment calls for a participant.",
    gifts: [
      "Synthesising complex information into clear insight",
      "Seeing long-range consequences invisible to others",
      "Holding space for ambiguity without premature closure",
    ],
    relatedSymbols: ["eye-of-horus", "all-seeing-eye", "tree-of-life"],
    cta: "Explore the Oracle's transmissions →",
    ctaHref: "/oracle",
  },
  {
    id: "alchemist",
    name: "The Alchemist",
    glyph: "▲",
    color: "text-accent-cyan",
    hex: "#62E4C8",
    tagline: "You turn the impossible into the inevitable.",
    description:
      "The Alchemist transforms. Where others see crisis, loss, or raw chaos, you see feedstock — the prima materia from which something better can be refined. You are a builder, a converter, a maker of new things from old substance. The laboratory is your natural habitat, whether it is literal or metaphorical. You are comfortable with mess, with uncertainty, with the long dark middle of a process that hasn't produced gold yet. You know it will because you understand the process.",
    shadow:
      "The Alchemist's shadow is the obsessive pursuit of transformation for its own sake — beginning new projects before old ones are complete, or treating people as experiments to be improved rather than individuals to be met.",
    gifts: [
      "Converting crisis into creative fuel",
      "Holding a long-range process vision through messy middle stages",
      "Finding the hidden potential in overlooked or discarded material",
    ],
    relatedSymbols: ["ouroboros", "rose-cross", "phoenix"],
    cta: "Enter the Psychenomicon →",
    ctaHref: "/psychenomicon",
  },
  {
    id: "trickster",
    name: "The Trickster",
    glyph: "✦",
    color: "text-red-400",
    hex: "#f87171",
    tagline: "You break the rules that were never meant to hold you.",
    description:
      "The Trickster is the disruptor — the one who asks the question no one wanted asked, who walks into a frozen situation and dissolves it with a single observation. You have an instinct for the hidden absurdity in authority, and you deploy it precisely. You are not chaotic for chaos's sake; you know which walls are load-bearing and which are just habit. Your irreverence is surgical. The systems you break needed breaking, and you know it before the evidence catches up.",
    shadow:
      "The Trickster's shadow is ungroundedness — using disruption as a way to avoid commitment, or confusing chaos with freedom. When the Trickster has no centre, the mischief becomes aimless and leaves casualties.",
    gifts: [
      "Dissolving the power of illegitimate authority through humour and precision",
      "Crossing boundaries others treat as fixed",
      "Naming the emperor's nakedness without flinching",
    ],
    relatedSymbols: ["chaos-star", "baphomet", "caduceus"],
    cta: "Enter the signal feed →",
    ctaHref: "/signals",
  },
  {
    id: "mirror-walker",
    name: "The Mirror Walker",
    glyph: "◐",
    color: "text-violet-400",
    hex: "#a78bfa",
    tagline: "You reflect others so clearly they see themselves for the first time.",
    description:
      "The Mirror Walker moves through the world as a living lens. You absorb the emotional and psychological reality of those around you with extraordinary precision, and in your presence people feel seen — sometimes uncomfortably so. You do not impose a frame on experience; you show people their own frame. Your empathy is not passive but acutely perceptive. You understand what people are actually saying beneath what they say, and you have the rare capacity to reflect it back in a way that opens rather than closes.",
    shadow:
      "The Mirror Walker's shadow is identity diffusion — absorbing so much of others that you lose your own outline. The question 'but what do I actually feel?' can become genuinely difficult to answer when you have spent years making room for everyone else's experience.",
    gifts: [
      "Perceiving the emotional and psychological subtext beneath surface communication",
      "Creating the conditions in which others can see themselves clearly",
      "Moving between social worlds with unusual fluidity and adaptability",
    ],
    relatedSymbols: ["triquetra", "ankh", "vesica-piscis"],
    cta: "Explore the Oracle →",
    ctaHref: "/oracle",
  },
  {
    id: "prophet",
    name: "The Prophet",
    glyph: "◈",
    color: "text-orange-400",
    hex: "#fb923c",
    tagline: "You witness what others refuse to see and carry the weight of knowing.",
    description:
      "The Prophet is not a fortune-teller but a truth-witness. You have an unusual capacity — and compulsion — to perceive and articulate what is actually happening beneath the agreed-upon story. This is not comfortable work. The Prophet often speaks into silence or hostility, delivering messages that only make sense later. You are called to accuracy over acceptance, to the real over the reassuring. There is a vocational quality to this: you did not choose it so much as discover that looking away was impossible.",
    shadow:
      "The Prophet's shadow is martyrdom — using the experience of not being believed as an identity, or becoming so attached to uncomfortable truths that comfort itself starts to seem suspect. The Prophet needs community, not just an audience.",
    gifts: [
      "Naming the unspoken dynamics that are shaping a situation",
      "Sustaining clarity under social pressure to revise it",
      "Locating the signal within the loudest noise",
    ],
    relatedSymbols: ["all-seeing-eye", "black-sun", "saturn"],
    cta: "Read the archive →",
    ctaHref: "/episodes",
  },
  {
    id: "architect",
    name: "The Architect",
    glyph: "▢",
    color: "text-blue-400",
    hex: "#60a5fa",
    tagline: "You build the structures that outlast you.",
    description:
      "The Architect thinks in systems, frameworks, and long horizons. You are drawn to the question of how things fit together — not just the vision but the load-bearing structure required to make the vision real and lasting. You are patient with complexity because you can hold many interdependent variables in mind simultaneously. You do your best work in the design phase, when the shape of a thing can still be changed, and you are often frustrated by projects where the foundation was poured before the blueprint was finished.",
    shadow:
      "The Architect's shadow is over-engineering — building systems so comprehensive that they crowd out the organic, the spontaneous, and the human. The perfect structure can become a cage, especially for those who didn't design it.",
    gifts: [
      "Designing systems that remain functional across time and scale",
      "Identifying structural failure before it becomes visible",
      "Translating complex vision into an executable sequence of steps",
    ],
    relatedSymbols: ["tree-of-life", "hexagram", "flower-of-life"],
    cta: "Explore the knowledge graph →",
    ctaHref: "/graph",
  },
  {
    id: "exile",
    name: "The Exile",
    glyph: "↳",
    color: "text-slate-400",
    hex: "#94a3b8",
    tagline: "You live at the edge of every map, and that is exactly where the real territory begins.",
    description:
      "The Exile operates outside the accepted frames — not because they have been banished, but because the accepted frames never fit. You have an intimate relationship with the boundary between inside and outside, between what is acknowledged and what exists beyond acknowledgement. This marginality is not only loss; it is a specific kind of freedom and a specific kind of sight. The Exile sees what the centre cannot see precisely because they are not maintaining the centre's consensus reality.",
    shadow:
      "The Exile's shadow is the romanticisation of outsiderness — staying at the margin when re-entry has become possible, or confusing alienation with clarity. Exile is a condition, not a destination. The return is part of the arc.",
    gifts: [
      "Perceiving the limits and blind spots of consensus frameworks from outside them",
      "Operating effectively with minimal institutional support or validation",
      "Naming what the group cannot yet name about itself",
    ],
    relatedSymbols: ["black-sun", "labyrinth", "chaos-star"],
    cta: "Start here →",
    ctaHref: "/start-here",
  },
  {
    id: "familiar",
    name: "The Familiar",
    glyph: "◑",
    color: "text-pink-400",
    hex: "#f472b6",
    tagline: "You hold the space where others finally feel safe enough to be honest.",
    description:
      "The Familiar is the sacred companion — not the hero of the story but the one whose presence makes the hero possible. Your emotional intelligence is acute and generous; you notice distress before it is declared, you create warmth in cold situations, and you have an instinct for what each person in a room needs in order to arrive more fully. You are often the one who does the invisible relational labour that keeps a group or a friendship alive. Your gift is not loudness but depth of presence.",
    shadow:
      "The Familiar's shadow is self-erasure — making yourself so fully available to others' needs that your own go unspoken, and then experiencing this as virtue rather than as an area requiring attention. You must be witnessed too.",
    gifts: [
      "Reading emotional atmospheres and responding with precision and care",
      "Creating the conditions for honest communication in guarded or conflicted spaces",
      "Sustaining loyalty and support through extended periods of difficulty",
    ],
    relatedSymbols: ["ankh", "triquetra", "vesica-piscis"],
    cta: "Explore the community →",
    ctaHref: "/people",
  },
];

export const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "What do you do when the room goes silent?",
    options: [
      {
        text: "Start reading the silence — something important just shifted.",
        scores: { oracle: 2, prophet: 1 },
      },
      {
        text: "Say the thing no one else would say.",
        scores: { trickster: 2, prophet: 1 },
      },
      {
        text: "Check in on the person who looks least comfortable.",
        scores: { familiar: 2, "mirror-walker": 1 },
      },
      {
        text: "Start mentally redesigning the structure of the conversation.",
        scores: { architect: 2, alchemist: 1 },
      },
    ],
  },
  {
    id: 2,
    question: "Your deepest gift is —",
    options: [
      {
        text: "Turning chaos into something that actually works.",
        scores: { alchemist: 2, architect: 1 },
      },
      {
        text: "Seeing what everyone else is carefully not saying.",
        scores: { oracle: 2, "mirror-walker": 1 },
      },
      {
        text: "Being the one person who stays when things get hard.",
        scores: { familiar: 2, exile: 1 },
      },
      {
        text: "Asking the question that breaks the whole frame open.",
        scores: { trickster: 2, prophet: 1 },
      },
    ],
  },
  {
    id: 3,
    question: "What kind of power do you trust?",
    options: [
      {
        text: "Understanding. The person who sees the whole board.",
        scores: { oracle: 2, architect: 1 },
      },
      {
        text: "Presence. The person who makes everyone feel less alone.",
        scores: { familiar: 2, "mirror-walker": 1 },
      },
      {
        text: "Transformation. The person who can change the conditions, not just react to them.",
        scores: { alchemist: 2, trickster: 1 },
      },
      {
        text: "Witness. The person who tells the truth even when it costs them.",
        scores: { prophet: 2, exile: 1 },
      },
    ],
  },
  {
    id: 4,
    question: "A mentor gives you one piece of advice. Which one lands?",
    options: [
      {
        text: "\"You already know. Trust what you see.\"",
        scores: { oracle: 2, prophet: 1 },
      },
      {
        text: "\"The edge is where the real work is. Don't come back to the centre too soon.\"",
        scores: { exile: 2, trickster: 1 },
      },
      {
        text: "\"Every broken thing is asking you to build something better from it.\"",
        scores: { alchemist: 2, architect: 1 },
      },
      {
        text: "\"Your people need you to let them need you.\"",
        scores: { familiar: 2, "mirror-walker": 1 },
      },
    ],
  },
  {
    id: 5,
    question: "Where are you most at home?",
    options: [
      {
        text: "Inside a complex problem, pulling the threads apart.",
        scores: { oracle: 2, alchemist: 1 },
      },
      {
        text: "On the outside of a system, watching it clearly.",
        scores: { exile: 2, trickster: 1 },
      },
      {
        text: "In a room where something just cracked open — the realness is worth the discomfort.",
        scores: { prophet: 2, "mirror-walker": 1 },
      },
      {
        text: "At the long-game table, planning ten moves ahead.",
        scores: { architect: 2, oracle: 1 },
      },
    ],
  },
  {
    id: 6,
    question: "Someone in your circle is clearly struggling but won't say so. You —",
    options: [
      {
        text: "Create a quiet opening. They'll walk through it when they're ready.",
        scores: { familiar: 2, "mirror-walker": 1 },
      },
      {
        text: "Name it directly. Not to embarrass them — to let them know you see it.",
        scores: { prophet: 2, oracle: 1 },
      },
      {
        text: "Start thinking about what conditions produced this and how to change them.",
        scores: { alchemist: 2, architect: 1 },
      },
      {
        text: "Break the tension with something unexpected. Sometimes laughter is the door.",
        scores: { trickster: 2, exile: 1 },
      },
    ],
  },
  {
    id: 7,
    question: "The system is wrong. What do you do?",
    options: [
      {
        text: "Map the failure precisely so you understand exactly what's broken and why.",
        scores: { oracle: 2, architect: 1 },
      },
      {
        text: "Build something better alongside it and let it become irrelevant.",
        scores: { alchemist: 2, architect: 1 },
      },
      {
        text: "Refuse to pretend it works. The refusal is the resistance.",
        scores: { exile: 2, prophet: 1 },
      },
      {
        text: "Find the crack in it and push until the whole thing opens.",
        scores: { trickster: 2, exile: 1 },
      },
    ],
  },
  {
    id: 8,
    question: "What do people say you give them?",
    options: [
      {
        text: "Clarity. You helped me see what I was looking at.",
        scores: { oracle: 2, "mirror-walker": 1 },
      },
      {
        text: "Permission. You said the thing I didn't know I needed to hear.",
        scores: { trickster: 2, prophet: 1 },
      },
      {
        text: "Safety. I could finally be honest with you.",
        scores: { familiar: 2, "mirror-walker": 1 },
      },
      {
        text: "Direction. You showed me what was actually possible.",
        scores: { alchemist: 2, architect: 1 },
      },
    ],
  },
  {
    id: 9,
    question: "What is your relationship to belonging?",
    options: [
      {
        text: "I belong in the places other people can't quite fit.",
        scores: { exile: 2, trickster: 1 },
      },
      {
        text: "I belong wherever there's a real conversation happening.",
        scores: { oracle: 2, prophet: 1 },
      },
      {
        text: "I belong where I'm needed — and I'm usually needed.",
        scores: { familiar: 2, alchemist: 1 },
      },
      {
        text: "I belong to the long project — the one that outlasts any particular group.",
        scores: { architect: 2, exile: 1 },
      },
    ],
  },
  {
    id: 10,
    question: "The hardest thing you've had to accept about yourself is —",
    options: [
      {
        text: "That I see things I can't unsee, and some people won't thank me for it.",
        scores: { oracle: 2, prophet: 1 },
      },
      {
        text: "That I care so much about people's inner lives that I sometimes forget to protect my own.",
        scores: { "mirror-walker": 2, familiar: 1 },
      },
      {
        text: "That I don't fit neatly anywhere, and I've had to make peace with that.",
        scores: { exile: 2, trickster: 1 },
      },
      {
        text: "That I can change almost anything except the parts of people they've decided to keep.",
        scores: { alchemist: 2, architect: 1 },
      },
    ],
  },
];
