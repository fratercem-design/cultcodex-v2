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

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
