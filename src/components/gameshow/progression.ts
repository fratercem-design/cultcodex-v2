// Client-side progression for the Panelverse Game Show — XP, ranks, streaks,
// and achievements, persisted in localStorage. No login required; a real
// server-backed leaderboard can layer on later using the same events.

export type RoundMeta = { name: string; tag: string; desc: string };

// Evocative identity per round (keys match the question bank round keys).
export const ROUND_META: Record<string, RoundMeta> = {
  "real-or-fake-lore": { name: "Lore or Lie", tag: "👁 LORE", desc: "Real cult lore hides among convincing fakes. Trust nothing." },
  "two-truths-lie": { name: "Two Truths & a Lie", tag: "🎭 DECEPTION", desc: "Two entries are genuine canon. One is fabricated. Find it." },
  "prophecy-or-bogus": { name: "The Prophecy Ledger", tag: "🔮 PROPHECY", desc: "One omen was truly foretold on stream. The rest, we invented." },
  "did-psyche-say-it": { name: "Did Psyche Say It?", tag: "🎙 QUOTES", desc: "One line is a real transcript quote. The others are impostors." },
  "codex-cluedo": { name: "Codex Cluedo", tag: "🕯 MYSTERY", desc: "One real suspect, place, and relic hide among fakes. Solve it." },
  "troll-or-not": { name: "Troll Tribunal", tag: "👹 TROLLS", desc: "The Trollopedia is real. Spot the true troll among the frauds." },
  "who-is-it": { name: "Legendary Guests", tag: "🕵 PEOPLE", desc: "A real bio from the archive. Name the cult member it describes." },
  "general-trivia": { name: "Occult Trivia", tag: "🧠 CRAFT", desc: "Tarot, astrology, the esoteric — how deep does your craft run?" },
  "name-that-realm": { name: "Name That Realm", tag: "🖼️ MULTIMEDIA", desc: "Real artwork from the archive. Which corner of the Cult is it?" },
  "real-title": { name: "Real Title or Fake?", tag: "🤯 ABSURD", desc: "The real episode titles are unhinged. Can you spot the genuine one?" },
  "finish-the-lore": { name: "Finish the Lore", tag: "✍️ FILL-IN", desc: "Complete a real (and deeply strange) lore title. Trust the chaos." },
};

export const RANKS = [
  { name: "Initiate", at: 0 },
  { name: "Acolyte", at: 100 },
  { name: "Keeper", at: 300 },
  { name: "Oracle", at: 700 },
  { name: "Mythwalker", at: 1500 },
] as const;

export const XP_PER_CORRECT = 10;

export type Achievement = { id: string; label: string; hint: string };
export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-blood", label: "🏆 First Blood", hint: "Answer your first question." },
  { id: "streak-5", label: "🔥 On Fire", hint: "Five correct in a row." },
  { id: "lore-hunter", label: "📜 Lore Hunter", hint: "10 correct in Lore rounds." },
  { id: "troll-whisperer", label: "👹 Troll Whisperer", hint: "5 correct in the Troll Tribunal." },
  { id: "tarot-adept", label: "🃏 Tarot Adept", hint: "5 correct in Occult Trivia." },
  { id: "panel-survivor", label: "🎭 Panel Survivor", hint: "25 total correct." },
  { id: "archivist", label: "🗝 Archivist", hint: "Open 5 archive doorways." },
  { id: "oracles-favorite", label: "🔮 Oracle's Favorite", hint: "Reach the rank of Oracle." },
  { id: "chaos-incarnate", label: "💥 Chaos Incarnate", hint: "100 total correct." },
  { id: "daily-devotee", label: "📿 Daily Devotee", hint: "A 7-day challenge streak." },
];

export const DAILY_BONUS_XP = 50;

export type ProgressState = {
  xp: number;
  correct: number;
  streak: number;
  bestStreak: number;
  archiveClicks: number;
  byRound: Record<string, number>;
  unlocked: string[];
  lastDaily: string;   // YYYY-MM-DD of last completed daily challenge
  dailyStreak: number; // consecutive days
  spins: number;       // unspent prize-wheel spins
  titles: string[];    // unlocked titles
  activeTitle: string; // the title currently worn (shown by rank)
};

const KEY = "cc_gameshow_v1";
const EMPTY: ProgressState = { xp: 0, correct: 0, streak: 0, bestStreak: 0, archiveClicks: 0, byRound: {}, unlocked: [], lastDaily: "", dailyStreak: 0, spins: 0, titles: [], activeTitle: "" };

// One spin earned per this many correct answers.
export const CORRECT_PER_SPIN = 5;

// Wearable titles the wheel can grant.
export const TITLE_POOL = [
  "the Unhinged", "Keeper of Cats", "Troll's Bane", "Oracle's Pet", "Chaos Certified",
  "Lore Goblin", "the Sleepless", "Prophecy Addict", "Panel Survivor", "Certified Cultist",
  "the Beloved", "Whisper-Network Nemesis", "Ma Matangi's Favorite", "the Notarized", "Vibe Custodian",
];

export type Prize =
  | { kind: "xp"; amount: number; label: string }
  | { kind: "title"; title: string; label: string }
  | { kind: "spins"; amount: number; label: string }
  | { kind: "flavor"; label: string };

// Weighted wheel segments (in display order).
export const WHEEL: { weight: number; make: (s: ProgressState) => Prize }[] = [
  { weight: 22, make: () => ({ kind: "xp", amount: 25, label: "+25 XP" }) },
  { weight: 10, make: () => ({ kind: "xp", amount: 100, label: "+100 XP" }) },
  { weight: 16, make: () => ({ kind: "flavor", label: "The Codex smiles" }) },
  { weight: 14, make: (s) => { const t = TITLE_POOL.find((x) => !s.titles.includes(x)); return t ? { kind: "title", title: t, label: `Title: ${t}` } : { kind: "xp", amount: 50, label: "+50 XP" }; } },
  { weight: 18, make: () => ({ kind: "xp", amount: 50, label: "+50 XP" }) },
  { weight: 8, make: () => ({ kind: "spins", amount: 2, label: "🎡 +2 Spins!" }) },
  { weight: 12, make: () => ({ kind: "xp", amount: 10, label: "+10 XP" }) },
];

/** Local calendar day as YYYY-MM-DD. */
export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dayNumber(key: string): number {
  return Math.floor(Date.parse(`${key}T00:00:00Z`) / 86_400_000);
}
/** Deterministic daily question index — everyone gets the same one each day. */
export function dailyIndex(total: number, key = todayKey()): number {
  if (total <= 0) return 0;
  return ((dayNumber(key) * 2654435761) % total + total) % total;
}
export function isDailyDone(s: ProgressState): boolean {
  return s.lastDaily === todayKey();
}

export function load(): ProgressState {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY };
  }
}

function save(s: ProgressState) {
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export function rankFor(xp: number) {
  let cur: (typeof RANKS)[number] = RANKS[0];
  let next: (typeof RANKS)[number] | null = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (xp >= RANKS[i].at) { cur = RANKS[i]; next = RANKS[i + 1] ?? null; }
  }
  const floor = cur.at;
  const ceil = next?.at ?? cur.at;
  const progress = next ? Math.min(1, (xp - floor) / (ceil - floor)) : 1;
  return { name: cur.name, next: next?.name ?? null, progress, toNext: next ? ceil - xp : 0 };
}

function checkAchievements(s: ProgressState): string[] {
  const has = new Set(s.unlocked);
  const add: string[] = [];
  const want = (id: string, cond: boolean) => { if (cond && !has.has(id)) { add.push(id); has.add(id); } };
  const loreCorrect = (s.byRound["real-or-fake-lore"] ?? 0) + (s.byRound["two-truths-lie"] ?? 0);
  want("first-blood", s.correct >= 1);
  want("streak-5", s.bestStreak >= 5);
  want("lore-hunter", loreCorrect >= 10);
  want("troll-whisperer", (s.byRound["troll-or-not"] ?? 0) >= 5);
  want("tarot-adept", (s.byRound["general-trivia"] ?? 0) >= 5);
  want("panel-survivor", s.correct >= 25);
  want("archivist", s.archiveClicks >= 5);
  want("oracles-favorite", s.xp >= 700);
  want("chaos-incarnate", s.correct >= 100);
  want("daily-devotee", s.dailyStreak >= 7);
  return add;
}

export type AnswerResult = { state: ProgressState; newAchievements: Achievement[]; rankedUp: string | null; xpGained: number; spinEarned?: boolean };

export function recordAnswer(roundKey: string, correct: boolean): AnswerResult {
  const s = load();
  const prevRank = rankFor(s.xp).name;
  const xpGained = correct ? XP_PER_CORRECT : 0;
  let spinEarned = false;
  if (correct) {
    const before = s.correct;
    s.correct += 1;
    s.xp += XP_PER_CORRECT;
    s.streak += 1;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
    s.byRound[roundKey] = (s.byRound[roundKey] ?? 0) + 1;
    if (Math.floor(s.correct / CORRECT_PER_SPIN) > Math.floor(before / CORRECT_PER_SPIN)) { s.spins += 1; spinEarned = true; }
  } else {
    s.streak = 0;
  }
  const newIds = checkAchievements(s);
  s.unlocked = [...new Set([...s.unlocked, ...newIds])];
  save(s);
  const newAchievements = ACHIEVEMENTS.filter((a) => newIds.includes(a.id));
  const rankedUp = rankFor(s.xp).name !== prevRank ? rankFor(s.xp).name : null;
  return { state: s, newAchievements, rankedUp, xpGained, spinEarned };
}

/** Spend one spin. Returns the landed prize + index (for the wheel animation) and new state. */
export function spinWheel(): { prize: Prize; index: number; state: ProgressState } | null {
  const s = load();
  if (s.spins <= 0) return null;
  s.spins -= 1;
  const total = WHEEL.reduce((a, w) => a + w.weight, 0);
  let r = rnd() * total, index = 0;
  for (let i = 0; i < WHEEL.length; i++) { if (r < WHEEL[i].weight) { index = i; break; } r -= WHEEL[i].weight; }
  const prize = WHEEL[index].make(s);
  if (prize.kind === "xp") s.xp += prize.amount;
  else if (prize.kind === "spins") s.spins += prize.amount;
  else if (prize.kind === "title") { s.titles = [...new Set([...s.titles, prize.title])]; if (!s.activeTitle) s.activeTitle = prize.title; }
  save(s);
  return { prize, index, state: s };
}

export function setActiveTitle(title: string): ProgressState {
  const s = load();
  s.activeTitle = s.titles.includes(title) || title === "" ? title : s.activeTitle;
  save(s);
  return s;
}

// Deterministic-free RNG is fine on the client (not the workflow sandbox).
function rnd(): number { return Math.random(); }

/** Complete today's daily challenge. Awards bonus XP + advances the day streak. */
export function recordDaily(correct: boolean): AnswerResult {
  const s = load();
  if (isDailyDone(s)) return { state: s, newAchievements: [], rankedUp: null, xpGained: 0 };
  const prevRank = rankFor(s.xp).name;
  const today = todayKey();
  const yesterday = todayKey(new Date(Date.now() - 86_400_000));
  s.dailyStreak = s.lastDaily === yesterday ? s.dailyStreak + 1 : 1;
  s.lastDaily = today;
  let xpGained = 0;
  if (correct) {
    xpGained = DAILY_BONUS_XP;
    s.xp += DAILY_BONUS_XP;
    s.correct += 1;
    s.streak += 1;
    s.bestStreak = Math.max(s.bestStreak, s.streak);
  }
  const newIds = checkAchievements(s);
  s.unlocked = [...new Set([...s.unlocked, ...newIds])];
  save(s);
  const rankedUp = rankFor(s.xp).name !== prevRank ? rankFor(s.xp).name : null;
  return { state: s, newAchievements: ACHIEVEMENTS.filter((a) => newIds.includes(a.id)), rankedUp, xpGained };
}

export function recordArchiveClick(): AnswerResult {
  const s = load();
  s.archiveClicks += 1;
  const newIds = checkAchievements(s);
  s.unlocked = [...new Set([...s.unlocked, ...newIds])];
  save(s);
  return { state: s, newAchievements: ACHIEVEMENTS.filter((a) => newIds.includes(a.id)), rankedUp: null, xpGained: 0 };
}
