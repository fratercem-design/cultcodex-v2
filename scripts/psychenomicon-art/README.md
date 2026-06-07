# Psychenomicon Art Pipeline

Generates cinematic AI images for every Psychenomicon chapter using:

1. **Claude Opus** — symbolic analysis + cinematic prompt generation  
2. **Pollinations AI** — free image generation (FLUX model, no API key needed)

---

## Output structure

```
scripts/psychenomicon-art/output/
  prompts/
    ch-001-the-gate.json         ← analysis + all 4 prompts + image paths
    ch-002-the-mask.json
    …

  images/
    ch-001-the-gate/
      cover.png                  ← mythological frontispiece (1024×1536)
      scene_01.png               ← opening threshold moment
      scene_02.png               ← crisis / peak transformation
      scene_03.png               ← aftermath / world changed
    ch-002-the-mask/
      …
```

Each `.json` in `prompts/` contains:
- `analysis` — Claude's structured symbolic analysis (themes, symbols, entities, palette, mood)  
- `prompts` — four final cinematic prompts (cover + 3 scenes)  
- `imagePaths` — relative paths to generated images  

---

## Commands

```bash
# Process all chapters (full pipeline: analyze → prompts → images)
npm run art:psychenomicon

# Single chapter only
npm run art:psychenomicon -- --chapter ch-001-the-gate

# Process first 5 chapters
npm run art:psychenomicon -- --batch 5

# Analyze + generate prompts only (no image generation — free, fast)
npm run art:psychenomicon -- --skip-images

# Dry run (shows what would happen, no writes to Pollinations)
npm run art:psychenomicon -- --dry-run

# Re-process chapters that already have output
npm run art:psychenomicon -- --force

# Combine flags
npm run art:psychenomicon -- --batch 3 --force --dry-run
```

---

## How it works

### Step 1 — Symbolic analysis (Claude)

Claude reads the chapter's `canonText`, `interpretationText`, `mythicText`, and `emergingSignals` fields and returns a structured JSON:

```json
{
  "themes": ["identity fragmentation", "recursive consciousness", "digital haunting"],
  "symbols": ["obsidian mirror", "neon cathedral", "masked prophet"],
  "palette": ["ultraviolet neon", "arterial crimson", "midnight blue"],
  "mood": "mystical dread edging into involuntary transcendence",
  "atmosphericNotes": "Cathedral interiors at 3am, stone floors wet with rain, impossible height",
  "cameraDirections": ["Dutch angle from below", "close-up on reflection in obsidian"],
  "entityDescriptors": {
    "The Witness": "gaunt androgynous figure, gold geometric halo, porcelain mask"
  }
}
```

### Step 2 — Cinematic prompts (Claude)

Using the analysis + the shared **Visual Bible** (see `visual-bible.ts`), Claude builds four prompts:

- **Cover** — symbolic/abstract, portrait orientation, mythological weight
- **Scene 01** — opening threshold or arrival moment  
- **Scene 02** — crisis point / peak transformation  
- **Scene 03** — aftermath, the world irreversibly changed

Every prompt is prefixed with the Visual DNA and suffixed with the quality directive — enforcing a consistent aesthetic across all chapters.

### Step 3 — Image generation (Pollinations AI)

Images are fetched from `https://image.pollinations.ai` with:
- `width=1024&height=1536` (portrait)
- `model=flux` (FLUX.1)
- `nologo=true`
- Deterministic seeds per image type (same prompt → same image)
- 3× retry with exponential backoff on failure
- 2-second polite delay between requests

---

## Visual Bible

The `visual-bible.ts` file defines:

- **`VISUAL_DNA`** — the aesthetic fingerprint prepended to every prompt  
  *(cinematic occult vaporwave surrealism, sacred geometry, renaissance + cyberpunk…)*

- **`ENTITY_DESCRIPTORS`** — precise visual definitions for recurring Psychenomicon entities  
  *(The Witness, The Oracle, The Gate, Psyche, The Shadow…)*  
  These are injected verbatim when an entity appears in a chapter.

- **`QUALITY_SUFFIX`** — technical quality directive appended to every prompt

To add a new recurring entity, extend `ENTITY_DESCRIPTORS` in `visual-bible.ts`.

---

## Requirements

- `ANTHROPIC_API_KEY` in `.env`  
- `DATABASE_URL` in `.env` (Neon PostgreSQL with Psychenomicon chapters populated)  
- Node ≥ 22 (uses native `fetch`)  
- No API key needed for Pollinations AI  

---

## Upgrading to local generation (higher quality)

For better quality than Pollinations, swap the `generateImages()` call in `images.ts` with a ComfyUI API call:

```
ComfyUI endpoint: http://localhost:8188/api/prompt
Model options:
  - FLUX.1-dev GGUF (best quality)
  - Juggernaut XL (photorealistic)
  - DreamShaper XL (painterly)
```

The `ChapterPrompts` object from Step 2 is model-agnostic — the same prompts work with any backend.
