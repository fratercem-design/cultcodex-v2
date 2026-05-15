const BRAND_PREFIXES = /^(Cult of Psyche\s*[-|:–—]\s*)/i;

export function cleanTitle(title: string): string {
  return title.replace(BRAND_PREFIXES, "").trim();
}
