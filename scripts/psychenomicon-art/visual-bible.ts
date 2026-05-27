// scripts/psychenomicon-art/visual-bible.ts
//
// The shared visual DNA of the Psychenomicon — prepended to every image
// prompt to enforce a consistent aesthetic across all chapters.
// Treat this like a cinematographer's style bible.

/**
 * Visual DNA prefix prepended to every generated image prompt.
 * Establishes the Psychenomicon's aesthetic language globally.
 */
export const VISUAL_DNA = `
cinematic occult vaporwave surrealism, neon ritual aesthetics, sacred geometry overlaid on organic forms,
psychological horror edging into transcendence, dreamlike symbolism, renaissance oil painting fused with
cyberpunk chrome and ultraviolet light, impossible liminal megastructures, analog horror film grain texture,
marble and obsidian surfaces, divine feminine iconography, hidden sigils embedded in architecture,
cathedral-scale negative space, cosmic dream logic, esoteric neon noir, volumetric god-rays,
chiaroscuro shadow work, baroque compositional density, hyper-detailed material rendering.
`.trim().replace(/\n/g, " ");

/**
 * Recurring entity visual descriptors — used verbatim in prompts to enforce
 * character/archetype consistency across the entire Psychenomicon.
 * When a chapter references one of these entities, insert their descriptor.
 */
export const ENTITY_DESCRIPTORS: Record<string, string> = {
  "The Witness":
    "gaunt androgynous figure, black ceremonial silk robes, gold geometric halo of orbiting sigils, " +
    "featureless porcelain mask, twin violet-luminous eyes behind the mask, bare feet on obsidian floor",

  "The Oracle":
    "elderly woman draped in indigo and silver, eyes replaced by star-field voids, " +
    "dozens of floating tarot cards orbiting her silhouette, voice that manifests as visible golden script",

  "The Architect":
    "chrome humanoid form, face a shifting blueprint grid, hands that draw blueprints in light, " +
    "surrounded by floating sacred geometry, clothes that are structural schematics",

  "The Mourner":
    "translucent figure of grief, ash-colored skin, tears that crystallize into black glass on the cheek, " +
    "wearing a veil of dark smoke, fingers that leave soot-trails in the air",

  "The Gate":
    "titanic obsidian arch etched with living sigils, pulsing violet light from its threshold, " +
    "impossible depth beyond — a starfield or void — flanked by stone figures mid-transformation",

  "Psyche":
    "dark-haired woman in crimson and black, tarot cards orbiting like satellites, " +
    "moth-wing sigils on her forearms, eyes that carry candlelight from within",

  "The Shadow":
    "formless dark presence that mimics human silhouette, edges dissolving into digital static, " +
    "only the eyes are visible — twin amber coals — wearing the negative space of a suit",
};

/**
 * Style suffix added to every prompt to ensure technical image quality.
 */
export const QUALITY_SUFFIX =
  "8K resolution, masterwork digital painting, museum-quality composition, " +
  "rule of thirds, dramatic depth of field, perfect lighting balance, " +
  "hyper-realistic textures, award-winning concept art.";

/**
 * Builds the full prompt from a raw scene description.
 * Prepends VISUAL_DNA and appends QUALITY_SUFFIX.
 * Injects entity descriptors for any referenced entity names.
 */
export function wrapPrompt(
  sceneDescription: string,
  entityNames: string[] = []
): string {
  // Inject matching entity descriptors
  const entityContext = entityNames
    .map((name) => ENTITY_DESCRIPTORS[name])
    .filter(Boolean)
    .join("; ");

  const parts = [
    VISUAL_DNA,
    entityContext ? `Featured entities: ${entityContext}.` : "",
    sceneDescription,
    QUALITY_SUFFIX,
  ].filter(Boolean);

  return parts.join(" ").replace(/\s+/g, " ").trim();
}
