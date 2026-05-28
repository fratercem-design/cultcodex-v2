# Trading Card System — Design Spec
**Date:** 2026-05-19  
**Project:** cultcodex.me  
**Status:** Approved for implementation

---

## Vision

An occult internet civilization documenting itself through trading cards. Not collectible images — identity fragments, lore objects, utility items, status markers, and mystery engines. The card system turns the existing 2,572-episode archive into a living mythology people obsess over.

Aesthetic fusion: 90s holographic trading cards × occult grimoire × Yu-Gi-Oh × Pokémon × ARG mystery × vaporwave CRT cathedral.

---

## Scope — Phase 1

This spec covers Phase 1: schema expansion, visual overhaul of the card component, seed data for the four priority archetypes, and the personality type system for Voice/Avatar cards. Phase 2 (AI art pipeline, Prophecy fulfillment triggers, Equip gameplay, Member ascension tracking) is out of scope here.

---

## 1. Schema Changes

### 1a. New CardType enum values
Add to existing `CardType` enum:
```
AVATAR     -- identity/archetype cards (Pokémon+Yu-Gi-Oh personality)
INCIDENT   -- legendary stream events (community memory objects)
RELIC      -- sacred objects with equip mechanics
ENTITY     -- chaos entity monster cards (internet archetypes)
PROPHECY   -- ARG mystery cards with redacted fulfillment conditions
MEMBER     -- soulbound community rank cards
GLITCH     -- corrupted ultra-rare anomalies
MAHAVIDYA  -- sacred divine feminine archetypes (reverent treatment)
```
Existing types (VOICE, TRANSMISSION, LORE, SIGNAL, ORACLE, CIPHER) are kept unchanged.

### 1b. New Rarity enum values
Add to existing `Rarity` enum:
```
FORBIDDEN  -- ultra rare, below Oracle
GLITCHED   -- corrupted cards, animated distortion
LIVING     -- evolves over time (art/text changes with stream events)
```
Existing: STATIC → SIGNAL → TRANSMISSION → ANOMALY → ORACLE → FORBIDDEN → GLITCHED → LIVING

### 1c. New fields on `Card` model
```prisma
personalityType   String?   -- MYSTIC|TRICKSTER|FLAME|WATCHER|SIGNAL|SAGE|SHADOW|CHAOS|VOID|LIGHT
secondaryType     String?   -- dual-type support (e.g. MYSTIC/CHAOS)
cardLevel         Int       @default(1)   -- Yu-Gi-Oh star level (1–8), computed from appearances
isEquippable      Boolean   @default(false)  -- Relic cards only
equipTarget       String?   -- "VOICE"|"MEMBER"|"ANY"
isSoulbound       Boolean   @default(false)  -- Member cards: cannot trade, permanently bound to earner
fulfillmentStatus String?   -- "UNFULFILLED"|"WATCHING"|"FULFILLING"|"FULFILLED" (Prophecy only)
fulfillmentCond   String?   -- human-readable condition shown on card
secretCondition   String?   -- machine-readable gate: "time:03:33"|"event:trollstorm"|"admin"|etc
ascensionLevel    Int       @default(0)  -- for Member cards (0–5), admin-granted in Phase 1
loreLayer         String?   -- hidden lore text; redacted until fulfillment/ascension
```

Note: ATK/DEF/SIG values reuse existing `statA`/`statB`/`statC` fields — new `STAT_LABELS` entries in `rarity.ts` map them to "ATK"/"DEF"/"SIG" for AVATAR and ENTITY card types. No new stat columns needed.

Note: `CardInteraction` model (prophecy witnessing, equip state) is deferred to Phase 2. Phase 1 stores conditions in card data only — no live evaluation.

---

## 2. Visual System — TradingCard Component Overhaul

### 2a. Art panel
- Fixed at **130px on md size** (card is 280px tall) — visually larger because stat section is more compact; replaces the current `height * 0.52` calculation
- Sacred geometry SVG overlay per card type (drawn in code, replaced by AI art later)
- Geometry patterns by type:
  - RELIC: alchemical triangle + circles (gold)
  - ENTITY: concentric ellipses + eye geometry (magenta)
  - PROPHECY: dashed orbit circles + radial lines (cyan)
  - MEMBER: star polygon + hexagram overlay (neon green)
  - AVATAR: pentagram + spiral (violet)
  - MAHAVIDYA: Sri Yantra-inspired triangles (amber)
  - GLITCH: broken grid with dropout lines (red)
  - INCIDENT: VHS tracking lines + timestamp geometry (crimson)

### 2b. Type-specific header
- New **level stars row** (Yu-Gi-Oh style) — shown for AVATAR, VOICE, ENTITY, MAHAVIDYA
- New **personality type banner** — shown for AVATAR and VOICE cards
  - Color-coded chip: MYSTIC=violet, TRICKSTER=magenta, FLAME=orange, WATCHER=cyan, SIGNAL=neon, SAGE=green, SHADOW=red, CHAOS=blue-violet, VOID=pink, LIGHT=gold
- **Status banner** for PROPHECY: UNFULFILLED/WATCHING/FULFILLED with color
- **Rank badge** for MEMBER: LVL N + rank name centered above abilities

### 2c. Stats section
- AVATAR/VOICE: ATK / DEF / SIG three-column display (replaces stat bars)
- RELIC: POWER / EQUIP TARGET / SUPPLY (minted/max)
- ENTITY: ATK / DEF / STACK (passive stack counter)
- PROPHECY: STATUS / WITNESSES / REWARD (last one redacted until fulfilled)
- MEMBER: LVL / XP / RANK three-column

### 2d. Animations by type
- **RELIC**: gold pulse glow (3s ease-in-out infinite)
- **ENTITY**: scanline corruption + periodic glitch transform (5s cycle)
- **PROPHECY**: subtle signal flicker (6s cycle, opacity dips)
- **MEMBER**: neon green pulse (2.5s)
- **GLITCH**: aggressive glitch every 4s (hue-rotate, translate, clip-path)
- **LIVING**: continuous pulse glow that breathes
- **Foil shimmer**: gold shimmer on RELIC, magenta on ENTITY, cyan on PROPHECY

### 2e. Redaction system (PROPHECY only)
- `fulfillmentCond` text is shown normally
- `loreLayer` (the reward) is rendered as `<span class="redacted">` — blue highlight, invisible text
- On FULFILLED status: redaction lifts, text glows cyan

---

## 3. Personality Type System (Voice/Avatar cards)

10 types. **Manually set in Phase 1 seed data.** Phase 2 will add Claude API classification from transcript patterns. Admin UI allows override at any time.

| Type | Color | Icon | Assigned to |
|------|-------|------|-------------|
| MYSTIC | #b388ff | 🜁 | Oracles, tarot readers, seers |
| TRICKSTER | #ff2bd6 | 🃏 | Trolls, provocateurs, chaos agents |
| FLAME | #ff6b35 | 🔥 | Protectors, loyalists, BKG circle |
| WATCHER | #00e5ff | 👁 | Lurkers, analysts, silent witnesses |
| SIGNAL | #ffd700 | 📡 | Amplifiers, connectors, recruiters |
| SAGE | #00ff9c | 🌿 | Scholars, historians, calm authority |
| SHADOW | #ff4444 | ☠ | Fallen, banned, reformed villains |
| CHAOS | #c0c0ff | 🌀 | Wildcards, pattern-breakers |
| VOID | #ff8c94 | 💀 | Unknown origin, manifested from nothing |
| LIGHT | #ffe4b5 | ✨ | Healers, warmth-bringers |

ATK/DEF/SIG computed from archive data:
- ATK = `clamp((appearances / 50) * 90 + 9)` scaled to archive presence
- DEF = loyalty proxy (recurring guests score higher; hosts max)
- SIG = actual signal count pulled from `topic.episodeCount` or person appearance count
- LEVEL (1–8 stars) = log-scaled from appearances: 1 guest = 1★, host = 8★

---

## 4. Seed Data — Four Priority Archetypes

### 4a. RELIC cards (8 cards)
All RELIC, all isEquippable=true, all have maxSupply set, all gold foil.
- The Golden Microphone (TRANSMISSION, 1/77)
- The Lamp of Eros (ANOMALY, 1/33)
- The Black Mirror Webcam (SIGNAL, 1/144)
- The Ban Hammer of Silence (TRANSMISSION, 1/99)
- The Fractured Sigil (ANOMALY, 1/13)
- The Panther Key (ORACLE, 1/7)
- The Crimson Headphones (SIGNAL, 1/88)
- The VHS of Revelation (FORBIDDEN, 1/3)

### 4b. ENTITY cards (10 cards)
All ENTITY, unlimited supply (maxSupply=null), all have passive stacking mechanics.
- The Reply Goblin (STATIC — common)
- The Parasocial Vampire (SIGNAL)
- The Algorithm Beast (TRANSMISSION)
- The Attention Serpent (ANOMALY)
- The Engagement Demon (TRANSMISSION)
- The Shadow Banned One (ANOMALY)
- The Ad Revenue Phantom (SIGNAL)
- The Noise Eater (ANOMALY)
- The Doomscroll Leviathan (ORACLE, 1/13)
- The Smiling Moderator (FORBIDDEN, 1/7)

### 4c. PROPHECY cards (6 cards)
All ORACLE rarity, all fulfillmentStatus=UNFULFILLED initially, all have secretCondition.
- "Three Voices Break the Gate" (condition: 3 different-type VOICE cards in same stream)
- "The Butterfly Opens the Seventh Door" (secretCondition: "time:03:33")
- "The Signal Returns at Dawn" (condition: stream starts after 6am)
- "Beware the Smiling Moderator" (condition: linked to Smiling Moderator ENTITY card)
- "The False Prophet Speaks Twice" (condition: admin-triggered live event)
- "Seven Voices, One Chamber" (condition: 7 guests in single stream)

### 4d. MEMBER cards (6 cards, one per rank)
All MEMBER, all isSoulbound=true. Not in packs — earned via activity.
- LVL 1: Chaos Witness (STATIC)
- LVL 2: Flame Keeper (SIGNAL)
- LVL 3: Panel Survivor (TRANSMISSION)
- LVL 4: Echo Walker (ANOMALY)
- LVL 5: First Circle Member (ORACLE)
- LVL 6: Seed Sorter (FORBIDDEN — rarest rank)

---

## 5. rarity.ts Updates

Extend all lookup maps to cover new CardType and Rarity values:
- `RARITY_LABEL`, `RARITY_ORDER`, `RARITY_STYLE` — add FORBIDDEN, GLITCHED, LIVING
- `CARD_TYPE_GLYPH`, `CARD_TYPE_LABEL`, `STAT_LABELS` — add all 8 new types
- New export: `PERSONALITY_TYPE_STYLE` — color/icon/label per personality type
- New export: `CARD_TYPE_GEOMETRY` — SVG path data per card type for art overlays
- New export: `CARD_TYPE_ANIMATION` — animation class name per card type

---

## 6. New Pages & Routes

### `/cards/archetypes`
Grid of all 10 personality types with example cards and lore descriptions. Public page.

### `/cards/collection` (update existing)
Filter by card type (new types included). Sort by new rarities. Show ATK/DEF on hover.

### `/admin/cards/seed`
Admin-only page to trigger seed scripts for the four archetype sets.

---

## 7. Seed Script

`scripts/seed-cards-phase1.ts` — seeds all 30 cards across the four archetypes with:
- Full card data (title, subtitle, flavourText, abilities, stats, conditions)
- Assigns to appropriate packs (Chaos Pack gets Entities, Ritual Pack gets Relics, etc.)
- Idempotent (upsert by slug)

---

## 8. What Is NOT in Phase 1

- AI art generation (cards use SVG geometry placeholders + emoji glyphs)
- Prophecy live fulfillment triggers (conditions exist in data, not yet auto-evaluated)
- Equip mechanic in gameplay (field exists, UI deferred)
- Member ascension activity tracking (rank field exists, manual admin grant for now)
- GLITCH and MAHAVIDYA card seeds (Visual system supports them, seed deferred)
- Fusion system
- Physical card ordering

---

## Success Criteria

- All 30 seed cards visible in `/cards` collection view
- New card types render correctly with type-specific geometry, animations, stat layouts
- Personality type banner visible on VOICE/AVATAR cards
- Prophecy cards show redacted reward text
- Member cards show rank badge and soulbound indicator
- Relic cards show gold pulse and limited supply
- Entity cards show magenta glitch animation
- All existing card functionality (pack opening, daily credits, collection stats) still works
- No TypeScript errors, no broken Prisma queries
