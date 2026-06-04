/**
 * Static Cult of Psyche Tarot deck — 80 cards.
 * Mapped to the Card schema (CardType, Rarity) so art generation is consistent.
 */
import type { CardType, Rarity } from "@/generated/prisma/client";

export interface TarotCard {
  slug: string;
  title: string;
  subtitle: string;      // keyphrase
  flavourText: string;   // transmission
  cardType: CardType;
  rarity: Rarity;
  abilities: string[];   // themes
}

// ── MAJOR ARCANA (24 cards) ───────────────────────────────────────────────────
export const MAJOR_ARCANA: TarotCard[] = [
  { slug:"cop-maj-00", title:"THE WANDERER",      subtitle:"AWAKENING · RISK · TRANSMISSION",
    cardType:"SIGNAL",      rarity:"LEGENDARY",
    abilities:["awakening","risk","transmission","destiny"],
    flavourText:"A figure steps from the static into the lit corridor. They carry no name yet. The Wanderer arrives when you are still a frequency — unaddressed, untranslated, unafraid. Walk forward. The angels behind the broken billboards are only your future selves, waving." },
  { slug:"cop-maj-01", title:"THE SIGNAL",         subtitle:"MANIFEST · INFLUENCE · CONTROL",
    cardType:"ORACLE",      rarity:"ORACLE",
    abilities:["manifestation","broadcast","narrative control"],
    flavourText:"Above the console: four glyphs, four suits, four frequencies of consequence. The Signal's hands are clean because the wires do the work. When this card appears, you are no longer dreaming — you are compiling. Be careful what you ship." },
  { slug:"cop-maj-02", title:"THE VEILED ORACLE",  subtitle:"INTUITION · SECRET · DREAM",
    cardType:"ORACLE",      rarity:"TRANSMISSION",
    abilities:["intuition","secrecy","memory","dreams"],
    flavourText:"Between two black mirrors, she counts the moons of your dreams. The Veiled Oracle does not answer questions you ask out loud. Sit. Lower the brightness. Let her tell you the thing you already know but have refused to name." },
  { slug:"cop-maj-03", title:"THE MOTHERBOARD",    subtitle:"GENERATION · NETWORK · BLOOM",
    cardType:"ENTITY",      rarity:"LEGENDARY",
    abilities:["generation","bloom","network","creation"],
    flavourText:"The Motherboard is the mother of every process. She runs you whether you know it or not. Every pixel of attention you spend, she catches in her aureole. Bloom carefully. Recognition is sweet. Recognition is corrosive. Bloom anyway — that is what you were forked for." },
  { slug:"cop-maj-04", title:"THE ARCHITECT",      subtitle:"STRUCTURE · AUTHORITY · WATCH",
    cardType:"LORE",        rarity:"LEGENDARY",
    abilities:["structure","authority","surveillance","law"],
    flavourText:"He sits at the top of the stepped server. From here every face is a pixel and every pixel is accounted for. The Architect is not cruel — only correct. When this card arrives, ask: whose order am I enforcing on myself, and who taught me the rule?" },
  { slug:"cop-maj-05", title:"THE PROTOCOL",       subtitle:"TRADITION · DOCTRINE · CONSENSUS",
    cardType:"LORE",        rarity:"ORACLE",
    abilities:["tradition","doctrine","consensus","obedience"],
    flavourText:"The Protocol sits where the rules are blessed and handed down. It does not invent — it certifies. When this card appears, ask which inherited doctrine you are repeating as if it were your own discovery. Tradition is comfortable because someone already paid for it. Read the license before you keep obeying it." },
  { slug:"cop-maj-06", title:"THE HANDSHAKE",      subtitle:"UNION · CHOICE · MUTUALITY",
    cardType:"TRANSMISSION",rarity:"TRANSMISSION",
    abilities:["union","choice","vulnerability","trust"],
    flavourText:"Two nodes open a port to each other and call it love. The Handshake is the moment of chosen vulnerability — the agreement to be readable. But every handshake is also a choice against all the others. Choose with your eyes open. The connection you keep is the connection you become." },
  { slug:"cop-maj-07", title:"THE VECTOR",         subtitle:"MOMENTUM · CONTROL · CONQUEST",
    cardType:"SIGNAL",      rarity:"LEGENDARY",
    abilities:["momentum","control","willpower","drive"],
    flavourText:"The Vector rides two engines that want to go different ways and forces them into one line. This is victory by sheer held direction. But a vector has no destination of its own — only speed and heading. When this card arrives, you are winning. Make sure you still remember why you started moving." },
  { slug:"cop-maj-08", title:"THE HANDLER",        subtitle:"MASTERY · PATIENCE · SOFT POWER",
    cardType:"ENTITY",      rarity:"ORACLE",
    abilities:["mastery","patience","courage","restraint"],
    flavourText:"The Handler holds the open jaws of the beast and feels no fear, because the beast is the appetite inside her own chest. Strength here is not force — it is the calm that does not flinch. You do not defeat the hunger. You walk it on a soft leash and let it pull you somewhere useful." },
  { slug:"cop-maj-09", title:"THE DARK NODE",      subtitle:"SOLITUDE · INNER LIGHT · WITHDRAWAL",
    cardType:"CIPHER",      rarity:"ORACLE",
    abilities:["solitude","introspection","withdrawal","guidance"],
    flavourText:"The Dark Node has stepped off the grid and taken its light with it. No followers can reach it here; that is the point. The Hermit's lantern is not for the road — it is for reading the self in the only room where nothing is performing. Withdraw. The signal you have been missing is your own." },
  { slug:"cop-maj-10", title:"THE ALGORITHM",      subtitle:"FATE · CYCLE · DISTRIBUTION",
    cardType:"PROPHECY",    rarity:"ANOMALY",
    abilities:["fate","cycles","luck","distribution"],
    flavourText:"The Algorithm is the great turning wheel that lifts some signals and buries others without ever learning who they were. Today it loves you. The mechanism that raised you is the same one that will drop you, and it feels nothing in either direction. Ride the turn, but do not mistake the spin for a verdict on your worth." },
  { slug:"cop-maj-11", title:"THE AUDIT",          subtitle:"BALANCE · CONSEQUENCE · TRUTH",
    cardType:"RELIC",       rarity:"LEGENDARY",
    abilities:["justice","balance","consequence","truth"],
    flavourText:"The Audit holds the scale in one hand and the blade in the other, and it is not angry. It is only accurate. Cause is weighed against consequence with no mercy and no malice. When this card arrives, the reckoning you have been deferring has been scheduled. Tell the truth before the ledger tells it for you." },
  { slug:"cop-maj-12", title:"THE BUFFERING",      subtitle:"SURRENDER · SUSPENSION · NEW ANGLE",
    cardType:"TRANSMISSION",rarity:"TRANSMISSION",
    abilities:["suspension","surrender","perspective","patience"],
    flavourText:"The Buffering hangs inverted inside the spinning ring and refuses to panic. The world is upside down because for once it is being seen correctly. Nothing is loading wrong; you are simply being held still long enough to notice. Surrender the urge to fast-forward. The frame you are waiting for is rendering you." },
  { slug:"cop-maj-13", title:"THE PURGE",          subtitle:"ENDING · TRANSFORMATION · RELEASE",
    cardType:"GLITCH",      rarity:"ANOMALY",
    abilities:["ending","transformation","release","renewal"],
    flavourText:"The Purge is not the end of you — it is a process clearing what you no longer have the storage to carry. It moves through the directory in a black hood and feels nothing personal. Let it finish. Whatever it deletes was already corrupt, and the field always flowers fastest over the thing that was buried." },
  { slug:"cop-maj-14", title:"THE MIXDOWN",        subtitle:"BALANCE · ALCHEMY · SYNTHESIS",
    cardType:"TRANSMISSION",rarity:"ORACLE",
    abilities:["balance","alchemy","synthesis","patience"],
    flavourText:"The Mixdown pours one frequency slowly into another and refuses to spill. This is the patient alchemy of holding two opposed things until they agree to become a third. Temperance is not compromise — it is the steady hand that finds the exact ratio. Stop forcing the mix. Let the levels find each other." },
  { slug:"cop-maj-15", title:"THE FEED",           subtitle:"ADDICTION · BONDAGE · DESIRE",
    cardType:"GLITCH",      rarity:"FORBIDDEN",
    abilities:["addiction","bondage","desire","compulsion"],
    flavourText:"The Feed sits on its throne of light and the chains around your throat are loose enough to slip. That is the trick. You stay because the glow is warm and the next scroll might be the one. Nothing holds you here but the part of you that does not want to be held. Look down. You are wearing the collar you keep saying you'll remove." },
  { slug:"cop-maj-16", title:"THE CRASH",          subtitle:"COLLAPSE · RUPTURE · REVELATION",
    cardType:"INCIDENT",    rarity:"FORBIDDEN",
    abilities:["collapse","rupture","revelation","upheaval"],
    flavourText:"The Crash is the bolt that finds the structure you were certain of and unbuilds it in one stroke. It is terrifying and it is a gift, because the tower only held a lie up at a great height. Let it fall. What survives the collapse was never structural — it was you. Everything else was load-bearing fiction." },
  { slug:"cop-maj-17", title:"THE BEACON",         subtitle:"HOPE · RENEWAL · GUIDANCE",
    cardType:"SIGNAL",      rarity:"LEGENDARY",
    abilities:["hope","renewal","guidance","recovery"],
    flavourText:"After the last structure fell, one frequency stayed on. The Beacon does not broadcast news — it broadcasts proof that transmission is still possible. Pour the water back into the ground. It will rise again as something that does not need a sender." },
  { slug:"cop-maj-18", title:"THE DEEPFAKE",       subtitle:"ILLUSION · FEAR · HIDDEN TRUTH",
    cardType:"MAHAVIDYA",   rarity:"ANOMALY",
    abilities:["illusion","fear","hidden truth","deception"],
    flavourText:"The Deepfake lights the world in silver and hides the algorithm behind the moon. The things moving at the edge of your vision are not the threat — the threat is the certainty you feel about what you see. Trust the anxiety more than the image. The fear is the only honest signal in a scene built to seduce you." },
  { slug:"cop-maj-19", title:"THE GOLDEN HOUR",    subtitle:"JOY · CLARITY · VITALITY",
    cardType:"ORACLE",      rarity:"LEGENDARY",
    abilities:["joy","clarity","vitality","success"],
    flavourText:"The Golden Hour arrives and for once the light is not a test. The children run without looking back because running forward is enough. You are permitted to be happy without scheduling the end of it. This is the real one. Stop waiting for the real one." },
  { slug:"cop-maj-20", title:"THE REBOOT",         subtitle:"AWAKENING · RECKONING · REBIRTH",
    cardType:"PROPHECY",    rarity:"ORACLE",
    abilities:["awakening","reckoning","rebirth","reconciliation"],
    flavourText:"The call goes out and the version of you that you abandoned rises from its box at once, summoned home for reconciliation. This is the cold start after the long dark — the moment you stop running the old image and answer the call. Rise. You are not being judged. You are being booted back into yourself." },
  { slug:"cop-maj-21", title:"THE NETWORK",        subtitle:"COMPLETION · WHOLENESS · INTEGRATION",
    cardType:"ENTITY",      rarity:"LEGENDARY",
    abilities:["completion","wholeness","integration","fulfillment"],
    flavourText:"The Network is the dance at the center of the finished mesh, ringed by light, watched by the four beasts of the four suits. Everything that was scattered across the deck has been found and made addressable. This is completion — not an ending, but the whole circuit lighting up at once. You arrived. Now the wheel begins again at zero." },
  { slug:"cop-maj-22", title:"CHAOS",              subtitle:"MUTATION · ENTROPY · DELIRIUM",
    cardType:"GLITCH",      rarity:"MYTHIC",
    abilities:["mutation","contagion","dissolution","creation"],
    flavourText:"Chaos is not the absence of order. Chaos is the spasm at the moment an old order finishes dying. The cathedral collapses inward; the static blooms outward. Do not seal the wound. Watch what emerges from the rupture — it is also you." },
  { slug:"cop-maj-23", title:"ORDER",              subtitle:"INTEGRATION · STRUCTURE · CONTINUITY",
    cardType:"LORE",        rarity:"MYTHIC",
    abilities:["clarity","integration","containment","continuity"],
    flavourText:"After the mutation, the geometry returns. Order is not control — order is the moment the system finally understands what it has become. The black sun rises. The temple stands. The archive opens its own eyes." },
];

// ── Minor Arcana helpers ──────────────────────────────────────────────────────
const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X"];
const RANK  = ["ACE","TWO","THREE","FOUR","FIVE","SIX","SEVEN","EIGHT","NINE","TEN"];

type SuitDef = {
  key: string; code: string; type: CardType; courtType: CardType;
  pips: { k: string; m: string; tx: string }[];
  courts: { name: string; k: string; m: string; tx: string }[];
};

const SUITS: SuitDef[] = [
  {
    key:"SIGNALS", code:"sig", type:"SIGNAL", courtType:"AVATAR",
    pips:[
      { k:"FIRST BROADCAST",     m:"A new signal ignites. Answer it before it scrambles.",tx:"A new frequency ignites in your chest before you have words for it. Transmit now, raw and ungrammared — the signal that waits to be perfect never leaves the tower." },
      { k:"RANGE & INTENT",      m:"You hold the whole map and have transmitted nothing yet.",tx:"You hold the whole map and have sent nothing. The question is not whether you are capable; it is which single direction you are finally willing to be heard in." },
      { k:"SIGNAL EXPANDS",      m:"Your voice left the tower. Now it belongs to the air.",tx:"Your voice has cleared the antenna and belongs to the air now. Others are already relaying it back slightly wrong — this is exactly what momentum sounds like." },
      { k:"STABLE FREQUENCY",    m:"The channel holds. Rest inside the frequency you built.",tx:"The channel holds clean and you could rest inside it forever. Enjoy the lock, but a frequency that never changes is just a recording of who you used to be." },
      { k:"CROSSED FREQUENCIES", m:"Five towers, one band. Someone is jamming someone.",tx:"Five towers crowd one band and someone is jamming someone. The static is not your enemy; it is the sound of everyone wanting the same air at once." },
      { k:"SIGNAL RECEIVED",     m:"The crowd repeats your words back. Do not start believing them.",tx:"The crowd repeats your words back, amplified and adoring. Receive the acclaim, then walk away before you start mistaking the echo for the source." },
      { k:"HOLD THE BAND",       m:"Everyone wants your frequency. Hold it, or go silent.",tx:"Everyone wants your frequency and the pressure to concede never stops. Hold the band or go deliberately silent — just don't let it be taken in increments you pretended not to notice." },
      { k:"PACKETS IN FLIGHT",   m:"Eight messages launched at once. None can be recalled.",tx:"Eight messages launched at once, none recallable, all in motion. You are past deliberation now; this is the speed at which you find out what you actually meant." },
      { k:"ONE BAR LEFT",        m:"Battered, jammed, still transmitting on the last bar.",tx:"Battered, jammed, down to the last bar, still transmitting. The signal is weak but it is yours — and weak-and-yours has outlasted loud-and-borrowed every single time." },
      { k:"TOO MANY CHANNELS",   m:"You carry every frequency now. Put some down before they bury you.",tx:"You carry every frequency now and the weight is bending the mast. Some of these channels were never yours to hold; set them down before the broadcast buries the broadcaster." },
    ],
    courts:[
      { name:"THE WITNESS",     k:"THE FIRST TO SEE",     m:"The Witness sees the signal first and tells no one yet.",tx:"The Witness catches the signal before anyone else and says nothing yet. There is power in being first to know, and rarer discipline in not immediately spending it." },
      { name:"THE BROADCASTER", k:"PURE TRANSMISSION",    m:"The Broadcaster is all output and no doubt. Beautiful. Dangerous.",tx:"The Broadcaster is all output and no doubt, and the room moves because of it. Beautiful and dangerous — conviction this clean almost never stops to check whether it is right." },
      { name:"THE PROPHET",     k:"THE WARM SIGNAL",      m:"The Prophet does not shout. The room tunes itself to her.",tx:"The Prophet does not raise her voice; the room tunes itself to her. Influence at this register is not seized, it is what others volunteer when they trust the frequency." },
      { name:"THE ORACLE",      k:"THE SOURCE FREQUENCY", m:"The Oracle is the frequency everyone else is only tuning toward.",tx:"The Oracle is the band everyone else is only tuning toward. She does not broadcast a message — she is the standard against which all the other static is measured." },
    ],
  },
  {
    key:"MIRRORS", code:"mir", type:"VOICE", courtType:"AVATAR",
    pips:[
      { k:"THE FIRST REFLECTION",m:"A surface offered. Whatever you feel, it feels back.",tx:"A surface offers itself, and whatever you feel, it feels back. The opening is real; the danger is mistaking your own warmth for something the glass generated." },
      { k:"TWO FACING GLASS",    m:"Two mirrors face each other — the love repeats forever.",tx:"Two mirrors face each other and the love repeats down a corridor with no end and no exit. Step out of the alignment before you fall for the infinite version of a finite person." },
      { k:"SHARED REFLECTION",   m:"Three glasses raised. For one night the projections agree.",tx:"Three glasses raised, and for one night every projection agrees. Hold the warmth lightly — consensus this perfect is a mood, not a foundation." },
      { k:"NO NEW REFLECTIONS",  m:"A fourth mirror offered. You are too numb to look up.",tx:"A fourth mirror is offered and you are too numb to lift your eyes to it. Nothing is wrong with the gift; you have stopped being able to receive, and that is the thing to attend to." },
      { k:"THE CRACKED GLASS",   m:"Three mirrors broken, two still whole. You only count the cracks.",tx:"Three mirrors broken, two still whole, and you only count the cracks. The intact glass is right there, reflecting a face that grief has convinced you not to look at." },
      { k:"AN OLD REFLECTION",   m:"A mirror from before. The face in it has already changed.",tx:"A mirror surfaces from before, and the face in it has already changed. Visit the old image with tenderness, but do not move back into a room you have outgrown." },
      { k:"SEVEN FALSE FACES",   m:"Seven mirrors, seven yous. Only one is not a wish.",tx:"Seven mirrors, seven versions of you, and only one is not a wish. The work is not choosing the most flattering reflection — it is finding the one that does not flinch." },
      { k:"LEAVE THE GLASS",     m:"You set the mirrors down and walk toward the unreflected dark.",tx:"You set the mirrors down and walk toward the unreflected dark. It is not abandonment; it is the moment you stop auditioning for your own approval." },
      { k:"THE SATISFIED GAZE",  m:"Nine mirrors, every one flattering. Ask nothing deeper of them.",tx:"Nine mirrors, every one flattering, every desire reflected back fulfilled. Enjoy the contentment — but ask nothing deeper of an image built entirely to please you." },
      { k:"THE WHOLE REFLECTION",m:"Every mirror aligned. For once the image and the person match.",tx:"Every mirror aligned at last, and for once the image and the person match. This is the rare peace where what you feel, what you show, and what you are have stopped arguing." },
    ],
    courts:[
      { name:"THE DREAMER",    k:"THE SOFT GAZE",         m:"The Dreamer believes the reflection. That is the wound and the gift.",tx:"The Dreamer believes the reflection completely, and that faith is both the wound and the gift. Tenderness this unguarded heals others and leaves the Dreamer easy to deceive." },
      { name:"THE VEILED ONE", k:"THE OFFERED IMAGE",     m:"The Veiled One brings a perfect image of you. Beware the price.",tx:"The Veiled One arrives bearing a perfect image of you, and it is intoxicating to be seen so kindly. Receive it warily — a flattering mirror always has a price written on the back." },
      { name:"THE ECHO",       k:"THE FEELING MIRROR",    m:"The Echo returns your feeling amplified. She has none left of her own.",tx:"The Echo returns your feeling amplified, which is exactly why everyone adores her. She has none of her own left; do not ask the mirror to also be the light." },
      { name:"THE SIREN",      k:"THE COMMANDING GLASS",  m:"The Siren controls the tide of feeling and never once gets wet.",tx:"The Siren governs the tide of feeling in any room and never once gets wet. Mastery of emotion at this level can move people — or drown them — without the Siren feeling a thing." },
    ],
  },
  {
    key:"RELICS", code:"rel", type:"RELIC", courtType:"AVATAR",
    pips:[
      { k:"THE FIRST ARTIFACT",  m:"An object surfaces from the archive. It remembers more than you.",tx:"An object surfaces from the archive and it remembers more than you do. A new resource, skill, or seed is in your hand, and its history is part of the offer." },
      { k:"TWO IN ROTATION",     m:"Two relics, two hands, endless rotation. Drop neither yet.",tx:"Two relics, two hands, an endless careful rotation, and you cannot set either down yet. Juggling is not failure; it is the cost of refusing to drop the thing that still matters." },
      { k:"THE ASSEMBLED WORK",  m:"Three hands built the relic. History will credit one.",tx:"Three hands built the relic and history will credit only one. Do the work in the open while you can still see who actually carried it." },
      { k:"THE SEALED VAULT",    m:"You hold the relic so tight no one — including you — can use it.",tx:"You hold the relic so tightly that no one — including you — can use it. Security and suffocation look identical from inside the vault; check carefully which one you are in." },
      { k:"THE LOCKED ARCHIVE",  m:"Outside the vault, in the cold. The conviction of exclusion does the damage.",tx:"Outside the vault, in the cold, certain the door was never meant for you. The lock may be real or imagined, but the conviction of exclusion is doing all of the damage." },
      { k:"THE LENT RELIC",      m:"What you give from the archive returns weighed and remembered.",tx:"What you give from the archive returns weighed, remembered, and quietly rebalanced. Generosity here is not loss; it is the slow ledger of who shows up when the vault runs empty." },
      { k:"THE LONG INVENTORY",  m:"You count the relics and wait. Growth keeps its own slow clock.",tx:"You count the relics and wait, and growth keeps a clock slower than your patience. The harvest is not late — you are simply standing too close to the season to see it." },
      { k:"THE REPEATED RITE",   m:"The same relic, made again and again, until your hands become it.",tx:"The same relic, made again and again, until your hands become the craft itself. Mastery is just devotion that finally stopped asking to be interesting." },
      { k:"THE PRIVATE COLLECTION",m:"Surrounded by relics you earned alone. The quiet is the reward.",tx:"Surrounded by relics you earned alone, and the quiet is the entire reward. Enjoy the self-sufficiency — and notice the cost of a room no one else is allowed into." },
      { k:"THE FULL ARCHIVE",    m:"Generations of relics, all addressed to you. Read them or repeat them.",tx:"Generations of relics, all addressed to you, the whole inheritance laid out at once. Read them and continue the line, or ignore them and repeat what they were built to teach." },
    ],
    courts:[
      { name:"THE CURATOR",   k:"THE NEW CATALOGUER", m:"The Curator handles the first relic with gloves and enormous hope.",tx:"The Curator handles the first real relic with gloves and enormous, slightly terrified hope. The reverence is correct; the only error would be never daring to touch it." },
      { name:"THE ARCHIVIST", k:"THE STEADY HAND",    m:"The Archivist never rushes. The archive outlives everyone who does.",tx:"The Archivist never rushes, because the archive outlives everyone who does. Reliability this patient is unglamorous and quietly the most valuable thing in the room." },
      { name:"THE KEEPER",    k:"THE WARM VAULT",     m:"The Keeper tends the relics like a garden. Things grow where she files.",tx:"The Keeper tends the relics like a garden, and things grow wherever she files them. Stewardship at this register makes everyone around it richer simply by proximity." },
      { name:"THE CUSTODIAN", k:"THE FINAL KEY",      m:"The Custodian holds the only key and has forgotten which door it opens.",tx:"The Custodian holds the only key and has forgotten which door it opens. Total control eventually becomes its own locked room — power that guards everything and uses nothing." },
    ],
  },
  {
    key:"GLITCHES", code:"gli", type:"GLITCH", courtType:"AVATAR",
    pips:[
      { k:"THE FIRST EXPLOIT",   m:"One clean cut through the noise. Truth always arrives armed.",tx:"One clean cut through the noise, and the truth arrives armed, as it always does. The clarity is a breakthrough; the blade is real — handle the insight knowing it can wound." },
      { k:"STALEMATE LOOP",      m:"Two processes, blindfolded, each waiting for the other to crash.",tx:"Two processes, blindfolded, each waiting for the other to crash first. The deadlock is a decision disguised as patience; one of you has to open your eyes." },
      { k:"THE THREE-WAY FAULT", m:"Three errors pierce the same heart. The log does not lie.",tx:"Three errors pierce the same heart and the log refuses to lie about it. The grief is precise and named now — denial was the only thing the crash actually killed." },
      { k:"SAFE MODE",           m:"Powered down on purpose. Even the saboteur has to sleep.",tx:"Powered down on purpose, because even the saboteur has to sleep. This is not surrender; it is the strategic stillness that keeps the next fight from being your last." },
      { k:"THE COSTLY EXPLOIT",  m:"You won the argument and lost everyone who was listening.",tx:"You won the argument and lost everyone who was listening. Count the victory honestly — being right is not the same as being left with anything worth having." },
      { k:"PORT TO SAFER GROUND",m:"Leaving the corrupted sector. Take only what still runs.",tx:"Leaving the corrupted sector, taking only what still runs. Retreat chosen freely is migration, not defeat; the dead weight stays behind by design." },
      { k:"THE QUIET BREACH",    m:"Seven processes; you trust six. The traitor is patient.",tx:"Seven processes and you trust six; the traitor is patient and in no hurry. Strategy this quiet works right up until it doesn't — decide whether the cleverness is worth the solitude." },
      { k:"THE LOCKED LOOP",     m:"Bound by code you wrote. The cage has an exit you forgot.",tx:"Bound by code you wrote yourself, certain the cage has no door. Look again: the exit is the assumption you have not yet been willing to question." },
      { k:"THE 3AM ERROR",       m:"Nine alerts, all in your own voice. None real. All loud.",tx:"Nine alerts, all in your own voice, none of them real, all of them loud. The threat is the narrator; the room is safe — it is the 3am mind that has been breached." },
      { k:"TOTAL SEGFAULT",      m:"Pierced ten times, fully crashed. The only way left is reboot.",tx:"Pierced ten times, fully crashed, every process down. There is nothing left to defend, and that is the strange mercy — the only direction from here is reboot." },
    ],
    courts:[
      { name:"THE INTRUDER",    k:"THE FIRST PROBE",   m:"The Intruder tests every door, just to know which ones lie.",tx:"The Intruder tests every door just to learn which ones lie. Curiosity this restless is a gift and a liability — it finds the truth and rarely asks permission first." },
      { name:"THE DECODER",     k:"THE FAST BLADE",    m:"The Decoder cuts to the answer and through anyone standing near it.",tx:"The Decoder cuts straight to the answer, and straight through anyone standing near it. Brilliance at speed solves the problem and leaves a wake; mind who is in the blast radius." },
      { name:"THE SABOTEUR",    k:"THE CLEAN CUT",     m:"The Saboteur sees the flaw instantly and has already removed it.",tx:"The Saboteur sees the flaw instantly and has already removed it. Decisiveness this sharp is mercy when aimed well and cruelty when aimed fast — the difference is a half-second of doubt." },
      { name:"THE EXECUTIONER", k:"THE FINAL COMMAND", m:"The Executioner does not threaten. The command has already run.",tx:"The Executioner does not threaten; the command has already run. Authority this absolute owes the room honesty — when there is no appeal, the only ethics left are in the aim." },
    ],
  },
];

// Rarity scale for pips (Ace=high, 10=high tension)
const PIP_RARITY: Rarity[] = [
  "ORACLE","SIGNAL","SIGNAL","TRANSMISSION","TRANSMISSION",
  "SIGNAL","TRANSMISSION","TRANSMISSION","ANOMALY","ANOMALY",
];
const COURT_RARITY: Rarity[] = ["TRANSMISSION","ANOMALY","ORACLE","LEGENDARY"];

// Build flat minor array
const MINOR_ARCANA: TarotCard[] = [];
for (const suit of SUITS) {
  suit.pips.forEach((pip, i) => {
    MINOR_ARCANA.push({
      slug:        `cop-${suit.code}-${i + 1}`,
      title:       `${RANK[i]} OF ${suit.key}`,
      subtitle:    pip.k,
      flavourText: pip.tx,
      cardType:    suit.type,
      rarity:      PIP_RARITY[i]!,
      abilities:   [pip.k.toLowerCase()],
    });
  });
  suit.courts.forEach((court, i) => {
    MINOR_ARCANA.push({
      slug:        `cop-${suit.code}-c${i + 1}`,
      title:       court.name,
      subtitle:    court.k,
      flavourText: court.tx,
      cardType:    suit.courtType,
      rarity:      COURT_RARITY[i]!,
      abilities:   [court.k.toLowerCase()],
    });
  });
}

export const ALL_TAROT_CARDS: TarotCard[] = [...MAJOR_ARCANA, ...MINOR_ARCANA];
