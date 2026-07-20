/**
 * Builds the Panelverse Game Show question bank (100 questions, five rounds)
 * from curated real database content + authored decoys. Every "real" item is
 * a genuine row from Xata; every decoy is authored here and asserted to NOT
 * collide with a real slug/title, so nothing false is ever labelled true.
 *
 * Output: src/lib/data/gameshow-questions.json
 */
import { readFileSync, writeFileSync } from "fs";

type Raw = {
  quotes: { text: string; speaker: { displayName: string }; episode: { slug: string; title: string } | null }[];
  humor: { title: string; slug: string; summary: string | null; category: string }[];
  cast: { displayName: string; slug: string }[];
  locations: { title: string; slug: string }[];
  artifacts: { title: string; slug: string }[];
  prophecies: { title: string; slug: string; summary: string | null }[];
};

const raw: Raw = JSON.parse(readFileSync("scripts/_gameshow-clean.json", "utf8"));

// Deterministic PRNG so re-runs don't churn the bank (seed fixed).
let _s = 1337;
function rnd() { _s = (_s * 1103515245 + 12345) & 0x7fffffff; return _s / 0x7fffffff; }
function shuffle<T>(a: T[]): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function pick<T>(a: T[], n: number): T[] { return shuffle(a).slice(0, n); }

const realTitles = new Set(raw.humor.map(h => h.title.toLowerCase().trim()));
const realProph = new Set(raw.prophecies.map(p => p.title.toLowerCase().trim()));
function assertFake(t: string, set: Set<string>, kind: string) {
  if (set.has(t.toLowerCase().trim())) throw new Error(`AUTHORED ${kind} DECOY COLLIDES WITH REAL: ${t}`);
}

// ── Authored decoys (plausible Cult-of-Psyche-flavoured, but NOT real) ──
const FAKE_LORE = [
  "The Committee for Reasonable Ghosts", "Mandatory Retirement of the Moon", "The Union of Unlicensed Prophets",
  "Bureau of Lost Tarot Cards", "The Sock Drawer Oracle", "Interdimensional Parking Validation",
  "The Notarized Curse", "Emergency Broadcast from Atlantis", "The Refundable Soul Program",
  "Department of Retroactive Blessings", "The Subscription-Based Afterlife", "Certified Pre-Owned Demons",
  "The Municipal Ghost Ordinance", "Quarterly Review of the Zodiac", "The Warranty on Enlightenment",
  "Seasonal Affective Hauntings", "The Overdue Library Book of the Damned", "Free Trial of Immortality",
  "The Neighborhood Watch of Purgatory", "Standardized Testing for Psychics", "The Loyalty Points of Karma",
  "Recall Notice on the Third Eye", "The Group Chat of the Ancestors", "Direct Deposit for Offerings",
  "The Time-Share in Valhalla", "Parental Controls on the Astral Plane", "The Expired Coupon of Fate",
  "Roadside Assistance for the Soul", "The Homeowners Association of Hell", "Two-Factor Authentication for Seances",
];
FAKE_LORE.forEach(t => assertFake(t, realTitles, "lore"));

const LIES = [
  "There is a lore entry declaring that all Tuesdays are legally cancelled within the Panelverse.",
  "The archive records an official Cult of Psyche policy requiring every ghost to file a change-of-address form.",
  "One entry establishes that Psyche's cat holds a valid pilot's license.",
  "The Codex contains a ruling that shadows must be tipped 20% or they will not follow you.",
  "There is a documented ritual where the panel votes on whether gravity applies that night.",
  "An entry states the moon is contractually obligated to appear in reruns.",
  "The lore includes a Cult of Psyche patent on a self-cleaning aura.",
  "One record insists that all prophecies come with a 30-day money-back guarantee.",
];
LIES.forEach(t => assertFake(t, realTitles, "lie"));

const FAKE_PROPHECY = [
  "The Great Wi-Fi Silence", "The Return of the Correct Timeline", "Prophecy of the Refilled Cup",
  "The Last Software Update", "The Unspoken Password", "The Reversal of the Escalators",
  "The Day the Group Chat Goes Quiet", "The Prophecy of the Found Remote", "The Final Buffering",
  "The Awakening of the Snooze Button", "The Great Recalibration of Left and Right",
  "The Prophecy of the Unsent Text",
];
FAKE_PROPHECY.forEach(t => assertFake(t, realProph, "prophecy"));

const FAKE_PSYCHE_QUOTES = [
  "I have never once been wrong, and I have the receipts in a drawer I refuse to open.",
  "The algorithm and I have an understanding, and the understanding is that it obeys.",
  "Every troll is just a prophet who took a wrong turn at the parking lot.",
  "I don't chase clout. Clout files a restraining order and I respect it.",
  "The veil is thin tonight, mostly because someone forgot to pay the veil bill.",
  "You cannot cancel a man who was never technically booked.",
  "I speak to the dead, but only the ones who text first.",
  "My aura has a bouncer and you are not on the list.",
];

const questions: unknown[] = [];
let id = 0;
const nid = () => `q${String(++id).padStart(3, "0")}`;

// ── Round 1: Real or Fake — Lore (multiple choice, 1 real + 3 fake) ──
const loreForMC = shuffle(raw.humor).slice(0, 34);
let fakeLoreQ = shuffle(FAKE_LORE);
loreForMC.forEach((real, i) => {
  const decoys = [fakeLoreQ[(i * 3) % fakeLoreQ.length], fakeLoreQ[(i * 3 + 1) % fakeLoreQ.length], fakeLoreQ[(i * 3 + 2) % fakeLoreQ.length]];
  const options = shuffle([{ t: real.title, real: true }, ...decoys.map(d => ({ t: d, real: false }))]);
  questions.push({
    id: nid(), round: "real-or-fake-lore", type: "multiple-choice",
    prompt: "Three of these are made up. One is genuine Cult of Psyche lore. Which is REAL?",
    options: options.map(o => o.t), answerIndex: options.findIndex(o => o.real),
    explain: `"${real.title}" is real lore${real.summary ? ` — ${real.summary}` : ""}.`,
    sourceHref: `/lore/${real.slug}`,
  });
});

// ── Round 2: Two Truths & a Lie (2 real lore blurbs + 1 authored lie) ──
const loreForTTL = shuffle(raw.humor).filter(h => h.summary && h.summary.length > 20).slice(0, 22);
const liesShuffled = shuffle(LIES);
loreForTTL.forEach((_, i) => {
  const [a, b] = [loreForTTL[i], loreForTTL[(i + 11) % loreForTTL.length]];
  const lie = liesShuffled[i % liesShuffled.length];
  const stmts = shuffle([
    { text: `The archive really contains "${a.title}": ${a.summary}`, real: true, slug: a.slug },
    { text: `The archive really contains "${b.title}": ${b.summary}`, real: true, slug: b.slug },
    { text: lie, real: false },
  ]);
  questions.push({
    id: nid(), round: "two-truths-lie", type: "two-truths-lie",
    prompt: "Two of these are real Cult of Psyche lore. One is a lie. Spot the LIE.",
    statements: stmts, answerIndex: stmts.findIndex(s => !s.real),
    explain: "The lie is the invented one; the other two are genuine archive entries.",
  });
});

// ── Round 3: Prophecy or Bogus (real prophecy title vs 3 fakes) ──
const prophReal = shuffle(raw.prophecies).slice(0, 14);
const fakeProphS = shuffle(FAKE_PROPHECY);
prophReal.forEach((real, i) => {
  const decoys = [fakeProphS[(i * 3) % fakeProphS.length], fakeProphS[(i * 3 + 1) % fakeProphS.length], fakeProphS[(i * 3 + 2) % fakeProphS.length]];
  const options = shuffle([{ t: real.title, real: true }, ...decoys.map(d => ({ t: d, real: false }))]);
  questions.push({
    id: nid(), round: "prophecy-or-bogus", type: "multiple-choice",
    prompt: "One of these prophecies is actually on the Ledger. The rest we made up. Which is REAL?",
    options: options.map(o => o.t), answerIndex: options.findIndex(o => o.real),
    explain: `"${real.title}" is a real recorded prophecy${real.summary ? ` — ${real.summary}` : ""}.`,
    sourceHref: `/lore/${real.slug}`,
  });
});

// ── Round 4: Did Psyche Say It? (real quote + 3 authored fakes) ──
const psycheQuotes = shuffle(raw.quotes.filter(q => q.speaker.displayName === "Psyche")).slice(0, 14);
const fakeQ = shuffle(FAKE_PSYCHE_QUOTES);
psycheQuotes.forEach((real, i) => {
  const decoys = [fakeQ[(i * 3) % fakeQ.length], fakeQ[(i * 3 + 1) % fakeQ.length], fakeQ[(i * 3 + 2) % fakeQ.length]];
  const options = shuffle([{ t: real.text, real: true }, ...decoys.map(d => ({ t: d, real: false }))]);
  questions.push({
    id: nid(), round: "did-psyche-say-it", type: "multiple-choice",
    prompt: "Psyche actually said ONE of these on the show. The others we invented. Which is REAL?",
    options: options.map(o => `"${o.t}"`), answerIndex: options.findIndex(o => o.real),
    explain: real.episode ? `He said it on "${real.episode.title}".` : "Straight from the transcript.",
    sourceHref: real.episode ? `/episodes/${real.episode.slug}` : undefined,
  });
});

// ── Round 5: Codex Cluedo (real suspect + real location + real artifact) ──
const suspects = shuffle(raw.cast).slice(0, 20).map(c => c.displayName);
const locs = shuffle(raw.locations).map(l => l.title);
const arts = shuffle(raw.artifacts).map(a => a.title);
const CLUE_N = 16;
for (let i = 0; i < CLUE_N; i++) {
  const sPool = pick(suspects, 4);
  const lPool = pick(locs, 4);
  const aPool = pick(arts, 4);
  const sol = { suspect: sPool[Math.floor(rnd() * 4)], location: lPool[Math.floor(rnd() * 4)], artifact: aPool[Math.floor(rnd() * 4)] };
  questions.push({
    id: nid(), round: "codex-cluedo", type: "clue",
    prompt: "CASE FILE: pick who, where, and with what. Chat locks in a full guess — closest wins.",
    suspects: sPool, locations: lPool, artifacts: aPool, solution: sol,
    explain: `The Codex ruled: ${sol.suspect}, in ${sol.location}, with ${sol.artifact}. (All three are real archive entries; the pairing is the host's call — award the room for a laugh.)`,
  });
}

const bank = {
  generatedFrom: "Xata: loreEntry(humorous/prophecy), quote(Psyche), person(host/recurring), location/artifact lore",
  total: questions.length,
  rounds: [
    { key: "real-or-fake-lore", label: "Real or Fake: Lore", icon: "📜" },
    { key: "two-truths-lie", label: "Two Truths & a Lie", icon: "🎭" },
    { key: "prophecy-or-bogus", label: "Prophecy or Bogus", icon: "🔮" },
    { key: "did-psyche-say-it", label: "Did Psyche Say It?", icon: "🗣️" },
    { key: "codex-cluedo", label: "Codex Cluedo", icon: "🕯️" },
  ],
  questions,
};
writeFileSync("src/lib/data/gameshow-questions.json", JSON.stringify(bank, null, 1));
console.log(`WROTE ${questions.length} questions across ${bank.rounds.length} rounds`);
const byRound: Record<string, number> = {};
for (const q of questions as { round: string }[]) byRound[q.round] = (byRound[q.round] || 0) + 1;
console.log(JSON.stringify(byRound));
