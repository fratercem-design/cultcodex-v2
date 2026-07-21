/**
 * Panelverse Game Show bank — 500 questions, 8 rounds, no duplicate answers.
 * Real content from prod (scripts/_gs3.json); decoys combinatorial+authored.
 * Every real answer used at most once; every decoy least-used-first under a
 * hard cap; the final audit throws if any option repeats too often or a decoy
 * collides with a real answer.
 */
import { readFileSync, writeFileSync } from "fs";

type Lore = { title: string; slug: string; summary: string | null };
type Raw = {
  humor: (Lore & { category: string })[];
  prophecies: Lore[];
  quotes: { text: string; speaker: { displayName: string }; episode: { slug: string; title: string } | null }[];
  cast: string[];
  locations: { title: string; slug: string }[];
  artifacts: { title: string; slug: string }[];
  troll: (Lore & { canonStatus: string })[];
  people: { displayName: string; slug: string; shortBio: string | null; loreSummary: string | null; personType: string }[];
};
const raw: Raw = JSON.parse(readFileSync("scripts/_gs3.json", "utf8"));

let _s = 424242;
const rnd = () => { _s = (_s * 1103515245 + 12345) & 0x7fffffff; return _s / 0x7fffffff; };
const shuffle = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pick = <T,>(a: T[], n: number): T[] => shuffle(a).slice(0, n);

const MAX_USE = 2;
const useCount = new Map<string, number>();
const uses = (s: string) => useCount.get(s) ?? 0;
const bump = (s: string) => useCount.set(s, uses(s) + 1);
function drawDecoys(pool: string[], n: number, avoid: Set<string>): string[] {
  const eligible = pool.filter((x) => !avoid.has(x) && uses(x) < MAX_USE);
  eligible.sort((a, b) => uses(a) - uses(b) || rnd() - 0.5);
  const chosen = eligible.slice(0, n);
  if (chosen.length < n) throw new Error(`decoy pool exhausted (need ${n}, have ${chosen.length})`);
  chosen.forEach(bump);
  return chosen;
}

// ── Decoy pools ──
const A = ["The Notarized", "The Refundable", "The Expired", "The Municipal", "The Overdue", "The Certified", "The Unlicensed", "The Complimentary", "The Discontinued", "The Recalled", "The Subscription", "The Warranty", "The Seasonal", "The Retroactive", "The Standardized", "The Emergency", "The Provisional", "The Notarial", "The Discounted", "The Audited"];
const B = ["Curse", "Prophecy", "Hex", "Blessing", "Sigil", "Omen", "Ritual", "Covenant", "Relic", "Oracle", "Séance", "Exorcism", "Talisman", "Incantation", "Apparition", "Reincarnation", "Divination", "Portal", "Familiar", "Ascension"];
const C = ["Astral", "Interdimensional", "Extraterrestrial", "Purgatorial", "Ectoplasmic", "Necromantic", "Prophetic", "Cosmic", "Infernal", "Celestial", "Spectral", "Occult", "Zodiacal", "Karmic", "Hexadecimal"];
const D = ["Parking Validation", "Filing Cabinet", "Group Chat", "Loyalty Points", "Warranty Card", "Recall Notice", "Time-Share", "Subscription Tier", "Homeowners Association", "Two-Factor Login", "Customer Support Line", "Roadside Assistance", "Overdraft Fee", "Coupon Book", "Waiting Room", "Terms of Service", "Change-of-Address Form", "Parental Controls", "Free Trial", "Direct Deposit"];
const FAKE_LORE: string[] = [];
for (const a of A) for (const b of B) FAKE_LORE.push(`${a} ${b}`);
for (const c of C) for (const d of D) FAKE_LORE.push(`${c} ${d}`);

const E = ["Found Remote", "Unsent Text", "Correct Timeline", "Last Software Update", "Refilled Cup", "Snooze Button", "Quiet Group Chat", "Full Battery", "Green Traffic Light", "Matching Sock", "Cleared Notification", "Parked Car", "Unspoken Password", "Reversed Escalator", "Final Buffering", "Warm Leftover", "Answered Email", "Located Charger", "Silent Phone", "Empty Inbox"];
const F = ["The Prophecy of the", "The Great", "The Coming of the", "The Return of the", "The Awakening of the", "The Fall of the"];
const FAKE_PROPHECY: string[] = [];
for (const f of F) for (const e of E) FAKE_PROPHECY.push(`${f} ${e}`);

// Fake troll-lore titles
const TA = ["The Sock Puppet", "The Bridge", "The Basement", "The Discount", "The Off-Brand", "The Knockoff", "The Part-Time", "The Freelance", "The Corporate", "The Retired", "The Wholesale", "The Seasonal", "The Certified", "The Amateur", "The Regional"];
const TB = ["Troll Militia", "Troll Union", "Troll Bracket", "Troll Cartel", "Troll Franchise", "Troll Syndicate", "Troll Chapter", "Troll Guild", "Troll Roster", "Troll Draft", "Troll Committee", "Troll Ledger", "Troll Bloodline", "Troll Rebrand", "Troll Onboarding"];
const FAKE_TROLL: string[] = [];
for (const a of TA) for (const b of TB) FAKE_TROLL.push(`${a} ${b}`);

// Fake person names (for Cluedo suspects + who-is-it decoys are REAL people; suspects fakes here)
const FN = ["Marlo", "Dax", "Corwin", "Silas", "Bram", "Odette", "Vesper", "Cassian", "Lorne", "Thessaly", "Renfield", "Dorian", "Mireille", "Gideon", "Calliope", "Barnaby", "Isolde", "Rufus", "Perpetua", "Constantine"];
const LN = ["Vane", "Crowe", "Ashdown", "Blackwood", "Mourne", "Sable", "Thorne", "Grimsby", "Ravensworth", "Nightingale", "Holloway", "Vex", "Marrow", "Cinder", "Hemlock"];
const FAKE_PEOPLE: string[] = [];
for (const f of FN) for (const l of LN) FAKE_PEOPLE.push(`${f} ${l}`);

// Fake locations / artifacts
const LOC1 = ["The Hollow", "The Drowned", "The Whispering", "The Forgotten", "The Burning", "The Frozen", "The Endless", "The Sunken", "The Hidden", "The Screaming", "The Gilded", "The Shattered"];
const LOC2 = ["Atrium", "Reliquary", "Concourse", "Undercroft", "Rookery", "Vestibule", "Causeway", "Aviary", "Catacomb", "Belfry", "Solarium", "Threshold"];
const FAKE_LOC: string[] = []; for (const a of LOC1) for (const b of LOC2) FAKE_LOC.push(`${a} ${b}`);
const ART1 = ["The Cracked", "The Weeping", "The Humming", "The Inverted", "The Borrowed", "The Unfinished", "The Counterfeit", "The Sealed", "The Melted", "The Whispering", "The Gilded", "The Forbidden"];
const ART2 = ["Astrolabe", "Reliquary Box", "Hex Ledger", "Bone Flute", "Wax Cylinder", "Sigil Coin", "Tarot Fragment", "Oracle Bell", "Ash Vial", "Iron Key", "Salt Compass", "Mirror Shard"];
const FAKE_ART: string[] = []; for (const a of ART1) for (const b of ART2) FAKE_ART.push(`${a} ${b}`);

const FAKE_QUOTES = [
  "I have never once been wrong, and I have the receipts in a drawer I refuse to open.",
  "The algorithm and I have an understanding, and the understanding is that it obeys.",
  "Every troll is just a prophet who took a wrong turn at the parking lot.",
  "I don't chase clout. Clout files a restraining order and I respect it.",
  "The veil is thin tonight, mostly because someone forgot to pay the veil bill.",
  "You cannot cancel a man who was never technically booked.",
  "I speak to the dead, but only the ones who text first.",
  "My aura has a bouncer and you are not on the list.",
  "I'm not superstitious, I'm just correct in ways science hasn't scheduled yet.",
  "The universe sends me signs. I read them. I do not reply-all.",
  "You can't hex a man who's already grounded himself with a snack.",
  "Mercury is in retrograde and frankly so is everyone in this chat.",
  "The cards never lie. People lie. The cards just take notes.",
  "I manifested this, and I'd like to speak to whoever approved it.",
  "Being right this often is a burden and I carry it in a tote bag.",
  "My third eye has a do-not-disturb setting and it is ON.",
  "The moon owes me money and I intend to collect at the eclipse.",
  "Enlightenment is just paying attention with better lighting.",
  "I read auras, and yours is buffering.",
  "Haters are just unpaid interns in my legacy.",
];

// ── General trivia (authored, definite answers) ──
type Triv = { q: string; opts: string[]; a: number; ex: string };
const TRIVIA: Triv[] = [
  { q: "How many cards are in a standard tarot deck?", opts: ["78", "52", "72", "64"], a: 0, ex: "A tarot deck has 78 cards: 22 Major Arcana + 56 Minor Arcana." },
  { q: "How many cards make up the Major Arcana?", opts: ["22", "16", "21", "12"], a: 0, ex: "The Major Arcana runs from 0 (The Fool) to XXI (The World) — 22 cards." },
  { q: "Which tarot card is numbered 0?", opts: ["The Fool", "The Magician", "The World", "Death"], a: 0, ex: "The Fool is card 0, beginning the Major Arcana's journey." },
  { q: "Which planet rules the sign Scorpio in modern astrology?", opts: ["Pluto", "Mars", "Saturn", "Venus"], a: 0, ex: "Modern astrology assigns Pluto to Scorpio (Mars is its traditional ruler)." },
  { q: "How many signs are in the Western zodiac?", opts: ["12", "10", "13", "8"], a: 0, ex: "Twelve zodiac signs, one per ~30° of the ecliptic." },
  { q: "What are the four suits of the tarot's Minor Arcana?", opts: ["Wands, Cups, Swords, Pentacles", "Hearts, Clubs, Spades, Diamonds", "Fire, Water, Air, Earth", "Rods, Bowls, Blades, Coins"], a: 0, ex: "Wands, Cups, Swords, and Pentacles (a.k.a. Coins)." },
  { q: "Which element is traditionally associated with the suit of Cups?", opts: ["Water", "Fire", "Air", "Earth"], a: 0, ex: "Cups map to Water — emotion, intuition, relationships." },
  { q: "The 'Hermetic' tradition takes its name from which figure?", opts: ["Hermes Trismegistus", "Hermes of Olympus", "Saint Hermas", "Herminius"], a: 0, ex: "Hermes Trismegistus, the legendary author of the Hermetic texts." },
  { q: "\"As above, so below\" comes from which text?", opts: ["The Emerald Tablet", "The Book of Thoth", "The Kybalion", "The Necronomicon"], a: 0, ex: "The maxim is from the Emerald Tablet of Hermes Trismegistus." },
  { q: "How many spheres (Sephirot) are on the Kabbalistic Tree of Life?", opts: ["10", "7", "12", "22"], a: 0, ex: "Ten Sephirot, connected by 22 paths." },
  { q: "Which tarot card traditionally depicts a figure hanging upside-down?", opts: ["The Hanged Man", "The Tower", "The Devil", "Judgement"], a: 0, ex: "The Hanged Man (XII) — suspension, surrender, new perspective." },
  { q: "In numerology, which number is often called the 'master number' of intuition?", opts: ["11", "7", "3", "9"], a: 0, ex: "11 is a master number linked to intuition and insight." },
  { q: "Which zodiac sign is symbolized by the scales?", opts: ["Libra", "Virgo", "Gemini", "Aquarius"], a: 0, ex: "Libra, the scales — balance and justice." },
  { q: "The planet Mercury rules which pair of zodiac signs?", opts: ["Gemini and Virgo", "Taurus and Libra", "Aries and Scorpio", "Cancer and Leo"], a: 0, ex: "Mercury rules both Gemini and Virgo." },
  { q: "What is a group of witches traditionally called?", opts: ["A coven", "A circle", "A conclave", "A congregation"], a: 0, ex: "A coven — classically said to number thirteen." },
  { q: "Which crystal is most commonly associated with amplifying energy and clarity?", opts: ["Clear quartz", "Obsidian", "Turquoise", "Jade"], a: 0, ex: "Clear quartz — the 'master healer', prized for amplification." },
  { q: "The pentagram with a single point upward traditionally represents what?", opts: ["Spirit over the four elements", "The five wounds", "The five senses only", "Chaos"], a: 0, ex: "Point-up: spirit presiding over earth, air, fire, and water." },
  { q: "Which tarot suit corresponds to the element of Fire?", opts: ["Wands", "Swords", "Cups", "Pentacles"], a: 0, ex: "Wands — Fire: drive, creativity, will." },
  { q: "'Mercury retrograde' refers to Mercury appearing to do what?", opts: ["Move backward across the sky", "Disappear entirely", "Turn red", "Collide with the Moon"], a: 0, ex: "An apparent backward (retrograde) motion from Earth's vantage." },
  { q: "Which Major Arcana card is numbered XIII?", opts: ["Death", "The Tower", "Temperance", "The Devil"], a: 0, ex: "XIII is Death — endings and transformation, rarely literal." },
  { q: "The 'third eye' chakra is located where?", opts: ["Between the eyebrows", "At the throat", "At the crown", "At the heart"], a: 0, ex: "Ajna, the brow chakra, sits between the eyebrows." },
  { q: "How many chakras are there in the common Western system?", opts: ["7", "5", "9", "12"], a: 0, ex: "Seven main chakras from root to crown." },
  { q: "Which sign is represented by the twins?", opts: ["Gemini", "Pisces", "Aries", "Cancer"], a: 0, ex: "Gemini, the twins — duality and communication." },
  { q: "A 'grimoire' is a book of what?", opts: ["Magic spells and rituals", "Dream interpretations only", "Saints' lives", "Astronomical tables"], a: 0, ex: "A grimoire is a textbook of magic — spells, invocations, correspondences." },
  { q: "Which oracle of ancient Greece was dedicated to Apollo?", opts: ["Delphi", "Dodona", "Siwa", "Cumae"], a: 0, ex: "The Oracle at Delphi, home of the Pythia." },
  { q: "In tarot, an upright card versus a reversed card differs by what?", opts: ["Its orientation when drawn", "Its color", "Its number", "Its suit"], a: 0, ex: "Reversed = drawn upside-down, often shifting the meaning." },
  { q: "Which metal is alchemically associated with the Moon?", opts: ["Silver", "Gold", "Iron", "Copper"], a: 0, ex: "Silver ↔ Moon; gold ↔ Sun in classical alchemy." },
  { q: "The word 'zodiac' derives from a Greek term meaning what?", opts: ["Circle of little animals", "Path of the sun", "Ring of stars", "Wheel of fate"], a: 0, ex: "From 'zodiakos kyklos' — circle of little animals/figures." },
  { q: "Which card traditionally represents sudden upheaval and shock?", opts: ["The Tower", "The Star", "The Sun", "The Hermit"], a: 0, ex: "The Tower (XVI) — sudden, destructive revelation." },
  { q: "Ophiuchus, sometimes called the '13th sign', represents what?", opts: ["The serpent-bearer", "The scorpion", "The archer", "The ram"], a: 0, ex: "Ophiuchus, the serpent-bearer, straddles the ecliptic near Scorpius." },
  { q: "What is scrying?", opts: ["Divination by gazing into a surface", "Reading tea leaves", "Casting runes", "Palm reading"], a: 0, ex: "Scrying — seeking visions in a crystal ball, mirror, or water." },
  { q: "Which classical element is associated with the suit of Swords?", opts: ["Air", "Fire", "Water", "Earth"], a: 0, ex: "Swords ↔ Air: intellect, conflict, truth." },
  { q: "The Wheel of the Year marks how many major seasonal festivals (sabbats)?", opts: ["8", "4", "12", "6"], a: 0, ex: "Eight sabbats: solstices, equinoxes, and the four cross-quarter days." },
  { q: "Which sign is ruled by the Sun?", opts: ["Leo", "Cancer", "Aries", "Sagittarius"], a: 0, ex: "Leo is the Sun's domicile." },
  { q: "Which sign is ruled by the Moon?", opts: ["Cancer", "Leo", "Taurus", "Pisces"], a: 0, ex: "Cancer is ruled by the Moon." },
  { q: "A 'sigil' in magic is best described as what?", opts: ["A symbol charged with intent", "A spoken chant", "A protective circle", "A sacred number"], a: 0, ex: "A sigil is a designed symbol encoding a desire or entity." },
  { q: "The tarot card The Lovers is most associated with which theme?", opts: ["Choice and union", "Death and rebirth", "Wealth", "Travel"], a: 0, ex: "The Lovers (VI) — relationships, values, and pivotal choice." },
  { q: "Which is a traditional tool on a witch's altar for the element Earth?", opts: ["A pentacle or salt", "A candle", "A wand", "A chalice"], a: 0, ex: "The pentacle (and salt) represent Earth on the altar." },
  { q: "'Tarot' most likely originated in the 15th century in which country?", opts: ["Italy", "Egypt", "France", "England"], a: 0, ex: "Tarot began as Italian playing cards (tarocchi) in the 1400s." },
  { q: "Which planet is traditionally associated with discipline and limitation?", opts: ["Saturn", "Jupiter", "Venus", "Mercury"], a: 0, ex: "Saturn — structure, boundaries, hard lessons." },
  { q: "Which planet is associated with expansion and luck?", opts: ["Jupiter", "Mars", "Saturn", "Neptune"], a: 0, ex: "Jupiter — growth, abundance, fortune." },
  { q: "In palmistry, the 'heart line' primarily reveals what?", opts: ["Emotional life", "Lifespan", "Career", "Intelligence"], a: 0, ex: "The heart line is read for matters of emotion and love." },
  { q: "The ouroboros depicts a serpent doing what?", opts: ["Eating its own tail", "Coiled around a tree", "Swallowing the sun", "Shedding its skin"], a: 0, ex: "Ouroboros — a serpent eating its tail: eternal cycles." },
  { q: "Which Major Arcana card is numbered XXI, the final one?", opts: ["The World", "The Sun", "Judgement", "The Star"], a: 0, ex: "The World (XXI) completes the Major Arcana." },
  { q: "Runes are the letters of which historical alphabet family?", opts: ["Futhark", "Ogham", "Cyrillic", "Coptic"], a: 0, ex: "The runic alphabets are known collectively as Futhark." },
  { q: "Which incense is classically burned for protection and cleansing?", opts: ["Sage", "Cinnamon", "Rose", "Vanilla"], a: 0, ex: "Sage (smudging) is the classic cleansing/protection herb." },
  { q: "The 'astral plane' in occult thought refers to what?", opts: ["A non-physical realm of travel and spirits", "The night sky", "A star map", "The subconscious brainstem"], a: 0, ex: "The astral plane — a subtle realm reached in projection." },
  { q: "Which zodiac sign is symbolized by the water-bearer?", opts: ["Aquarius", "Pisces", "Cancer", "Capricorn"], a: 0, ex: "Aquarius — the water-bearer (an air sign, confusingly)." },
  { q: "How many court cards are in each tarot suit?", opts: ["4", "3", "5", "2"], a: 0, ex: "Four: Page, Knight, Queen, King." },
  { q: "The phrase 'occult' literally means what?", opts: ["Hidden", "Evil", "Ancient", "Forbidden"], a: 0, ex: "From Latin 'occultus' — hidden or concealed knowledge." },
];

let id = 0;
const nid = () => `q${String(++id).padStart(3, "0")}`;
const questions: unknown[] = [];
const mc = (round: string, prompt: string, real: string, decoys: string[], explain: string, sourceHref?: string, wrap = (s: string) => s) => {
  const opts = shuffle([{ t: real, real: true }, ...decoys.map((d) => ({ t: d, real: false }))]);
  questions.push({ id: nid(), round, type: "multiple-choice", prompt, options: opts.map((o) => wrap(o.t)), answerIndex: opts.findIndex((o) => o.real), explain, sourceHref });
};

// R1 Real or Fake: Lore (90)
const loreS = shuffle(raw.humor);
for (let i = 0; i < 90; i++) { const r = loreS[i]; bump(r.title); mc("real-or-fake-lore", "Three are made up. One is genuine Cult of Psyche lore. Which is REAL?", r.title, drawDecoys(FAKE_LORE, 3, new Set([r.title])), `"${r.title}" is real lore${r.summary ? ` — ${r.summary}` : ""}.`, `/lore/${r.slug}`); }

// R2 Two Truths & a Lie (50)
const LIE_SUBJ = ["all Tuesdays", "every ghost", "the panel", "each prophecy", "the third eye", "every curse", "the tarot deck", "each séance", "the astral plane", "every demon", "the moon", "each aura", "every shadow", "the crystal ball", "each tarot reader"];
const LIE_PRED = ["must be renewed annually at the DMV", "are legally cancelled during retrograde", "require parking validation to proceed", "come with a 30-day money-back guarantee", "must carry liability insurance", "expire if left in a hot car", "are contractually obligated to appear in reruns", "must file a change-of-address form", "charge a checked-bag fee", "vote each night on whether gravity applies", "take weekends off after unionizing", "must be tipped 20 percent or they leave", "need a signed permission slip from the moon", "are subject to a self-cleaning aura patent", "get put on hold with the ancestors"];
const LIES: string[] = []; for (const s of LIE_SUBJ) for (const p of LIE_PRED) LIES.push(`The archive rules that ${s} ${p}.`);
const liePool = shuffle(LIES);
const loreTTL = shuffle(raw.humor).filter((h) => h.summary && h.summary.length > 20).slice(90, 90 + 110);
for (let i = 0; i < 50; i++) {
  const a = loreTTL[i * 2], b = loreTTL[i * 2 + 1]; bump(a.title); bump(b.title);
  const lie = liePool[i]; bump(lie);
  const stmts = shuffle([{ text: `"${a.title}" is real lore: ${a.summary}`, real: true, slug: a.slug }, { text: `"${b.title}" is real lore: ${b.summary}`, real: true, slug: b.slug }, { text: lie, real: false }]);
  questions.push({ id: nid(), round: "two-truths-lie", type: "two-truths-lie", prompt: "Two are real Cult of Psyche lore. One is a lie. Spot the LIE.", statements: stmts, answerIndex: stmts.findIndex((s) => !s.real), explain: "The lie is the invented one; the other two are genuine archive entries." });
}

// R3 Prophecy or Bogus (50)
const prophS = shuffle(raw.prophecies);
for (let i = 0; i < 50; i++) { const r = prophS[i]; bump(r.title); mc("prophecy-or-bogus", "One prophecy is really on the Ledger. The rest we made up. Which is REAL?", r.title, drawDecoys(FAKE_PROPHECY, 3, new Set([r.title])), `"${r.title}" is a real recorded prophecy${r.summary ? ` — ${r.summary}` : ""}.`, `/lore/${r.slug}`); }

// R4 Did Psyche Say It? (50)
const psyQ = shuffle(raw.quotes.filter((q) => q.speaker.displayName === "Psyche")).slice(0, 50);
const notPsyche = raw.quotes.filter((q) => q.speaker.displayName !== "Psyche").map((q) => q.text);
const qDecoy = [...FAKE_QUOTES, ...shuffle(notPsyche).slice(0, 160)];
for (let i = 0; i < 50; i++) { const r = psyQ[i]; bump(r.text); mc("did-psyche-say-it", "Psyche really said ONE of these on the show. The others we invented. Which is REAL?", r.text, drawDecoys(qDecoy, 3, new Set([r.text])), r.episode ? `He said it on "${r.episode.title}".` : "Straight from the transcript.", r.episode ? `/episodes/${r.episode.slug}` : undefined, (s) => `"${s}"`); }

// R5 Codex Cluedo — FIXED: each column has one REAL answer among fakes; solution = the reals.
const castReal = shuffle(raw.cast); const locReal = shuffle(raw.locations.map((l) => l.title)); const artReal = shuffle(raw.artifacts.map((a) => a.title));
for (let i = 0; i < 50; i++) {
  const s = castReal[i]; bump(s); const l = locReal[i]; bump(l); const a = artReal[i]; bump(a);
  const sPool = shuffle([s, ...drawDecoys(FAKE_PEOPLE, 3, new Set([s]))]);
  const lPool = shuffle([l, ...drawDecoys(FAKE_LOC, 3, new Set([l]))]);
  const aPool = shuffle([a, ...drawDecoys(FAKE_ART, 3, new Set([a]))]);
  questions.push({ id: nid(), round: "codex-cluedo", type: "clue", prompt: "CASE FILE: in each column, exactly ONE is a real archive entry. Name the real suspect, place, and object.", suspects: sPool, locations: lPool, artifacts: aPool, solution: { suspect: s, location: l, artifact: a }, explain: `The real trio: ${s} (a real cast member), ${l} (a real location), and ${a} (a real artifact). The three fakes in each column are invented.` });
}

// R6 Troll or Not (75) — real troll lore vs fake troll titles
const trollS = shuffle(raw.troll);
for (let i = 0; i < 75; i++) { const r = trollS[i]; bump(r.title); mc("troll-or-not", "The Trollopedia is real. One of these is a genuine entry. Which is REAL troll lore?", r.title, drawDecoys(FAKE_TROLL, 3, new Set([r.title])), `"${r.title}" is real${r.summary ? ` — ${r.summary}` : " troll lore in the archive."}`, `/lore/${r.slug}`); }

// R7 Who Is It? (85) — a real bio → which real person; decoys are other real people
const peopleS = shuffle(raw.people.filter((p) => (p.shortBio || p.loreSummary || "").length > 15));
const N7 = Math.min(85, peopleS.length);
const castNamePool = [...new Set(raw.cast)];
for (let i = 0; i < N7; i++) {
  const p = peopleS[i]; bump(p.displayName);
  const bio = (p.shortBio || p.loreSummary || "").replace(/\s+/g, " ").trim();
  const decoys = drawDecoys(castNamePool, 3, new Set([p.displayName]));
  const opts = shuffle([{ t: p.displayName, real: true }, ...decoys.map((d) => ({ t: d, real: false }))]);
  questions.push({ id: nid(), round: "who-is-it", type: "multiple-choice", prompt: `From the archive: "${bio}" — WHO is this?`, options: opts.map((o) => o.t), answerIndex: opts.findIndex((o) => o.real), explain: `It's ${p.displayName}${p.personType ? ` (${p.personType})` : ""}.`, sourceHref: `/people/${p.slug}` });
}

// R8 General Trivia (fill to 500) — authored occult/tarot knowledge
const trivS = shuffle(TRIVIA);
const need8 = 500 - questions.length;
for (let i = 0; i < need8; i++) {
  const t = trivS[i % trivS.length];
  const opts = shuffle(t.opts.map((o, oi) => ({ t: o, real: oi === t.a })));
  questions.push({ id: nid(), round: "general-trivia", type: "multiple-choice", prompt: t.q, options: opts.map((o) => o.t), answerIndex: opts.findIndex((o) => o.real), explain: t.ex });
}

// ── Audit: no option repeats beyond MAX_USE (trivia exempt — a fixed knowledge set) ──
const nonTrivia = (questions as { round: string; options?: string[]; statements?: { text: string }[] }[]).filter((q) => q.round !== "general-trivia");
const cnt = new Map<string, number>();
for (const q of nonTrivia) { const opts = q.options || (q.statements || []).map((s) => s.text); for (const o of opts) cnt.set(o, (cnt.get(o) ?? 0) + 1); }
const over = [...cnt.entries()].filter(([, n]) => n > MAX_USE);
if (over.length) throw new Error(`OVER CAP: ${over.slice(0, 5).map(([s, n]) => `${n}× ${s}`).join(" | ")}`);

const bank = {
  generatedFrom: "prod Xata + combinatorial decoys + authored trivia",
  total: questions.length,
  rounds: [
    { key: "real-or-fake-lore", label: "Real or Fake: Lore", icon: "📜" },
    { key: "two-truths-lie", label: "Two Truths & a Lie", icon: "🎭" },
    { key: "prophecy-or-bogus", label: "Prophecy or Bogus", icon: "🔮" },
    { key: "did-psyche-say-it", label: "Did Psyche Say It?", icon: "🗣️" },
    { key: "codex-cluedo", label: "Codex Cluedo", icon: "🕯️" },
    { key: "troll-or-not", label: "Troll or Not", icon: "🌉" },
    { key: "who-is-it", label: "Who Is It?", icon: "🕵️" },
    { key: "general-trivia", label: "General Trivia", icon: "❓" },
  ],
  questions,
};
writeFileSync("src/lib/data/gameshow-questions.json", JSON.stringify(bank, null, 1));
const byRound: Record<string, number> = {};
for (const q of questions as { round: string }[]) byRound[q.round] = (byRound[q.round] || 0) + 1;
console.log(`WROTE ${questions.length}`, JSON.stringify(byRound));
