import { WORDS_PER_SECOND, countWords, parseTranscript, splitSentences } from "./transcript";
import type { Clip, ParsedTranscript, Segment } from "./types";

// Heuristic clip finder. It runs with no API key, so it can only work from
// surface signals (questions, numbers, stories, strong claims). Every title,
// hook and caption is built from the transcript's own words, so it can't
// promise anything the clip doesn't contain.

export const MIN_CLIP_SECONDS = 20;
export const MAX_CLIP_SECONDS = 60;
export const TARGET_CLIPS = 10;

type Signal = "question" | "number" | "story" | "contrarian" | "emotion" | "advice" | "hook";

const HOOK_OPENERS = [
  "here's the thing", "nobody tells you", "the truth is", "what if", "let me tell you",
  "the reason", "the problem is", "this is why", "i've never", "the biggest", "the worst",
  "can i tell", "funny story", "the lesson", "never ", "stop ", "do not ",
];
const CONTRARIAN = [
  "wrong", "myth", "nobody tells", "everyone says", "secret", "mistake", "overrated",
  "makes no sense", "is a lie", "never pay", "the truth", "doesn't hate",
];
const STORY = [
  "i remember", "one time", "funny story", "story time", "worst stream story", "when i was",
  "i told", "she said", "he said", "goes off", "so we're", "i grab", "i sat", "i panic",
];
const EMOTION = [
  "[laughter]", "haha", "lol", "crazy", "insane", "panic", "sad", "miserable", "heavy",
  "scared", "cried", "funny", "broke", "couldn't", "wild",
];
const ADVICE = [
  "you should", "you will", "pick one", "never pay", "the lesson", "advice", "how to",
  "the whole game", "build for", "ship it", "cut it up", "do not ",
];
const LOW_VALUE = [
  "let me see what else", "on the list", "housekeeping", "quick break", "be right back",
  "merch", "link is in the description", "check the chat", "we're back", "grab some water",
  "moving on", "we are live", "mic is", "bye chat", "thanks everybody", "thank you all",
  "welcome back",
];
// Lines that set a moment up. Good openers, weak titles.
const SETUP_RE =
  /^(?:(?:okay|so|alright)[,.]?\s+)?(?:question from chat|first thing|can i tell|i want to go back|let me|so this is a funny story|what happened\??$)|\b\w+ asks\b/i;
// A new topic starting mid-window means the clip would splice two conversations.
const TOPIC_SHIFT_RE =
  /\b(?:question from chat|chat question|in chat just|\w+ asks,|moving on|let's (?:do|take|move)|housekeeping|rapid fire)\b/i;
const QUESTION_START_RE =
  /^(?:what|why|how|who|when|where|which|should|would|could|can|do|does|did|is|are|was|were|will|have|has)\b/i;
const FILLER_RE = /\b(um+|uh+|erm|you know|i mean|i don't know)\b/g;
const NUMBER_RE =
  /\$\s?\d[\d,.]*\s?(?:k|m|million|thousand)?|\b\d[\d,.]*\s?(?:%|percent\b|x\b|k\b|thousand\b|million\b|hundred\b)|\b\d{2,}[\d,]*\b/i;
const LEADING_FILLER_RE =
  /^(?:(?:okay|ok|so|um+|uh+|yeah|well|and|but|honestly\??|actually no|actually|wait|right|alright|look|i mean)[,.?!]?\s+)+/i;

const STOPWORDS = new Set(
  (
    "the a an and or but if then so to of in on at for with from by as is are was were be been being it its " +
    "this that these those i you he she we they me him her us them my your our their mine yours what which who " +
    "whom when where why how all any both each few more most other some such no nor not only own same than too " +
    "very can will just don't should now okay yeah like um uh really actually thing things got get going gonna " +
    "about know think said says say one two also back into out up down over again still even much many well " +
    "didn't doesn't isn't wasn't i'm i've i'd you're we're they're that's there's here's it's let's can't won't " +
    "maybe right time way make made would could there here because every never always people guys chat stuff " +
    "tell told want wanted went come came thought look lot little been have has had does did doing whole last next " +
    "laughter remember somebody everybody everyone anyone someone couldn't couldnt percent description question " +
    "asks asked first makes months hours minutes seconds days weeks year years good great best worst actually " +
    "honestly literally totally single another around through while since sure okay ever made makes being " +
    "said says tonight today week night nobody anything everything something nothing neither either " +
    "yourself myself himself herself half stay grew faster biggest cleared finish finishes"
  ).split(" "),
);

interface Scored {
  text: string;
  score: number;
  signals: Set<Signal>;
  lowValue: boolean;
}

interface ScoredSegment extends Segment, Scored {
  seconds: number;
}

function has(text: string, list: string[]): boolean {
  return list.some((p) => text.includes(p));
}

function scoreText(text: string): Scored {
  const lower = ` ${text.toLowerCase()} `;
  const signals = new Set<Signal>();
  let score = 0;
  const add = (sig: Signal, pts: number) => {
    signals.add(sig);
    score += pts;
  };

  if (text.includes("?")) add("question", 1.5);
  if (NUMBER_RE.test(text)) add("number", 2);
  if (has(lower, STORY)) add("story", 1.5);
  if (has(lower, CONTRARIAN)) add("contrarian", 1.8);
  if (has(lower, EMOTION)) add("emotion", 1.2);
  if (has(lower, ADVICE)) add("advice", 1.5);
  if (HOOK_OPENERS.some((h) => lower.includes(` ${h}`))) add("hook", 1.5);
  if (/\byou(r)?\b/.test(lower)) score += 0.3;

  const fillers = (lower.match(FILLER_RE) ?? []).length;
  score -= fillers * 0.6;
  const lowValue = has(lower, LOW_VALUE);
  if (lowValue) score -= 2.5;
  if (countWords(text) < 4 && !signals.size) score -= 0.3;

  return { text, score, signals, lowValue };
}

function scoreSegment(seg: Segment): ScoredSegment {
  const seconds =
    seg.start !== null && seg.end !== null
      ? Math.max(0.5, seg.end - seg.start)
      : Math.max(1, countWords(seg.text) / WORDS_PER_SECOND);
  return { ...seg, ...scoreText(seg.text), seconds };
}

interface Window {
  from: number;
  to: number;
  score: number;
}

function windowScore(segs: ScoredSegment[], from: number, to: number, seconds: number): number {
  let sum = 0;
  for (let k = from; k <= to; k++) {
    sum += segs[k].score;
    if (k > from && TOPIC_SHIFT_RE.test(segs[k].text)) sum -= 4;
  }
  const first = segs[from];
  const last = segs[to];
  let score = sum / Math.sqrt(seconds / 30);
  // A clip lives or dies on its first line.
  score += Math.max(0, first.score) * 0.8;
  if (first.signals.has("hook") || first.signals.has("question")) score += 1;
  if (first.lowValue || (LEADING_FILLER_RE.test(first.text) && first.score <= 0)) score -= 1.5;
  // Prefer endings that land on a finished thought.
  if (/[.!)\]]$/.test(last.text)) score += 0.4;
  if (last.text.includes("?") && to > from) score -= 0.6; // ends on an unanswered question
  return score;
}

function candidateWindows(segs: ScoredSegment[]): Window[] {
  const out: Window[] = [];
  for (let i = 0; i < segs.length; i++) {
    let seconds = 0;
    for (let j = i; j < segs.length; j++) {
      seconds =
        segs[i].start !== null && segs[j].end !== null
          ? segs[j].end! - segs[i].start!
          : seconds + segs[j].seconds;
      if (seconds > MAX_CLIP_SECONDS && j > i) break;
      if (seconds >= MIN_CLIP_SECONDS || (j === i && seconds > MAX_CLIP_SECONDS)) {
        out.push({ from: i, to: j, score: windowScore(segs, i, j, seconds) });
      }
    }
  }
  return out;
}

function pickWindows(windows: Window[], count: number): Window[] {
  const sorted = [...windows].sort((a, b) => b.score - a.score);
  const chosen: Window[] = [];
  for (const w of sorted) {
    if (chosen.length >= count) break;
    if (chosen.some((c) => w.from <= c.to && c.from <= w.to)) continue;
    chosen.push(w);
  }
  return chosen;
}

// ── Copy generation ────────────────────────────────────────────────────────

function clean(text: string): string {
  return text
    .replace(/\[[^\]]*\]\s*/g, "")
    .replace(LEADING_FILLER_RE, "")
    .replace(/^[A-Z][a-z]+ asks,?\s*/, "")
    .trim();
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Shorten a sentence to at most `maxWords`, preferring a clause boundary. */
export function shorten(text: string, maxWords: number): string {
  const c = capitalize(clean(text));
  const words = c.split(/\s+/);
  if (words.length <= maxWords) return c;
  const head = words.slice(0, maxWords).join(" ");
  // Last clause break (punctuation followed by a space, so "$5,000" survives).
  const cut = Math.max(...[...head.matchAll(/[,;:—–.](?=\s)/g)].map((m) => m.index), -1);
  if (cut > head.length * 0.45) return head.slice(0, cut).trim();
  return `${head.replace(/[,;:.]$/, "")}…`;
}

/** The clip's opening words, verbatim, so an editor can search for them. */
function excerptOf(text: string): string {
  const words = text.replace(/^\[[^\]]*\]\s*/, "").split(/\s+/);
  return words.length > 18 ? `${words.slice(0, 18).join(" ")}…` : words.join(" ");
}

function keywords(text: string, names: Set<string>, n: number): string[] {
  const counts = new Map<string, number>();
  for (const raw of text.toLowerCase().match(/[a-z][a-z'’-]{3,}/g) ?? []) {
    const w = raw.replace(/['’]s$/, "");
    if (STOPWORDS.has(w) || names.has(w) || w.length < 4 || /['’]|ly$|est$|(?<=.{4})ed$/.test(w)) continue;
    counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .slice(0, n)
    .map(([w]) => w);
}

/** Capitalised words that don't start a sentence: probably names, never hashtags. */
function properNouns(text: string): Set<string> {
  const out = new Set<string>();
  for (const m of text.matchAll(/(?<![.!?]\s|^)\b([A-Z][a-z]{2,})\b/g)) out.add(m[1].toLowerCase());
  return out;
}

const SIGNAL_REASON: Record<Signal, string> = {
  hook: "Strong first line",
  question: "Asks a question viewers want answered",
  number: "Specific number",
  story: "Story with a payoff",
  contrarian: "Contrarian take",
  emotion: "Emotional or funny beat",
  advice: "Useful, repeatable advice",
};

const AUDIENCE_PROMPT: Partial<Record<Signal, string>> = {
  contrarian: "Agree or disagree?",
  question: "What would you say?",
  story: "Has this ever happened to you?",
  number: "Did that number surprise you?",
  advice: "Save this for your next stream.",
  emotion: "Tell me you've been there.",
};

const SIGNAL_THUMB: Partial<Record<Signal, string>> = {
  contrarian: "HOT TAKE",
  story: "WHAT HAPPENED",
  advice: "DO THIS",
  number: "THE REAL NUMBERS",
};

function dominantSignal(items: Scored[]): Signal | null {
  const tally = new Map<Signal, number>();
  for (const s of items) for (const sig of s.signals) tally.set(sig, (tally.get(sig) ?? 0) + 1);
  const weight: Record<Signal, number> = {
    contrarian: 1.3, story: 1.2, number: 1.1, advice: 1.1, emotion: 0.9, question: 0.8, hook: 0.5,
  };
  let best: Signal | null = null;
  let bestN = 0;
  for (const [sig, n] of tally) {
    if (n * weight[sig] > bestN) {
      best = sig;
      bestN = n * weight[sig];
    }
  }
  return best;
}

/** The sentence that pays the clip off: the one worth quoting in a title. */
function payoffScore(s: Scored): number {
  const words = countWords(clean(s.text));
  let score = s.score;
  if (s.signals.has("number") || s.signals.has("contrarian") || s.signals.has("advice")) score += 1;
  if (SETUP_RE.test(s.text.trim())) score -= 3;
  if (s.lowValue) score -= 3;
  if (words < 4) score -= 2;
  if (words > 22) score -= 1;
  if (s.text.trim().endsWith("?")) score -= 2.5;
  return score;
}

function buildClip(segs: ScoredSegment[], w: Window, hasTimestamps: boolean): Omit<Clip, "rank" | "score"> {
  const inClip = segs.slice(w.from, w.to + 1);
  const text = inClip.map((s) => s.text).join(" ");
  const sentences = inClip.flatMap((s) => splitSentences(s.text)).map(scoreText);
  const payoff = [...sentences].sort((a, b) => payoffScore(b) - payoffScore(a))[0];
  const signal = dominantSignal(sentences);

  // An opening question from the clip makes the most honest title: it's
  // exactly what the clip answers.
  const openingQuestion = sentences
    .slice(0, 4)
    .find((s) => {
      const q = clean(s.text);
      return (
        q.endsWith("?") &&
        countWords(q) >= 6 &&
        QUESTION_START_RE.test(q) &&
        !SETUP_RE.test(s.text.trim()) &&
        !/\b(it|that|this)\?$/i.test(q)
      );
    });
  const payoffLine = clean(payoff.text);
  const title = openingQuestion
    ? shorten(openingQuestion.text, 14)
    : `“${shorten(payoffLine, 12).replace(/[.!]+$/, "")}”`;


  const names = properNouns(text);
  const kw = keywords(sentences.filter((s) => !s.lowValue).map((s) => s.text).join(" "), names, 3);
  const hashtags = [...kw.map((k) => `#${k.replace(/[^a-z0-9]/g, "")}`), "#shorts", "#podcast", "#livestream"]
    .filter((h, i, arr) => h.length > 2 && arr.indexOf(h) === i);

  const numberMatch = text.match(NUMBER_RE)?.[0]?.trim().replace(/[.,]$/, "");
  const punchy = sentences
    .filter((s) => s.signals.size > 0 && !s.lowValue && !SETUP_RE.test(s.text.trim()))
    .map((s) => clean(s.text).replace(/[.!]+$/, ""))
    // "That's wrong" needs the line before it; a hook has to stand alone.
    .find((s) => countWords(s) >= 2 && countWords(s) <= 5 && !s.endsWith("?") && !/^(that|it|this|those|these)\b/i.test(s));
  // Best hook: a short, complete line with a signal. Otherwise the payoff, cut down.
  const hook = punchy ?? shorten(payoffLine, 8).replace(/[.]+$/, "");
  const thumbs = [
    numberMatch?.toUpperCase(),
    punchy?.toUpperCase(),
    signal ? SIGNAL_THUMB[signal] : undefined,
    kw.length >= 2 ? `${kw[0]} ${kw[1]}`.toUpperCase() : kw[0]?.toUpperCase(),
  ].filter((t): t is string => !!t && t.length > 1);
  const thumbnailText = [...new Set(thumbs)].slice(0, 3);

  const reasons: string[] = [];
  const firstSignals = scoreText(inClip[0].text).signals;
  if (firstSignals.has("hook") || firstSignals.has("question")) reasons.push(SIGNAL_REASON.hook);
  for (const s of sentences) {
    for (const sig of s.signals) {
      if (sig === "hook") continue;
      const reason = sig === "number" && numberMatch ? `Specific number (${numberMatch})` : SIGNAL_REASON[sig];
      if (!reasons.includes(reason)) reasons.push(reason);
    }
  }

  const opener = sentences.find((s) => !s.lowValue && countWords(clean(s.text)) >= 4) ?? sentences[0];
  const summary = [opener, payoff]
    .filter((s, i, arr) => arr.indexOf(s) === i)
    .map((s) => shorten(s.text, 22).replace(/[^.!?…]$/, "$&."))
    .join(" ");
  const prompt = (signal && AUDIENCE_PROMPT[signal]) ?? "Thoughts?";

  return {
    start: hasTimestamps ? inClip[0].start : null,
    end: hasTimestamps ? inClip[inClip.length - 1].end : null,
    excerpt: excerptOf(inClip[0].text),
    title,
    hook,
    shortsDescription: `${summary}\n\nFull stream on the channel. ${[...hashtags.slice(0, 2), "#shorts"].join(" ")}`,
    tiktokCaption: `${hook}${/[?!…]$/.test(hook) ? "" : "."} ${prompt} ${hashtags.slice(0, 5).join(" ")}`,
    thumbnailText,
    hashtags,
    why: reasons.length ? reasons.slice(0, 3) : ["Dense stretch of talk"],
  };
}

export function findClips(parsed: ParsedTranscript, count = TARGET_CLIPS): Clip[] {
  const segs = parsed.segments.map(scoreSegment);
  if (!segs.length) return [];
  const chosen = pickWindows(candidateWindows(segs), count);
  if (!chosen.length) return [];

  const max = Math.max(...chosen.map((w) => w.score));
  const min = Math.min(...chosen.map((w) => w.score));
  const spread = max - min || 1;

  return chosen
    .sort((a, b) => b.score - a.score)
    .map((w, i) => ({
      rank: i + 1,
      score: Math.round(60 + (38 * (w.score - min)) / spread),
      ...buildClip(segs, w, parsed.hasTimestamps),
    }));
}

export function analyzeLocal(raw: string, count = TARGET_CLIPS): { clips: Clip[]; hasTimestamps: boolean } {
  const parsed = parseTranscript(raw);
  return { clips: findClips(parsed, count), hasTimestamps: parsed.hasTimestamps };
}
