/**
 * Special-edition gold-foil collectibles — 12 limited cards with painted art in
 * public/cards/art/{slug}.webp. Seeded by scripts/cards/seed-special-editions.ts.
 * obtainMethod "secret" keeps them out of random packs.
 */
import type { CardType, Rarity } from "@/generated/prisma/client";

export interface SpecialEdition {
  slug: string;
  title: string;
  subtitle: string;
  flavourText: string;
  cardType: CardType;
  rarity: Rarity;
  abilities: string[];
}

export const SPECIAL_EDITION_MAX_SUPPLY = 100;

export const SPECIAL_EDITIONS: SpecialEdition[] = [
  { slug: "se-01-nyx-high-priestess", title: "Nyx", subtitle: "The High Priestess",
    cardType: "ORACLE", rarity: "FORBIDDEN", abilities: ["Night Sight", "Veil of Stars"],
    flavourText: "She sits between the pillars and holds the moon like a lamp. Ask her nothing you are not ready to hear answered." },
  { slug: "se-02-shadow-oracle", title: "The Shadow Oracle", subtitle: "Mirror of the Unsaid",
    cardType: "ORACLE", rarity: "MYTHIC", abilities: ["Shadow Read", "Obsidian Mirror"],
    flavourText: "The mirror is black so you can see the one star you keep hidden." },
  { slug: "se-03-lilith-in-scorpio", title: "Lilith in Scorpio", subtitle: "The Unbowed",
    cardType: "ENTITY", rarity: "MYTHIC", abilities: ["Black Moon", "Sting of Truth"],
    flavourText: "She was told to kneel. She grew wings instead." },
  { slug: "se-04-archive-daemon", title: "Archive Daemon", subtitle: "Special Edition",
    cardType: "ENTITY", rarity: "MYTHIC", abilities: ["Archive Guard", "Hundred Eyes"],
    flavourText: "Every record has a guardian. This one never sleeps and never forgets who asked." },
  { slug: "se-05-moth-at-the-gate", title: "The Moth at the Gate", subtitle: "Drawn to the Light",
    cardType: "SIGNAL", rarity: "MYTHIC", abilities: ["Flame Seek", "Threshold"],
    flavourText: "The gate was always open a crack. The moth is the part of you that noticed." },
  { slug: "se-06-oracle-mask", title: "The Oracle Mask", subtitle: "Face of the Trance",
    cardType: "RELIC", rarity: "MYTHIC", abilities: ["Third Eye", "Borrowed Voice"],
    flavourText: "Put it on and the eyes close. Something else does the seeing." },
  { slug: "se-07-cult-of-two", title: "Cult of Two", subtitle: "The Closed Circle",
    cardType: "LORE", rarity: "MYTHIC", abilities: ["Shared Flame", "Mirror Bond"],
    flavourText: "The smallest cult there is, and the hardest to leave." },
  { slug: "se-08-seven-pillars", title: "The Seven Pillars", subtitle: "Temple of the Codex",
    cardType: "LORE", rarity: "MYTHIC", abilities: ["Curiosity", "Discernment"],
    flavourText: "Curiosity, compassion, integrity, humility, wonder, discernment, transformation. Each one stands against its counterfeit." },
  { slug: "se-09-signal-tower", title: "The Signal Tower", subtitle: "Broadcast in the Dark",
    cardType: "SIGNAL", rarity: "MYTHIC", abilities: ["Wide Broadcast", "Beacon"],
    flavourText: "It sends the same message every night. The ones who need it always find the frequency." },
  { slug: "se-10-codex-seal", title: "The Codex Seal", subtitle: "Mark of the Vault",
    cardType: "RELIC", rarity: "MYTHIC", abilities: ["Heptagram", "Keyhole"],
    flavourText: "A heptagram for the seven pillars, a keyhole for the vault. The mark that goes on everything else." },
  { slug: "se-11-forbidden-transmission", title: "Forbidden Transmission", subtitle: "Do Not Tune In",
    cardType: "TRANSMISSION", rarity: "FORBIDDEN", abilities: ["Static Serpent", "Sealed Door"],
    flavourText: "The receiver was unplugged years ago. It is still talking." },
  { slug: "se-12-keeper-of-the-codex", title: "Keeper of the Codex", subtitle: "Who Shapes the Myth",
    cardType: "CIPHER", rarity: "FORBIDDEN", abilities: ["Living Page", "Master Key"],
    flavourText: "Keeper of the codex. You shape the mythology you study." },
];
