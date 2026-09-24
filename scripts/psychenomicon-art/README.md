# Psychenomicon Art Pipeline

Generates resumable cinematic art for Psychenomicon chapters still missing published images.

1. **HCNSEC text model** — symbolic analysis + compact cinematic prompts
2. **Step Image Edit 2** — image generation through HCNSEC's OpenAI-compatible API
3. **Local-first output** — nothing is written to the live database without `--publish`

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
      cover.png                  ← mythological frontispiece (1024×1024 by default)
      scene_01.png               ← opening threshold moment
      scene_02.png               ← crisis / peak transformation
      scene_03.png               ← aftermath / world changed
    ch-002-the-mask/
      …
```

Each `.json` in `prompts/` contains:
- `analysis` — structured symbolic analysis (themes, symbols, entities, palette, mood)
- `prompts` — four final cinematic prompts (cover + 3 scenes)  
- `imagePaths` — relative paths to generated images  

---

## Commands

```bash
# Report exact database and local coverage; no AI calls or writes
npm run art:psychenomicon -- --inventory

# Generate the next missing chapter locally (four images)
npm run art:psychenomicon

# Single chapter only
npm run art:psychenomicon -- --chapter ch-001-the-gate

# Process first 5 chapters
npm run art:psychenomicon -- --batch 5

# Analyze + generate prompts only (uses the configured text model)
npm run art:psychenomicon -- --skip-images

# Dry run (build prompts, but do not call the image endpoint)
npm run art:psychenomicon -- --dry-run

# Publish locally complete images after review (writes to the configured DB)
npm run art:psychenomicon -- --chapter chapter-025 --publish

# Re-process chapters that already have output
npm run art:psychenomicon -- --force

# Combine flags
npm run art:psychenomicon -- --batch 3 --force --dry-run
```

---

## How it works

### Step 1 — Symbolic analysis

The configured text model reads `canonText`, `interpretationText`, `mythicText`, and `emergingSignals` and returns structured JSON:

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

### Step 2 — Compact cinematic prompts

Using the analysis + the shared **Visual Bible** (see `visual-bible.ts`), the text model builds four prompts:

- **Cover** — symbolic/abstract, portrait orientation, mythological weight
- **Scene 01** — opening threshold or arrival moment  
- **Scene 02** — crisis point / peak transformation  
- **Scene 03** — aftermath, the world irreversibly changed

Every prompt includes compact visual DNA and quality requirements while remaining within Step Image Edit 2's 512-character limit.

### Step 3 — Image generation (HCNSEC)

Images are requested from `https://api.hcnsec.cn/v1/images/generations` with:
- `model=step-image-edit-2`
- `size=1024x1024` by default
- `response_format=b64_json` for durable local output
- stable requested seeds derived from each prompt and slot
- four attempts with exponential backoff
- a configurable polite delay between requests

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

- `HCNSEC_API_KEY` set in the current shell (do not commit it)
- `DATABASE_URL` for the current Xata/Postgres database
- Node ≥ 22 (uses native `fetch`)  

Optional overrides: `ART_TEXT_MODEL`, `ART_IMAGE_MODEL`, `ART_API_BASE_URL`,
`ART_IMAGE_SIZE`, `ART_IMAGE_DELAY_MS`, and `ART_IMAGE_PROMPT_MAX_CHARS`.

The runner is local-only by default. `--publish` is required for database writes.

---

## Optional local generation

To use ComfyUI instead, implement another OpenAI-compatible provider adapter or replace `generateImages()`:

```
ComfyUI endpoint: http://localhost:8188/api/prompt
Model options:
  - FLUX.1-dev GGUF (best quality)
  - Juggernaut XL (photorealistic)
  - DreamShaper XL (painterly)
```

The `ChapterPrompts` object from Step 2 is model-agnostic — the same prompts work with any backend.
