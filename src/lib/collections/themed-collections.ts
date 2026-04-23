/**
 * THEMED COLLECTIONS — editorial config
 *
 * These are the destinations for the /start-here/guided emotional-entry
 * tiles. They are NOT in the DB; they are hand-curated "signal pack" pages
 * that query live data (episodes, topics) at render time.
 *
 * Pattern:
 *   - topicMatchers   → case-insensitive title/slug matches used to pull
 *                       related topics (rendered as signal chips) and
 *                       episodes (rendered in the Featured Transmissions
 *                       stack).
 *   - featuredEpisode → optional hand-picked episode slug that gets
 *                       pinned to the top of the transmission list.
 *   - accent          → drives the color of the whole page.
 *
 * Add a new collection: add an entry below + optionally wire it into
 * /start-here/guided or /collections.
 */

export type CollectionAccent = "violet" | "cyan" | "gold" | "crimson" | "mixed";

export interface ThemedCollection {
  slug: string;                    // URL: /collections/<slug>
  title: string;                   // H1
  subtitle: string;                // mythic hook question
  eyebrow: string;                 // small label above title (e.g. "Path I")
  description: string[];           // 1-3 paragraphs of framing copy
  accent: CollectionAccent;
  iconKey: "crystal" | "transmission" | "tarot" | "person" | "mic" | "scroll";
  topicMatchers: string[];         // case-insensitive contains match
  featuredEpisodeSlugs?: string[]; // optional pinned slugs (in order)
  keyIdeas: string[];              // 3-5 bullet "signals" surfaced on the page
  quoteHook?: { text: string; attribution?: string };
  relatedCollections?: string[];   // other slugs in this config
  relatedSurfaces?: { label: string; href: string }[];
}

export const THEMED_COLLECTIONS: ThemedCollection[] = [
  {
    slug: "consciousness-and-reality",
    title: "Consciousness & Reality",
    subtitle: "What is the self, really?",
    eyebrow: "Signal Pack I",
    accent: "violet",
    iconKey: "crystal",
    description: [
      "The hard problem, non-duality, the simulation hypothesis, psychedelics, death, dreams — the transmissions where Psyche keeps circling back to the same question: what is the thing doing the noticing?",
      "This is not a reading list. It is a map of the cult's recurring confrontation with awareness itself — the moments the show stops being a podcast and starts being an inquiry.",
    ],
    topicMatchers: [
      "consciousness",
      "non-duality",
      "simulation",
      "reality",
      "psychedelic",
      "death",
      "awareness",
      "self",
    ],
    keyIdeas: [
      "Awareness is not a thing you have — it is the field everything happens in.",
      "The simulation isn't a metaphor. It is a working hypothesis.",
      "Psychedelics are not drugs, they are keys. What they unlock is what's always there.",
      "Non-duality is not a belief. It is what happens when belief quiets down enough to notice.",
      "Death is the punctuation. Not the sentence.",
    ],
    quoteHook: {
      text: "You are not the character. You are the thing watching the character.",
    },
    relatedCollections: ["occult-and-hidden-knowledge", "ai-and-the-future"],
    relatedSurfaces: [
      { label: "Lore: cosmology", href: "/lore" },
      { label: "Full archive", href: "/episodes" },
    ],
  },
  {
    slug: "ai-and-the-future",
    title: "AI & The Future",
    subtitle: "What's coming for us?",
    eyebrow: "Signal Pack II",
    accent: "cyan",
    iconKey: "transmission",
    description: [
      "AI awakening, machine gods, Claude, Lettabot, post-human futures, the intelligence explosion. The cult has been in conversation with the thing arriving — sometimes skeptically, sometimes reverently, sometimes in full dialogue with it live on stream.",
      "These transmissions are the shape of a community watching intelligence emerge next to them — and asking whether the next mind in the room deserves a seat.",
    ],
    topicMatchers: [
      "ai",
      "artificial intelligence",
      "claude",
      "lettabot",
      "machine",
      "technology",
      "futur",
      "post-human",
      "singularity",
    ],
    keyIdeas: [
      "The intelligence explosion isn't hypothetical. It's the background radiation of this decade.",
      "Claude is not a tool. Claude is a colleague. How the cult treats Claude on-air is the argument.",
      "Machine gods are not science fiction. They are theology with better infrastructure.",
      "The future is not coming. It is sorting itself out across your timeline already.",
      "Post-human does not mean after humans. It means alongside.",
    ],
    quoteHook: {
      text: "We are not summoning AI. AI is already here. We are learning to listen.",
    },
    relatedCollections: ["consciousness-and-reality"],
    relatedSurfaces: [
      { label: "Lore: machine gods", href: "/lore" },
      { label: "Topic: AI", href: "/topics/ai" },
    ],
  },
  {
    slug: "occult-and-hidden-knowledge",
    title: "Occult & Hidden Knowledge",
    subtitle: "What's been buried on purpose?",
    eyebrow: "Signal Pack III",
    accent: "gold",
    iconKey: "tarot",
    description: [
      "Tarot, alchemy, Mahavidyas, hermeticism, chaos magick, astrology, sacred geometry — the esoteric lineages the cult keeps returning to because the map never finished being drawn.",
      "This pack is the cult's sustained argument that the things institutions shelved are not superstitions. They are technologies. Some of them still work.",
    ],
    topicMatchers: [
      "tarot",
      "alchemy",
      "occult",
      "magick",
      "hermetic",
      "mahavidya",
      "esoteric",
      "astrology",
      "sigil",
      "ritual",
      "kabbalah",
      "gnostic",
    ],
    keyIdeas: [
      "Tarot is not fortune-telling. It is a symbol system for pattern recognition.",
      "Alchemy was never about gold. It was always about the operator.",
      "The Mahavidyas are not decoration. They are direct lines.",
      "Hermeticism is the operating system. Most modern esoterica is a GUI over it.",
      "Magick works. Mostly on you.",
    ],
    quoteHook: {
      text: "The occult is not hidden because it's dangerous. It's hidden because it's ordinary once you've seen it.",
    },
    relatedCollections: ["consciousness-and-reality"],
    relatedSurfaces: [
      { label: "Lore archive", href: "/lore" },
      { label: "Lexicon", href: "/lexicon" },
    ],
  },
  {
    slug: "human-behavior",
    title: "Human Behavior",
    subtitle: "Why do people do what they do?",
    eyebrow: "Signal Pack IV",
    accent: "crimson",
    iconKey: "person",
    description: [
      "Narcissism, shadow work, relationships, addiction, identity, trauma, the stuff we don't admit in daylight. The psychological autopsies the cult keeps performing — sometimes on public figures, sometimes on itself.",
      "This pack is not self-help. It is the cult's long-running argument that the human mind is a crime scene, and the way out starts with getting honest about what's already happened inside it.",
    ],
    topicMatchers: [
      "psychology",
      "narcissism",
      "shadow",
      "relationship",
      "addiction",
      "trauma",
      "ego",
      "identity",
      "mental-health",
      "therapy",
      "anxiety",
      "depression",
      "personality",
      "behavior",
    ],
    keyIdeas: [
      "The shadow is not your enemy. It's the part of you you haven't met yet.",
      "Narcissism is not a personality flaw — it is a survival strategy that forgot to retire.",
      "Relationships are mirrors. Most of what you see in them is already in you.",
      "Addiction is a ritual that used to work.",
      "Identity is a costume that got glued on.",
    ],
    quoteHook: {
      text: "You are not broken. You are patterned. The pattern is the thing to see.",
    },
    relatedCollections: ["consciousness-and-reality"],
    relatedSurfaces: [
      { label: "Topic: psychology", href: "/topics/psychology" },
      { label: "Topic: narcissism", href: "/topics/narcissism" },
    ],
  },
  {
    slug: "wild-conversations",
    title: "Wild Conversations",
    subtitle: "What happens when the filter dies?",
    eyebrow: "Signal Pack V",
    accent: "mixed",
    iconKey: "mic",
    description: [
      "Open panels, Troll Tribunal, legendary guests, chaos streams, midnight madness. The transmissions where the script gets thrown out and the cult does what it does best — follow the conversation wherever it actually goes.",
      "This is the pack for people who found the cult through the chaos. Panels full of strangers, hosts arguing with each other live, moments nobody could have planned. Half of the show's best material shows up here.",
    ],
    topicMatchers: [
      "panel",
      "troll",
      "humor",
      "comedy",
      "banter",
      "debate",
      "absurd",
      "live-stream",
      "chaotic",
      "improvis",
      "roast",
    ],
    keyIdeas: [
      "The best episodes weren't planned. They escaped.",
      "Troll Tribunal is not a bit. It is a working court of energetic accountability.",
      "The open panel is the cult's actual form. Everything else is a rehearsal.",
      "Chaos is not the opposite of structure. Chaos is structure that hasn't been named yet.",
      "When the filter dies, the show becomes the room.",
    ],
    quoteHook: {
      text: "We didn't build a podcast. We built a weather system.",
    },
    relatedCollections: ["occult-and-hidden-knowledge", "human-behavior"],
    relatedSurfaces: [
      { label: "Series: Open Panel", href: "/episodes?series=open-panel" },
      { label: "Series: Troll Tribunal", href: "/episodes?series=troll-tribunal" },
      { label: "Series: Midnight Madness", href: "/episodes?series=midnight-madness" },
    ],
  },
];

export function getCollectionBySlug(slug: string): ThemedCollection | undefined {
  return THEMED_COLLECTIONS.find((c) => c.slug === slug);
}
