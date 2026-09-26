/**
 * Transmission Kit: the productized "live stream → chapters, clips, notes"
 * service sold on /kit. Plans, FAQ, and the sample kit shown on the landing
 * page all live here so copy and prices change in one place.
 *
 * The sample kit is an illustrative example of a typical Sunday collective
 * tarot live. Swap it for a real one (with the creator's permission) once the
 * first pilot kits are delivered.
 */

export type KitPlanId = "single" | "monthly" | "premium";

export interface KitPlan {
  id: KitPlanId;
  name: string;
  priceCents: number;
  interval: "one-time" | "month";
  tagline: string;
  features: string[];
  highlight?: boolean;
}

export const KIT_PLANS: KitPlan[] = [
  {
    id: "single",
    name: "Single Kit",
    priceCents: 2900,
    interval: "one-time",
    tagline: "One live stream, up to 3 hours.",
    features: [
      "YouTube chapters, ready to paste",
      "10 best clip moments with timestamps",
      "SEO description + tags",
      "5 Shorts hooks with the exact line to open on",
      "Delivered by email within 48 hours",
    ],
  },
  {
    id: "monthly",
    name: "Weekly Live",
    priceCents: 7900,
    interval: "month",
    tagline: "4 streams a month. About $20 each.",
    features: [
      "Everything in Single Kit, every week",
      "Recurring-theme notes across your streams",
      "Priority 24-hour turnaround",
      "Cancel anytime from the billing portal",
    ],
    highlight: true,
  },
  {
    id: "premium",
    name: "Done For You",
    priceCents: 24900,
    interval: "month",
    tagline: "8 streams a month plus edited Shorts.",
    features: [
      "Everything in Weekly Live, for 8 streams",
      "5 vertical Shorts edited and captioned each month",
      "3 title + thumbnail-text options per stream",
      "A monthly call on what to clip more of",
    ],
  },
];

export function formatPlanPrice(plan: KitPlan): string {
  const dollars = `$${plan.priceCents / 100}`;
  return plan.interval === "month" ? `${dollars}/mo` : dollars;
}

export const KIT_FAQ: { q: string; a: string }[] = [
  {
    q: "What do I send you?",
    a: "A link to the replay. YouTube, Twitch, Rumble, or TikTok Live replays all work. Unlisted YouTube links are fine.",
  },
  {
    q: "How fast do I get it?",
    a: "Within 48 hours of payment for a Single Kit, 24 hours on the monthly plans. You get it as an email you can copy straight from.",
  },
  {
    q: "Is this just AI?",
    a: "AI does the first pass over the transcript. A person who hosts a weekly tarot live reads every kit, fixes the timestamps, and picks the clips. You get something you can paste without checking.",
  },
  {
    q: "Do you need my channel login?",
    a: "No. Nothing gets posted for you. You keep full control of your channel.",
  },
  {
    q: "What if my stream is longer than 3 hours?",
    a: "Send it anyway. Anything over 3 hours counts as two streams on the monthly plans, or we'll email you a quote for a Single Kit before doing any work.",
  },
  {
    q: "What if I don't like it?",
    a: "Reply to the delivery email within 7 days and we'll redo it or refund you. Your choice.",
  },
  {
    q: "Can I cancel the monthly plan?",
    a: "Yes, anytime, from the billing link in your receipt. You keep any kits already paid for that month.",
  },
];

export interface SampleChapter {
  t: string;
  title: string;
}

export interface SampleClip {
  start: string;
  end: string;
  title: string;
  why: string;
}

export interface SampleHook {
  hook: string;
  clipAt: string;
}

export const SAMPLE_KIT = {
  stream: {
    title: "Sunday Collective Reading: Pick a Pile + Live Q&A",
    length: "2h 41m",
    chatMessages: "1,900+",
  },
  chapters: [
    { t: "0:00", title: "Welcome + what's on the table tonight" },
    { t: "4:12", title: "Energy of the week: Three of Swords reversed" },
    { t: "11:48", title: "Pile 1: The Tower as a relief, not a threat" },
    { t: "27:05", title: "Pile 2: Queen of Cups and the friendship question" },
    { t: "41:30", title: "Pile 3: Eight of Pentacles, the slow win" },
    { t: "58:02", title: "Chat pulls: live one-card readings" },
    { t: "1:14:40", title: "Mercury retrograde myths, cleared up" },
    { t: "1:29:15", title: "Why reversals aren't always 'bad'" },
    { t: "1:46:50", title: "Viewer story: the reading that came true" },
    { t: "2:03:22", title: "Rapid-fire yes/no round" },
    { t: "2:24:10", title: "Closing spread for the week ahead" },
  ] satisfies SampleChapter[],
  clips: [
    {
      start: "13:02",
      end: "14:10",
      title: "The Tower isn't punishment",
      why: "Strongest single take of the night. Chat spiked with 'needed this'.",
    },
    {
      start: "29:44",
      end: "30:31",
      title: "'Your friend isn't the problem, the timing is'",
      why: "Quotable line, works with no setup.",
    },
    {
      start: "1:02:18",
      end: "1:03:05",
      title: "Chat pull: Death card, instant laugh",
      why: "Funny, short, and shows the live format.",
    },
    {
      start: "1:16:02",
      end: "1:17:20",
      title: "Mercury retrograde in 60 seconds",
      why: "Evergreen, searchable topic. Good for a Short and a clip.",
    },
    {
      start: "1:31:40",
      end: "1:32:35",
      title: "How to read a reversal",
      why: "Teaching moment beginners search for.",
    },
    {
      start: "1:48:05",
      end: "1:50:12",
      title: "Viewer's reading came true",
      why: "Story arc with a payoff. Best candidate for a long clip.",
    },
  ] satisfies SampleClip[],
  description: `Sunday collective tarot reading: pick a pile, then live one-card pulls from chat.

This week: the Three of Swords reversed as the energy of the week, why the Tower can be a relief, a Queen of Cups friendship message, and the slow win of the Eight of Pentacles. Plus Mercury retrograde myths, how to read reversals, and a viewer story about a reading that came true.

Chapters are in the timeline below. Pick a pile before you skip ahead.

#tarot #collectivereading #pickapile #tarotreading #mercuryretrograde`,
  hooks: [
    { hook: "The Tower card is not coming to punish you.", clipAt: "13:02" },
    { hook: "If you pulled Queen of Cups this week, read this before you text them.", clipAt: "29:44" },
    { hook: "Someone in chat asked for a sign. They got the Death card.", clipAt: "1:02:18" },
    { hook: "Mercury retrograde doesn't do what you think it does.", clipAt: "1:16:02" },
    { hook: "A viewer told us how this reading came true 3 weeks later.", clipAt: "1:48:05" },
  ] satisfies SampleHook[],
};
