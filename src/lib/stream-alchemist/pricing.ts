import type { Clip, LockedClip } from "./types";

export const FREE_CLIP_LIMIT = 3;

// Checkout destinations are Stripe Payment Links (or any URL) set per
// environment. NEXT_PUBLIC_* values are inlined at build time, so each must be
// referenced literally here. Unset links fall back to an email so early
// buyers can still raise their hand while payments are being wired up.
const CONTACT_EMAIL = "psychetarotchannel@gmail.com";

function mailto(subject: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export type PlanId = "free" | "creator" | "lifetime" | "done-for-you";

export interface Plan {
  id: PlanId;
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: string;
  href: string;
  /** True when href is a real checkout link rather than the email fallback. */
  live: boolean;
  badge?: string;
}

const creatorUrl = process.env.NEXT_PUBLIC_STREAM_ALCHEMIST_CREATOR_URL;
const lifetimeUrl = process.env.NEXT_PUBLIC_STREAM_ALCHEMIST_LIFETIME_URL;
const doneForYouUrl = process.env.NEXT_PUBLIC_STREAM_ALCHEMIST_DFY_URL;

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    cadence: "",
    blurb: "See what it finds in one of your streams.",
    features: ["1 transcript", "3 clip ideas with full copy", "CSV and Markdown export"],
    cta: "Try it free",
    href: "/stream-alchemist/app",
    live: true,
  },
  {
    id: "creator",
    name: "Creator",
    price: "$19",
    cadence: "/month",
    blurb: "For hosts who stream every week.",
    features: [
      "20 transcripts a month",
      "All 10 clip ideas per transcript",
      "Titles, hooks, captions, thumbnail text, hashtags",
      "CSV and Markdown export",
      "Cancel anytime",
    ],
    cta: creatorUrl ? "Start Creator" : "Reserve Creator",
    href: creatorUrl || mailto("Stream Alchemist: Creator plan"),
    live: !!creatorUrl,
  },
  {
    id: "lifetime",
    name: "Founding Lifetime",
    price: "$49",
    cadence: "once",
    blurb: "Early-access price for the first users.",
    features: [
      "Everything in Creator",
      "Pay once, no subscription",
      "A direct line to shape what gets built next",
    ],
    cta: lifetimeUrl ? "Get lifetime access" : "Reserve lifetime access",
    href: lifetimeUrl || mailto("Stream Alchemist: Founding Lifetime"),
    live: !!lifetimeUrl,
    badge: "Early access",
  },
];

export const DONE_FOR_YOU: Plan = {
  id: "done-for-you",
  name: "Done-for-you clips",
  price: "$99",
  cadence: "per stream",
  blurb: "Send one stream. Get back edited, captioned vertical clips ready to post.",
  features: [
    "Up to 5 edited vertical clips from one stream",
    "Burned-in captions and a hook on every clip",
    "Titles, descriptions and hashtags written for you",
  ],
  cta: doneForYouUrl ? "Book a done-for-you stream" : "Ask about done-for-you",
  href: doneForYouUrl || mailto("Stream Alchemist: Done-for-you clips"),
  live: !!doneForYouUrl,
};

/** Free tier: full copy for the first clips, only position and score for the rest. */
export function lockClips(clips: Clip[], limit = FREE_CLIP_LIMIT): { clips: Clip[]; locked: LockedClip[] } {
  return {
    clips: clips.slice(0, limit),
    locked: clips.slice(limit).map(({ rank, score, start, end }) => ({ rank, score, start, end })),
  };
}
