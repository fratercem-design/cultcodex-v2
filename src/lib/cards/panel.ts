/**
 * The Panel — 25 character cards of Cult of Psyche regulars, sold in the Panel
 * Pack and drawable in readings. Seeded by scripts/cards/seed-panel.ts.
 *
 * Each card is the person's on-panel role, written from their /people profile:
 * no likeness, no private details, no drama. Until painted art exists at
 * public/cards/art/{slug}.webp, cards render the procedural `art` scene.
 * `artPrompt` is the brief for that painting (symbolic, never a portrait).
 */
import type { CardType, Rarity } from "@/generated/prisma/client";
import type { Motif, Palette } from "./codex/types";

export interface PanelCard {
  slug: string;
  /** The person's /people/{personSlug} profile. */
  personSlug: string;
  title: string;
  subtitle: string;
  cardType: CardType;
  rarity: Rarity;
  flavourText: string;
  abilities: [string, string];
  art: { motif: Motif; palette: Palette };
  artPrompt: string;
}

export const PANEL_SET = {
  slug: "the-panel",
  name: "The Panel",
  description: "Twenty-five regulars of the Cult of Psyche open panel.",
} as const;

export const PANEL_PACK = {
  slug: "panel-pack",
  name: "The Panel Pack",
  description: "Five cards from the regulars of the open panel. At least one Transmission or better.",
  cost: 150,
  cardCount: 5,
  sortOrder: 3,
  artTheme: "violet",
  guaranteeRarity: "TRANSMISSION" as Rarity,
  // Only the rarities the set has, so a pull never falls back to other cards.
  weights: {
    weightStatic: 0, weightSignal: 48, weightTransmission: 30, weightAnomaly: 14,
    weightOracle: 6, weightLegendary: 2, weightMythic: 0, weightForbidden: 0,
  },
} as const;

export const PANEL: PanelCard[] = [
  // ── Legendary ──
  { slug: "panel-gotti", personSlug: "gotti", title: "Gotti", subtitle: "The Alchemist", cardType: "MEMBER", rarity: "LEGENDARY",
    flavourText: "Every bad week goes into the crucible. What comes out, he calls gold.",
    abilities: ["Transmute", "Loyal to the End"], art: { motif: "flame", palette: "gold" },
    artPrompt: "an alchemist's crucible pouring molten gold over cracked stones, sparks rising" },
  { slug: "panel-tiger-butterfly", personSlug: "tiger-butterfly", title: "Tiger Butterfly", subtitle: "One Year Apart", cardType: "ORACLE", rarity: "LEGENDARY",
    flavourText: "Born a year to the day after the host. Reads The Fool as trusting yourself, and means it.",
    abilities: ["Twin Star", "Capricorn Ground"], art: { motif: "star", palette: "ember" },
    artPrompt: "a butterfly with tiger-striped wings resting on a tarot card, twin stars above" },

  // ── Oracle ──
  { slug: "panel-eldo", personSlug: "eldo", title: "Eldo", subtitle: "The Faceless Mod", cardType: "MEMBER", rarity: "ORACLE",
    flavourText: "No face on camera, no hesitation in chat. He says the uncomfortable thing so the panel doesn't have to.",
    abilities: ["Call-Out", "Mod Hammer"], art: { motif: "mask", palette: "void" },
    artPrompt: "a blank featureless mask floating before a glowing chat window, a small gavel beside it" },
  { slug: "panel-jamie", personSlug: "jamie", title: "Jamie", subtitle: "Keeper of the Chat", cardType: "MEMBER", rarity: "ORACLE",
    flavourText: "Fifty-plus episodes and a mod badge. Knows every regular by their first message.",
    abilities: ["Long Watch", "Capricorn Sun"], art: { motif: "eye", palette: "frost" },
    artPrompt: "a lantern-lit watchtower over a river of glowing chat messages, a mod shield on the door" },
  { slug: "panel-joker", personSlug: "joker", title: "Joker", subtitle: "The Flex-Off Champion", cardType: "AVATAR", rarity: "ORACLE",
    flavourText: "Arm in a sling and still in the flex-off. Brings his dog and the chaos in equal measure.",
    abilities: ["Flex Off", "Good Boy"], art: { motif: "crown", palette: "blood" },
    artPrompt: "a jester's crown on a trophy pedestal, a loyal dog's silhouette at its foot, confetti" },

  // ── Anomaly ──
  { slug: "panel-paige", personSlug: "paige", title: "Paige", subtitle: "The Anchor", cardType: "ORACLE", rarity: "ANOMALY",
    flavourText: "When the panel spins out, she pulls a card and brings it back to centre.",
    abilities: ["Recalibrate", "Good Vibrations"], art: { motif: "ring", palette: "rose" },
    artPrompt: "a ship's anchor wrapped in a glowing ring of tarot cards on calm violet water" },
  { slug: "panel-kell", personSlug: "kell-kelloggs", title: "Kell", subtitle: "The Scouse Sentinel", cardType: "MEMBER", rarity: "ANOMALY",
    flavourText: "Long-time mod from the Liverpool end of the chat. Steady, trusted, never far from the door.",
    abilities: ["Steady Hand", "Scouse Ward"], art: { motif: "key", palette: "sea" },
    artPrompt: "a brass key hanging by a harbour door at night, a Mersey ferry light on the water" },
  { slug: "panel-meezer", personSlug: "meezer", title: "Meezer", subtitle: "That Funny Feeling", cardType: "VOICE", rarity: "ANOMALY",
    flavourText: "Artist, musician, calm in a loud room. He sang on stream and the chat went quiet.",
    abilities: ["Calm Frequency", "Astral Step"], art: { motif: "wave", palette: "violet" },
    artPrompt: "an acoustic guitar floating in a starfield, soft sound waves becoming constellations" },
  { slug: "panel-trixie", personSlug: "trixie", title: "Trixie", subtitle: "The House Cat", cardType: "ENTITY", rarity: "ANOMALY",
    flavourText: "Walks straight across the spread mid-reading. The cards are always better for it.",
    abilities: ["Spread Walker", "Purr Field"], art: { motif: "eyes", palette: "dusk" },
    artPrompt: "a mischievous cat's glowing eyes peeking over a fanned tarot spread on a velvet table" },
  { slug: "panel-instant-karma", personSlug: "instant-karma", title: "Instant Karma", subtitle: "Patron of the Cats", cardType: "MEMBER", rarity: "ANOMALY",
    flavourText: "Twenty dollars at a time, for the cats. What goes around comes back around.",
    abilities: ["Super Chat", "Karmic Return"], art: { motif: "heart", palette: "verdant" },
    artPrompt: "a glowing coin circling back into an open palm, cat paw prints in gold around it" },

  // ── Transmission ──
  { slug: "panel-selene", personSlug: "selene", title: "Selene", subtitle: "The Moon Reader", cardType: "ORACLE", rarity: "TRANSMISSION",
    flavourText: "A working tarot reader. Reads the spread symbol by symbol, cat included.",
    abilities: ["Full Spread", "Lunar Read"], art: { motif: "moon", palette: "abyss" },
    artPrompt: "a crescent moon lighting a Celtic-cross tarot spread on a dark table" },
  { slug: "panel-tara", personSlug: "tara", title: "Tara", subtitle: "Cards and Cats", cardType: "ORACLE", rarity: "TRANSMISSION",
    flavourText: "Holds that every cat is a familiar and every deck needs one.",
    abilities: ["Familiar Bond", "Cat Spread"], art: { motif: "lotus", palette: "rose" },
    artPrompt: "a lotus blooming from a deck of cards, a sleeping cat curled around the stem" },
  { slug: "panel-dr-orion", personSlug: "dr-orion", title: "Dr. Orion", subtitle: "The Folklorist", cardType: "LORE", rarity: "TRANSMISSION",
    flavourText: "Came on to explain what really happened to Chicken Little. The sky was a metaphor.",
    abilities: ["Source Check", "Old Tale"], art: { motif: "book", palette: "dusk" },
    artPrompt: "an open folklore book under the Orion constellation, a tiny acorn falling from the page" },
  { slug: "panel-luna", personSlug: "luna", title: "Luna", subtitle: "The Cat Whisperer", cardType: "LORE", rarity: "TRANSMISSION",
    flavourText: "A cat behaviourist who reads the twitch of a tail like a card.",
    abilities: ["Tail Reading", "Feline Sense"], art: { motif: "spiral", palette: "violet" },
    artPrompt: "a cat's tail curling into a glowing spiral under a full moon" },
  { slug: "panel-ellaria", personSlug: "ellaria", title: "Ellaria", subtitle: "Keeper of Feline Lore", cardType: "LORE", rarity: "TRANSMISSION",
    flavourText: "Knows every cat in every myth, from Bastet down to the one on the desk.",
    abilities: ["Bastet's Line", "Nine Lives"], art: { motif: "pyramid", palette: "ember" },
    artPrompt: "a Bastet statue before a pyramid at dusk, nine small lamps lit at its base" },
  { slug: "panel-milton", personSlug: "milton", title: "Milton", subtitle: "The Steady Hand", cardType: "MEMBER", rarity: "TRANSMISSION",
    flavourText: "The stream was falling apart. He picked up the mod tools and held it together.",
    abilities: ["Emergency Mod", "Hold the Line"], art: { motif: "hourglass", palette: "sea" },
    artPrompt: "a hand steadying a cracked hourglass while sparks of static fly around it" },
  { slug: "panel-chona", personSlug: "chona", title: "Chona", subtitle: "The Greek Oracle", cardType: "ORACLE", rarity: "TRANSMISSION",
    flavourText: "Tunes in from the Philippines for Greek goddess readings. Athena keeps turning up.",
    abilities: ["Goddess Draw", "Far Signal"], art: { motif: "chalice", palette: "abyss" },
    artPrompt: "a Greek temple oracle card glowing over a tropical night sea, an owl on the column" },

  // ── Signal ──
  { slug: "panel-john-clark", personSlug: "john-clark", title: "John Clark", subtitle: "The London Querent", cardType: "VOICE", rarity: "SIGNAL",
    flavourText: "Asks from London, gets the reading, comes back for the next one.",
    abilities: ["Querent", "Night Owl"], art: { motif: "tower", palette: "frost" },
    artPrompt: "a foggy London clock tower at night with a single tarot card glowing in a window" },
  { slug: "panel-jose", personSlug: "jose", title: "Jose", subtitle: "Late-Night Loyal", cardType: "MEMBER", rarity: "SIGNAL",
    flavourText: "A long-time supporter from Mexico, there for every 2 a.m. reading.",
    abilities: ["Late Shift", "Steady Supporter"], art: { motif: "candle", palette: "ember" },
    artPrompt: "a marigold-wreathed candle burning late beside a laptop showing a tarot stream" },
  { slug: "panel-blade", personSlug: "blade", title: "Blade", subtitle: "Friend of the Show", cardType: "MEMBER", rarity: "SIGNAL",
    flavourText: "Comes for the full spread every time, and stays for the panel after.",
    abilities: ["Full Read", "Old Friend"], art: { motif: "comet", palette: "blood" },
    artPrompt: "a silver blade-shaped comet streaking over a table of laid-out tarot cards" },
  { slug: "panel-sask", personSlug: "sask", title: "Sask", subtitle: "South Bay Regular", cardType: "VOICE", rarity: "SIGNAL",
    flavourText: "Logs in from the South Bay and settles into the panel like it's his living room.",
    abilities: ["Regular", "Beach Signal"], art: { motif: "antenna", palette: "sea" },
    artPrompt: "a beach radio antenna at sunset on the Pacific, signal rings over the waves" },
  { slug: "panel-hell-walker", personSlug: "hell-walker", title: "Hell Walker", subtitle: "The Metal Pilgrim", cardType: "AVATAR", rarity: "SIGNAL",
    flavourText: "Met the show at a King Diamond gig. The darker the venue, the better.",
    abilities: ["Heavy Signal", "Pilgrimage"], art: { motif: "skull", palette: "blood" },
    artPrompt: "a candlelit skull wearing a concert wristband on a stage lit in deep red" },
  { slug: "panel-michelle", personSlug: "michelle", title: "Michelle", subtitle: "The Wild Path", cardType: "VOICE", rarity: "SIGNAL",
    flavourText: "Left the well-worn road and found her own practice out among the trees.",
    abilities: ["Own Path", "Rooted"], art: { motif: "tree", palette: "verdant" },
    artPrompt: "a footpath branching off into a moonlit Kentucky forest, fireflies along it" },
  { slug: "panel-rando", personSlug: "rando", title: "Rando", subtitle: "The Original", cardType: "VOICE", rarity: "SIGNAL",
    flavourText: "Plays his own songs, and argues the machine can't write them for you.",
    abilities: ["Live Take", "Human Hand"], art: { motif: "radio", palette: "toxic" },
    artPrompt: "a hand-written song sheet beside a vintage microphone, a robot hand reaching and stopping short" },
  { slug: "panel-taro", personSlug: "taro", title: "Taro", subtitle: "The Live Reader", cardType: "ORACLE", rarity: "SIGNAL",
    flavourText: "Pulls the cards in real time and reads them before the chat catches up.",
    abilities: ["Quick Draw", "Second Sight"], art: { motif: "bell", palette: "dusk" },
    artPrompt: "tarot cards mid-flip in the air above a live-stream red record light" },
];

const BY_SLUG = new Map(PANEL.map((c) => [c.slug, c]));
export const panelCard = (slug: string) => BY_SLUG.get(slug);

/** Card stats, steady per card: each rarity has a band, nudged by the slug. */
export function panelStats(card: Pick<PanelCard, "slug" | "rarity">): [number, number, number] {
  const base: Partial<Record<Rarity, number>> = { SIGNAL: 46, TRANSMISSION: 58, ANOMALY: 68, ORACLE: 77, LEGENDARY: 86 };
  let h = 0;
  for (const ch of card.slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const b = base[card.rarity] ?? 50;
  return [b + (h % 12), b + ((h >>> 4) % 12), b + ((h >>> 8) % 12)];
}
