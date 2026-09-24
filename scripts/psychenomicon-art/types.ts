// scripts/psychenomicon-art/types.ts
// Shared TypeScript interfaces for the Psychenomicon art pipeline.

/** Structured symbolic analysis of a single chapter, produced by Claude. */
export interface ChapterAnalysis {
  /** Chapter slug, e.g. "ch-001-the-gate" */
  slug: string;
  /** Human-readable chapter title */
  title: string;
  /** Core psychological/mythological themes */
  themes: string[];
  /** Visual symbols and recurring motifs */
  symbols: string[];
  /** Entities (people / archetypes / creatures) that appear in the chapter */
  entities: string[];
  /** Dominant color palette for the chapter — specific hues, not generic words */
  palette: string[];
  /** Singular mood statement: emotional/atmospheric tone */
  mood: string;
  /** Environmental notes: settings, architecture, spatial qualities */
  atmosphericNotes: string;
  /** Camera/compositional directions for cover and scenes */
  cameraDirections: string[];
  /**
   * Visual descriptors for recurring entities — used verbatim in prompts
   * to enforce consistency across the full Psychenomicon.
   * Key: entity name   Value: precise visual descriptor string
   */
  entityDescriptors: Record<string, string>;
}

/** Four cinematic prompts for a chapter: one cover + three scenes. */
export interface ChapterPrompts {
  cover: string;
  scene_01: string;
  scene_02: string;
  scene_03: string;
}

/** Full output record saved to disk per chapter. */
export interface ChapterArtOutput {
  slug: string;
  title: string;
  chapterNumber: number;
  generatedAt: string;
  analysis: ChapterAnalysis;
  prompts: ChapterPrompts;
  /** Relative paths to generated images from the output root */
  imagePaths: {
    cover: string;
    scene_01: string;
    scene_02: string;
    scene_03: string;
  };
}
