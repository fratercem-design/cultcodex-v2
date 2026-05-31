/**
 * Clean transcript artifacts from quote text before displaying it.
 * Replaces raw censored-word placeholders (e.g. "[ __ ]", "[__]", "[ ___ ]")
 * left by the transcription pipeline with a proper em-dash typographic elision.
 * Also strips trailing/leading whitespace and normalises multiple spaces.
 */
export function cleanTranscriptText(text: string): string {
  return text
    .replace(/\[\s*_+\s*\]/g, "—") // [ __ ] → em dash
    .replace(/\s{2,}/g, " ")            // collapse double spaces
    .trim();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export { cleanTitle } from "./clean-title";

const BOILERPLATE_PATTERNS: RegExp[] = [
  /streamyard/i,
  /\$\d+\s*discount/i,
  /new to streaming/i,
  /check out.*and get/i,
  /🎙️?\s*new to/i,
  /level up\?/i,
  /affiliate/i,
  /promo code/i,
  /use code\b/i,
  /sponsored by/i,
];

/**
 * Strip YouTube sponsor/affiliate boilerplate from an episode summary.
 * Filters line-by-line so a single bad sentence doesn't wipe a real summary.
 * Returns null when nothing substantive remains — caller should show empty state.
 */
export function cleanEpisodeSummary(text: string | null | undefined): string | null {
  if (!text) return null;
  const clean = text
    .split(/\n+/)
    .filter((line) => !BOILERPLATE_PATTERNS.some((re) => re.test(line)))
    .join("\n")
    .trim();
  return clean.length >= 20 ? clean : null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
