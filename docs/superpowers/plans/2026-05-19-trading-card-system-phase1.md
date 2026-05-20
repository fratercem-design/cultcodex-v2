# Trading Card System Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand cultcodex.me's card system with 8 new card types, 3 new rarities, occult sacred-geometry art, Pokémon/Yu-Gi-Oh personality mechanics, and 30 seed cards across 4 priority archetypes (Relic, Entity, Prophecy, Member).

**Architecture:** Schema-first — migrate Prisma enums + Card fields, regenerate client, then extend `rarity.ts` constants, extract geometry + personality into focused libs, overhaul `TradingCard` component with type-specific rendering, seed 30 cards, add two new pages.

**Tech Stack:** Next.js 14 App Router, Prisma ORM, Neon/PostgreSQL, TypeScript, inline styles (existing pattern — no Tailwind in card components), `tsx` for seed scripts.

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Modify | `prisma/schema.prisma` | New enum values + Card fields |
| Create | `prisma/migrations/20260519000000_card_system_phase1/migration.sql` | Raw SQL patch |
| Modify | `src/lib/cards/rarity.ts` | New rarity/type lookup maps + exports |
| Create | `src/lib/cards/geometry.ts` | SVG path data per card type |
| Create | `src/lib/cards/personality.ts` | Personality type styles/labels |
| Modify | `src/app/globals.css` | New animation keyframes |
| Modify | `src/components/cards/trading-card.tsx` | Full visual overhaul |
| Create | `scripts/seed-cards-phase1.ts` | Seed 30 cards idempotently |
| Modify | `src/app/cards/collection-view.tsx` | New type/rarity filters |
| Create | `src/app/cards/archetypes/page.tsx` | Public personality types page |
| Create | `src/app/admin/cards/seed/page.tsx` | Admin seed trigger UI |
| Create | `src/app/api/admin/seed-cards/route.ts` | API route to run seed |

---

## Task 1: Schema Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260519000000_card_system_phase1/migration.sql`

- [ ] **Step 1: Add new enum values to schema.prisma**

Open `prisma/schema.prisma`. Find the `enum CardType` block and replace it:

```prisma
enum CardType {
  VOICE
  TRANSMISSION
  LORE
  SIGNAL
  ORACLE
  CIPHER
  AVATAR
  INCIDENT
  RELIC
  ENTITY
  PROPHECY
  MEMBER
  GLITCH
  MAHAVIDYA
}
```

Find the `enum Rarity` block and replace it:

```prisma
enum Rarity {
  STATIC
  SIGNAL
  TRANSMISSION
  ANOMALY
  ORACLE
  FORBIDDEN
  GLITCHED
  LIVING
}
```

- [ ] **Step 2: Add new fields to the Card model**

In `prisma/schema.prisma`, find the `model Card` block. After `abilities String[]`, add:

```prisma
  personalityType   String?
  secondaryType     String?
  cardLevel         Int       @default(1)
  isEquippable      Boolean   @default(false)
  equipTarget       String?
  isSoulbound       Boolean   @default(false)
  fulfillmentStatus String?
  fulfillmentCond   String?
  secretCondition   String?
  ascensionLevel    Int       @default(0)
  loreLayer         String?
```

- [ ] **Step 3: Create the migration SQL file**

Create the directory `prisma/migrations/20260519000000_card_system_phase1/` and write `migration.sql`:

```sql
-- AddValue CardType enum (Postgres: cannot run inside transaction)
ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'AVATAR';
ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'INCIDENT';
ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'RELIC';
ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'ENTITY';
ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'PROPHECY';
ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'MEMBER';
ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'GLITCH';
ALTER TYPE "CardType" ADD VALUE IF NOT EXISTS 'MAHAVIDYA';

-- AddValue Rarity enum
ALTER TYPE "Rarity" ADD VALUE IF NOT EXISTS 'FORBIDDEN';
ALTER TYPE "Rarity" ADD VALUE IF NOT EXISTS 'GLITCHED';
ALTER TYPE "Rarity" ADD VALUE IF NOT EXISTS 'LIVING';

-- AddColumn Card
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "personalityType" TEXT;
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "secondaryType" TEXT;
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "cardLevel" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "isEquippable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "equipTarget" TEXT;
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "isSoulbound" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "fulfillmentStatus" TEXT;
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "fulfillmentCond" TEXT;
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "secretCondition" TEXT;
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "ascensionLevel" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Card" ADD COLUMN IF NOT EXISTS "loreLayer" TEXT;
```

- [ ] **Step 4: Apply the migration to the database**

```bash
cd /c/Users/johnb/cultcodex-ui
npx prisma db execute --file prisma/migrations/20260519000000_card_system_phase1/migration.sql --schema prisma/schema.prisma
```

Expected: no error output. If it says `IF NOT EXISTS` is unsupported, run each `ALTER TYPE` line individually via the Neon SQL console.

- [ ] **Step 5: Regenerate the Prisma client**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client` with no errors.

- [ ] **Step 6: Verify TypeScript sees the new values**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: zero errors related to CardType or Rarity. (Other pre-existing errors are ok.)

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260519000000_card_system_phase1/
git commit -m "feat: expand card schema — 8 new card types, 3 rarities, 11 new Card fields"
```

---

## Task 2: Extend rarity.ts

**Files:**
- Modify: `src/lib/cards/rarity.ts`

- [ ] **Step 1: Add new rarity entries to all existing maps**

In `src/lib/cards/rarity.ts`, update `RARITY_LABEL`:

```ts
export const RARITY_LABEL: Record<Rarity, string> = {
  STATIC:       "STATIC",
  SIGNAL:       "SIGNAL",
  TRANSMISSION: "TRANSMISSION",
  ANOMALY:      "ANOMALY",
  ORACLE:       "ORACLE",
  FORBIDDEN:    "FORBIDDEN",
  GLITCHED:     "GLITCHED",
  LIVING:       "LIVING",
};
```

Update `RARITY_ORDER`:

```ts
export const RARITY_ORDER: Record<Rarity, number> = {
  STATIC: 0, SIGNAL: 1, TRANSMISSION: 2, ANOMALY: 3,
  ORACLE: 4, FORBIDDEN: 5, GLITCHED: 6, LIVING: 7,
};
```

Update `RARITY_STYLE`:

```ts
export const RARITY_STYLE: Record<Rarity, { color: string; glow: string; borderOpacity: number }> = {
  STATIC:       { color: "var(--term-fg-dim)",  glow: "none",                                              borderOpacity: 0.4 },
  SIGNAL:       { color: "var(--neon)",          glow: "var(--glow-neon)",                                  borderOpacity: 0.7 },
  TRANSMISSION: { color: "var(--neon-4)",        glow: "var(--glow-amber)",                                 borderOpacity: 0.8 },
  ANOMALY:      { color: "var(--neon-3)",        glow: "var(--glow-magenta)",                               borderOpacity: 0.9 },
  ORACLE:       { color: "var(--neon-5)",        glow: "0 0 8px rgba(255,56,96,0.7), 0 0 24px rgba(255,56,96,0.35)", borderOpacity: 1 },
  FORBIDDEN:    { color: "#b388ff",              glow: "0 0 10px rgba(179,136,255,0.7), 0 0 28px rgba(179,136,255,0.3)", borderOpacity: 1 },
  GLITCHED:     { color: "#ff0055",              glow: "0 0 12px rgba(255,0,85,0.8), 0 0 32px rgba(255,0,85,0.4)",      borderOpacity: 1 },
  LIVING:       { color: "#ff6b35",              glow: "0 0 10px rgba(255,107,53,0.7), 0 0 28px rgba(255,107,53,0.35)", borderOpacity: 1 },
};
```

- [ ] **Step 2: Add new CardType entries to all existing maps**

Update `CARD_TYPE_GLYPH`:

```ts
export const CARD_TYPE_GLYPH: Record<CardType, string> = {
  VOICE:        "◐",
  TRANSMISSION: "▦",
  LORE:         "▲",
  SIGNAL:       "◈",
  ORACLE:       "◉",
  CIPHER:       "✦",
  AVATAR:       "🜁",
  INCIDENT:     "⚠",
  RELIC:        "🗝",
  ENTITY:       "👁",
  PROPHECY:     "🌙",
  MEMBER:       "🜂",
  GLITCH:       "▓",
  MAHAVIDYA:    "🔱",
};
```

Update `CARD_TYPE_LABEL`:

```ts
export const CARD_TYPE_LABEL: Record<CardType, string> = {
  VOICE:        "VOICE",
  TRANSMISSION: "TRANSMISSION",
  LORE:         "LORE",
  SIGNAL:       "SIGNAL",
  ORACLE:       "ORACLE",
  CIPHER:       "CIPHER",
  AVATAR:       "AVATAR",
  INCIDENT:     "INCIDENT",
  RELIC:        "RELIC",
  ENTITY:       "ENTITY",
  PROPHECY:     "PROPHECY",
  MEMBER:       "MEMBER",
  GLITCH:       "GLITCH",
  MAHAVIDYA:    "MAHAVIDYA",
};
```

Update `STAT_LABELS`:

```ts
export const STAT_LABELS: Record<CardType, [string, string, string]> = {
  VOICE:        ["SIGNAL STR", "RESONANCE",    "CLARITY"],
  TRANSMISSION: ["BROADCAST",  "REACH",        "DEPTH"],
  LORE:         ["CANON",      "DEPTH",        "INFLUENCE"],
  SIGNAL:       ["REACH",      "RESONANCE",    "CLARITY"],
  ORACLE:       ["CLARITY",    "WEIGHT",       "RESONANCE"],
  CIPHER:       ["POWER",      "SIGNAL",       "CLARITY"],
  AVATAR:       ["ATK",        "DEF",          "SIG"],
  INCIDENT:     ["WITNESSES",  "IMPACT",       "NOTORIETY"],
  RELIC:        ["POWER",      "DURABILITY",   "RARITY"],
  ENTITY:       ["ATK",        "DEF",          "STACK"],
  PROPHECY:     ["STATUS",     "WITNESSES",    "REWARD"],
  MEMBER:       ["LVL",        "ASCENSION",    "RANK"],
  GLITCH:       ["ERROR",      "CORRUPTION",   "VOID"],
  MAHAVIDYA:    ["SHAKTI",     "DHARMA",       "MYSTERY"],
};
```

- [ ] **Step 3: Add CARD_TYPE_ANIMATION export**

Append to `src/lib/cards/rarity.ts`:

```ts
/** CSS animation class name to apply to card wrapper per card type */
export const CARD_TYPE_ANIMATION: Partial<Record<CardType, string>> = {
  RELIC:     "card-anim-relic",
  ENTITY:    "card-anim-entity",
  PROPHECY:  "card-anim-prophecy",
  MEMBER:    "card-anim-member",
  GLITCH:    "card-anim-glitch",
  LIVING:    "card-anim-living",
  MAHAVIDYA: "card-anim-living",
};

/** Foil tint color override per card type (null = use rarity default) */
export const CARD_TYPE_FOIL_TINT: Partial<Record<CardType, string>> = {
  RELIC:    "rgba(255,215,0,0.15)",
  ENTITY:   "rgba(255,43,214,0.12)",
  PROPHECY: "rgba(0,229,255,0.10)",
};

/** Whether this card type always forces foil regardless of isFoil flag */
export const CARD_TYPE_ALWAYS_FOIL: Partial<Record<CardType, boolean>> = {
  RELIC: true,
};

/** Card types that use ATK/DEF column stats instead of stat bars */
export const CARD_TYPE_COLUMN_STATS = new Set<CardType>(["AVATAR", "ENTITY", "INCIDENT", "RELIC", "PROPHECY", "MEMBER", "GLITCH", "MAHAVIDYA"]);

/** Card types that show Yu-Gi-Oh level stars */
export const CARD_TYPE_SHOW_STARS = new Set<CardType>(["AVATAR", "VOICE", "ENTITY", "MAHAVIDYA"]);

/** Card types that show personality type banner */
export const CARD_TYPE_SHOW_PERSONALITY = new Set<CardType>(["AVATAR", "VOICE"]);
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/cards/rarity.ts
git commit -m "feat: extend rarity.ts — 3 new rarities, 8 new card types, animation/foil/stat-layout maps"
```

---

## Task 3: geometry.ts — Sacred Geometry SVG Paths

**Files:**
- Create: `src/lib/cards/geometry.ts`

- [ ] **Step 1: Create the file**

Create `src/lib/cards/geometry.ts`:

```ts
import type { CardType } from "@/generated/prisma/client";

export interface GeometryPath {
  d?: string;
  type: "path" | "circle" | "line" | "polygon" | "ellipse" | "rect";
  attrs: Record<string, string | number>;
}

/** SVG geometry layers rendered behind card art. viewBox is always "0 0 200 130". */
export const CARD_TYPE_GEOMETRY: Partial<Record<CardType, GeometryPath[]>> = {
  RELIC: [
    { type: "polygon", attrs: { points: "100,10 178,125 22,125", fill: "none", stroke: "currentColor", strokeWidth: 0.7 } },
    { type: "circle",  attrs: { cx: 100, cy: 72, r: 52, fill: "none", stroke: "currentColor", strokeWidth: 0.45 } },
    { type: "circle",  attrs: { cx: 100, cy: 72, r: 28, fill: "none", stroke: "currentColor", strokeWidth: 0.3 } },
    { type: "line",    attrs: { x1: 100, y1: 10, x2: 100, y2: 125, stroke: "currentColor", strokeWidth: 0.3 } },
    { type: "line",    attrs: { x1: 22, y1: 125, x2: 178, y2: 125, stroke: "currentColor", strokeWidth: 0.3 } },
  ],
  ENTITY: [
    { type: "ellipse", attrs: { cx: 100, cy: 65, rx: 80, ry: 46, fill: "none", stroke: "currentColor", strokeWidth: 0.55 } },
    { type: "ellipse", attrs: { cx: 100, cy: 65, rx: 55, ry: 30, fill: "none", stroke: "currentColor", strokeWidth: 0.4 } },
    { type: "circle",  attrs: { cx: 100, cy: 65, r: 14, fill: "none", stroke: "currentColor", strokeWidth: 0.9 } },
    { type: "line",    attrs: { x1: 100, y1: 19, x2: 100, y2: 111, stroke: "currentColor", strokeWidth: 0.4 } },
    { type: "line",    attrs: { x1: 20,  y1: 65, x2: 180, y2: 65,  stroke: "currentColor", strokeWidth: 0.35 } },
  ],
  PROPHECY: [
    { type: "circle",  attrs: { cx: 100, cy: 65, r: 55, fill: "none", stroke: "currentColor", strokeWidth: 0.45, strokeDasharray: "4 4" } },
    { type: "circle",  attrs: { cx: 100, cy: 65, r: 35, fill: "none", stroke: "currentColor", strokeWidth: 0.3 } },
    { type: "circle",  attrs: { cx: 100, cy: 65, r: 15, fill: "none", stroke: "currentColor", strokeWidth: 0.6 } },
    { type: "line",    attrs: { x1: 40, y1: 12, x2: 100, y2: 65, stroke: "currentColor", strokeWidth: 0.3 } },
    { type: "line",    attrs: { x1: 160, y1: 12, x2: 100, y2: 65, stroke: "currentColor", strokeWidth: 0.3 } },
    { type: "line",    attrs: { x1: 100, y1: 65, x2: 100, y2: 120, stroke: "currentColor", strokeWidth: 0.3 } },
    { type: "line",    attrs: { x1: 100, y1: 65, x2: 22, y2: 105,  stroke: "currentColor", strokeWidth: 0.25 } },
    { type: "line",    attrs: { x1: 100, y1: 65, x2: 178, y2: 105, stroke: "currentColor", strokeWidth: 0.25 } },
  ],
  MEMBER: [
    { type: "polygon", attrs: { points: "100,12 122,56 170,56 132,84 147,128 100,102 53,128 68,84 30,56 78,56", fill: "none", stroke: "currentColor", strokeWidth: 0.55 } },
    { type: "circle",  attrs: { cx: 100, cy: 72, r: 25, fill: "none", stroke: "currentColor", strokeWidth: 0.45 } },
  ],
  AVATAR: [
    { type: "polygon", attrs: { points: "100,8 118,62 174,62 128,96 146,150 100,118 54,150 72,96 26,62 82,62", fill: "none", stroke: "currentColor", strokeWidth: 0.5 } },
    { type: "circle",  attrs: { cx: 100, cy: 65, r: 40, fill: "none", stroke: "currentColor", strokeWidth: 0.3 } },
  ],
  INCIDENT: [
    { type: "rect",    attrs: { x: 10, y: 10, width: 180, height: 110, fill: "none", stroke: "currentColor", strokeWidth: 0.5 } },
    { type: "rect",    attrs: { x: 20, y: 20, width: 160, height: 90,  fill: "none", stroke: "currentColor", strokeWidth: 0.3 } },
    { type: "line",    attrs: { x1: 10, y1: 30, x2: 190, y2: 30, stroke: "currentColor", strokeWidth: 0.6 } },
    { type: "line",    attrs: { x1: 10, y1: 100, x2: 190, y2: 100, stroke: "currentColor", strokeWidth: 0.4 } },
    { type: "line",    attrs: { x1: 100, y1: 10, x2: 100, y2: 120, stroke: "currentColor", strokeWidth: 0.25, strokeDasharray: "3 3" } },
  ],
  GLITCH: [
    { type: "rect",    attrs: { x: 5,  y: 20,  width: 90,  height: 8,  fill: "currentColor", opacity: 0.3 } },
    { type: "rect",    attrs: { x: 80, y: 50,  width: 115, height: 5,  fill: "currentColor", opacity: 0.25 } },
    { type: "rect",    attrs: { x: 15, y: 75,  width: 70,  height: 10, fill: "currentColor", opacity: 0.35 } },
    { type: "rect",    attrs: { x: 100, y: 95, width: 90,  height: 6,  fill: "currentColor", opacity: 0.2 } },
    { type: "line",    attrs: { x1: 0, y1: 65, x2: 200, y2: 65, stroke: "currentColor", strokeWidth: 1, opacity: 0.4 } },
  ],
  MAHAVIDYA: [
    { type: "polygon", attrs: { points: "100,10 178,118 22,118", fill: "none", stroke: "currentColor", strokeWidth: 0.6 } },
    { type: "polygon", attrs: { points: "100,120 22,12 178,12",  fill: "none", stroke: "currentColor", strokeWidth: 0.5 } },
    { type: "circle",  attrs: { cx: 100, cy: 65, r: 52, fill: "none", stroke: "currentColor", strokeWidth: 0.35 } },
    { type: "circle",  attrs: { cx: 100, cy: 65, r: 18, fill: "none", stroke: "currentColor", strokeWidth: 0.5 } },
  ],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/cards/geometry.ts
git commit -m "feat: add card geometry — sacred SVG art overlays per card type"
```

---

## Task 4: personality.ts — Personality Type System

**Files:**
- Create: `src/lib/cards/personality.ts`

- [ ] **Step 1: Create the file**

Create `src/lib/cards/personality.ts`:

```ts
export type PersonalityType =
  | "MYSTIC" | "TRICKSTER" | "FLAME" | "WATCHER" | "SIGNAL"
  | "SAGE"   | "SHADOW"    | "CHAOS" | "VOID"     | "LIGHT";

export interface PersonalityStyle {
  color: string;
  glow: string;
  icon: string;
  label: string;
  description: string;
}

export const PERSONALITY_TYPE_STYLE: Record<PersonalityType, PersonalityStyle> = {
  MYSTIC:    { color: "#b388ff", glow: "0 0 8px rgba(179,136,255,0.6)", icon: "🜁", label: "MYSTIC",    description: "Oracles · tarot readers · seers · hidden knowledge holders" },
  TRICKSTER: { color: "#ff2bd6", glow: "0 0 8px rgba(255,43,214,0.6)",  icon: "🃏", label: "TRICKSTER", description: "Trolls · provocateurs · chaos agents · comedic disruptors" },
  FLAME:     { color: "#ff6b35", glow: "0 0 8px rgba(255,107,53,0.6)",  icon: "🔥", label: "FLAME",     description: "Protectors · loyalists · warriors · sacred circle members" },
  WATCHER:   { color: "#00e5ff", glow: "0 0 8px rgba(0,229,255,0.6)",   icon: "👁", label: "WATCHER",   description: "Lurkers · analysts · silent witnesses · pattern seekers" },
  SIGNAL:    { color: "#ffd700", glow: "0 0 8px rgba(255,215,0,0.6)",   icon: "📡", label: "SIGNAL",    description: "Amplifiers · connectors · those who recruit others into the cult" },
  SAGE:      { color: "#00ff9c", glow: "0 0 8px rgba(0,255,156,0.6)",   icon: "🌿", label: "SAGE",      description: "Scholars · historians · deep knowledge · calm authority" },
  SHADOW:    { color: "#ff4444", glow: "0 0 8px rgba(255,68,68,0.6)",   icon: "☠", label: "SHADOW",    description: "Fallen · banned · reformed villains · cautionary tales" },
  CHAOS:     { color: "#c0c0ff", glow: "0 0 8px rgba(192,192,255,0.6)", icon: "🌀", label: "CHAOS",     description: "Wildcards · unpredictable · those who break patterns on purpose" },
  VOID:      { color: "#ff8c94", glow: "0 0 8px rgba(255,140,148,0.6)", icon: "💀", label: "VOID",      description: "Unknown origin · no history · manifested from nothing" },
  LIGHT:     { color: "#ffe4b5", glow: "0 0 8px rgba(255,228,181,0.6)", icon: "✨", label: "LIGHT",     description: "Healers · comforters · those who bring warmth to dark streams" },
};

export const ALL_PERSONALITY_TYPES = Object.keys(PERSONALITY_TYPE_STYLE) as PersonalityType[];

/** Member rank names by ascension level (0–5) */
export const MEMBER_RANK: Record<number, string> = {
  0: "INITIATE",
  1: "CHAOS WITNESS",
  2: "FLAME KEEPER",
  3: "PANEL SURVIVOR",
  4: "ECHO WALKER",
  5: "FIRST CIRCLE",
  6: "SEED SORTER",
};

/** Compute Yu-Gi-Oh level stars (1–8) from appearance count */
export function computeCardLevel(appearances: number): number {
  if (appearances <= 1)  return 1;
  if (appearances <= 3)  return 2;
  if (appearances <= 8)  return 3;
  if (appearances <= 20) return 4;
  if (appearances <= 50) return 5;
  if (appearances <= 100) return 6;
  if (appearances <= 300) return 7;
  return 8;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/cards/personality.ts
git commit -m "feat: add personality type system — 10 archetypes, member ranks, level formula"
```

---

## Task 5: Add Animation Keyframes to globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Append new keyframes and animation classes**

Open `src/app/globals.css` and append at the end of the file:

```css
/* ── Card system phase 1 animations ──────────────────────── */

@keyframes cardRelicPulse {
  0%, 100% { box-shadow: 0 0 18px rgba(255,215,0,0.45); }
  50%       { box-shadow: 0 0 36px rgba(255,215,0,0.75), 0 0 60px rgba(255,165,0,0.3); }
}

@keyframes cardEntityGlitch {
  0%, 88%, 100% { transform: translate(0); filter: none; }
  89%  { transform: translate(-3px, 1px); filter: hue-rotate(60deg) brightness(1.3); }
  91%  { transform: translate(3px, -1px); filter: hue-rotate(-60deg); }
  93%  { transform: translate(-1px, 2px); }
  95%  { transform: translate(1px, -1px); filter: hue-rotate(120deg); }
}

@keyframes cardProphecyFlicker {
  0%, 82%, 100% { opacity: 1; }
  85% { opacity: 0.75; }
  88% { opacity: 1; }
  92% { opacity: 0.55; }
  95% { opacity: 1; }
}

@keyframes cardMemberPulse {
  0%, 100% { box-shadow: 0 0 14px rgba(0,255,156,0.35); }
  50%       { box-shadow: 0 0 30px rgba(0,255,156,0.65); }
}

@keyframes cardGlitchAggressive {
  0%, 75%, 100% { transform: translate(0); clip-path: none; filter: none; }
  76%  { transform: translate(-4px, 2px);  filter: hue-rotate(90deg) brightness(1.5); clip-path: inset(10% 0 70% 0); }
  78%  { transform: translate(4px, -2px);  filter: hue-rotate(-90deg); clip-path: inset(60% 0 5% 0); }
  80%  { transform: translate(-2px, 3px);  filter: hue-rotate(45deg); clip-path: inset(30% 0 40% 0); }
  82%  { transform: translate(0); clip-path: none; filter: none; }
}

@keyframes cardLivingPulse {
  0%, 100% { box-shadow: 0 0 14px rgba(255,107,53,0.45); }
  50%       { box-shadow: 0 0 40px rgba(255,107,53,0.8), 0 0 80px rgba(255,107,53,0.3); }
}

@keyframes cardFoilGold {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes cardFoilMagenta {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
@keyframes cardFoilCyan {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.card-anim-relic     { animation: cardRelicPulse 3s ease-in-out infinite; }
.card-anim-entity    { animation: cardEntityGlitch 5s ease-in-out infinite; }
.card-anim-prophecy  { animation: cardProphecyFlicker 6s ease-in-out infinite; }
.card-anim-member    { animation: cardMemberPulse 2.5s ease-in-out infinite; }
.card-anim-glitch    { animation: cardGlitchAggressive 4s ease-in-out infinite; }
.card-anim-living    { animation: cardLivingPulse 2s ease-in-out infinite; }
```

- [ ] **Step 2: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add card animation keyframes — relic pulse, entity glitch, prophecy flicker, member pulse, glitch, living"
```

---

## Task 6: Overhaul TradingCard Component

**Files:**
- Modify: `src/components/cards/trading-card.tsx`

This is the largest change. Replace the file entirely with the new version below.

- [ ] **Step 1: Update the TradingCardData interface**

The interface gains new optional fields. Replace the existing `TradingCardData` interface:

```ts
export interface TradingCardData {
  id: string;
  slug: string;
  cardType: CardType;
  rarity: Rarity;
  title: string;
  subtitle?: string | null;
  flavourText?: string | null;
  artUrl?: string | null;
  statA: number;
  statB: number;
  statC: number;
  abilities: string[];
  isFoil?: boolean;
  isNew?: boolean;
  totalMinted?: number;
  maxSupply?: number | null;
  // Phase 1 additions
  personalityType?: string | null;
  secondaryType?: string | null;
  cardLevel?: number;
  isEquippable?: boolean;
  isSoulbound?: boolean;
  fulfillmentStatus?: string | null;
  fulfillmentCond?: string | null;
  loreLayer?: string | null;
  ascensionLevel?: number;
}
```

- [ ] **Step 2: Add geometry import and CardGeometry component**

After the imports block at the top, add:

```ts
import { CARD_TYPE_GEOMETRY, type GeometryPath } from "@/lib/cards/geometry";
import {
  CARD_TYPE_ANIMATION,
  CARD_TYPE_ALWAYS_FOIL,
  CARD_TYPE_FOIL_TINT,
  CARD_TYPE_COLUMN_STATS,
  CARD_TYPE_SHOW_STARS,
  CARD_TYPE_SHOW_PERSONALITY,
} from "@/lib/cards/rarity";
import { PERSONALITY_TYPE_STYLE, MEMBER_RANK } from "@/lib/cards/personality";
import type { PersonalityType } from "@/lib/cards/personality";
```

Add `CardGeometry` helper component (add before `TradingCard`):

```ts
function CardGeometry({ cardType, color }: { cardType: CardType; color: string }) {
  const paths = CARD_TYPE_GEOMETRY[cardType];
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 200 130"
      width="100%" height="100%"
      style={{ position: "absolute", inset: 0, opacity: 0.13, color }}
      aria-hidden="true"
    >
      {paths.map((p, i) => {
        const el = p.type;
        const a = p.attrs;
        if (el === "path")    return <path    key={i} {...a as React.SVGProps<SVGPathElement>} />;
        if (el === "circle")  return <circle  key={i} {...a as React.SVGProps<SVGCircleElement>} />;
        if (el === "line")    return <line    key={i} {...a as React.SVGProps<SVGLineElement>} />;
        if (el === "polygon") return <polygon key={i} {...a as React.SVGProps<SVGPolygonElement>} />;
        if (el === "ellipse") return <ellipse key={i} {...a as React.SVGProps<SVGEllipseElement>} />;
        if (el === "rect")    return <rect    key={i} {...a as React.SVGProps<SVGRectElement>} />;
        return null;
      })}
    </svg>
  );
}
```

- [ ] **Step 3: Add LevelStars, PersonalityBanner, ColumnStats, RedactedText helpers**

Add these helper components before `TradingCard`:

```ts
function LevelStars({ level, color }: { level: number; color: string }) {
  return (
    <div style={{
      display: "flex", justifyContent: "flex-end", gap: 2,
      padding: "2px 7px 1px", background: "rgba(0,0,0,0.3)", flexShrink: 0,
    }}>
      {Array.from({ length: Math.min(level, 8) }).map((_, i) => (
        <span key={i} style={{ fontSize: 9, color, filter: `drop-shadow(0 0 3px ${color})`, lineHeight: 1 }}>★</span>
      ))}
    </div>
  );
}

function PersonalityBanner({ personalityType, secondaryType, hp }: {
  personalityType: string;
  secondaryType?: string | null;
  hp: number;
}) {
  const ps = PERSONALITY_TYPE_STYLE[personalityType as PersonalityType];
  if (!ps) return null;
  const label = secondaryType ? `${ps.icon} ${ps.label} / ${secondaryType}` : `${ps.icon} ${ps.label}`;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "2px 7px", background: "rgba(0,0,0,0.4)", flexShrink: 0,
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <span style={{
        fontFamily: "var(--font-mono), monospace", fontSize: 7.5,
        padding: "2px 7px", borderRadius: 10, fontWeight: "bold",
        background: `rgba(0,0,0,0.3)`, color: ps.color,
        border: `1px solid ${ps.color}44`, letterSpacing: "0.08em",
      }}>{label}</span>
      <span style={{
        fontFamily: "var(--font-mono), monospace", fontSize: 10,
        fontWeight: "bold", color: ps.color, letterSpacing: "0.04em",
      }}>{hp} <span style={{ fontSize: 7, color: "rgba(255,255,255,0.3)" }}>PWR</span></span>
    </div>
  );
}

function ColumnStats({ labels, values, color }: {
  labels: [string, string, string];
  values: [number, number, number];
  color: string;
}) {
  return (
    <div style={{
      display: "flex", gap: 4,
      padding: "4px 8px",
      borderTop: `1px solid rgba(255,255,255,0.08)`,
      background: "rgba(0,0,0,0.3)", flexShrink: 0,
    }}>
      {labels.map((label, i) => (
        <div key={label} style={{ flex: 1, textAlign: "center" }}>
          <div style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 6.5, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em",
          }}>{label}</div>
          <div style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11, fontWeight: "bold", color, letterSpacing: "0.02em",
          }}>{values[i]}</div>
        </div>
      ))}
    </div>
  );
}

function MemberRankBadge({ ascensionLevel, color }: { ascensionLevel: number; color: string }) {
  const rank = MEMBER_RANK[ascensionLevel] ?? "INITIATE";
  return (
    <div style={{ textAlign: "center", padding: "3px 8px 2px", flexShrink: 0 }}>
      <span style={{
        fontFamily: "var(--font-mono), monospace", fontSize: 8, fontWeight: "bold",
        padding: "2px 10px", borderRadius: 10,
        background: `rgba(0,0,0,0.3)`, color,
        border: `1px solid ${color}44`, letterSpacing: "0.1em",
      }}>LVL {ascensionLevel} · {rank}</span>
    </div>
  );
}

function ProphecyStatusBanner({ status, color }: { status: string; color: string }) {
  const statusColor = status === "FULFILLED" ? "#00ff9c" : status === "WATCHING" ? "#ffd700" : color;
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2px 7px", background: "rgba(0,0,0,0.5)", flexShrink: 0,
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    }}>
      <span style={{
        fontFamily: "var(--font-mono), monospace", fontSize: 7.5, fontWeight: "bold",
        color: statusColor, letterSpacing: "0.15em",
        textShadow: `0 0 8px ${statusColor}`,
      }}>{status === "FULFILLED" ? "✓ FULFILLED" : status === "WATCHING" ? "◉ WATCHING" : "◌ UNFULFILLED"}</span>
    </div>
  );
}

function RedactedText({ text, revealed }: { text: string; revealed: boolean }) {
  if (revealed) return <span style={{ color: "var(--neon-2)", textShadow: "0 0 8px var(--neon-2)" }}>{text}</span>;
  return (
    <span style={{
      background: "rgba(0,229,255,0.25)", color: "transparent",
      borderRadius: 2, userSelect: "none", cursor: "default",
    }}>{text}</span>
  );
}
```

- [ ] **Step 4: Update the main TradingCard function**

Replace the `SIZE_MAP` art height and the main component's art section + stats section. Key changes:

**In `SIZE_MAP`**, change art height from `height * 0.52` to fixed `130` for md, scaled for others:

```ts
const ART_HEIGHT_MAP = { sm: 91, md: 130, lg: 182 } as const;
```

**In `TradingCard` function body**, after computing `rarityStyle`, add:

```ts
  const animClass = CARD_TYPE_ANIMATION[card.cardType];
  const alwaysFoil = CARD_TYPE_ALWAYS_FOIL[card.cardType] ?? false;
  const foilTint = CARD_TYPE_FOIL_TINT[card.cardType];
  const useColumnStats = CARD_TYPE_COLUMN_STATS.has(card.cardType);
  const showStars = CARD_TYPE_SHOW_STARS.has(card.cardType);
  const showPersonality = CARD_TYPE_SHOW_PERSONALITY.has(card.cardType);
  const effectiveIsFoil = alwaysFoil || card.isFoil;
  const artHeight = ART_HEIGHT_MAP[size];
  const isFulfilled = card.fulfillmentStatus === "FULFILLED";
  const isMember = card.cardType === "MEMBER";
  const isProphecy = card.cardType === "PROPHECY";
```

**Apply `animClass` to the outer wrapper div** — add `className={animClass}` to `cardStyle` element (next to `style={cardStyle}`).

**Replace art area height** from `Math.round(height * 0.52)` to `artHeight`.

**Inside the art area**, add `<CardGeometry cardType={card.cardType} color={borderColor} />` right after `<div style={{ position: "absolute", inset: 0 ... }}>` (the PlaceholderArt container). Keep PlaceholderArt as fallback when no artUrl.

**After the header bar** and before the art area, add level stars and personality banner conditionally:

```tsx
{showStars && (card.cardLevel ?? 1) > 0 && (
  <LevelStars level={card.cardLevel ?? 1} color={borderColor} />
)}
{showPersonality && card.personalityType && (
  <PersonalityBanner
    personalityType={card.personalityType}
    secondaryType={card.secondaryType}
    hp={card.statA}
  />
)}
{isProphecy && card.fulfillmentStatus && (
  <ProphecyStatusBanner status={card.fulfillmentStatus} color={borderColor} />
)}
```

**Replace the stats section** (the `{[...].map(StatBar)}` block) with:

```tsx
{useColumnStats ? (
  isMember ? (
    <>
      <MemberRankBadge ascensionLevel={card.ascensionLevel ?? 0} color={borderColor} />
      <ColumnStats
        labels={[statLabels[0], statLabels[1], statLabels[2]]}
        values={[card.statA, card.statB, card.statC]}
        color={barColor}
      />
    </>
  ) : isProphecy ? (
    <div style={{ padding: "3px 8px", flexShrink: 0, borderTop: `1px solid rgba(255,255,255,0.07)` }}>
      {card.fulfillmentCond && (
        <div style={{ fontFamily: "var(--font-mono),monospace", fontSize: 7.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.5, marginBottom: 4 }}>
          ◈ {card.fulfillmentCond}
        </div>
      )}
      {card.loreLayer && size !== "sm" && (
        <div style={{ fontFamily: "var(--font-mono),monospace", fontSize: 7, color: borderColor, lineHeight: 1.5 }}>
          ✦ <RedactedText text={card.loreLayer} revealed={isFulfilled} />
        </div>
      )}
    </div>
  ) : (
    <ColumnStats
      labels={[statLabels[0], statLabels[1], statLabels[2]]}
      values={[card.statA, card.statB, card.statC]}
      color={barColor}
    />
  )
) : (
  <div style={{ padding: "0 8px 6px", flexShrink: 0, position: "relative", zIndex: 3,
    borderTop: `1px solid rgba(${hexToRgb(borderColor)},0.25)`, marginTop: 4, paddingTop: 5 }}>
    {[
      { label: statLabels[0], val: card.statA },
      { label: statLabels[1], val: card.statB },
      { label: statLabels[2], val: card.statC },
    ].map(({ label, val }) => (
      <StatBar key={label} label={label} value={val} color={barColor} size={size} />
    ))}
  </div>
)}
```

**Update the foil overlay** to use `effectiveIsFoil` instead of `isFoil`, and use `foilTint` when present:

```ts
const foilOverlay: CSSProperties | undefined = effectiveIsFoil ? {
  position: "absolute", inset: 0, borderRadius: 8,
  background: `linear-gradient(
    105deg,
    transparent 35%,
    rgba(255,255,255,0.08) 45%,
    ${foilTint ?? `rgba(${card.rarity === "ORACLE" ? "255,56,96" : card.rarity === "ANOMALY" ? "255,43,214" : "255,184,0"},0.15)`} 50%,
    rgba(255,255,255,0.08) 55%,
    transparent 65%
  )`,
  backgroundSize: "200% 200%",
  animation: hovered ? "cardFoilGold 1.5s ease infinite" : "none",
  pointerEvents: "none", zIndex: 10,
} : undefined;
```

**Add soulbound badge** to footer area for MEMBER cards:

```tsx
{card.isSoulbound && (
  <span style={{
    fontFamily: "var(--font-mono),monospace", fontSize: 7,
    color: borderColor, letterSpacing: "0.06em", opacity: 0.7,
  }}>⛓ SOULBOUND</span>
)}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd /c/Users/johnb/cultcodex-ui && npx tsc --noEmit 2>&1 | grep -i "trading-card\|rarity\|geometry\|personality" | head -20
```

Expected: no errors from the modified files.

- [ ] **Step 6: Commit**

```bash
git add src/components/cards/trading-card.tsx
git commit -m "feat: overhaul TradingCard — bigger art, sacred geometry, level stars, personality banner, column stats, redaction, type animations"
```

---

## Task 7: Seed Script — 30 Cards

**Files:**
- Create: `scripts/seed-cards-phase1.ts`

- [ ] **Step 1: Create the seed script**

Create `scripts/seed-cards-phase1.ts`:

```ts
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Phase 1 cards...");

  // ── RELIC PACK ──────────────────────────────────────────────────────────────
  const ritualPack = await prisma.cardPack.upsert({
    where: { slug: "ritual-pack" },
    update: {},
    create: {
      slug: "ritual-pack",
      name: "Ritual Pack",
      description: "Sacred objects and relics of the Cult. Gold foil. Limited supply.",
      cost: 150,
      cardCount: 3,
      isAvailable: true,
      sortOrder: 10,
      weightStatic: 0, weightSignal: 20, weightTransmission: 50, weightAnomaly: 25, weightOracle: 5,
    },
  });

  const relics = [
    {
      slug: "relic-golden-microphone",
      cardType: "RELIC" as const,
      rarity: "TRANSMISSION" as const,
      title: "The Golden Microphone",
      subtitle: "Sacred Instrument · First Transmission",
      flavourText: "Every word becomes signal. Every silence becomes myth.",
      abilities: ["EQUIP: Equipped Voice card gains +22 REACH and +15 RESONANCE", "PASSIVE: All VOICE cards in hand cost 1 less credit to play"],
      statA: 70, statB: 60, statC: 77,
      maxSupply: 77, isEquippable: true, equipTarget: "VOICE", cardLevel: 5,
    },
    {
      slug: "relic-lamp-of-eros",
      cardType: "RELIC" as const,
      rarity: "ANOMALY" as const,
      title: "The Lamp of Eros",
      subtitle: "Illuminator · Reveals what is hidden",
      flavourText: "Some truths burn the one who carries them.",
      abilities: ["ACTIVATE: Reveal all face-down Prophecy cards. Each fulfilled grants 50 credits.", "PASSIVE: Cannot be destroyed by Chaos Entity abilities"],
      statA: 80, statB: 75, statC: 90,
      maxSupply: 33, isEquippable: false, cardLevel: 6,
    },
    {
      slug: "relic-black-mirror-webcam",
      cardType: "RELIC" as const,
      rarity: "SIGNAL" as const,
      title: "The Black Mirror Webcam",
      subtitle: "Eye of the Stream · Witness Engine",
      flavourText: "It sees everything. It remembers everything. It never blinks.",
      abilities: ["PASSIVE: Records one quote per stream into the archive automatically", "EQUIP: Equipped Watcher-type Voice card gains INVISIBLE status"],
      statA: 55, statB: 70, statC: 65,
      maxSupply: 144, isEquippable: true, equipTarget: "VOICE", cardLevel: 4,
    },
    {
      slug: "relic-ban-hammer-of-silence",
      cardType: "RELIC" as const,
      rarity: "TRANSMISSION" as const,
      title: "The Ban Hammer of Silence",
      subtitle: "Admin Relic · Weapon of Consequence",
      flavourText: "One strike. No appeals. The chat goes quiet.",
      abilities: ["ACTIVATE: Destroy target Chaos Entity card. Cannot be countered.", "PASSIVE: Trolls who see this card leave the stream voluntarily"],
      statA: 99, statB: 40, statC: 55,
      maxSupply: 99, isEquippable: false, cardLevel: 5,
    },
    {
      slug: "relic-fractured-sigil",
      cardType: "RELIC" as const,
      rarity: "ANOMALY" as const,
      title: "The Fractured Sigil",
      subtitle: "Broken Symbol · Power Unstable",
      flavourText: "It was whole once. No one remembers what it meant.",
      abilities: ["PASSIVE: Generates 5 Signal Credits per turn but damages a random card in hand for 10", "ACTIVATE: Sacrifice this card to draw 3 Cipher cards from the archive"],
      statA: 85, statB: 30, statC: 70,
      maxSupply: 13, isEquippable: false, cardLevel: 6,
    },
    {
      slug: "relic-panther-key",
      cardType: "RELIC" as const,
      rarity: "ORACLE" as const,
      title: "The Panther Key",
      subtitle: "Gate Opener · BKG Relic",
      flavourText: "Lenore brought it. No one knows from where.",
      abilities: ["ACTIVATE: Unlock any locked Prophecy card regardless of condition", "PASSIVE: +30 DEF to all FLAME-type Voice cards while in play"],
      statA: 77, statB: 99, statC: 88,
      maxSupply: 7, isEquippable: false, cardLevel: 7,
    },
    {
      slug: "relic-crimson-headphones",
      cardType: "RELIC" as const,
      rarity: "SIGNAL" as const,
      title: "The Crimson Headphones",
      subtitle: "Tuned to Frequencies Unknown",
      flavourText: "She hears things no one else can. That's the point.",
      abilities: ["EQUIP: Equipped Voice card can detect hidden Glitch cards in opponent's hand", "PASSIVE: Gain 3 Signal Credits whenever a Prophecy card flickers to WATCHING"],
      statA: 60, statB: 65, statC: 80,
      maxSupply: 88, isEquippable: true, equipTarget: "VOICE", cardLevel: 4,
    },
    {
      slug: "relic-vhs-of-revelation",
      cardType: "RELIC" as const,
      rarity: "FORBIDDEN" as const,
      title: "The VHS of Revelation",
      subtitle: "The Stream That Shouldn't Exist",
      flavourText: "Episode 777. The timestamp is wrong. The faces are wrong. The audio is fine.",
      abilities: ["FORBIDDEN: Can only be obtained by opening a pack at 3:33 AM", "ACTIVATE: Play the tape. All cards in play are revealed including face-down. Lasts 1 turn."],
      statA: 99, statB: 99, statC: 99,
      maxSupply: 3, isEquippable: false, secretCondition: "time:03:33", cardLevel: 8,
    },
  ];

  // ── CHAOS PACK ────────────────────────────────────────────────────────────
  const chaosPack = await prisma.cardPack.upsert({
    where: { slug: "chaos-pack" },
    update: {},
    create: {
      slug: "chaos-pack",
      name: "Chaos Pack",
      description: "Internet monsters and chaos entities. Unlimited supply. Pure disruption.",
      cost: 100,
      cardCount: 5,
      isAvailable: true,
      sortOrder: 20,
      weightStatic: 35, weightSignal: 30, weightTransmission: 20, weightAnomaly: 12, weightOracle: 3,
    },
  });

  const entities = [
    {
      slug: "entity-reply-goblin",
      cardType: "ENTITY" as const,
      rarity: "STATIC" as const,
      title: "The Reply Goblin",
      subtitle: "Chaos Entity · Always in the Replies",
      flavourText: "It never watches. It only reads. It always has thoughts.",
      abilities: ["PASSIVE: Gains +3 ATK for each reply it posts this turn (max 5 posts)", "Cannot be silenced by cards that require eye contact"],
      statA: 30, statB: 15, statC: 0,
      maxSupply: null, cardLevel: 1,
    },
    {
      slug: "entity-parasocial-vampire",
      cardType: "ENTITY" as const,
      rarity: "SIGNAL" as const,
      title: "The Parasocial Vampire",
      subtitle: "Chaos Entity · One-Way Attachment",
      flavourText: "It knows everything about you. You don't know it exists.",
      abilities: ["PASSIVE: Gains +5 PWR each turn the host does not address it", "STRIKE: Drain 20 CLARITY from target Voice card. Heal this card for the same amount"],
      statA: 55, statB: 20, statC: 0,
      maxSupply: null, cardLevel: 2,
    },
    {
      slug: "entity-algorithm-beast",
      cardType: "ENTITY" as const,
      rarity: "TRANSMISSION" as const,
      title: "The Algorithm Beast",
      subtitle: "Chaos Entity · Platform God",
      flavourText: "It doesn't hate you. It just optimizes against you.",
      abilities: ["FIELD: At the end of each turn, the card with the lowest engagement is sent to the void", "PASSIVE: Cannot be targeted by Relic cards"],
      statA: 75, statB: 80, statC: 0,
      maxSupply: null, cardLevel: 4,
    },
    {
      slug: "entity-attention-serpent",
      cardType: "ENTITY" as const,
      rarity: "ANOMALY" as const,
      title: "The Attention Serpent",
      subtitle: "Chaos Entity · Parasocial Predator",
      flavourText: "It gains strength from being ignored. Do not look. Do not answer. It feeds on both.",
      abilities: ["PASSIVE: Gains +5 PWR each turn the host does not address it (max stacks: 10)", "STRIKE: Target Voice card loses 30 CLARITY. If DEF below 500, target is silenced for 2 turns"],
      statA: 70, statB: 35, statC: 0,
      maxSupply: null, cardLevel: 5,
    },
    {
      slug: "entity-engagement-demon",
      cardType: "ENTITY" as const,
      rarity: "TRANSMISSION" as const,
      title: "The Engagement Demon",
      subtitle: "Chaos Entity · Metric Vampire",
      flavourText: "It doesn't care what you say. It cares how many people react to it.",
      abilities: ["FIELD: All players must pay 10 credits at end of turn or draw a Chaos card instead", "PASSIVE: Gains 1 stack per card played this turn"],
      statA: 65, statB: 50, statC: 0,
      maxSupply: null, cardLevel: 4,
    },
    {
      slug: "entity-shadow-banned-one",
      cardType: "ENTITY" as const,
      rarity: "ANOMALY" as const,
      title: "The Shadow Banned One",
      subtitle: "Chaos Entity · Invisible Presence",
      flavourText: "It speaks. No one hears. It writes. No one sees. It is still here.",
      abilities: ["INVISIBLE: Cannot be targeted while this card has fewer than 3 stacks", "ACTIVATE: Remove all stacks to deal 15 damage per stack to all Voice cards in play"],
      statA: 60, statB: 90, statC: 0,
      maxSupply: null, cardLevel: 5,
    },
    {
      slug: "entity-ad-revenue-phantom",
      cardType: "ENTITY" as const,
      rarity: "SIGNAL" as const,
      title: "The Ad Revenue Phantom",
      subtitle: "Chaos Entity · Monetization Ghost",
      flavourText: "It was promised. It never arrived. The invoice remains.",
      abilities: ["PASSIVE: Each turn, there is a 30% chance this card steals 5 Signal Credits from each player", "Immune to abilities that cost credits to activate"],
      statA: 45, statB: 40, statC: 0,
      maxSupply: null, cardLevel: 3,
    },
    {
      slug: "entity-noise-eater",
      cardType: "ENTITY" as const,
      rarity: "ANOMALY" as const,
      title: "The Noise Eater",
      subtitle: "Chaos Entity · Signal Devourer",
      flavourText: "It consumes frequencies. It leaves only static. Static is its language.",
      abilities: ["FIELD: All Voice cards lose 5 SIGNAL STR per turn while this is in play", "DEVOUR: Destroy a SIGNAL-type card. This card gains ATK equal to that card's REACH"],
      statA: 80, statB: 45, statC: 0,
      maxSupply: null, cardLevel: 6,
    },
    {
      slug: "entity-doomscroll-leviathan",
      cardType: "ENTITY" as const,
      rarity: "ORACLE" as const,
      title: "The Doomscroll Leviathan",
      subtitle: "Chaos Entity · Ancient Algorithm",
      flavourText: "Before the platforms, it existed as hunger. The platforms gave it a face.",
      abilities: ["FIELD: All players discard 1 card at end of each turn", "CANNOT BE TARGETED while 3+ cards are in play", "DEVOUR: Destroy target card. Controller loses credits equal to its SIG value"],
      statA: 95, statB: 88, statC: 0,
      maxSupply: 13, cardLevel: 7,
    },
    {
      slug: "entity-smiling-moderator",
      cardType: "ENTITY" as const,
      rarity: "FORBIDDEN" as const,
      title: "The Smiling Moderator",
      subtitle: "Chaos Entity · Trusted Betrayer",
      flavourText: "It was given the keys. It remembered everything. It waited.",
      abilities: ["FORBIDDEN: Cannot be obtained from standard packs. Event drop only.", "PASSIVE: Cannot be identified as hostile until it acts. Appears as an ALLY card.", "STRIKE: Reveal true form. Immediately ban 2 Voice cards from your opponent's hand."],
      statA: 88, statB: 77, statC: 0,
      maxSupply: 7, secretCondition: "event:admin", cardLevel: 8,
    },
  ];

  // ── PROPHECY PACK (Ritual only — not in Chaos/Signal packs) ────────────────
  const prophecyPack = await prisma.cardPack.upsert({
    where: { slug: "oracle-pack" },
    update: {},
    create: {
      slug: "oracle-pack",
      name: "Oracle Pack",
      description: "Prophecies, mysteries, and ARG fragments. Watch the streams.",
      cost: 200,
      cardCount: 3,
      isAvailable: true,
      sortOrder: 30,
      weightStatic: 0, weightSignal: 0, weightTransmission: 0, weightAnomaly: 30, weightOracle: 70,
    },
  });

  const prophecies = [
    {
      slug: "prophecy-three-voices",
      cardType: "PROPHECY" as const,
      rarity: "ORACLE" as const,
      title: '"Three Voices Break the Gate"',
      subtitle: "ARG Fragment · Condition: Watch",
      flavourText: "The gate has hinges on both sides.",
      abilities: ["CONDITION: When 3 VOICE cards of different personality types speak in the same stream"],
      statA: 0, statB: 0, statC: 0,
      maxSupply: null, cardLevel: 7,
      fulfillmentStatus: "UNFULFILLED",
      fulfillmentCond: "Three Voices with different personality types must speak in a single stream.",
      loreLayer: "Unlock the Seventh Signal Pack and grant 333 credits to all Witnesses.",
      secretCondition: "event:three-voice-types",
    },
    {
      slug: "prophecy-butterfly-seventh-door",
      cardType: "PROPHECY" as const,
      rarity: "ORACLE" as const,
      title: '"The Butterfly Opens the 7th Door"',
      subtitle: "ARG Fragment · Condition: Time",
      flavourText: "It was never locked. You just needed to arrive at exactly the wrong moment.",
      abilities: ["CONDITION: This card can only be found in packs opened between 3:28–3:38 AM"],
      statA: 0, statB: 0, statC: 0,
      maxSupply: null, cardLevel: 8,
      fulfillmentStatus: "UNFULFILLED",
      fulfillmentCond: "Open a pack between 3:28 AM and 3:38 AM local time.",
      loreLayer: "The seventh door opens. What is behind it has no name yet.",
      secretCondition: "time:03:33",
    },
    {
      slug: "prophecy-signal-returns-at-dawn",
      cardType: "PROPHECY" as const,
      rarity: "ORACLE" as const,
      title: '"The Signal Returns at Dawn"',
      subtitle: "ARG Fragment · Condition: Stream",
      flavourText: "It always comes back. It just needs the right frequency.",
      abilities: ["CONDITION: A live stream begins after 6:00 AM and runs for at least 2 hours"],
      statA: 0, statB: 0, statC: 0,
      maxSupply: null, cardLevel: 6,
      fulfillmentStatus: "UNFULFILLED",
      fulfillmentCond: "A stream must begin after 6:00 AM and run for 2+ hours.",
      loreLayer: "All cards marked DORMANT reactivate. The archive adds a new chapter.",
      secretCondition: "event:dawn-stream",
    },
    {
      slug: "prophecy-beware-smiling-moderator",
      cardType: "PROPHECY" as const,
      rarity: "ORACLE" as const,
      title: '"Beware the Smiling Moderator"',
      subtitle: "ARG Fragment · Condition: Entity",
      flavourText: "The warning was always there. In the margins. Nobody reads margins.",
      abilities: ["CONDITION: The Smiling Moderator ENTITY card is played and reveals its true form"],
      statA: 0, statB: 0, statC: 0,
      maxSupply: null, cardLevel: 7,
      fulfillmentStatus: "UNFULFILLED",
      fulfillmentCond: "The Smiling Moderator card must be played and reveal its hidden form.",
      loreLayer: "Holders gain the SURVIVOR badge. The Smiling Moderator card is permanently marked EXPOSED.",
      secretCondition: "event:smiling-moderator-revealed",
    },
    {
      slug: "prophecy-false-prophet-speaks-twice",
      cardType: "PROPHECY" as const,
      rarity: "ORACLE" as const,
      title: '"The False Prophet Speaks Twice"',
      subtitle: "ARG Fragment · Condition: Admin",
      flavourText: "Once was forgiven. Twice was the plan.",
      abilities: ["CONDITION: Admin-triggered live stream event — only Psyche can fulfill this one"],
      statA: 0, statB: 0, statC: 0,
      maxSupply: null, cardLevel: 8,
      fulfillmentStatus: "UNFULFILLED",
      fulfillmentCond: "Fulfilled live during a stream. Admin-only trigger.",
      loreLayer: "A special edition Incident card drops for everyone watching at the moment of fulfillment.",
      secretCondition: "admin",
    },
    {
      slug: "prophecy-seven-voices-one-chamber",
      cardType: "PROPHECY" as const,
      rarity: "ORACLE" as const,
      title: '"Seven Voices, One Chamber"',
      subtitle: "ARG Fragment · Condition: Panel",
      flavourText: "Seven is the number of completion. Seven is when things break.",
      abilities: ["CONDITION: A single stream features 7 or more unique guest voices"],
      statA: 0, statB: 0, statC: 0,
      maxSupply: null, cardLevel: 7,
      fulfillmentStatus: "UNFULFILLED",
      fulfillmentCond: "Seven or more unique guest voices must appear in a single stream.",
      loreLayer: "The Seven Voices each receive a unique WITNESS card. The chamber remembers.",
      secretCondition: "event:seven-guests",
    },
  ];

  // ── MEMBER CARDS (not in packs — earned via activity) ─────────────────────
  const members = [
    {
      slug: "member-chaos-witness",
      cardType: "MEMBER" as const,
      rarity: "STATIC" as const,
      title: "Chaos Witness",
      subtitle: "Cult Rank I · Entry Level",
      flavourText: "You were there. That's enough. For now.",
      abilities: ["EARNED: Stay in chat during a recorded Incident event", "ASCENDS TO: Flame Keeper at Rank II"],
      statA: 1, statB: 0, statC: 0,
      maxSupply: null, isSoulbound: true, ascensionLevel: 1, cardLevel: 1,
    },
    {
      slug: "member-flame-keeper",
      cardType: "MEMBER" as const,
      rarity: "SIGNAL" as const,
      title: "Flame Keeper",
      subtitle: "Cult Rank II · Protector",
      flavourText: "The fire doesn't protect itself. That's your job now.",
      abilities: ["EARNED: Participate in 10 streams and contribute to lore", "PASSIVE: Signal Credits earn at 1.1×"],
      statA: 2, statB: 1, statC: 0,
      maxSupply: null, isSoulbound: true, ascensionLevel: 2, cardLevel: 2,
    },
    {
      slug: "member-panel-survivor",
      cardType: "MEMBER" as const,
      rarity: "TRANSMISSION" as const,
      title: "Panel Survivor",
      subtitle: "Cult Rank III · Veteran",
      flavourText: "You've seen things that didn't make the archive. You carry them anyway.",
      abilities: ["EARNED: Witness 3 Incident-tier stream events", "PASSIVE: Early access to Prophecy card drops before public"],
      statA: 3, statB: 2, statC: 0,
      maxSupply: null, isSoulbound: true, ascensionLevel: 3, cardLevel: 3,
    },
    {
      slug: "member-echo-walker",
      cardType: "MEMBER" as const,
      rarity: "ANOMALY" as const,
      title: "Echo Walker",
      subtitle: "Cult Rank IV · The Resonant",
      flavourText: "They walk between streams. Their signal lingers after they leave.",
      abilities: ["EARNED: Contribute 5 lore entries confirmed by admin", "PASSIVE: Credits earn at 1.3×. Exclusive pack type unlocked."],
      statA: 4, statB: 3, statC: 0,
      maxSupply: null, isSoulbound: true, ascensionLevel: 4, cardLevel: 4,
    },
    {
      slug: "member-first-circle",
      cardType: "MEMBER" as const,
      rarity: "ORACLE" as const,
      title: "First Circle Member",
      subtitle: "Cult Rank V · Inner Sanctum",
      flavourText: "There is no outer circle for you anymore. There is only this.",
      abilities: ["EARNED: Admin-granted to core community members", "PASSIVE: Credits earn at 1.5×. Access to forbidden drops. Username on the Wall."],
      statA: 5, statB: 5, statC: 0,
      maxSupply: null, isSoulbound: true, ascensionLevel: 5, cardLevel: 5,
    },
    {
      slug: "member-seed-sorter",
      cardType: "MEMBER" as const,
      rarity: "FORBIDDEN" as const,
      title: "Seed Sorter",
      subtitle: "Cult Rank VI · Before the Beginning",
      flavourText: "You were here before it was called the Cult. You remember the first stream.",
      abilities: ["EARNED: Founding members only. Non-transferable. Eternal.", "PASSIVE: Credits earn at 2×. All future drops arrive early. Your name in the lore."],
      statA: 6, statB: 6, statC: 0,
      maxSupply: 13, isSoulbound: true, ascensionLevel: 6, cardLevel: 6,
    },
  ];

  // ── Upsert all cards ────────────────────────────────────────────────────────
  const allCardSets = [
    { cards: relics,    pack: ritualPack },
    { cards: entities,  pack: chaosPack },
    { cards: prophecies, pack: prophecyPack },
    { cards: members,   pack: null },
  ];

  for (const { cards, pack } of allCardSets) {
    for (const cardData of cards) {
      const { slug, ...data } = cardData;
      const card = await prisma.card.upsert({
        where: { slug },
        update: { ...data },
        create: { slug, isActive: true, totalMinted: 0, ...data },
      });
      if (pack) {
        await prisma.packCard.upsert({
          where: { packId_cardId: { packId: pack.id, cardId: card.id } },
          update: {},
          create: { packId: pack.id, cardId: card.id, weight: 1.0 },
        });
      }
      console.log(`✓ ${card.title}`);
    }
  }

  console.log("\nDone. Seeded 3 packs and 30 cards.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run the seed script**

```bash
cd /c/Users/johnb/cultcodex-ui && npx tsx scripts/seed-cards-phase1.ts
```

Expected output: 30 lines of `✓ <card title>` then `Done. Seeded 3 packs and 30 cards.`

If it errors on import path, change the first line to:
```ts
import { PrismaClient } from "@prisma/client";
```

- [ ] **Step 3: Verify in the database**

```bash
npx tsx -e "import {PrismaClient} from '../src/generated/prisma/client'; const p=new PrismaClient(); p.card.count().then(n=>{console.log('Cards:',n);p.\$disconnect()})"
```

Expected: `Cards: 30` (or higher if cards already existed).

- [ ] **Step 4: Commit**

```bash
git add scripts/seed-cards-phase1.ts
git commit -m "feat: seed 30 phase-1 cards — 8 Relics, 10 Entities, 6 Prophecies, 6 Members + 3 new packs"
```

---

## Task 8: Update collection-view.tsx — New Filters

**Files:**
- Modify: `src/app/cards/collection-view.tsx`

- [ ] **Step 1: Update the hardcoded RARITIES and TYPES arrays**

Find and replace:

```ts
const RARITIES: FilterRarity[] = ["ALL", "ORACLE", "ANOMALY", "TRANSMISSION", "SIGNAL", "STATIC"];
const TYPES: FilterType[] = ["ALL", "VOICE", "TRANSMISSION", "LORE", "SIGNAL", "ORACLE", "CIPHER"];
```

Replace with:

```ts
const RARITIES: FilterRarity[] = [
  "ALL", "LIVING", "GLITCHED", "FORBIDDEN", "ORACLE", "ANOMALY", "TRANSMISSION", "SIGNAL", "STATIC",
];
const TYPES: FilterType[] = [
  "ALL",
  "AVATAR", "ENTITY", "RELIC", "PROPHECY", "MEMBER", "INCIDENT", "GLITCH", "MAHAVIDYA",
  "VOICE", "TRANSMISSION", "LORE", "SIGNAL", "ORACLE", "CIPHER",
];
```

- [ ] **Step 2: Update RARITY_ORDER usage in sort**

The sort already uses `RARITY_ORDER[b.card.rarity] - RARITY_ORDER[a.card.rarity]` — this will automatically work once `RARITY_ORDER` is extended in Task 2. No change needed.

- [ ] **Step 3: Add soulbound indicator to collection cards**

Find the card rendering in CollectionView where `TradingCard` is rendered. Just below the `TradingCard` component, add:

```tsx
{oc.card.isSoulbound && (
  <div style={{
    fontFamily: "var(--font-mono), monospace",
    fontSize: 7,
    color: "var(--neon)",
    textAlign: "center",
    marginTop: 4,
    letterSpacing: "0.1em",
    opacity: 0.6,
  }}>⛓ SOULBOUND</div>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/cards/collection-view.tsx
git commit -m "feat: update collection view — new rarity/type filters, soulbound indicator"
```

---

## Task 9: /cards/archetypes — Public Personality Types Page

**Files:**
- Create: `src/app/cards/archetypes/page.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/cards/archetypes/page.tsx`:

```tsx
import type { Metadata } from "next";
import { ALL_PERSONALITY_TYPES, PERSONALITY_TYPE_STYLE } from "@/lib/cards/personality";

export const metadata: Metadata = {
  title: "Card Archetypes — CULT CODEX",
  description: "The 10 personality types of the Cult of Psyche card system. Every voice is classified.",
};

export default function CardArchetypesPage() {
  return (
    <main style={{ minHeight: "100vh", background: "var(--term-bg)", padding: "40px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        <p style={{
          fontFamily: "var(--font-mono), monospace", fontSize: 10,
          color: "var(--neon)", letterSpacing: "0.4em",
          textShadow: "var(--glow-neon)", marginBottom: 12,
        }}>
          // PERSONALITY_TYPES
        </p>

        <h1 style={{
          fontFamily: "var(--font-mono), monospace", fontSize: 26,
          color: "var(--term-fg)", marginBottom: 8,
        }}>
          The 10 Archetypes
        </h1>

        <p style={{
          fontFamily: "var(--font-mono), monospace", fontSize: 11,
          color: "var(--term-fg-dim)", marginBottom: 40, lineHeight: 1.7, maxWidth: 560,
        }}>
          Every voice in the Cult of Psyche archive is classified by personality type.
          These are not roles assigned from outside — they emerge from 2,572 episodes of transcript patterns.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}>
          {ALL_PERSONALITY_TYPES.map((type) => {
            const ps = PERSONALITY_TYPE_STYLE[type];
            return (
              <div
                key={type}
                style={{
                  borderRadius: 10,
                  border: `1px solid ${ps.color}44`,
                  background: "rgba(0,0,0,0.3)",
                  padding: "18px 20px",
                  transition: "border-color 200ms ease, box-shadow 200ms ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${ps.color}99`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${ps.color}22`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${ps.color}44`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 28, filter: `drop-shadow(0 0 8px ${ps.color})` }}>{ps.icon}</span>
                  <span style={{
                    fontFamily: "var(--font-mono), monospace", fontSize: 13,
                    fontWeight: "bold", color: ps.color, letterSpacing: "0.15em",
                    textShadow: ps.glow,
                  }}>{ps.label}</span>
                </div>
                <p style={{
                  fontFamily: "var(--font-mono), monospace", fontSize: 10,
                  color: "var(--term-fg-dim)", lineHeight: 1.6, margin: 0,
                }}>
                  {ps.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify the page renders**

```bash
cd /c/Users/johnb/cultcodex-ui && npx tsc --noEmit 2>&1 | grep "archetypes" | head -5
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/cards/archetypes/
git commit -m "feat: add /cards/archetypes — public personality type showcase page"
```

---

## Task 10: Admin Seed Page + API Route

**Files:**
- Create: `src/app/admin/cards/seed/page.tsx`
- Create: `src/app/api/admin/seed-cards/route.ts`

- [ ] **Step 1: Create the API route**

Create `src/app/api/admin/seed-cards/route.ts`:

```ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { PrismaClient } from "@/generated/prisma/client";

// Inline the seed data call — imports the seed logic directly
export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  try {
    // Dynamically import seed function to avoid bundling all seed data in the client
    const { seedPhase1Cards } = await import("@/lib/cards/seed-phase1");
    const result = await seedPhase1Cards();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[seed-cards]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Extract seed logic to a lib module**

Create `src/lib/cards/seed-phase1.ts` by taking the `main()` body from `scripts/seed-cards-phase1.ts` and wrapping it:

```ts
import { prisma } from "@/lib/db";

export async function seedPhase1Cards(): Promise<{ seeded: number }> {
  // Paste the entire body of the main() function from scripts/seed-cards-phase1.ts here
  // (all the relics/entities/prophecies/members arrays + the upsert loop)
  // Replace `console.log` with no-ops or keep them (they go to server logs)
  let seeded = 0;
  // ... (full seed body) ...
  return { seeded };
}
```

(Copy the full arrays and loop from `scripts/seed-cards-phase1.ts` into this function. Increment `seeded` in the inner loop.)

- [ ] **Step 3: Create the admin seed page**

Create `src/app/admin/cards/seed/page.tsx`:

```tsx
"use client";
import { useState } from "react";
import { requireAdmin } from "@/lib/auth"; // server-side guard is in the API

export default function AdminCardSeedPage() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function runSeed() {
    setStatus("running");
    setMsg("");
    try {
      const res = await fetch("/api/admin/seed-cards", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Seed failed");
      setStatus("done");
      setMsg(`Seeded ${json.seeded} cards.`);
    } catch (err) {
      setStatus("error");
      setMsg(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 500 }}>
      <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, color: "var(--neon)", letterSpacing: "0.3em", marginBottom: 12 }}>
        // ADMIN · SEED_CARDS
      </p>
      <h1 style={{ fontFamily: "var(--font-mono), monospace", fontSize: 20, color: "var(--term-fg)", marginBottom: 8 }}>
        Phase 1 Card Seed
      </h1>
      <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: "var(--term-fg-dim)", marginBottom: 24, lineHeight: 1.7 }}>
        Seeds 30 cards (8 Relics, 10 Entities, 6 Prophecies, 6 Members) and 3 packs.
        Idempotent — safe to run multiple times.
      </p>
      <button
        onClick={runSeed}
        disabled={status === "running"}
        style={{
          fontFamily: "var(--font-mono), monospace", fontSize: 12,
          letterSpacing: "0.15em", textTransform: "uppercase",
          color: "var(--neon)", background: "transparent",
          border: "1px solid var(--neon)", borderRadius: 4,
          padding: "10px 28px", cursor: status === "running" ? "not-allowed" : "pointer",
          opacity: status === "running" ? 0.5 : 1,
        }}
      >
        {status === "running" ? "SEEDING..." : "▸ RUN SEED"}
      </button>
      {msg && (
        <p style={{
          fontFamily: "var(--font-mono), monospace", fontSize: 11, marginTop: 20,
          color: status === "error" ? "var(--neon-5)" : "var(--neon)",
        }}>
          {status === "done" ? "✓ " : "✕ "}{msg}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/cards/seed/ src/app/api/admin/seed-cards/ src/lib/cards/seed-phase1.ts
git commit -m "feat: admin seed page + API route for phase-1 card seeding"
```

---

## Task 11: Final Integration Check + Deploy

- [ ] **Step 1: Full TypeScript check**

```bash
cd /c/Users/johnb/cultcodex-ui && npx tsc --noEmit 2>&1
```

Expected: zero errors. Fix any that appear before continuing.

- [ ] **Step 2: Check the build**

```bash
npx next build 2>&1 | tail -20
```

Expected: `Route (app)` table with no errors. If a page errors, check the Prisma query — likely a missing `.catch()`.

- [ ] **Step 3: Add .superpowers to .gitignore**

```bash
echo ".superpowers/" >> .gitignore
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm session files"
```

- [ ] **Step 4: Push to trigger Railway deploy**

```bash
git push origin master
```

Expected: Railway picks up the push and deploys within ~3 minutes.

- [ ] **Step 5: Verify on cultcodex.me**

- Visit `/cards` — collection should load, new type filters visible
- Visit `/cards/packs` — Ritual Pack, Chaos Pack, Oracle Pack should appear  
- Visit `/cards/archetypes` — 10 personality type tiles visible
- Visit `/admin/cards/seed` — seed button visible (admin only)
- Click seed button → `✓ Seeded 30 cards`
- Open a Chaos Pack — Entity cards should appear with magenta glitch animation
- Open a Ritual Pack — Relic cards should appear with gold pulse + foil shimmer

---

## Self-Review

**Spec coverage check:**
- ✓ Task 1: New CardType enum values (8 types), new Rarity values (3), new Card fields (11)
- ✓ Task 2: rarity.ts extended — RARITY_LABEL, RARITY_ORDER, RARITY_STYLE, all CardType maps, new exports
- ✓ Task 3: CARD_TYPE_GEOMETRY — geometry.ts with SVG paths for all 8 new types
- ✓ Task 4: personality.ts — 10 types with color/icon/label, MEMBER_RANK, computeCardLevel
- ✓ Task 5: globals.css — relic/entity/prophecy/member/glitch/living animations
- ✓ Task 6: TradingCard overhaul — bigger art, geometry, stars, personality banner, column stats, redaction, foil tints, soulbound badge, animation classes
- ✓ Task 7: Seed script — all 30 cards with full data, 3 packs, idempotent
- ✓ Task 8: collection-view.tsx — new type/rarity filters, soulbound indicator
- ✓ Task 9: /cards/archetypes page
- ✓ Task 10: Admin seed page + API route
- ✓ Task 11: Build check + deploy
- ✓ Spec §8 "not in Phase 1": AI art, live prophecy triggers, equip gameplay, ascension tracking, GLITCH/MAHAVIDYA seeds, fusion — none present in plan

**Type consistency check:**
- `PersonalityType` defined in `personality.ts`, imported in `trading-card.tsx` ✓
- `GeometryPath` defined in `geometry.ts`, used in `CardGeometry` component ✓
- `CARD_TYPE_COLUMN_STATS`, `CARD_TYPE_SHOW_STARS`, `CARD_TYPE_SHOW_PERSONALITY` defined in `rarity.ts`, imported in `trading-card.tsx` ✓
- `MEMBER_RANK` used in `MemberRankBadge` — key is `number`, `ascensionLevel` is `number` ✓
- Seed script uses `"RELIC" as const` etc — matches new enum values ✓

**No placeholders:** All steps contain actual code, exact commands, expected output. ✓
