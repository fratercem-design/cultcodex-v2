/**
 * Optional AI-art backdrops for the game show (generated in Canva).
 *
 * Drop the exported PNG/WebP files into `public/images/gameshow/` using the
 * filenames below, then add the key here. Anything NOT listed falls back to the
 * bespoke SVG emblem — so this is safe to ship empty and fill in as art lands
 * (no broken images, no 404s for unlisted rounds).
 *
 * Export from Canva ("Occult Tarot Game Show Backdrop"): Share → Download → PNG →
 * all pages, then save each page as the matching file below.
 */

// Hero backdrop shown behind the page title (Canva slide 1 — the arch + psi sigil).
export const HERO_ART: string | null = null; // e.g. "/images/gameshow/hero.webp"

// Per-round backdrops. Key = round key; value = public path. Fill as files land.
// Suggested mapping from the Canva suite:
//   real-or-fake-lore → slide 2 (ornate round frame)
//   prophecy-or-bogus → slide 3 (crystal ball)
//   two-truths-lie    → slide 4 (twin masks)
//   did-psyche-say-it → slide 5 (vintage mic)
//   codex-cluedo      → slide 6 (detective)
//   troll-or-not      → slide 7 (troll bridge)
//   who-is-it         → slide 8 (hooded figure)
//   general-trivia    → slide 9 (question star)
export const ROUND_ART: Record<string, string> = {
  // "prophecy-or-bogus": "/images/gameshow/rounds/prophecy-or-bogus.webp",
};
