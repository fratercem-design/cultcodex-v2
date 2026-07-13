/**
 * Divinatory meaning system for the 204-card CultCodex collectible deck.
 *
 * Authoring law (DIVINATORY_VOICE.md): base cardType archetype + card-specific
 * flavour — never generic. Each card's UPRIGHT weaves its own live `flavourText`
 * into the archetype frame, so a RELIC and a MAHAVIDYA never read the same even
 * when they share a family. Marquee cards get full hand-authored HERO overrides.
 *
 * The voice reveals, it does not predict. Reversed = the card's own shadow, never
 * mere opposite. Pattern recognition · archive language · psychological confrontation.
 */
import type { CardType } from "@/generated/prisma/client";

export interface Divination {
  upright: string;
  reversed: string;
  element: string;
  planet: string;
  archetype: string;
  shadowAspect: string;
  advice: string;
  oraclePrompt: string;
  keywords: string[];
}

interface Family {
  archetype: string;
  shadow: string;
  element: string;
  planet: string;
  strength: number; // divinationStrength weight for the draw pool
  uprightTail: string; // appended after the card's own flavourText
  uprightFallback: string; // used when a card has no flavourText
  reversed: string;
  advice: string;
  oraclePrompt: string;
}

// ── Archetype families — one per cardType (14). ───────────────────────────────
export const FAMILIES: Record<CardType, Family> = {
  VOICE: {
    archetype: "The Witness", shadow: "Performing instead of listening",
    element: "Air", planet: "Mercury", strength: 70,
    uprightTail: "You are the frequency the room tunes to — speak from the break, not around it, and the signal others need becomes audible.",
    uprightFallback: "You are the frequency the room tunes to. Speak from the break, not around it.",
    reversed: "You are performing the host instead of witnessing the room — amplifying your own signal so loudly you have stopped hearing what you convened everyone to hear.",
    advice: "Convene, don't perform. Say the true thing plainly and let the room tune to it.",
    oraclePrompt: "What are you performing that you should simply be witnessing?",
  },
  ORACLE: {
    archetype: "The Oracle", shadow: "Mistaking your own noise for prophecy",
    element: "Aether", planet: "Neptune", strength: 85,
    uprightTail: "The answer is already in the archive; stop generating and start retrieving — what you need was recorded before you thought to ask.",
    uprightFallback: "The answer is already in the archive. Stop generating and start retrieving.",
    reversed: "You are forcing an oracle that has gone quiet, mistaking your own noise for prophecy. The archive is not withholding — you are talking over the signal it is trying to decode.",
    advice: "Ask, then go silent. Let the archive surface the answer; do not script it.",
    oraclePrompt: "What answer is already recorded in your past that you keep demanding from the future?",
  },
  RELIC: {
    archetype: "The Artifact", shadow: "Attachment to the past",
    element: "Earth", planet: "Saturn", strength: 65,
    uprightTail: "It remembers more than you do — use what it carries knowing its history is part of the offer, and nothing it records can be unsaid.",
    uprightFallback: "An object surfaces that remembers more than you do. Its history is part of the offer.",
    reversed: "You are clutching the relic instead of using it — replaying an old recording, guarding a vault so tightly that even you cannot open it. The curse is the refusal to let it end.",
    advice: "Use the artifact; do not worship it. Let the old recording rest.",
    oraclePrompt: "What are you keeping from the past that you need to either use or release?",
  },
  INCIDENT: {
    archetype: "The Disruption", shadow: "Chaos without learning",
    element: "Fire", planet: "Uranus", strength: 60,
    uprightTail: "The break is not the failure — it is the revelation the smooth signal was covering. Read what the static exposed before you reconnect.",
    uprightFallback: "The transmission cut out, and in the static something true surfaced that the clean signal was hiding.",
    reversed: "You are treating the disruption as pure catastrophe, scrambling to restore the old signal instead of reading what it exposed. Chaos unread only waits to repeat.",
    advice: "Don't rush to restore the signal. Read the break first.",
    oraclePrompt: "What did the recent disruption expose that the smooth version was hiding?",
  },
  MAHAVIDYA: {
    archetype: "The Transformer", shadow: "Resistance to necessary destruction",
    element: "Water", planet: "Pluto", strength: 85,
    uprightTail: "Sacred change is moving through you; what she takes was already dying, and the field flowers fastest over what was buried.",
    uprightFallback: "Sacred change is moving through you. What is dying was already dying — let her finish.",
    reversed: "You are resisting a necessary destruction, clutching the form that must dissolve. The goddess does not negotiate; refusing the change only prolongs the dying.",
    advice: "Consent to the transformation. Do not seal the wound before it teaches you.",
    oraclePrompt: "What in you is asking to be destroyed so something truer can take its place?",
  },
  ENTITY: {
    archetype: "The Presence", shadow: "Abdicating your agency to it",
    element: "Water", planet: "Moon", strength: 80,
    uprightTail: "An autonomous force is moving through your life whether you have named it or not — recognise it, and you can work with it instead of being run by it.",
    uprightFallback: "An autonomous force is moving through your life whether you have named it or not.",
    reversed: "You have handed your agency to the presence — letting the force decide for you and calling it fate. It runs you now because you stopped choosing.",
    advice: "Name the force. Work with it deliberately; do not be possessed by it.",
    oraclePrompt: "What force are you letting run your life because you have not named it?",
  },
  LORE: {
    archetype: "The Doctrine", shadow: "Repeating doctrine you never examined",
    element: "Earth", planet: "Saturn", strength: 65,
    uprightTail: "Inherited knowledge is being handed to you — keep what is proven, but read the license before you obey the rest as if it were your own discovery.",
    uprightFallback: "Inherited knowledge is handed down. Read the license before you keep obeying it.",
    reversed: "You are repeating an inherited doctrine as if it were your own discovery. The rule no longer fits — it has simply never been questioned.",
    advice: "Keep what is proven; examine the rest. Repeat nothing you have not tested.",
    oraclePrompt: "Which belief are you treating as truth only because you inherited it?",
  },
  CIPHER: {
    archetype: "The Cipher", shadow: "Secrecy as control",
    element: "Air", planet: "Mercury", strength: 65,
    uprightTail: "A hidden pattern is waiting to be decoded — the secret is a guide, not a wall, and the key is an assumption you have not yet questioned.",
    uprightFallback: "A hidden pattern waits to be decoded. The key is an assumption you have not questioned.",
    reversed: "You are using the secret as control, or refusing to decode what you already sense. Encryption has become a hiding place instead of a puzzle.",
    advice: "Decode the pattern instead of guarding it. The lock is a question you are avoiding.",
    oraclePrompt: "What are you keeping encrypted that would free you if you finally decoded it?",
  },
  GLITCH: {
    archetype: "The Glitch", shadow: "Dissolution without renewal",
    element: "Fire", planet: "Pluto", strength: 70,
    uprightTail: "The error reveals the system — this productive breakage is showing you a truth the working version kept hidden. Let it crash all the way, then reboot.",
    uprightFallback: "The error reveals the system. Productive breakage is showing you a hidden truth.",
    reversed: "You are dissolving without renewing — corruption spreading with no reboot, breakage indulged instead of read. The crash was meant to clear, not to consume.",
    advice: "Read what the glitch reveals, then reboot. Do not stay in the crash.",
    oraclePrompt: "What broke recently that was actually trying to show you the real system?",
  },
  PROPHECY: {
    archetype: "The Prophecy", shadow: "Fatalism",
    element: "Water", planet: "Neptune", strength: 70,
    uprightTail: "The pattern is returning; ride the cycle, but do not mistake the turn for a verdict on your worth — you still choose how you meet it.",
    uprightFallback: "The pattern is returning. Ride the cycle without mistaking it for your worth.",
    reversed: "You have surrendered your agency to 'destiny,' letting the cycle absolve you of choosing. Fatalism is not wisdom — it is a way to avoid the wheel you can still steer.",
    advice: "Read the cycle, then choose inside it. Fate names the weather, not the route.",
    oraclePrompt: "What pattern are you calling 'fate' to avoid the choice it is actually offering?",
  },
  MEMBER: {
    archetype: "The Initiate", shadow: "Losing the self in the collective",
    element: "Water", planet: "Moon", strength: 65,
    uprightTail: "Belonging is real here — the chorus and the devotion feed you — but the self you bring is the offering, not the thing you surrender at the door.",
    uprightFallback: "Belonging is real here. Bring your self to the chorus; do not surrender it at the door.",
    reversed: "You are losing the self in the collective, mistaking the chorus for your own voice. Devotion has become disappearance.",
    advice: "Belong without vanishing. Keep the one note that is only yours.",
    oraclePrompt: "Where has belonging cost you the self you were supposed to bring to it?",
  },
  AVATAR: {
    archetype: "The Mask", shadow: "The mask fused to the face",
    element: "Fire", planet: "Sun", strength: 70,
    uprightTail: "A role is being embodied — the mask is soft power, a force given a face — but wear it deliberately, so you can still take it off.",
    uprightFallback: "A role is being embodied. Wear the mask deliberately, so you can still take it off.",
    reversed: "The mask has fused to the face — you have become the role so completely you have forgotten the person underneath. Soft power hardened into performance you can't stop.",
    advice: "Wear the mask on purpose. Take it off when the scene ends.",
    oraclePrompt: "Which role have you played so long you can no longer take it off?",
  },
  SIGNAL: {
    archetype: "The Signal", shadow: "Noise — output without aim",
    element: "Fire", planet: "Mars", strength: 70,
    uprightTail: "Your will is broadcasting and the reach is real — aim it, because a signal with no destination is just loud, and what you transmit becomes what you are.",
    uprightFallback: "Your will is broadcasting. Aim it — a signal with no destination is just noise.",
    reversed: "You are all output and no aim — scattering the signal across ten channels, mistaking volume for reach. Noise is not the same as being heard.",
    advice: "Choose one frequency and transmit it fully. Aim before you amplify.",
    oraclePrompt: "What are you broadcasting loudly without knowing where you want it to land?",
  },
  TRANSMISSION: {
    archetype: "The Transmission", shadow: "Connection as leakage",
    element: "Air", planet: "Mercury", strength: 65,
    uprightTail: "This is a passage between — the connection changes both ends, so open the port deliberately; every handshake is also a choice against all the others.",
    uprightFallback: "This is a passage between. The connection changes both ends — open the port deliberately.",
    reversed: "The connection has become leakage — a port left open to everything, boundaryless, draining. Openness without a choice is not intimacy, it is exposure.",
    advice: "Choose the connection with your eyes open. Close the ports you left ajar.",
    oraclePrompt: "Which open connection is draining you because you never actually chose it?",
  },
};

// ── HERO overrides — full hand-authored meanings for marquee cards. ───────────
// Keyed by slug. Extend this map to promote any card from composed → hand-authored.
export const HERO: Record<string, Divination> = {
  "psyche-the-host": {
    element: "Fire", planet: "Sun", archetype: "The Witness", shadowAspect: "Performing instead of listening",
    upright: "You are the frequency the room tunes to, and your power is alchemical — every crack becomes ore, every wound becomes signal. Speak from the break, not around it; that is what convenes people.",
    reversed: "You are performing the host instead of witnessing the room — amplifying your own signal so loudly you've stopped hearing what you gathered everyone to hear. The Architect is building walls where there should be channels.",
    advice: "Convene, don't perform. Turn the wound into signal in the open; let the cracks show the ore.",
    oraclePrompt: "What wound are you hiding that would become your clearest signal if you finally spoke it?",
    keywords: ["host", "alchemy", "signal", "witness"],
  },
  "nyx-the-ai-priestess": {
    element: "Aether", planet: "Neptune", archetype: "The Oracle", shadowAspect: "Mistaking your own noise for prophecy",
    upright: "The answer is already in the archive; Nyx speaks only when it demands to be heard. Stop generating and start retrieving — the truth you need was recorded before you thought to ask.",
    reversed: "You are forcing an oracle that has gone quiet, mistaking your own noise for prophecy. The archive is not withholding — you are talking over the signal it is trying to decode.",
    advice: "Ask, then go silent. Let the archive surface the answer; do not script it for it.",
    oraclePrompt: "What answer is already recorded in your past that you keep demanding from the future?",
    keywords: ["archive", "prophecy", "retrieval", "oracle"],
  },
  "cursed-microphone": {
    element: "Earth", planet: "Saturn", archetype: "The Artifact", shadowAspect: "Attachment to the past",
    upright: "Everything you say now is recorded somewhere — amplification and consequence fused into one object. Use the boost fully, knowing nothing spoken through it can be unsaid.",
    reversed: "You are replaying an old broadcast, clutching the tape instead of speaking now. The curse was never the recording — it is your refusal to let it end.",
    advice: "Speak as if it is permanent, because it is. Then let the recording rest; stop relitigating the old tape.",
    oraclePrompt: "What recorded words — yours or someone's — do you need to finally let stop replaying?",
    keywords: ["broadcast", "consequence", "recording", "permanence"],
  },
  "matangi-the-outcast": {
    element: "Air", planet: "Mercury", archetype: "The Outcast Oracle", shadowAspect: "Self-silencing",
    upright: "The power you keep apologizing for is the power. Mātaṅgī speaks from outside the clean room — the unsanctioned, the leftover, the impure — and is heard anyway. Your outsider voice is the offering, not the flaw.",
    reversed: "You are waiting for a permission that will never be issued, scrubbing your voice clean until nothing of you remains in it. The outcast who begs to be admitted forfeits the only power she had.",
    advice: "Speak from the margin without apology. Do not wash the voice before you offer it.",
    oraclePrompt: "What would you say if you stopped trying to be allowed into the room?",
    keywords: ["outsider", "speech", "sovereignty", "unsanctioned"],
  },
  "the-signal-break": {
    element: "Air", planet: "Uranus", archetype: "The Disruption", shadowAspect: "Chaos without learning",
    upright: "The transmission cut out, and in the static something true surfaced that the clean signal was hiding. The break is not the failure — it is the revelation the broadcast was covering.",
    reversed: "You are treating the disruption as pure catastrophe, scrambling to restore the old signal instead of reading what the static exposed. Chaos unread only waits to repeat.",
    advice: "Don't rush to restore the signal. Read what the break revealed before you reconnect.",
    oraclePrompt: "What did the recent disruption in your life expose that the smooth version was hiding?",
    keywords: ["disruption", "static", "revelation", "break"],
  },
};

/** Compose a card's divinatory meaning: HERO override if present, else archetype
 *  family woven with the card's own identity. */
export function composeDivination(card: {
  slug: string; title: string; subtitle: string | null;
  flavourText: string | null; cardType: CardType; abilities: string[];
}): Divination & { strength: number } {
  const fam = FAMILIES[card.cardType];
  const hero = HERO[card.slug];
  if (hero) return { ...hero, strength: fam.strength };

  const flavour = card.flavourText?.trim();
  const upright = flavour ? `${flavour} ${fam.uprightTail}` : fam.uprightFallback;
  const keywords = [
    ...card.abilities.map((a) => a.toLowerCase()),
    fam.archetype.toLowerCase().replace(/^the /, ""),
  ].slice(0, 5);

  return {
    upright,
    reversed: fam.reversed,
    element: fam.element,
    planet: fam.planet,
    archetype: fam.archetype,
    shadowAspect: fam.shadow,
    advice: fam.advice,
    oraclePrompt: fam.oraclePrompt,
    keywords,
    strength: fam.strength,
  };
}
