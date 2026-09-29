/**
 * Psyche Recommends — affiliate and referral links, shown on /recommends.
 *
 * To add one, append an entry below. `slug` also becomes a short link,
 * cultcodex.me/go/<slug>, that redirects to `url` — easy to say on stream or
 * pin in chat, and the link can change here without anyone's bookmark breaking.
 *
 * Every entry is treated as a paid relationship: the page carries an affiliate
 * disclosure and the links are marked rel="sponsored".
 */
export interface Recommendation {
  /** Lowercase, hyphenated. Used for /go/<slug>. */
  slug: string;
  name: string;
  category: string;
  /** Why Psyche uses it, in one or two sentences. */
  blurb: string;
  /** The affiliate / referral URL. */
  url: string;
  /** Optional discount or referral code to show beside the button. */
  code?: string;
  /** What the referral gets the viewer, e.g. "First month free". */
  offer?: string;
  /** Optional logo or product image under /public, e.g. "/images/recommends/x.webp". */
  image?: string;
}

export const RECOMMENDATIONS: Recommendation[] = [
  // {
  //   slug: "example",
  //   name: "Example Tarot Deck",
  //   category: "Tarot",
  //   blurb: "The deck on the table most nights.",
  //   url: "https://example.com/?ref=cultofpsyche",
  //   code: "PSYCHE10",
  //   offer: "10% off your first order",
  // },
];

export function getRecommendation(slug: string): Recommendation | undefined {
  return RECOMMENDATIONS.find((r) => r.slug === slug);
}
