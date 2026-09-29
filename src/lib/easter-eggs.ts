/**
 * Pure logic behind the site's easter eggs, kept separate so it's testable.
 * Client-safe: no DB, no secrets. (The Stairwell's answers live in its
 * route folder names, not here.)
 */

export type Omen = "3:33" | "full-moon" | "halloween" | "friday-13";

const SYNODIC_DAYS = 29.530588853;
// A known new moon: 2000-01-06 18:14 UTC.
const NEW_MOON_EPOCH = Date.UTC(2000, 0, 6, 18, 14);

/** 0 = new, 0.5 = full. */
export function moonPhase(date: Date): number {
  const days = (date.getTime() - NEW_MOON_EPOCH) / 86_400_000;
  return (((days / SYNODIC_DAYS) % 1) + 1) % 1;
}

/** Within about a day of full. */
export function isFullMoon(date: Date): boolean {
  return Math.abs(moonPhase(date) - 0.5) < 0.034;
}

/** Omens in the visitor's local time. */
export function activeOmens(date: Date): Omen[] {
  const omens: Omen[] = [];
  if (date.getHours() === 3 && date.getMinutes() === 33) omens.push("3:33");
  if (isFullMoon(date)) omens.push("full-moon");
  if (date.getMonth() === 9 && date.getDate() === 31) omens.push("halloween");
  if (date.getDay() === 5 && date.getDate() === 13) omens.push("friday-13");
  return omens;
}

export const PROPHECIES = [
  "A guest will say the quiet part out loud. Chat will clip it.",
  "The stream will start late. Something important will happen in the first four minutes anyway.",
  "You will find the card you want in the last pack you can afford.",
  "Somebody in the comments already knows. They're waiting to be asked.",
  "The cat is load-bearing.",
  "An old episode is about to become relevant again.",
  "Look under the footer. Look under the basement.",
  "The seventh time is the one that counts.",
];
