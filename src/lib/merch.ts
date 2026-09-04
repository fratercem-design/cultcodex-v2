/**
 * The merchandise line, as static data.
 *
 * Checkout lives on Fourthwall — this file only describes what exists and where
 * each piece links to, so nothing here needs a database or a migration.
 *
 * Before launch, two things must be set for real:
 *   1. FOURTHWALL_BASE and every `slug` below, once the shop exists.
 *   2. Every `price`. These are proposals and have not been signed off, which is
 *      why the page renders a draft notice while PRICING_APPROVED is false.
 */

export const FOURTHWALL_BASE = "https://cultofpsyche.fourthwall.com/products";

/** Flip to true once prices are final; hides the draft notice on /shop. */
export const PRICING_APPROVED = false;

export type House = "signal" | "shadow" | "archive";

export interface MerchItem {
  slug: string;
  name: string;
  house: House;
  art: string;
  product: string;
  blurb: string;
  price: number;
  colourways: string[];
}

export const HOUSES: Record<House, { title: string; handle: string; href: string; blurb: string }> = {
  signal: {
    title: "House of Signal",
    handle: "@CultofPsyche",
    href: "https://www.youtube.com/@cultofpsyche",
    blurb: "The lantern side. Bone and ember on void — legible from across a room.",
  },
  shadow: {
    title: "House of Shadow",
    handle: "@PsychesNightmares",
    href: "https://www.youtube.com/@psychesnightmares",
    blurb: "Bruise and phosphor, deliberately out of register. These read wrong on purpose.",
  },
  archive: {
    title: "House of Archive",
    handle: "cultcodex.me",
    href: "/",
    blurb: "The terminal surfaces. Monospace, phosphor, gold — the merch that argues the receipts exist.",
  },
};

export const HOUSE_ORDER: House[] = ["signal", "shadow", "archive"];

export const MERCH: MerchItem[] = [
  {
    slug: "moth-at-the-gate-tee",
    name: "The Moth at the Gate",
    house: "signal",
    art: "/merch/01-psyche-sigil.png",
    product: "Heavyweight tee",
    blurb: "Psyche is the soul and the moth both. She is passing through the gate, not standing at it.",
    price: 34,
    colourways: ["Void black", "Oxblood", "Bone"],
  },
  {
    slug: "you-are-not-shadow-tee",
    name: "You Are Not Shadow",
    house: "signal",
    art: "/merch/02-not-shadow.png",
    product: "Tee, full-body print",
    blurb: "The epigraph of the Psychenomicon, set so the cast shadow runs down the wearer.",
    price: 34,
    colourways: ["Void black", "Bone"],
  },
  {
    slug: "no-followers-cap",
    name: "No Followers",
    house: "signal",
    art: "/merch/03-fellow-travelers.png",
    product: "Embroidered six-panel cap",
    blurb: "The ethical spine of the whole house, small enough to wear without having to explain it.",
    price: 38,
    colourways: ["Void black", "Bone", "Oxblood"],
  },
  {
    slug: "seven-pillars-hoodie",
    name: "The Seven Pillars",
    house: "signal",
    art: "/merch/04-seven-pillars.png",
    product: "Heavyweight hoodie",
    blurb: "Curiosity, compassion, integrity, humility, wonder, discernment, transformation — each with its counterfeit implied.",
    price: 78,
    colourways: ["Void black", "Bone"],
  },
  {
    slug: "signal-shadow-sovereignty-hoodie",
    name: "Signal / Shadow / Sovereignty",
    house: "signal",
    art: "/merch/10-signal-shadow-sovereignty.png",
    product: "Hoodie, back spine print",
    blurb: "The three-part doctrine running the full length of the back. The prestige piece of the line.",
    price: 78,
    colourways: ["Void black", "Oxblood"],
  },
  {
    slug: "oracle-mask-tee",
    name: "The Oracle Mask",
    house: "shadow",
    art: "/merch/05-oracle-mask.png",
    product: "Oversized tee",
    blurb: "Sewn mouth, sealed third eye, phosphor tears. The halves have slipped out of register — that misprint is the design.",
    price: 36,
    colourways: ["Void black"],
  },
  {
    slug: "looks-back-tee",
    name: "Looks Back",
    house: "shadow",
    art: "/merch/06-looks-back.png",
    product: "Tee",
    blurb: "A door left ajar, with something on the other side that has already noticed you.",
    price: 34,
    colourways: ["Void black", "Bone"],
  },
  {
    slug: "cult-of-two-crewneck",
    name: "Cult of Two",
    house: "shadow",
    art: "/merch/07-cult-of-two.png",
    product: "Crewneck sweatshirt",
    blurb: "Both channels as one eclipse. Where the discs overlap, an eye. The piece that explains why there are two.",
    price: 62,
    colourways: ["Void black", "Bone", "Oxblood"],
  },
  {
    slug: "select-from-truth-desk-mat",
    name: "SELECT * FROM truth",
    house: "archive",
    art: "/merch/08-terminal.png",
    product: "Desk mat, 36 × 18 in",
    blurb: "A real query against a real archive. The figure on it is the live segment count.",
    price: 42,
    colourways: ["Void black"],
  },
  {
    slug: "codex-seal-pin",
    name: "The Codex Seal",
    house: "archive",
    art: "/merch/09-codex-seal.png",
    product: "Hard enamel pin, gold plate",
    blurb: "A heptagram for the seven pillars, a keyhole for the vault. The mark that goes on everything else.",
    price: 16,
    colourways: ["Gold on void", "Gold on oxblood"],
  },
];

export interface Edition {
  name: string;
  run: string;
  blurb: string;
}

/** The pieces print-on-demand cannot make. Enquiry only — no cart. */
export const EDITIONS: Edition[] = [
  {
    name: "The Receipt",
    run: "No two alike",
    blurb:
      "One genuine transcript segment from the archive — episode, timecode, the line verbatim — printed on cotton rag and hand-numbered. Every buyer gets a different segment, because every segment is different.",
  },
  {
    name: "The Sealed Page",
    run: "Edition of 77",
    blurb:
      "A single page of the Psychenomicon on parchment, rolled, and closed with the Codex Seal struck in oxblood wax. Numbered on the reverse in ink.",
  },
  {
    name: "Personal Sigil Commission",
    run: "Capped queue",
    blurb:
      "A sigil drawn for one person from a short intake, delivered as a signed print plus the digital file, and logged in the codex with a number against their name.",
  },
  {
    name: "Hand-distressed Pillar Patches",
    run: "Batches of 25",
    blurb:
      "The seven-pillars mark screened onto canvas, then aged individually — sanded, tea-stained, singed at one corner. Sold as a set of seven or singly.",
  },
];

export function itemsForHouse(house: House): MerchItem[] {
  return MERCH.filter((m) => m.house === house);
}

export function productUrl(item: MerchItem): string {
  return `${FOURTHWALL_BASE}/${item.slug}`;
}
