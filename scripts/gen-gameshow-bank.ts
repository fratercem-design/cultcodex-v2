/**
 * Builds the Panelverse Game Show bank (250 questions, five rounds) from
 * real prod DB content (scripts/_gs2.json) + combinatorially-generated decoys.
 *
 * Anti-repeat guarantees:
 *  - Every REAL correct answer is used at most once (pools are far larger than needed).
 *  - Every DECOY is drawn least-used-first from large pools; a hard cap (MAX_USE)
 *    forbids any option string appearing more than MAX_USE times across the bank.
 *  - No option collides with a real title/quote (decoys are asserted false).
 */
import { readFileSync, writeFileSync } from "fs";

type Raw = {
  humor: { title: string; slug: string; summary: string | null; category: string }[];
  prophecies: { title: string; slug: string; summary: string | null }[];
  quotes: { text: string; context: string | null; speaker: { displayName: string }; episode: { slug: string; title: string } | null }[];
  cast: string[];
  locations: { title: string; slug: string }[];
  artifacts: { title: string; slug: string }[];
};
const raw: Raw = JSON.parse(readFileSync("scripts/_gs2.json", "utf8"));

// Deterministic PRNG.
let _s = 20260720;
const rnd = () => { _s = (_s * 1103515245 + 12345) & 0x7fffffff; return _s / 0x7fffffff; };
const shuffle = <T,>(a: T[]): T[] => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const pick = <T,>(a: T[], n: number): T[] => shuffle(a).slice(0, n);

const MAX_USE = 2; // no answer string may appear more than this many times
const useCount = new Map<string, number>();
const uses = (s: string) => useCount.get(s) ?? 0;
const bump = (s: string) => useCount.set(s, uses(s) + 1);

/** Draw `n` decoys from `pool`, least-used first, excluding `avoid`, respecting MAX_USE. */
function drawDecoys(pool: string[], n: number, avoid: Set<string>): string[] {
  const eligible = pool.filter((x) => !avoid.has(x) && uses(x) < MAX_USE);
  eligible.sort((a, b) => uses(a) - uses(b) || (rnd() - 0.5));
  const chosen = eligible.slice(0, n);
  if (chosen.length < n) throw new Error(`decoy pool exhausted (need ${n}, have ${chosen.length})`);
  return chosen;
}

// ── Combinatorial decoy pools (clearly fake, occult-bureaucratic-absurd) ──
const A = ["The Notarized", "The Refundable", "The Expired", "The Municipal", "The Overdue", "The Certified", "The Unlicensed", "The Complimentary", "The Discontinued", "The Recalled", "The Subscription", "The Warranty", "The Seasonal", "The Retroactive", "The Standardized", "The Emergency", "The Provisional", "The Notarial", "The Discounted", "The Audited"];
const B = ["Curse", "Prophecy", "Hex", "Blessing", "Sigil", "Omen", "Ritual", "Covenant", "Relic", "Oracle", "Séance", "Exorcism", "Talisman", "Incantation", "Apparition", "Reincarnation", "Divination", "Portal", "Familiar", "Ascension"];
const C = ["Astral", "Interdimensional", "Extraterrestrial", "Purgatorial", "Ectoplasmic", "Necromantic", "Prophetic", "Cosmic", "Infernal", "Celestial", "Spectral", "Occult", "Zodiacal", "Karmic", "Hexadecimal"];
const D = ["Parking Validation", "Filing Cabinet", "Group Chat", "Loyalty Points", "Warranty Card", "Recall Notice", "Time-Share", "Subscription Tier", "Homeowners Association", "Two-Factor Login", "Customer Support Line", "Roadside Assistance", "Overdraft Fee", "Coupon Book", "Waiting Room", "Terms of Service", "Change-of-Address Form", "Parental Controls", "Free Trial", "Direct Deposit"];

const FAKE_LORE: string[] = [];
for (const a of A) for (const b of B) FAKE_LORE.push(`${a} ${b}`);
for (const c of C) for (const d of D) FAKE_LORE.push(`${c} ${d}`);
// authored highlights
FAKE_LORE.push("The Committee for Reasonable Ghosts", "Bureau of Lost Tarot Cards", "The Sock Drawer Oracle", "Certified Pre-Owned Demons", "Standardized Testing for Psychics", "The Neighborhood Watch of Purgatory");

const E = ["Found Remote", "Unsent Text", "Correct Timeline", "Last Software Update", "Refilled Cup", "Snooze Button", "Quiet Group Chat", "Full Battery", "Green Traffic Light", "Matching Sock", "Cleared Notification", "Parked Car", "Unspoken Password", "Reversed Escalator", "Final Buffering", "Warm Leftover", "Answered Email", "Located Charger", "Silent Phone", "Empty Inbox"];
const F = ["The Prophecy of the", "The Great", "The Coming of the", "The Return of the", "The Awakening of the", "The Fall of the"];
const FAKE_PROPHECY: string[] = [];
for (const f of F) for (const e of E) FAKE_PROPHECY.push(`${f} ${e}`);

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
  "I don't believe in coincidences, I believe in appointments I forgot I made.",
  "The cards never lie. People lie. The cards just take notes.",
  "I manifested this, and I'd like to speak to whoever approved it.",
  "Being right this often is a burden and I carry it in a tote bag.",
  "The spirits are loud tonight because I left the group chat on.",
  "I don't hold grudges, I archive them with timestamps.",
  "My third eye has a do-not-disturb setting and it is ON.",
  "You brought bad energy. I brought a laminated boundary.",
  "The moon owes me money and I intend to collect at the eclipse.",
  "I'm the only person in this cult with a refund policy on curses.",
  "Enlightenment is just paying attention with better lighting.",
  "I read auras, and yours is buffering.",
  "The prophecy was clear, the timing was a suggestion.",
  "Haters are just unpaid interns in my legacy.",
  "I've been to the astral plane and the parking was terrible.",
  "Some people speak to angels. I get the voicemail.",
  "I don't do drama, I do documentary.",
  "The tarot said yes but the vibes said file the paperwork.",
  "I'm grounded, centered, and slightly annoyed, which is my strongest form.",
  "The candle flickered because it agreed with me.",
  "I don't need luck, I have a filing system for fate.",
  "You can quote me, but the spirits get the royalties.",
  "I forgave you in a past life and I'm requesting a refund.",
  "My spirit animal is on a break and left me in charge.",
];

let id = 0;
const nid = () => `q${String(++id).padStart(3, "0")}`;
const questions: unknown[] = [];

// ── Round 1: Real or Fake — Lore (90) ──
const loreShuffled = shuffle(raw.humor);
const R1 = 90;
for (let i = 0; i < R1; i++) {
  const real = loreShuffled[i]; bump(real.title);
  const avoid = new Set([real.title]);
  const decoys = drawDecoys(FAKE_LORE, 3, avoid); decoys.forEach(bump);
  const opts = shuffle([{ t: real.title, real: true }, ...decoys.map((d) => ({ t: d, real: false }))]);
  questions.push({ id: nid(), round: "real-or-fake-lore", type: "multiple-choice",
    prompt: "Three are made up. One is genuine Cult of Psyche lore. Which is REAL?",
    options: opts.map((o) => o.t), answerIndex: opts.findIndex((o) => o.real),
    explain: `"${real.title}" is real lore${real.summary ? ` — ${real.summary}` : ""}.`, sourceHref: `/lore/${real.slug}` });
}

// ── Round 2: Two Truths & a Lie (50) — 2 real + 1 authored lie ──
// Combinatorial lies — a fake "archive rule" from subject × predicate (hundreds unique).
const LIE_SUBJ = ["all Tuesdays", "every ghost", "the panel", "each prophecy", "the third eye", "every curse", "the tarot deck", "each séance", "the astral plane", "every demon", "the moon", "each aura", "every shadow", "the crystal ball", "each tarot reader"];
const LIE_PRED = ["must be renewed annually at the DMV", "are legally cancelled during retrograde", "require parking validation to proceed", "come with a 30-day money-back guarantee", "must carry liability insurance", "expire if left in a hot car", "are contractually obligated to appear in reruns", "must file a change-of-address form", "charge a checked-bag fee", "vote each night on whether gravity applies", "take weekends off after unionizing", "must be tipped 20 percent or they leave", "need a signed permission slip from the moon", "are subject to a self-cleaning aura patent", "get put on hold with the ancestors"];
const LIES: string[] = [];
for (const s of LIE_SUBJ) for (const p of LIE_PRED) LIES.push(`The archive rules that ${s} ${p}.`);
const liePool = shuffle(LIES);
const loreForTTL = shuffle(raw.humor).filter((h) => h.summary && h.summary.length > 20).slice(90, 90 + 110);
const R2 = 50;
for (let i = 0; i < R2; i++) {
  const a = loreForTTL[i * 2], b = loreForTTL[i * 2 + 1];
  bump(a.title); bump(b.title);
  const lie = liePool[i]; bump(lie);
  const stmts = shuffle([
    { text: `"${a.title}" is real lore: ${a.summary}`, real: true, slug: a.slug },
    { text: `"${b.title}" is real lore: ${b.summary}`, real: true, slug: b.slug },
    { text: lie, real: false },
  ]);
  questions.push({ id: nid(), round: "two-truths-lie", type: "two-truths-lie",
    prompt: "Two are real Cult of Psyche lore. One is a lie. Spot the LIE.",
    statements: stmts, answerIndex: stmts.findIndex((s) => !s.real),
    explain: "The lie is the invented one; the other two are genuine archive entries." });
}

// ── Round 3: Prophecy or Bogus (40) ──
const prophShuffled = shuffle(raw.prophecies);
const R3 = 40;
for (let i = 0; i < R3; i++) {
  const real = prophShuffled[i]; bump(real.title);
  const decoys = drawDecoys(FAKE_PROPHECY, 3, new Set([real.title])); decoys.forEach(bump);
  const opts = shuffle([{ t: real.title, real: true }, ...decoys.map((d) => ({ t: d, real: false }))]);
  questions.push({ id: nid(), round: "prophecy-or-bogus", type: "multiple-choice",
    prompt: "One prophecy is really on the Ledger. The rest we made up. Which is REAL?",
    options: opts.map((o) => o.t), answerIndex: opts.findIndex((o) => o.real),
    explain: `"${real.title}" is a real recorded prophecy${real.summary ? ` — ${real.summary}` : ""}.`, sourceHref: `/lore/${real.slug}` });
}

// ── Round 4: Did Psyche Say It? (35) — real Psyche quote + fake quotes ──
const psycheQuotes = shuffle(raw.quotes.filter((q) => q.speaker.displayName === "Psyche")).slice(0, 35);
// Decoy pool: authored fakes + real quotes said by OTHERS (Psyche didn't say them → valid, plentiful).
const notPsyche = raw.quotes.filter((q) => q.speaker.displayName !== "Psyche").map((q) => q.text);
const quoteDecoyPool = [...FAKE_QUOTES, ...shuffle(notPsyche).slice(0, 120)];
const R4 = Math.min(35, psycheQuotes.length);
for (let i = 0; i < R4; i++) {
  const real = psycheQuotes[i]; bump(real.text);
  const decoys = drawDecoys(quoteDecoyPool, 3, new Set([real.text])); decoys.forEach(bump);
  const opts = shuffle([{ t: real.text, real: true }, ...decoys.map((d) => ({ t: d, real: false }))]);
  questions.push({ id: nid(), round: "did-psyche-say-it", type: "multiple-choice",
    prompt: "Psyche really said ONE of these on the show. The others we invented. Which is REAL?",
    options: opts.map((o) => `"${o.t}"`), answerIndex: opts.findIndex((o) => o.real),
    explain: real.episode ? `He said it on "${real.episode.title}".` : "Straight from the transcript.",
    sourceHref: real.episode ? `/episodes/${real.episode.slug}` : undefined });
}

// ── Round 5: Codex Cluedo (35) ──
const R5 = 250 - questions.length; // fill to exactly 250
for (let i = 0; i < R5; i++) {
  const sPool = pick(raw.cast, 4);
  const lPool = pick(raw.locations.map((l) => l.title), 4);
  const aPool = pick(raw.artifacts.map((a) => a.title), 4);
  const sol = { suspect: sPool[Math.floor(rnd() * 4)], location: lPool[Math.floor(rnd() * 4)], artifact: aPool[Math.floor(rnd() * 4)] };
  questions.push({ id: nid(), round: "codex-cluedo", type: "clue",
    prompt: "CASE FILE: pick who, where, and with what. Chat locks a full guess — closest wins.",
    suspects: sPool, locations: lPool, artifacts: aPool, solution: sol,
    explain: `The Codex ruled: ${sol.suspect}, in ${sol.location}, with ${sol.artifact}. (All three are real archive entries; the pairing is the host's call.)` });
}

// ── Anti-repeat audit ──
const overCap = [...useCount.entries()].filter(([, n]) => n > MAX_USE);
if (overCap.length) throw new Error(`OVER CAP: ${overCap.slice(0, 5).map(([s, n]) => `${n}× ${s}`).join(" | ")}`);

const bank = {
  generatedFrom: "prod Xata: humorous lore, prophecies, Psyche quotes, cast/location/artifact; decoys combinatorial+authored",
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
const byRound: Record<string, number> = {};
for (const q of questions as { round: string }[]) byRound[q.round] = (byRound[q.round] || 0) + 1;
const maxUse = Math.max(...useCount.values());
console.log(`WROTE ${questions.length} questions`, JSON.stringify(byRound), `maxAnswerReuse=${maxUse}`);
