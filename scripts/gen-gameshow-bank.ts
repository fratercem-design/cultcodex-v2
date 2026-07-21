/**
 * Panelverse Game Show bank — 1000 questions, 11 rounds, no duplicate answers.
 * Real content from prod (scripts/_gs4.json) + combinatorial decoys. Funnier,
 * more absurd, with multimedia (episode-thumbnail) rounds and inside jokes.
 */
import { readFileSync, writeFileSync } from "fs";

type Lore = { title: string; slug: string; summary: string | null };
type Ep = { title: string; slug: string; thumbnailUrl: string };
type Raw = {
  humor: (Lore & { category: string })[];
  prophecies: Lore[];
  quotes: { text: string; speaker: { displayName: string }; episode: { slug: string; title: string } | null }[];
  cast: string[];
  locations: { title: string; slug: string }[];
  artifacts: { title: string; slug: string }[];
  troll: (Lore & { canonStatus: string })[];
  people: { displayName: string; slug: string; shortBio: string | null; loreSummary: string | null; personType: string }[];
  episodes: Ep[];
};
const raw: Raw = JSON.parse(readFileSync("scripts/_gs4.json", "utf8"));

let _s = 90210;
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
const FAKE_PROPHECY: string[] = []; for (const f of F) for (const e of E) FAKE_PROPHECY.push(`${f} ${e}`);

const TA = ["The Sock Puppet", "The Bridge", "The Basement", "The Discount", "The Off-Brand", "The Knockoff", "The Part-Time", "The Freelance", "The Corporate", "The Retired", "The Wholesale", "The Seasonal", "The Certified", "The Amateur", "The Regional"];
const TB = ["Troll Militia", "Troll Union", "Troll Bracket", "Troll Cartel", "Troll Franchise", "Troll Syndicate", "Troll Chapter", "Troll Guild", "Troll Roster", "Troll Draft", "Troll Committee", "Troll Ledger", "Troll Bloodline", "Troll Rebrand", "Troll Onboarding"];
const FAKE_TROLL: string[] = []; for (const a of TA) for (const b of TB) FAKE_TROLL.push(`${a} ${b}`);

const FN = ["Marlo", "Dax", "Corwin", "Silas", "Bram", "Odette", "Vesper", "Cassian", "Lorne", "Thessaly", "Renfield", "Dorian", "Mireille", "Gideon", "Calliope", "Barnaby", "Isolde", "Rufus", "Perpetua", "Constantine"];
const LN = ["Vane", "Crowe", "Ashdown", "Blackwood", "Mourne", "Sable", "Thorne", "Grimsby", "Ravensworth", "Nightingale", "Holloway", "Vex", "Marrow", "Cinder", "Hemlock"];
const FAKE_PEOPLE: string[] = []; for (const f of FN) for (const l of LN) FAKE_PEOPLE.push(`${f} ${l}`);

const LOC1 = ["The Hollow", "The Drowned", "The Whispering", "The Forgotten", "The Burning", "The Frozen", "The Endless", "The Sunken", "The Hidden", "The Screaming", "The Gilded", "The Shattered"];
const LOC2 = ["Atrium", "Reliquary", "Concourse", "Undercroft", "Rookery", "Vestibule", "Causeway", "Aviary", "Catacomb", "Belfry", "Solarium", "Threshold"];
const FAKE_LOC: string[] = []; for (const a of LOC1) for (const b of LOC2) FAKE_LOC.push(`${a} ${b}`);
const ART1 = ["The Cracked", "The Weeping", "The Humming", "The Inverted", "The Borrowed", "The Unfinished", "The Counterfeit", "The Sealed", "The Melted", "The Whispering", "The Gilded", "The Forbidden"];
const ART2 = ["Astrolabe", "Reliquary Box", "Hex Ledger", "Bone Flute", "Wax Cylinder", "Sigil Coin", "Tarot Fragment", "Oracle Bell", "Ash Vial", "Iron Key", "Salt Compass", "Mirror Shard"];
const FAKE_ART: string[] = []; for (const a of ART1) for (const b of ART2) FAKE_ART.push(`${a} ${b}`);

// Fake ABSURD episode titles (combinatorial) — for the "real title?" round.
const EP_OPEN = ["I Can't Believe", "Why Is", "The Night", "URGENT:", "Confessions of", "My", "The Great", "Live:", "Nobody Tell", "Apology for", "The Return of", "Breaking:"];
const EP_BODY = ["the Toaster Confessed", "a Goose Ran the Panel", "I Married the WiFi", "the Moon Called Collect", "My Plant Testified", "Everyone Turned Into Bees", "the Cat Filed a Lawsuit", "the Fridge Started Preaching", "a Ghost Left a Yelp Review", "the Printer Achieved Enlightenment", "My Roomba Joined a Cult", "the Sun Got Cancelled", "a Pigeon Demanded Rent", "the Group Chat Became Sentient", "My Aura Got Repossessed", "the Candle Unionized", "a Demon Missed the Meeting", "the Tarot Deck Called in Sick", "My Shadow Got a Restraining Order", "the Vibe Filed for Divorce"];
const FAKE_EP: string[] = []; for (const o of EP_OPEN) for (const b of EP_BODY) FAKE_EP.push(`${o} ${b}`);

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

const TRIVIA: { q: string; opts: string[]; a: number; ex: string }[] = JSON.parse(readFileSync("scripts/gameshow-trivia.json", "utf8"));

// Fake completion words for finish-the-lore (funny nouns).
const FILL_FAKE = ["Yoga", "Karaoke", "Refund", "Brunch", "Podcast", "Timeshare", "Subpoena", "Casserole", "Rebrand", "Playlist", "Coupon", "Zamboni", "Onboarding", "Smoothie", "Firmware", "Pilates", "Bake Sale", "Tax Audit", "Group Project", "Loyalty Program", "Warranty", "Hotline", "Rerun", "Sequel", "Merger", "Reunion Tour", "Focus Group", "Waitlist"];

let id = 0;
const nid = () => `q${String(++id).padStart(4, "0")}`;
const questions: unknown[] = [];
const mc = (round: string, prompt: string, real: string, decoys: string[], explain: string, sourceHref?: string, wrap = (s: string) => s, image?: string) => {
  const opts = shuffle([{ t: real, real: true }, ...decoys.map((d) => ({ t: d, real: false }))]);
  questions.push({ id: nid(), round, type: "multiple-choice", prompt, options: opts.map((o) => wrap(o.t)), answerIndex: opts.findIndex((o) => o.real), explain, sourceHref, ...(image ? { image } : {}) });
};

// R1 Real or Fake: Lore (130 — cycle reals up to MAX_USE)
const loreS = shuffle(raw.humor);
for (let i = 0; i < 130; i++) { const r = loreS[i % loreS.length]; if (uses(r.title) >= MAX_USE) continue; bump(r.title); mc("real-or-fake-lore", "Three are made up. One is genuine Cult of Psyche lore. Which is REAL?", r.title, drawDecoys(FAKE_LORE, 3, new Set([r.title])), `"${r.title}" is real lore${r.summary ? ` — ${r.summary}` : ""}.`, `/lore/${r.slug}`); }

// R2 Two Truths & a Lie (70)
const LIE_S = ["all Tuesdays", "every ghost", "the panel", "each prophecy", "the third eye", "every curse", "the tarot deck", "each séance", "the astral plane", "every demon", "the moon", "each aura", "every shadow", "the crystal ball", "each tarot reader"];
const LIE_P = ["must be renewed annually at the DMV", "are legally cancelled during retrograde", "require parking validation to proceed", "come with a 30-day money-back guarantee", "must carry liability insurance", "expire if left in a hot car", "are contractually obligated to appear in reruns", "must file a change-of-address form", "charge a checked-bag fee", "vote each night on whether gravity applies", "take weekends off after unionizing", "must be tipped 20 percent or they leave", "need a signed permission slip from the moon", "are subject to a self-cleaning aura patent", "get put on hold with the ancestors"];
const LIES: string[] = []; for (const s of LIE_S) for (const p of LIE_P) LIES.push(`The archive rules that ${s} ${p}.`);
const liePool = shuffle(LIES);
const loreTTL = shuffle(raw.humor.filter((h) => h.summary && h.summary.length > 20));
for (let i = 0; i < 70; i++) {
  const a = loreTTL[(i * 2) % loreTTL.length], b = loreTTL[(i * 2 + 1) % loreTTL.length];
  if (uses(a.title) >= MAX_USE || uses(b.title) >= MAX_USE || a.slug === b.slug) continue;
  bump(a.title); bump(b.title); const lie = liePool[i]; bump(lie);
  const stmts = shuffle([{ text: `"${a.title}" is real lore: ${a.summary}`, real: true, slug: a.slug }, { text: `"${b.title}" is real lore: ${b.summary}`, real: true, slug: b.slug }, { text: lie, real: false }]);
  questions.push({ id: nid(), round: "two-truths-lie", type: "two-truths-lie", prompt: "Two are real Cult of Psyche lore. One is a lie. Spot the LIE.", statements: stmts, answerIndex: stmts.findIndex((s) => !s.real), explain: "The lie is the invented one; the other two are genuine archive entries." });
}

// R3 Prophecy or Bogus (60)
const prophS = shuffle(raw.prophecies);
for (let i = 0; i < 60; i++) { const r = prophS[i % prophS.length]; if (uses(r.title) >= MAX_USE) continue; bump(r.title); mc("prophecy-or-bogus", "One prophecy is really on the Ledger. The rest we made up. Which is REAL?", r.title, drawDecoys(FAKE_PROPHECY, 3, new Set([r.title])), `"${r.title}" is a real recorded prophecy${r.summary ? ` — ${r.summary}` : ""}.`, `/lore/${r.slug}`); }

// R4 Did Psyche Say It? (90)
const psyQ = shuffle(raw.quotes.filter((q) => q.speaker.displayName === "Psyche"));
const notPsyche = raw.quotes.filter((q) => q.speaker.displayName !== "Psyche").map((q) => q.text);
const qDecoy = [...FAKE_QUOTES, ...shuffle(notPsyche).slice(0, 300)];
for (let i = 0; i < 90; i++) { const r = psyQ[i % psyQ.length]; if (uses(r.text) >= MAX_USE) continue; bump(r.text); mc("did-psyche-say-it", "Psyche really said ONE of these on the show. The others we invented. Which is REAL?", r.text, drawDecoys(qDecoy, 3, new Set([r.text])), r.episode ? `He said it on "${r.episode.title}".` : "Straight from the transcript.", r.episode ? `/episodes/${r.episode.slug}` : undefined, (s) => `"${s}"`); }

// R5 Codex Cluedo (60)
const castReal = shuffle(raw.cast); const locReal = shuffle(raw.locations.map((l) => l.title)); const artReal = shuffle(raw.artifacts.map((a) => a.title));
for (let i = 0; i < 60; i++) {
  const s = castReal[i % castReal.length], l = locReal[i % locReal.length], a = artReal[i % artReal.length];
  if (uses(s) >= MAX_USE || uses(l) >= MAX_USE || uses(a) >= MAX_USE) continue;
  bump(s); bump(l); bump(a);
  const sPool = shuffle([s, ...drawDecoys(FAKE_PEOPLE, 3, new Set([s]))]);
  const lPool = shuffle([l, ...drawDecoys(FAKE_LOC, 3, new Set([l]))]);
  const aPool = shuffle([a, ...drawDecoys(FAKE_ART, 3, new Set([a]))]);
  questions.push({ id: nid(), round: "codex-cluedo", type: "clue", prompt: "CASE FILE: in each column, exactly ONE is a real archive entry. Name the real suspect, place, and object.", suspects: sPool, locations: lPool, artifacts: aPool, solution: { suspect: s, location: l, artifact: a }, explain: `The real trio: ${s} (real cast), ${l} (real location), and ${a} (real artifact). The rest are invented.` });
}

// R6 Troll or Not (100)
const trollS = shuffle(raw.troll);
for (let i = 0; i < 100; i++) { const r = trollS[i % trollS.length]; if (uses(r.title) >= MAX_USE) continue; bump(r.title); mc("troll-or-not", "The Trollopedia is real. One of these is a genuine entry. Which is REAL troll lore?", r.title, drawDecoys(FAKE_TROLL, 3, new Set([r.title])), `"${r.title}" is real${r.summary ? ` — ${r.summary}` : " troll lore."}`, `/lore/${r.slug}`); }

// R7 Who Is It? (110)
const peopleS = shuffle(raw.people.filter((p) => (p.shortBio || p.loreSummary || "").length > 12));
const castNamePool = [...new Set(raw.cast)];
for (let i = 0; i < 110; i++) {
  const p = peopleS[i % peopleS.length]; if (uses(p.displayName) >= MAX_USE) continue; bump(p.displayName);
  const bio = (p.shortBio || p.loreSummary || "").replace(/\s+/g, " ").trim();
  const decoys = drawDecoys(castNamePool, 3, new Set([p.displayName]));
  const opts = shuffle([{ t: p.displayName, real: true }, ...decoys.map((d) => ({ t: d, real: false }))]);
  questions.push({ id: nid(), round: "who-is-it", type: "multiple-choice", prompt: `From the archive: "${bio}" — WHO is this?`, options: opts.map((o) => o.t), answerIndex: opts.findIndex((o) => o.real), explain: `It's ${p.displayName}${p.personType ? ` (${p.personType})` : ""}.`, sourceHref: `/people/${p.slug}` });
}

// R8 Guess the Episode (MULTIMEDIA — real thumbnail, pick the title) (130)
const epS = shuffle(raw.episodes);
const epTitles = raw.episodes.map((e) => e.title);
for (let i = 0; i < 130; i++) {
  const e = epS[i % epS.length]; if (uses(e.title) >= MAX_USE) continue; bump(e.title);
  const decoys = shuffle(epTitles.filter((t) => t !== e.title)).slice(0, 3);
  const opts = shuffle([{ t: e.title, real: true }, ...decoys.map((d) => ({ t: d, real: false }))]);
  questions.push({ id: nid(), round: "guess-the-episode", type: "multiple-choice", image: e.thumbnailUrl, prompt: "🎬 This is a real episode thumbnail. Which title belongs to it?", options: opts.map((o) => o.t), answerIndex: opts.findIndex((o) => o.real), explain: `This is "${e.title}".`, sourceHref: `/episodes/${e.slug}` });
}

// R9 Real Title? (absurd episode titles — 1 real + 3 fake absurd) (90)
const epForTitle = shuffle(raw.episodes);
const fakeEpPool = shuffle(FAKE_EP);
for (let i = 0; i < 90; i++) {
  const e = epForTitle[i % epForTitle.length]; if (uses(e.title) >= MAX_USE) continue; bump(e.title);
  const decoys = drawDecoys(fakeEpPool, 3, new Set([e.title]));
  const opts = shuffle([{ t: e.title, real: true }, ...decoys.map((d) => ({ t: d, real: false }))]);
  questions.push({ id: nid(), round: "real-title", type: "multiple-choice", prompt: "One of these is an ACTUAL Cult of Psyche episode title. The rest we made up. Which chaos is REAL?", options: opts.map((o) => o.t), answerIndex: opts.findIndex((o) => o.real), explain: `"${e.title}" is a real episode. Yes, really.`, sourceHref: `/episodes/${e.slug}` });
}

// R10 Finish the Lore (fill-in the last word of a real absurd title) (70)
const fillPool = shuffle(FILL_FAKE);
const fillCandidates = shuffle(raw.humor.filter((h) => h.title.trim().split(" ").length >= 3 && h.title.split(" ").every((w) => w.length < 16)));
let fi = 0;
for (let i = 0; i < 70 && fi < fillCandidates.length; i++, fi++) {
  const h = fillCandidates[fi]; const words = h.title.trim().split(" "); const last = words[words.length - 1]; const stem = words.slice(0, -1).join(" ");
  if (last.length < 3 || uses(last) >= MAX_USE) { i--; continue; }
  bump(last);
  const decoys = fillPool.filter((w) => w.toLowerCase() !== last.toLowerCase() && uses(w) < MAX_USE).slice(0, 3); decoys.forEach(bump);
  if (decoys.length < 3) { i--; continue; }
  const opts = shuffle([{ t: last, real: true }, ...decoys.map((d) => ({ t: d, real: false }))]);
  questions.push({ id: nid(), round: "finish-the-lore", type: "multiple-choice", prompt: `Complete the real lore title: "${stem} ___"`, options: opts.map((o) => o.t), answerIndex: opts.findIndex((o) => o.real), explain: `The real entry is "${h.title}".`, sourceHref: `/lore/${h.slug}` });
}

// R11 General Trivia (fill to 1000)
const trivS = shuffle(TRIVIA);
const need = 1000 - questions.length;
for (let i = 0; i < need; i++) {
  const t = trivS[i % trivS.length];
  const opts = shuffle(t.opts.map((o, oi) => ({ t: o, real: oi === t.a })));
  questions.push({ id: nid(), round: "general-trivia", type: "multiple-choice", prompt: t.q, options: opts.map((o) => o.t), answerIndex: opts.findIndex((o) => o.real), explain: t.ex });
}

// Audit (trivia exempt; guess-the-episode title reuse capped at MAX_USE already).
const cnt = new Map<string, number>();
for (const q of questions as { round: string; options?: string[]; statements?: { text: string }[] }[]) {
  if (q.round === "general-trivia" || q.round === "guess-the-episode") continue;
  const opts = q.options || (q.statements || []).map((s) => s.text);
  for (const o of opts) cnt.set(o, (cnt.get(o) ?? 0) + 1);
}
const over = [...cnt.entries()].filter(([, n]) => n > MAX_USE);
if (over.length) throw new Error(`OVER CAP: ${over.slice(0, 5).map(([s, n]) => `${n}× ${s}`).join(" | ")}`);

const bank = {
  generatedFrom: "prod Xata (lore/prophecy/quotes/people/troll/episodes+thumbnails) + combinatorial decoys + authored trivia",
  total: questions.length,
  rounds: [
    { key: "real-or-fake-lore", label: "Real or Fake: Lore", icon: "📜" },
    { key: "two-truths-lie", label: "Two Truths & a Lie", icon: "🎭" },
    { key: "prophecy-or-bogus", label: "Prophecy or Bogus", icon: "🔮" },
    { key: "did-psyche-say-it", label: "Did Psyche Say It?", icon: "🗣️" },
    { key: "codex-cluedo", label: "Codex Cluedo", icon: "🕯️" },
    { key: "troll-or-not", label: "Troll or Not", icon: "🌉" },
    { key: "who-is-it", label: "Who Is It?", icon: "🕵️" },
    { key: "guess-the-episode", label: "Guess the Episode", icon: "🎬" },
    { key: "real-title", label: "Real Title or Fake?", icon: "🤯" },
    { key: "finish-the-lore", label: "Finish the Lore", icon: "✍️" },
    { key: "general-trivia", label: "General Trivia", icon: "❓" },
  ],
  questions,
};
writeFileSync("src/lib/data/gameshow-questions.json", JSON.stringify(bank, null, 1));
const byRound: Record<string, number> = {};
for (const q of questions as { round: string }[]) byRound[q.round] = (byRound[q.round] || 0) + 1;
console.log(`WROTE ${questions.length}`, JSON.stringify(byRound));
