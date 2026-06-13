/**
 * Generate unique illustrative images for trading cards via DALL-E 3.
 *
 * Images are saved to public/cards/art/[slug].png and artUrl is updated in DB.
 * Portraits are 1024×1792 (DALL-E 3 portrait size) — ~52% art area fill on card.
 *
 * Usage:
 *   npx tsx scripts/generate-card-art.ts                   # all cards without artUrl
 *   npx tsx scripts/generate-card-art.ts --type MAHAVIDYA  # specific type only
 *   npx tsx scripts/generate-card-art.ts --limit 5         # first N cards
 *   npx tsx scripts/generate-card-art.ts --dry-run         # show prompts, no API calls
 *   npx tsx scripts/generate-card-art.ts --all             # re-generate even existing
 *   npx tsx scripts/generate-card-art.ts --slug kali-the-devourer  # single card
 *
 * Cost: ~$0.08 per image (DALL-E 3 standard 1024×1792)
 *
 * Rate limit: 5 images/min — script waits 13s between requests automatically.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { getPrisma, disconnect } from "./ingest/lib";

const prisma = getPrisma();

const OUTPUT_DIR = path.join(process.cwd(), "public/cards/art");
const RATE_LIMIT_MS = 13_000; // 13s between requests → ~4.6/min (safe under 5/min)

// Filenames of already-passed Chinnamastā art, in preference order. Any
// Chinnamastā-variant card reuses the first one that exists on disk.
const CHINNAMASTA_ART_SOURCES = ["chhinnamasta.png", "chinnamasta-the-severed.png", "chinnamasta-severed.png"];

// ── All 10 Mahavidyas — ensures complete set exists in DB ────────────────────

const ALL_MAHAVIDYAS = [
  { slug: "kali-the-devourer",      title: "Kālī",           subtitle: "The Devourer",           rarity: "LEGENDARY",    statA: 99, statB: 88, statC: 99, abilities: ["Ego Death", "Shadow Clear"],       flavourText: "She destroys what cannot be saved. Nothing else." },
  { slug: "tara-the-liberator",     title: "Tārā",           subtitle: "She Who Carries Across",  rarity: "LEGENDARY",    statA: 96, statB: 91, statC: 77, abilities: ["Safe Passage", "Compassion Field"], flavourText: "She carries those who cannot carry themselves across the dark water." },
  { slug: "tripura-sundari",        title: "Tripurā Sundarī",subtitle: "Beauty of the Three Worlds",rarity:"MYTHIC",      statA: 99, statB: 97, statC: 88, abilities: ["World Sight", "Triple Domain"],    flavourText: "She contains the three worlds and finds them aesthetically satisfying." },
  { slug: "bhuvaneshvari",          title: "Bhuvaneshvarī",  subtitle: "Queen of the Universe",   rarity: "LEGENDARY",    statA: 97, statB: 88, statC: 91, abilities: ["Spatial Command", "World Hold"],   flavourText: "Space itself is her body. Distance is her devotion." },
  { slug: "bhairavi-the-fierce",    title: "Bhairavī",       subtitle: "The Fierce One",          rarity: "LEGENDARY",    statA: 92, statB: 88, statC: 96, abilities: ["Cycle End", "Terror Field"],       flavourText: "She arrives at the end of cycles and begins the next." },
  { slug: "chhinnamasta",           title: "Chinnamastā",    subtitle: "The Self-Severed",        rarity: "MYTHIC",       statA: 99, statB: 99, statC: 99, abilities: ["Self-Sacrifice", "Severed Voice"],  flavourText: "She cut her own head to feed her devotees. The head kept speaking.", maxSupply: 13 },
  { slug: "dhumavati-the-widow",    title: "Dhūmāvatī",      subtitle: "Widow Goddess",           rarity: "ORACLE",       statA: 88, statB: 96, statC: 82, abilities: ["Void Accept", "Smoke Ward"],       flavourText: "She sits in smoke and owns what no one else will claim." },
  { slug: "bagalamukhi-the-still",  title: "Bagalamukhi",    subtitle: "She Who Paralyzes",       rarity: "ORACLE",       statA: 88, statB: 96, statC: 85, abilities: ["Silence", "Troll Freeze"],         flavourText: "She doesn't argue. She simply stops the mouth." },
  { slug: "matangi-the-outcast",    title: "Mātangī",        subtitle: "Patron of the Marginal",  rarity: "ANOMALY",      statA: 81, statB: 88, statC: 79, abilities: ["Outcast Bond", "Margin Signal"],   flavourText: "She is offered what is leftover. She finds it sufficient." },
  { slug: "kamala-the-lotus",       title: "Kamalā",         subtitle: "Lotus of Abundance",      rarity: "TRANSMISSION", statA: 77, statB: 92, statC: 66, abilities: ["Abundance Field", "Lotus Bloom"],  flavourText: "Not all abundance is material. She distributes what is needed." },
] as const;

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN    = args.includes("--dry-run");
const REGEN_ALL  = args.includes("--all");
const TYPE_ARG   = args.find(a => a.startsWith("--type="))?.split("=")[1]
                ?? (args.indexOf("--type") >= 0 ? args[args.indexOf("--type") + 1] : null);
const LIMIT_ARG  = args.find(a => a.startsWith("--limit="))?.split("=")[1]
                ?? (args.indexOf("--limit") >= 0 ? args[args.indexOf("--limit") + 1] : null);
const SLUG_ARG   = args.find(a => a.startsWith("--slug="))?.split("=")[1]
                ?? (args.indexOf("--slug") >= 0 ? args[args.indexOf("--slug") + 1] : null);
const LIMIT_RAW  = LIMIT_ARG ? parseInt(LIMIT_ARG, 10) : undefined;
if (LIMIT_RAW !== undefined && (isNaN(LIMIT_RAW) || LIMIT_RAW <= 0)) {
  console.error(`Invalid --limit value: "${LIMIT_ARG}". Must be a positive integer.`);
  process.exit(1);
}
const LIMIT = LIMIT_RAW;

// ── Rarity palette hints ──────────────────────────────────────────────────────

const RARITY_PALETTE: Record<string, string> = {
  STATIC:       "muted dark greys, faint teal glow",
  SIGNAL:       "neon green, deep black, electric green accents",
  TRANSMISSION: "deep violet, purple glow, transmission wave patterns",
  ANOMALY:      "gold and deep crimson, anomalous radiant energy",
  ORACLE:       "blood red, deep crimson, oracle fire, prophetic red light",
  LEGENDARY:    "brilliant gold, amber, legendary warm aura, starfield",
  MYTHIC:       "deep violet, electric purple, mythic cosmic scale, nebula",
  FORBIDDEN:    "blood red and black, forbidden dark light, corrupted data, warning glyphs",
};

// ── Per-type prompt builders ─────────────────────────────────────────────────

function buildMahavidyaPrompt(title: string, subtitle: string, flavourText: string, rarity: string): string {
  const iconography: Record<string, string> = {
    "Kālī": "blue-black skin, four arms — upper two holding sword and a severed lotus, lower two in abhaya and varada mudra — adorned with a garland of lotus-skull emblems, tongue extended in the fierce mudra, standing atop the prostrate white-skinned Shiva on a cremation-ground lotus, lightning sky, intense transcendent expression, traditional pata painting style",
    "Bagalamukhi": "golden-yellow complexion, yellow garments and ornaments, left hand grasps the tongue of a kneeling devotee-demon, right hand raised holding a golden club, seated on a golden throne in a sun-lit lotus lake, yellow lotus flowers, three eyes, serene all-powerful expression, traditional pata painting style",
    "Tārā": "deep indigo-blue body, three eyes, seated in royal ease on a white lotus throne, matted hair adorned with moon crest, wearing tiger-skin mantle, garland of white lotuses and symbolic emblems, holding a blue lotus and ritual implements, fierce yet deeply compassionate expression, Tibetan thangka-inspired sacred art",
    "Chinnamastā": "SKIP_NAME_PROMPT",
    "Chhinnamastā": "SKIP_NAME_PROMPT",
    "Chhinnamasta": "SKIP_NAME_PROMPT",
    "Chinnamasta": "SKIP_NAME_PROMPT",
    "Dhūmāvatī": "pale silver-grey complexion, an elderly great widow goddess, disheveled white hair adorned with smoke-wisps, gaunt dignified face with deep wisdom in the eyes, riding a crow-drawn chariot through mist, crow staff banner, wearing white widow robes, desolate twilight landscape, sacred ash and incense smoke, traditional pata painting style",
    "Mātangī": "emerald green complexion, elegant and fierce, seated on an ornate jeweled throne beneath a forest canopy, holding ritual knife and skull cup, surrounded by emerald-plumaged parrots, flowers and forest offerings at her feet, beautiful serene expression, sacred grove atmosphere, traditional South Indian temple art style",
    "Kamalā": "luminous golden-rose complexion, full of grace and abundance, seated on a fully-open pink lotus, two white royal elephants flanking her raising trunks in offering, pouring streams of golden water and flowers over her, holding pink lotuses in two raised hands, two lower hands in varada and abhaya mudra, radiant warm light, traditional Lakshmi-form devotional painting",
    "Tripurā Sundarī": "lustrous red-rose complexion radiant as the rising sun, supremely beautiful and serene, seated on a lotus throne upheld by Brahma, Vishnu, Rudra and Sadashiva as her divine footstool, four arms holding noose, goad, sugarcane bow and flower arrows, crown with crescent moon, surrounded by golden light, exquisitely beautiful, traditional Sri Yantra-framed devotional art",
    "Bhuvaneshvarī": "red complexion luminous like the dawn, crescent moon crown, four arms — two in varada and abhaya mudra, holding a noose and goad — wearing crimson silks adorned with star emblems, surrounded by infinite cosmic space with nebulae, galaxies and sacred geometry, serene all-encompassing queen expression, traditional cosmological sacred art",
    "Bhairavī": "deep crimson-gold complexion, majestic and fierce, seated in lotus posture on a lotus throne, rising sun as her blazing nimbus, three cosmic eyes, adorned with garland of sacred symbols, holding a book of wisdom, fire vessel, skull cup, right hand in abhaya mudra, moon in matted hair, traditional tantric solar goddess painting",
  };

  const icon = iconography[title] ?? `fierce divine goddess, multiple arms, divine weapons, traditional sacred iconography`;
  const palette = RARITY_PALETTE[rarity] ?? "jewel tones, gold";

  // Some deities trigger safety filters by name — use a nameless visual description
  if (icon === "SKIP_NAME_PROMPT") {
    return `Traditional Indian tantric devotional painting of a radiant golden goddess standing in a triumphant pose with both arms raised high, three luminous halos of sacred golden energy radiating from her crown outward and downward blessing two devoted figures kneeling below her in reverence, wearing elaborate ornate jewelry lotus garlands and a jeweled crown, standing atop a lotus platform above celestial waters, blazing divine aura, surrounded by sacred geometry and lotus mandala patterns, ${palette}, extremely detailed, museum quality sacred art, no violence, vertical portrait composition, spiritual radiance, classical pata painting style`;
  }

  return `Sacred devotional illustration of the Hindu goddess ${title} (${subtitle}). ${icon}. Museum-quality sacred art, intricate hand-painted style, rich jewel tones with ${palette}, ornate gold jewelry and crown, sacred geometry and divine symbols framing the figure, dark cosmic background with lotus and mandala motifs, extremely detailed, spiritual radiance. Traditional Indian devotional tarot card art, vertical portrait composition, inspired by classical pata and thangka painting traditions.`;
}

function buildVoicePrompt(title: string, subtitle: string, flavourText: string, rarity: string): string {
  const palette = RARITY_PALETTE[rarity] ?? "dark atmosphere";
  return `Mystical stylized portrait of a figure named "${title}" — ${subtitle}. ${flavourText.slice(0, 80)}. Dark esoteric atmosphere, ${palette}, symbolic occult elements surrounding the figure, dark background with transmission wave patterns, cult archive aesthetic, tarot card illustration style, vertical portrait composition, highly detailed, digital painting.`;
}

function buildTransmissionPrompt(title: string, subtitle: string, flavourText: string, rarity: string): string {
  const palette = RARITY_PALETTE[rarity] ?? "deep purple";
  return `Abstract atmospheric scene titled "${title}". ${subtitle}. ${flavourText.slice(0, 100)}. Broadcast waves, cosmic frequency patterns, transmission signal aesthetics, dark studio with neon accents, ${palette}, esoteric broadcast tower, mystical atmosphere, tarot card illustration style, vertical portrait composition, highly detailed digital art.`;
}

function buildLorePrompt(title: string, subtitle: string, flavourText: string, rarity: string): string {
  const palette = RARITY_PALETTE[rarity] ?? "dark ochre";
  return `Mystical illustration of the concept "${title}" — "${subtitle}". ${flavourText.slice(0, 120)}. Sacred symbols and occult iconography, ancient manuscript aesthetic with modern dark twist, ${palette}, esoteric glyphs and sigils, atmospheric depth, tarot card illustration style, vertical portrait composition, highly detailed symbolic art.`;
}

function buildSignalPrompt(title: string, subtitle: string, flavourText: string, rarity: string): string {
  const palette = RARITY_PALETTE[rarity] ?? "neon green";
  return `Abstract symbolic artwork representing the concept of "${title}". ${subtitle}. ${flavourText.slice(0, 100)}. Geometric signal patterns, frequency waves, cosmic data visualization, ${palette}, dark background with luminous energy patterns, esoteric information aesthetics, tarot card illustration style, vertical composition, highly detailed.`;
}

function buildOraclePrompt(title: string, subtitle: string, flavourText: string, rarity: string): string {
  const palette = RARITY_PALETTE[rarity] ?? "crimson and gold";
  return `Prophetic oracle vision of "${title}" — "${subtitle}". ${flavourText.slice(0, 120)}. All-seeing eye, cosmic fire, prophetic imagery, mystic oracle surrounded by sacred symbols, ${palette}, dark mystical atmosphere, burning celestial light, tarot card illustration style, vertical portrait composition, extremely detailed.`;
}

function buildCipherPrompt(title: string, subtitle: string, flavourText: string, rarity: string): string {
  const palette = RARITY_PALETTE[rarity] ?? "teal and dark";
  return `Cryptographic cipher artwork titled "${title}" — "${subtitle}". ${flavourText.slice(0, 100)}. Layered encoded symbols, sacred geometry, alchemical notation overlaid with digital code, ${palette}, mysterious dark atmosphere, arcane knowledge aesthetic, tarot card illustration style, vertical composition, highly detailed.`;
}

function buildRelicPrompt(title: string, subtitle: string, flavourText: string, rarity: string): string {
  const palette = RARITY_PALETTE[rarity] ?? "amber and shadow";
  return `Ancient mystical relic artifact — "${title}" — "${subtitle}". ${flavourText.slice(0, 100)}. Detailed artifact illustration, ancient textures, museum-quality display against dark backdrop, ${palette}, sacred object with visible power emanating, runic inscriptions, tarot card illustration style, vertical composition, highly detailed.`;
}

function buildEntityPrompt(title: string, subtitle: string, flavourText: string, rarity: string): string {
  const palette = RARITY_PALETTE[rarity] ?? "cosmic dark";
  return `Cosmic entity "${title}" — "${subtitle}". ${flavourText.slice(0, 120)}. Otherworldly being of immense power, cosmic form, sacred geometry body, ${palette}, void background with star formations and energy fields, overwhelming presence, tarot card illustration style, vertical portrait composition, extremely detailed digital art.`;
}

function buildProphecyPrompt(title: string, subtitle: string, flavourText: string, rarity: string): string {
  const palette = RARITY_PALETTE[rarity] ?? "golden prophecy";
  return `Prophetic vision card — "${title}" — "${subtitle}". ${flavourText.slice(0, 120)}. Ancient prophecy scroll, celestial imagery, future-seeing eye, ${palette}, burning light of revelation, cosmic writing and sacred glyphs, dark mystical atmosphere, tarot card illustration style, vertical composition, highly detailed.`;
}

function buildMemberPrompt(title: string, subtitle: string, flavourText: string, rarity: string): string {
  const palette = RARITY_PALETTE[rarity] ?? "cult purple";
  return `Cult member portrait — "${title}" — "${subtitle}". ${flavourText.slice(0, 100)}. Mysterious figure wearing occult symbolic clothing, sacred archive symbols as background, ${palette}, dark ritual atmosphere, identity partially obscured, sigil and transmission wave motifs, tarot card illustration style, vertical portrait, highly detailed.`;
}

function buildGlitchPrompt(title: string, subtitle: string, flavourText: string, rarity: string): string {
  const palette = RARITY_PALETTE[rarity] ?? "corrupt green";
  return `Digital glitch art — "${title}" — "${subtitle}". ${flavourText.slice(0, 100)}. Corrupted data visualization, glitch effects, pixel dissolution, system error aesthetics, ${palette}, dark cyber atmosphere, fragmented reality, torn digital fabric, tarot card illustration style, vertical composition, highly detailed.`;
}

function buildAvatarPrompt(title: string, subtitle: string, flavourText: string, rarity: string): string {
  const palette = RARITY_PALETTE[rarity] ?? "spectral";
  return `Mystical avatar form — "${title}" — "${subtitle}". ${flavourText.slice(0, 100)}. Symbolic archetypal figure, spectral energy body, ${palette}, cosmic background with signal frequency patterns, sacred geometric aura, powerful presence, tarot card illustration style, vertical portrait composition, highly detailed.`;
}

function buildIncidentPrompt(title: string, subtitle: string, flavourText: string, rarity: string): string {
  const palette = RARITY_PALETTE[rarity] ?? "dark crimson";
  return `Dark incident scene — "${title}" — "${subtitle}". ${flavourText.slice(0, 100)}. Dramatic and ominous atmosphere, event-capture aesthetic, ${palette}, dark esoteric iconography, aftermath energy, tarot card illustration style, vertical composition, highly detailed.`;
}

function buildMajorArcanaPrompt(title: string, subtitle: string, flavourText: string, rarity: string, cardType: string): string {
  const palette = RARITY_PALETTE[rarity] ?? "dark mystical";
  // Major arcana cards have a cyberpunk/tarot fusion aesthetic
  return `Cyberpunk tarot card illustration — "${title}" — "${subtitle}". ${flavourText.slice(0, 150)}. Dark futuristic-occult fusion aesthetic, digital and sacred symbolism combined, ${palette}, arcane circuitry and sacred geometry merged, dark atmospheric background, powerful archetypal imagery, tarot card art style, vertical portrait composition, highly detailed digital painting.`;
}

function buildPrompt(card: {
  slug: string;
  title: string;
  subtitle: string | null;
  flavourText: string | null;
  cardType: string;
  rarity: string;
}): string {
  const t = card.title;
  const s = card.subtitle ?? "";
  const f = card.flavourText ?? "";
  const r = card.rarity;

  // Tarot major arcana slugs start with "cop-maj-"
  const isMajorArcana = card.slug.startsWith("cop-maj-");

  switch (card.cardType) {
    case "MAHAVIDYA":  return buildMahavidyaPrompt(t, s, f, r);
    case "VOICE":      return buildVoicePrompt(t, s, f, r);
    case "TRANSMISSION": return isMajorArcana ? buildMajorArcanaPrompt(t, s, f, r, "TRANSMISSION") : buildTransmissionPrompt(t, s, f, r);
    case "LORE":       return isMajorArcana ? buildMajorArcanaPrompt(t, s, f, r, "LORE") : buildLorePrompt(t, s, f, r);
    case "SIGNAL":     return isMajorArcana ? buildMajorArcanaPrompt(t, s, f, r, "SIGNAL") : buildSignalPrompt(t, s, f, r);
    case "ORACLE":     return isMajorArcana ? buildMajorArcanaPrompt(t, s, f, r, "ORACLE") : buildOraclePrompt(t, s, f, r);
    case "CIPHER":     return buildCipherPrompt(t, s, f, r);
    case "RELIC":      return isMajorArcana ? buildMajorArcanaPrompt(t, s, f, r, "RELIC") : buildRelicPrompt(t, s, f, r);
    case "ENTITY":     return isMajorArcana ? buildMajorArcanaPrompt(t, s, f, r, "ENTITY") : buildEntityPrompt(t, s, f, r);
    case "PROPHECY":   return isMajorArcana ? buildMajorArcanaPrompt(t, s, f, r, "PROPHECY") : buildProphecyPrompt(t, s, f, r);
    case "MEMBER":     return buildMemberPrompt(t, s, f, r);
    case "GLITCH":     return isMajorArcana ? buildMajorArcanaPrompt(t, s, f, r, "GLITCH") : buildGlitchPrompt(t, s, f, r);
    case "AVATAR":     return buildAvatarPrompt(t, s, f, r);
    case "INCIDENT":   return isMajorArcana ? buildMajorArcanaPrompt(t, s, f, r, "INCIDENT") : buildIncidentPrompt(t, s, f, r);
    default:           return buildMajorArcanaPrompt(t, s, f, r, card.cardType);
  }
}

// ── Ensure all 10 Mahavidyas exist in DB ─────────────────────────────────────

async function ensureMahavidyas(): Promise<void> {
  console.log("── Ensuring all 10 Mahavidyas exist ──");
  for (const m of ALL_MAHAVIDYAS) {
    const existing = await prisma.card.findUnique({ where: { slug: m.slug } });
    if (!existing) {
      await prisma.card.create({
        data: {
          slug: m.slug,
          cardType: "MAHAVIDYA",
          rarity: m.rarity as "LEGENDARY" | "MYTHIC" | "ORACLE" | "ANOMALY" | "TRANSMISSION",
          title: m.title,
          subtitle: m.subtitle,
          flavourText: m.flavourText,
          statA: m.statA,
          statB: m.statB,
          statC: m.statC,
          abilities: [...m.abilities],
          ...("maxSupply" in m ? { maxSupply: m.maxSupply } : {}),
        },
      });
      console.log(`  + Created: ${m.slug} (${m.title})`);
    } else {
      console.log(`  ✓ Exists:  ${m.slug}`);
    }
  }
  console.log();
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("═══ GENERATE CARD ART ═══\n");

  if (!process.env.OPENAI_API_KEY) {
    console.error("✗ OPENAI_API_KEY not set");
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Ensure all 10 Mahavidyas are in the DB before generating
  if (!SLUG_ARG && (!TYPE_ARG || TYPE_ARG.toUpperCase() === "MAHAVIDYA")) {
    await ensureMahavidyas();
  }

  const where: Record<string, unknown> = {};
  if (!REGEN_ALL) where.artUrl = null;
  if (TYPE_ARG) where.cardType = TYPE_ARG.toUpperCase();
  if (SLUG_ARG) where.slug = SLUG_ARG;

  const cards = await prisma.card.findMany({
    where: where as Parameters<typeof prisma.card.findMany>[0]["where"],
    select: { id: true, slug: true, title: true, subtitle: true, flavourText: true, cardType: true, rarity: true, artUrl: true },
    orderBy: [{ cardType: "asc" }, { rarity: "desc" }, { title: "asc" }],
    take: LIMIT,
  });

  if (cards.length === 0) {
    console.log("No cards to process.");
    await disconnect();
    return;
  }

  const estimatedCost = (cards.length * 0.08).toFixed(2);
  console.log(`Cards to process: ${cards.length}${LIMIT ? ` (limited to ${LIMIT})` : ""}`);
  console.log(`Estimated cost: ~$${estimatedCost} (gpt-image-1 medium, 1024×1536)`);
  if (DRY_RUN) console.log("DRY RUN — no API calls will be made\n");
  console.log();

  // Print breakdown by type
  const byType = cards.reduce<Record<string, number>>((acc, c) => {
    acc[c.cardType] = (acc[c.cardType] ?? 0) + 1;
    return acc;
  }, {});
  for (const [type, count] of Object.entries(byType).sort()) {
    console.log(`  ${type.padEnd(14)} ${count} cards`);
  }
  console.log();

  if (DRY_RUN) {
    console.log("── Prompt preview (first 5) ──");
    for (const card of cards.slice(0, 5)) {
      const prompt = buildPrompt(card);
      console.log(`\n[${card.slug}] ${card.cardType} / ${card.rarity}`);
      console.log(`  ${prompt.slice(0, 200)}…`);
    }
    await disconnect();
    return;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let generated = 0;
  let failed = 0;
  // Track when the last real API call was made so we only sleep before calls, not skips.
  let lastApiCallAt = 0;

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const outputPath = path.join(OUTPUT_DIR, `${card.slug}.png`);
    const artUrl = `/cards/art/${card.slug}.png`;

    console.log(`[${i + 1}/${cards.length}] ${card.slug}`);
    console.log(`  Type: ${card.cardType} | Rarity: ${card.rarity}`);

    // Skip if file already exists and not re-generating (no API call — no rate limit needed)
    if (!REGEN_ALL && fs.existsSync(outputPath)) {
      console.log(`  ↷ file exists, updating artUrl only`);
      await prisma.card.update({ where: { id: card.id }, data: { artUrl } });
      generated++;
      continue;
    }

    // Chinnamastā variants: OpenAI's safety filter rejects this goddess's
    // iconography non-deterministically even with a fully nameless prompt.
    // All such cards depict the same goddess, so reuse the one image that
    // passed (chhinnamasta.png) rather than fighting the filter.
    // File copy = no API call, no rate limit needed — continue immediately.
    if (/innamasta/i.test(card.slug)) {
      const source = [...CHINNAMASTA_ART_SOURCES]
        .map(name => path.join(OUTPUT_DIR, name))
        .find(p => p !== outputPath && fs.existsSync(p));
      if (source) {
        fs.copyFileSync(source, outputPath);
        await prisma.card.update({ where: { id: card.id }, data: { artUrl } });
        console.log(`  ⟳ Reused ${path.basename(source)} → ${card.slug}.png (filter-safe)`);
        generated++;
        continue;
      }
      console.log(`  ⚠ no existing Chinnamastā art to reuse — falling through to API`);
    }

    // Rate limit: enforce gap between consecutive API calls only
    const msSinceLast = Date.now() - lastApiCallAt;
    if (lastApiCallAt > 0 && msSinceLast < RATE_LIMIT_MS) {
      const waitMs = RATE_LIMIT_MS - msSinceLast;
      process.stdout.write(`  ⏳ waiting ${Math.ceil(waitMs / 1000)}s…`);
      await new Promise(r => setTimeout(r, waitMs));
      process.stdout.write(" done\n");
    }

    const prompt = buildPrompt(card);
    console.log(`  Prompt: ${prompt.slice(0, 120)}…`);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (openai.images.generate as any)({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: "1024x1536",
        quality: "medium",
      });

      // gpt-image-1 returns base64-encoded PNG
      const b64 = response.data?.[0]?.b64_json;
      if (!b64) throw new Error("No image data in response");

      fs.writeFileSync(outputPath, Buffer.from(b64, "base64"));
      await prisma.card.update({ where: { id: card.id }, data: { artUrl } });
      console.log(`  ✓ Saved → public/cards/art/${card.slug}.png`);
      generated++;
      lastApiCallAt = Date.now();
    } catch (err) {
      console.error(`  ✗ ${err instanceof Error ? err.message : String(err)}`);
      failed++;
      lastApiCallAt = Date.now(); // count failed calls against rate limit too
    }
  }

  console.log(`\n═══ DONE ═══`);
  console.log(`Generated: ${generated} | Failed: ${failed}`);
  console.log(`Images saved to: ${OUTPUT_DIR}`);
  console.log(`\nNext: commit public/cards/art/ to git, then deploy.`);

  await disconnect();
}

main().catch(e => { console.error(e.message || e); process.exit(1); });
