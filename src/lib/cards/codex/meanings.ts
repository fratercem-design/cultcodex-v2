/**
 * Divinatory meanings for the Codex deck, used by the Oracle's readings.
 * Fixed per card so the same card always reads the same way; the Oracle
 * interprets them against the question and the archive.
 *
 * Secret cards are deliberately absent: the deck the Oracle draws from is
 * every card that has a meaning here, so the hidden three never appear in a
 * reading and can't be spoiled by one.
 */
export interface CardMeaning {
  keywords: [string, string, string];
  upright: string;
  reversed: string;
}

export const CARD_MEANINGS: Record<string, CardMeaning> = {
  // ── Pack · STATIC ──
  "s1-dead-air": {
    keywords: ["pause", "incubation", "listening"],
    upright: "A silence that is doing work. Nothing is coming through yet because something is still forming; don't fill the gap just to end the discomfort.",
    reversed: "Silence kept too long. What began as a pause has become avoidance, and the audience has started to leave.",
  },
  "s1-the-antenna": {
    keywords: ["reception", "attention", "patience"],
    upright: "You are better placed to receive than you think. Point yourself at the question and wait; the signal arrives for those who keep listening.",
    reversed: "Tuned to the wrong station. You are hearing what you expected, not what is being sent.",
  },
  "s1-candle-stub": {
    keywords: ["endurance", "small light", "devotion"],
    upright: "Not much is left, and it is enough. A modest, faithful effort sees you through the dark stretch.",
    reversed: "Burning out on habit. You keep tending something that stopped giving light a while ago.",
  },
  "s1-screen-moth": {
    keywords: ["attraction", "compulsion", "restlessness"],
    upright: "You are drawn toward something bright. Ask whether it warms you or only keeps you circling.",
    reversed: "The pull has broken. You can finally see the glow for what it is and fly somewhere else.",
  },
  "s1-salt-circle": {
    keywords: ["boundaries", "protection", "clarity"],
    upright: "Draw the line and keep it. A clear boundary protects both what is inside and what is kept out.",
    reversed: "A wall mistaken for safety. The circle has become a cell; something needs to be let in.",
  },
  "s1-bent-key": {
    keywords: ["near-solutions", "improvisation", "wrong door"],
    upright: "You hold a key that almost fits. It opens something real, only not the door you are standing at.",
    reversed: "Forcing the lock. Stop twisting; the damage is costing more than the door is worth.",
  },
  "s1-last-tram-moon": {
    keywords: ["late chances", "solitude", "transition"],
    upright: "There is still one ride out, even after the schedule says there isn't. Take it quietly.",
    reversed: "Waiting at a stop after the last tram left. Accept that this route is closed and walk.",
  },
  "s1-napkin-eye": {
    keywords: ["noticing", "small omens", "self-awareness"],
    upright: "Pay attention to what you scribble without thinking. The throwaway detail knows more than the plan.",
    reversed: "Watching everything but yourself. The eye is turned outward and missing what is close.",
  },

  // ── Pack · SIGNAL ──
  "s1-number-station": {
    keywords: ["codes", "repetition", "hidden instruction"],
    upright: "A pattern is repeating around you on purpose. Write it down; it is an instruction, not noise.",
    reversed: "Seeing codes in static. Not every repetition is a message, and chasing them all will exhaust you.",
  },
  "s1-the-loop": {
    keywords: ["recurrence", "lessons", "déjà vu"],
    upright: "You have been here before because something was left unlearned. This pass can be the last one.",
    reversed: "Refusing to notice the loop. The same argument, the same ending, and a new name on it each time.",
  },
  "s1-hollow-moon": {
    keywords: ["hidden depths", "reflection", "what lives inside"],
    upright: "Something that looks empty is occupied. Knock gently; the hollow place answers.",
    reversed: "A bright surface covering a vacancy. What you admire may have nothing behind it.",
  },
  "s1-the-listener": {
    keywords: ["devotion", "study", "attunement"],
    upright: "Long listening is about to pay off. Your hours in the archive have trained an ear others lack.",
    reversed: "Consuming without speaking. You know the material by heart and still haven't added your own line.",
  },
  "s1-crow-courier": {
    keywords: ["messages", "gossip", "memory"],
    upright: "News is on its way, carried by someone who remembers everything. Receive it, and remember who sent it.",
    reversed: "Rumour dressed as news. Check the source before you repeat it.",
  },
  "s1-mirror-twin": {
    keywords: ["shadow self", "projection", "doubles"],
    upright: "What irritates you in another is showing you your own reflection, a half-second late.",
    reversed: "Refusing to recognise yourself. The twin has stopped mimicking you and started leading.",
  },
  "s1-ashen-hand": {
    keywords: ["fate", "reading signs", "direction"],
    upright: "The lines already point somewhere. Follow the one you keep glancing at.",
    reversed: "Reading your palm to avoid choosing. The hand is waiting for you to move it.",
  },

  // ── Pack · TRANSMISSION ──
  "s1-broadcast-tower": {
    keywords: ["reach", "voice", "amplification"],
    upright: "Your message can travel further than you think. Broadcast it, and mind what you amplify.",
    reversed: "Transmitting on autopilot. You're loud, and you've lost track of why you started speaking.",
  },
  "s1-serpent-cable": {
    keywords: ["connection", "undercurrents", "hidden influence"],
    upright: "Something unseen connects you to what you want. Follow the line beneath the surface.",
    reversed: "A tangle in the deep. A hidden influence is feeding on the connection; cut what isn't yours.",
  },
  "s1-static-hourglass": {
    keywords: ["timing", "waiting", "reset"],
    upright: "The wait is part of the process. When the sand runs out, turn it once and start clean.",
    reversed: "Buffering forever. You keep resetting to avoid the moment it would have to finish.",
  },
  "s1-rose-chalice": {
    keywords: ["honesty", "intimacy", "offering"],
    upright: "Share the cup. An honest conversation now brings two people closer than any gesture.",
    reversed: "Truth used as a weapon. Confession is not the same as cruelty with good lighting.",
  },
  "s1-comet-omen": {
    keywords: ["rare events", "witness", "fleeting chance"],
    upright: "Something rare is passing. Be present for it; it won't be on the replay.",
    reversed: "Explaining away the sign. You saw it, and you're already telling yourself you didn't.",
  },
  "s1-lotus-engine": {
    keywords: ["gradual growth", "unfolding", "revelation"],
    upright: "Understanding opens one petal at a time. You are further along than it feels.",
    reversed: "Forcing the bloom. Prying it open early tears what would have opened on its own.",
  },

  // ── Pack · ANOMALY ──
  "s1-unlit-door": {
    keywords: ["threshold", "the unknown", "invitation"],
    upright: "A door has appeared that wasn't there before. It won't stay long; decide whether you're walking through.",
    reversed: "Standing at the threshold for so long that the door is fading. Not choosing is also a choice.",
  },
  "s1-many-eyed-choir": {
    keywords: ["collective", "scrutiny", "crowd wisdom"],
    upright: "The crowd sees what you can't. Listen to the consensus, especially the parts that sting.",
    reversed: "Performing for the audience. You've stopped doing the thing and started doing it for them.",
  },
  "s1-skull-radio": {
    keywords: ["ancestors", "the past speaking", "endings"],
    upright: "Something you thought was over still has a message for you. Tune in before you bury it.",
    reversed: "Letting the dead set the agenda. Honour the old voice and stop taking orders from it.",
  },
  "s1-drowned-bell": {
    keywords: ["intuition", "the unconscious", "persistent feeling"],
    upright: "A feeling that won't go away is ringing for a reason. Dive for it.",
    reversed: "Drowning out the bell with noise. The louder you make the day, the clearer it rings at night.",
  },

  // ── Pack · ORACLE and above ──
  "s1-pale-oracle": {
    keywords: ["prophecy", "indirect answers", "the real question"],
    upright: "The answer you get won't match the question you asked, and it will be the right one. Ask again, more honestly.",
    reversed: "Seeking prophecy to avoid responsibility. No oracle can decide this for you.",
  },
  "s1-sun-behind-sun": {
    keywords: ["deeper truth", "illumination", "hidden source"],
    upright: "Behind the obvious explanation there is a brighter, stranger one. Look past the first light.",
    reversed: "Dazzled. The truth is right there, and it's too bright to look at directly yet. Go slowly.",
  },
  "s1-the-codex": {
    keywords: ["record", "memory", "knowledge"],
    upright: "Everything you need has already been written down somewhere. Go back to the record.",
    reversed: "Drowning in the archive. Knowing everything that was said is no substitute for saying something.",
  },
  "s1-psyche-ascendant": {
    keywords: ["transformation", "the soul", "rebirth"],
    upright: "The mess you are in is a cocoon. Something with wings is finishing inside it.",
    reversed: "Tearing the cocoon open early. The change is real; the timing isn't yours to rush.",
  },
  "s1-sky-eater": {
    keywords: ["upheaval", "total change", "overwrite"],
    upright: "The frame everything sat inside is dissolving. Don't cling to the old sky; watch what renders next.",
    reversed: "Catastrophising. The sky is fine; one bad signal has eaten your perspective, not the world.",
  },

  // ── Initiation ──
  "s1-initiates-eye": {
    keywords: ["beginnings", "initiation", "first sight"],
    upright: "You are at the start of something, seeing it clearly for the first time. Remember this view.",
    reversed: "Mistaking the first step for the whole path. The initiation is the start, not the arrival.",
  },

  // ── Trials ──
  "s1-kept-flame": {
    keywords: ["loyalty", "care", "what you cherish"],
    upright: "Tend what you love. Small, steady attention keeps the flame alive.",
    reversed: "Guarding a flame that has gone out. Let yourself grieve it and light another.",
  },
  "s1-reliquary": {
    keywords: ["treasures", "memory", "reverence"],
    upright: "What you've kept tells you who you are. Look through the box.",
    reversed: "Worshipping relics. Nostalgia is holding the door shut on something new.",
  },
  "s1-first-word": {
    keywords: ["speaking up", "courage", "participation"],
    upright: "Say it. The first word is the hardest, and the room is kinder than you fear.",
    reversed: "Rehearsing forever. The perfect first line doesn't exist; the moment to speak does.",
  },
  "s1-scribes-jar": {
    keywords: ["wisdom", "collecting", "words that last"],
    upright: "Someone already said what you need to hear. Find the saying and keep it close.",
    reversed: "Quoting others instead of thinking. Your jar is full of voices and none of them is yours.",
  },
  "s1-pulse": {
    keywords: ["feeling", "response", "aliveness"],
    upright: "Your gut reaction is information. Trust the jolt.",
    reversed: "Numbness. You've stopped reacting to protect yourself, and it's costing you joy too.",
  },
  "s1-seven-suns": {
    keywords: ["consistency", "discipline", "momentum"],
    upright: "Show up again tomorrow. Consistency, not intensity, is what changes things.",
    reversed: "Breaking the chain out of fear of breaking it. One missed day isn't the end; quitting is.",
  },
  "s1-the-unbroken": {
    keywords: ["completion", "cycles", "endurance"],
    upright: "A cycle is about to close. Keep going; the end connects back to the beginning.",
    reversed: "Endurance turned into self-punishment. Finishing isn't worth it if you devour yourself doing it.",
  },
  "s1-the-querent": {
    keywords: ["seeking", "the right question", "openness"],
    upright: "Your question is changing as you ask it. Follow the new shape.",
    reversed: "Asking until you get the answer you wanted. The first reading was the true one.",
  },
  "s1-marginalia": {
    keywords: ["commentary", "personal meaning", "annotation"],
    upright: "Your notes in the margin matter as much as the text. Add your perspective.",
    reversed: "Living in the margins. Commentary is safe; at some point you have to write the main text.",
  },
  "s1-salon-candle": {
    keywords: ["community", "conversation", "gathering"],
    upright: "Bring this to other people. The answer comes out in conversation, not alone.",
    reversed: "A crowd with no warmth. You're surrounded and still unheard; find the smaller room.",
  },
  "s1-cartographer": {
    keywords: ["orientation", "planning", "territory"],
    upright: "Map what you know before you go further. The shape of the terrain is the strategy.",
    reversed: "Mistaking the map for the territory. Your plan is tidy; the ground isn't.",
  },
  "s1-seekers-lens": {
    keywords: ["focus", "investigation", "persistence"],
    upright: "Narrow your search. The thing you want is findable if you stop looking everywhere at once.",
    reversed: "Searching as a way of not finding. You already know; the hunt is a hiding place.",
  },
  "s1-torn-foil": {
    keywords: ["surprise", "risk", "excitement"],
    upright: "Open it. The thrill is in not knowing, and this one is worth the tear.",
    reversed: "Chasing the rip. The high of opening is replacing the pleasure of having.",
  },
  "s1-the-archivist": {
    keywords: ["stewardship", "roots", "accumulated knowledge"],
    upright: "Your patience is becoming expertise. What you keep, others will come to rely on.",
    reversed: "Hoarding. Knowledge kept under lock teaches no one, including you.",
  },
  "s1-inner-circle": {
    keywords: ["belonging", "commitment", "trust"],
    upright: "You belong closer in than you are standing. Commit and the circle opens.",
    reversed: "Exclusivity as armour. The circle has become a way of keeping people out.",
  },
  "s1-oracles-crown": {
    keywords: ["authority", "responsibility", "sovereignty"],
    upright: "Take the seat. You have earned the authority you keep waiting for someone to grant you.",
    reversed: "A heavy crown. Leadership taken for status turns into weight; ask who it serves.",
  },
};
