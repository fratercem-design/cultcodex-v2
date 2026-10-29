/**
 * Special-edition gold-foil collectibles — 12 limited cards with painted art in
 * public/cards/art/{slug}.webp, a prismatic foil variant at {slug}-foil.webp and a
 * 5s loop at public/cards/anim/{slug}.mp4. Seeded by scripts/cards/seed-special-editions.ts.
 * obtainMethod "secret" keeps them out of random packs.
 */
import type { CardType, Rarity } from "@/generated/prisma/client";
import type { Divination } from "./card-divination";

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

export const CARD_BACKS = {
  tarot: "/cards/backs/tarot.webp",
  specialEdition: "/cards/backs/special-edition.webp",
} as const;

export const specialEditionFoilUrl = (slug: string) => `/cards/art/${slug}-foil.webp`;
export const specialEditionAnimationUrl = (slug: string) => `/cards/anim/${slug}.mp4`;

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

const SPECIAL_EDITION_SLUGS = new Set(SPECIAL_EDITIONS.map((s) => s.slug));
export const isSpecialEdition = (slug: string) => SPECIAL_EDITION_SLUGS.has(slug);

/**
 * Draw weight in readings. Regular cards sit at 50-100, so the twelve together
 * come up in well under 1% of drawn cards: as rare in a reading as in the vault.
 */
export const SPECIAL_EDITION_DIVINATION_STRENGTH = 5;

/** Hand-authored divinatory meanings, written onto each card by the seed script. */
export const SPECIAL_EDITION_DIVINATION: Record<string, Divination> = {
  "se-01-nyx-high-priestess": {
    element: "Water", planet: "Moon", archetype: "The High Priestess", shadowAspect: "Asking questions you are not ready to have answered",
    upright: "You already know more than you have admitted. Sit between the pillars and let the moon do the work: what you need will show itself once you stop pushing for it.",
    reversed: "You keep asking and then refusing the answer. The knowing is there, but you have covered it with noise because hearing it would mean changing something.",
    advice: "Ask one question, then stay quiet long enough to hear the reply.",
    oraclePrompt: "Which answer have you already received and decided not to hear?",
    keywords: ["intuition", "stillness", "night sight", "the veil"],
  },
  "se-02-shadow-oracle": {
    element: "Aether", planet: "Pluto", archetype: "The Shadow Oracle", shadowAspect: "Hiding your brightest part as if it were your worst",
    upright: "The black mirror shows the one star you keep hidden. Something you file under shame or secrecy is the source of your clearest sight right now.",
    reversed: "You are polishing the mirror so nobody can see into it, yourself included. The thing you will not say is starting to say itself in other ways.",
    advice: "Name the hidden star out loud, to one person or on one page.",
    oraclePrompt: "What part of you do you keep in the dark because it shines too much?",
    keywords: ["shadow work", "the unsaid", "black mirror", "hidden light"],
  },
  "se-03-lilith-in-scorpio": {
    element: "Water", planet: "Pluto", archetype: "The Unbowed", shadowAspect: "Fighting every room instead of leaving the wrong one",
    upright: "You were told to kneel and you grew wings instead. Your refusal is a power, and this is a moment to use it: say no to what shrinks you, and mean it.",
    reversed: "Defiance has become a reflex. You are stinging people who were not the threat, and the fight is keeping you in a place you could simply fly out of.",
    advice: "Choose which refusal matters most, and let the rest go.",
    oraclePrompt: "Where are you still kneeling out of habit, and what would it take to stand up?",
    keywords: ["sovereignty", "refusal", "black moon", "truth"],
  },
  "se-04-archive-daemon": {
    element: "Earth", planet: "Saturn", archetype: "The Guardian", shadowAspect: "Keeping records as a way to keep score",
    upright: "Nothing is lost. The record holds what happened, and it remembers who asked. Look back through what you have already gathered: the pattern you need is in there.",
    reversed: "You are guarding the past so tightly that nothing new can be written. Old grievances are filed and indexed, and you keep reading them instead of living.",
    advice: "Search the archive for the lesson, then close the drawer.",
    oraclePrompt: "What record from your past are you guarding that would be better retired?",
    keywords: ["memory", "records", "vigilance", "patterns"],
  },
  "se-05-moth-at-the-gate": {
    element: "Fire", planet: "Venus", archetype: "The Seeker", shadowAspect: "Chasing every light, including the ones that burn",
    upright: "The gate was always open a crack, and part of you has noticed. Follow the pull toward the light; you are at a threshold and it is safe to cross.",
    reversed: "You keep circling the lamp. The attraction is real, but this particular flame costs more than it gives, and you already know which one it is.",
    advice: "Step through the gate you have been circling, or fly away from the flame that keeps burning you.",
    oraclePrompt: "Which light are you drawn to, and is it a doorway or a fire?",
    keywords: ["threshold", "attraction", "seeking", "transformation"],
  },
  "se-06-oracle-mask": {
    element: "Aether", planet: "Neptune", archetype: "The Medium", shadowAspect: "Letting the mask speak so you never have to",
    upright: "Put on the mask and let something larger see through you. A role, a practice or a ritual can say what you cannot say as yourself.",
    reversed: "The mask has grown on. You speak in a borrowed voice so often that you are not sure what your own sounds like any more.",
    advice: "Wear the mask on purpose, and take it off afterward.",
    oraclePrompt: "Whose voice are you borrowing, and what would you say in your own?",
    keywords: ["trance", "persona", "third eye", "channeling"],
  },
  "se-07-cult-of-two": {
    element: "Fire", planet: "Venus", archetype: "The Closed Circle", shadowAspect: "Closing the circle so tight no one else can enter",
    upright: "A bond with one other person is the subject here. Two people sharing one flame can build something neither could alone. Tend it.",
    reversed: "The circle of two has closed into a cell. The shared flame is warm, but it is using up the air, and you have stopped seeing anyone outside it.",
    advice: "Keep the flame, and open one window.",
    oraclePrompt: "Which bond in your life is feeding you, and which is quietly enclosing you?",
    keywords: ["devotion", "partnership", "the bond", "enmeshment"],
  },
  "se-08-seven-pillars": {
    element: "Earth", planet: "Sun", archetype: "The Temple", shadowAspect: "Living by the counterfeit of a virtue",
    upright: "Curiosity, compassion, integrity, humility, wonder, discernment, transformation. One of the seven is holding you up right now. Lean on it.",
    reversed: "A pillar has been swapped for its counterfeit: certainty posing as discernment, or performance posing as humility. The temple still stands, but it is leaning.",
    advice: "Pick one pillar and check it honestly against its counterfeit.",
    oraclePrompt: "Which of the seven pillars have you been faking, and which is truly yours?",
    keywords: ["values", "integrity", "structure", "discernment"],
  },
  "se-09-signal-tower": {
    element: "Air", planet: "Mercury", archetype: "The Broadcaster", shadowAspect: "Transmitting without ever checking who is listening",
    upright: "Keep sending the message. The people who need it will find the frequency, even if you never see them arrive.",
    reversed: "You are broadcasting into the dark and calling the silence proof that nobody cares. Change the frequency, or listen for a while.",
    advice: "Send it again, plainly, and trust the reach you cannot see.",
    oraclePrompt: "Who is your message really for, and are you speaking on their frequency?",
    keywords: ["communication", "reach", "beacon", "persistence"],
  },
  "se-10-codex-seal": {
    element: "Earth", planet: "Saturn", archetype: "The Seal", shadowAspect: "Sealing things off so they never have to be faced",
    upright: "The heptagram marks what is finished and true. Something in your life is ready to be sealed: a decision, a commitment, a closed chapter. Press the mark.",
    reversed: "You have sealed a door that still needs opening. The keyhole is there for a reason; what is locked away is asking to be let back in.",
    advice: "Seal what is complete; unlock what you closed too soon.",
    oraclePrompt: "What have you locked away that holds the key you are looking for?",
    keywords: ["commitment", "completion", "the vault", "the key"],
  },
  "se-11-forbidden-transmission": {
    element: "Air", planet: "Uranus", archetype: "The Forbidden Signal", shadowAspect: "Tuning in to what you swore you would never hear again",
    upright: "Something you unplugged is still talking. An old message, habit or voice keeps playing; this is the moment to hear it fully once, then decide.",
    reversed: "You keep retuning to the forbidden frequency for comfort, even knowing what it does to you. The static has become a lullaby.",
    advice: "Listen to the message once, on purpose, then pull the plug for good.",
    oraclePrompt: "Which old transmission are you still receiving after you said you had stopped listening?",
    keywords: ["the unconscious", "old patterns", "static", "taboo"],
  },
  "se-12-keeper-of-the-codex": {
    element: "Aether", planet: "Jupiter", archetype: "The Mythmaker", shadowAspect: "Believing the myth you wrote is the only true one",
    upright: "You shape the mythology you study. The story you tell about your life is being written right now, and the pen is in your hand.",
    reversed: "You have forgotten you are the author. You are reading your own myth as fate, when you could turn the page and write the next chapter differently.",
    advice: "Rewrite one line of the story you tell about yourself.",
    oraclePrompt: "What myth about yourself are you ready to rewrite?",
    keywords: ["authorship", "myth", "the living page", "agency"],
  },
};
