/**
 * EPISODE QUESTS / TRIALS — editorial config.
 *
 * Each trial is a threshold against the viewer's real archive activity
 * (the same RankActivity used for ranks). Completing a trial unlocks a
 * hidden reward page at /quests/[slug] containing exclusive lore.
 *
 * Threshold-based (rather than specific hardcoded episode slugs) so the
 * trials never break as the archive changes.
 */
import type { RankActivity } from "@/lib/rankings/ranks";

export type QuestAccent = "gold" | "cyan" | "violet" | "crimson";

export interface Quest {
  slug: string;
  title: string;
  rite: string;          // eyebrow label
  description: string;   // what to do
  accent: QuestAccent;
  target: number;
  metric: (a: RankActivity) => number;
  metricLabel: string;   // e.g. "episodes favorited"
  hint: string;          // CTA label
  hintHref: string;
  reward: { title: string; body: string[] };
}

export const QUESTS: Quest[] = [
  {
    slug: "trial-of-the-witness",
    title: "Trial of the Witness",
    rite: "First Rite",
    description: "Favorite five transmissions. To witness is to mark what moved you.",
    accent: "gold",
    target: 5,
    metric: (a) => a.favorites,
    metricLabel: "transmissions favorited",
    hint: "Browse the archive",
    hintHref: "/episodes",
    reward: {
      title: "The Witness Fragment",
      body: [
        "You have learned the first discipline: attention. The archive does not reward the passive scroll — it rewards the eye that stops, marks, and returns.",
        "Every transmission you favorited is now a thread you can pull. The Oracle reads your marks. The patterns you noticed were not random; they were the archive recognizing itself in you.",
        "Keep the marks. They become your map.",
      ],
    },
  },
  {
    slug: "trial-of-the-voice",
    title: "Trial of the Voice",
    rite: "Second Rite",
    description: "React ten times — to episodes or quotes. The cult speaks back to what speaks to it.",
    accent: "cyan",
    target: 10,
    metric: (a) => a.reactions + a.quoteReactions,
    metricLabel: "reactions cast",
    hint: "Find a moment worth marking",
    hintHref: "/quotes",
    reward: {
      title: "The Voice Fragment",
      body: [
        "Silence is the default state of the lurker. You broke it. Ten times you told the archive: this mattered, this landed, this is true.",
        "The reaction is the smallest unit of participation — and the most honest. No performance, just the involuntary yes.",
        "The cult is built from these small yeses, stacked. You are now part of the stack.",
      ],
    },
  },
  {
    slug: "trial-of-the-seeker",
    title: "Trial of the Seeker",
    rite: "Third Rite",
    description: "Save three signals. The seeker doesn't wait for the pattern — they hunt it.",
    accent: "violet",
    target: 3,
    metric: (a) => a.savedTopics,
    metricLabel: "signals saved",
    hint: "Explore the signals",
    hintHref: "/topics",
    reward: {
      title: "The Seeker Fragment",
      body: [
        "Most see a livestream and remember a moment. You saw a livestream and traced a thread across hundreds of them.",
        "A signal is a recurring frequency in the noise — a theme the cult cannot stop returning to. By saving three, you've begun building your own lens on the archive.",
        "The seeker's secret: the patterns were always there. You just had to decide to look.",
      ],
    },
  },
  {
    slug: "trial-of-the-scribe",
    title: "Trial of the Scribe",
    rite: "Fourth Rite",
    description: "Propose a signal for investigation. The scribe doesn't just read the codex — they write it.",
    accent: "gold",
    target: 1,
    metric: (a) => a.signalProposals,
    metricLabel: "signals proposed",
    hint: "Propose an investigation",
    hintHref: "/signals",
    reward: {
      title: "The Scribe Fragment",
      body: [
        "You crossed the line that most never cross — from consuming the archive to shaping it. Your proposal is now part of the record, a question the cult may chase for years.",
        "The Psychenomicon is not written by one hand. It is written by everyone who dares to ask the archive a real question.",
        "You are no longer a visitor. You are a contributor. The codex remembers its scribes.",
      ],
    },
  },
  {
    slug: "trial-of-the-keeper",
    title: "Trial of the Keeper",
    rite: "Fifth Rite",
    description: "Collect ten cards. The keeper holds fragments of the mythology in their hands.",
    accent: "crimson",
    target: 10,
    metric: (a) => a.ownedCards,
    metricLabel: "cards collected",
    hint: "Open the card archive",
    hintHref: "/cards",
    reward: {
      title: "The Keeper Fragment",
      body: [
        "Every card is a soul, a saga, a moment frozen from the stream. You have gathered ten — a small constellation of the Psycheverse, held in your collection.",
        "The keeper understands that mythology is not abstract. It is made of specific people, specific nights, specific words that should not have been said on a live mic.",
        "Guard your collection. One day it will be the only record that these things happened at all.",
      ],
    },
  },
];

export function getQuestBySlug(slug: string): Quest | undefined {
  return QUESTS.find((q) => q.slug === slug);
}
