import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import { MysticalDivider } from "@/components/graphics/mystical-divider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Symbol Codex — CULT CODEX",
  description:
    "A scholarly encyclopedia of the twenty esoteric symbols that form the visual and philosophical language of the Cult of Psyche archive.",
};

/* ------------------------------------------------------------------ */
/*  Data types                                                          */
/* ------------------------------------------------------------------ */

type Tradition =
  | "egyptian"
  | "hermetic"
  | "kabbalistic"
  | "alchemical"
  | "classical"
  | "chaos-magick"
  | "universal"
  | "hindu";

type Assessment = "well-chosen" | "contextual";

interface EsotericSymbol {
  name: string;
  aka?: string[];
  tradition: Tradition;
  assessment: Assessment;
  meaning: string;
  body: string;
  contextNote?: string;
}

/* ------------------------------------------------------------------ */
/*  Style maps                                                          */
/* ------------------------------------------------------------------ */

const TRADITION_META: Record<
  Tradition,
  { label: string; color: string; borderColor: string; bgHover: string }
> = {
  egyptian: {
    label: "Egyptian",
    color: "text-accent-gold",
    borderColor: "border-accent-gold/30",
    bgHover: "hover:bg-accent-gold-dim",
  },
  hermetic: {
    label: "Hermetic",
    color: "text-accent-violet",
    borderColor: "border-accent-violet/30",
    bgHover: "hover:bg-accent-violet-dim",
  },
  kabbalistic: {
    label: "Kabbalistic",
    color: "text-accent-cyan",
    borderColor: "border-accent-cyan/30",
    bgHover: "hover:bg-accent-cyan-dim",
  },
  alchemical: {
    label: "Alchemical",
    color: "text-accent-gold",
    borderColor: "border-accent-gold/30",
    bgHover: "hover:bg-accent-gold-dim",
  },
  classical: {
    label: "Classical",
    color: "text-text-primary",
    borderColor: "border-text-muted/30",
    bgHover: "hover:bg-surface",
  },
  "chaos-magick": {
    label: "Chaos Magick",
    color: "text-accent-crimson",
    borderColor: "border-accent-crimson/30",
    bgHover: "hover:bg-accent-crimson/5",
  },
  universal: {
    label: "Universal",
    color: "text-text-muted",
    borderColor: "border-text-muted/30",
    bgHover: "hover:bg-surface",
  },
  hindu: {
    label: "Hindu / Tantric",
    color: "text-orange-400",
    borderColor: "border-orange-400/30",
    bgHover: "hover:bg-orange-400/5",
  },
};

/* ------------------------------------------------------------------ */
/*  Symbol data — all 20 entries                                        */
/* ------------------------------------------------------------------ */

const SYMBOLS: EsotericSymbol[] = [
  // ── WELL-CHOSEN ─────────────────────────────────────────────────
  {
    name: "Ouroboros",
    tradition: "egyptian",
    assessment: "well-chosen",
    meaning: "Cyclical time — the eternal return",
    body:
      "The serpent devouring its own tail is one of the oldest cosmological images in human history, appearing first in the Egyptian New Kingdom and later in Hermetic and Gnostic texts. In the archive it frames the show's own recursive nature: old episodes generate new lore that reinterprets old episodes. Alchemically, the Ouroboros is also the prima materia — the undifferentiated matter from which the Great Work begins — and its completion: the philosopher's stone returned to the source.",
  },
  {
    name: "Eye of Horus",
    aka: ["Wedjat", "Eye of Ra"],
    tradition: "egyptian",
    assessment: "well-chosen",
    meaning: "Measures, judges, and heals",
    body:
      "The Wedjat — 'the whole one' — is the restored eye of Horus, healed by Thoth after Set tore it apart. Its three functions are precise: the Eye measures (its fractional parts encode the heqat grain measure), it judges (the weighing of the soul against the feather of Ma'at), and it heals (wadjet amulets were placed over surgical wounds). In the archive it maps onto Psyche's role — the figure who sees what others avoid, names it accurately, and holds space for people to recover.",
  },
  {
    name: "Ankh",
    tradition: "egyptian",
    assessment: "well-chosen",
    meaning: "Where the circle of spirit meets the cross of matter",
    body:
      "The ankh is the hieroglyph for life, held by gods as the key to the Duat — the Egyptian underworld. The precise reading 'where the circle of spirit meets the cross of matter' is genuinely Hermetic: the loop (spirit, completion, eternity) surmounts the cross (four directions, matter, the earthly plane). In the archive this symbol marks the threshold between the archive's analytical function (the cross: structured data) and its mythic-consciousness function (the loop: meaning beyond information).",
  },
  {
    name: "Tree of Life",
    aka: ["Etz Chaim", "Sephiroth"],
    tradition: "kabbalistic",
    assessment: "well-chosen",
    meaning: "Ten spheres, twenty-two paths, one totality",
    body:
      "The Kabbalistic Tree of Life is the map of emanation — how Ein Sof (the infinite, formless divine) steps down through ten Sephiroth into manifest reality. The 22 paths connecting the spheres correspond to the 22 letters of the Hebrew alphabet and, in the Golden Dawn system, to the 22 Major Arcana of the tarot. For a show organized around tarot, consciousness, and initiatory structure, the Tree is not decoration: it is the hidden skeleton of the archive's organizing logic.",
  },
  {
    name: "Hexagram",
    aka: ["Star of David", "Seal of Solomon", "Magen David"],
    tradition: "hermetic",
    assessment: "well-chosen",
    meaning: "Fire descending, water ascending — the alchemical marriage",
    body:
      "The hexagram is formed by two interlocking triangles: the upward-pointing fire triangle (the masculine, solar, descending spirit) and the downward-pointing water triangle (the feminine, lunar, ascending matter). Their union is the alchemical coniunctio — the sacred marriage of opposites that produces the philosopher's stone. The Hermetic axiom 'As above, so below' is geometrically encoded in this symbol. In the archive it marks every moment when the show achieves genuine synthesis: where the personal becomes mythic and the intellectual becomes felt.",
  },
  {
    name: "Vesica Piscis",
    tradition: "universal",
    assessment: "well-chosen",
    meaning: "The generative overlap — where two worlds birth a third",
    body:
      "The Vesica Piscis is the almond-shaped intersection of two circles of equal radius. It appears in sacred geometry across traditions: the mandorla (the body-halo of Christ and the Buddha), the womb of the goddess in Sheela-na-gig carvings, and the foundational form from which Platonic solids are derived. Its mathematical ratio (√3) appears in Gothic cathedral proportions. In the archive it represents the space where the archive world and the viewer's world meet — the conversation zone, the panel, the threshold.",
  },
  {
    name: "Caduceus",
    tradition: "hermetic",
    assessment: "well-chosen",
    meaning: "Transmutation through balance — the two serpents made one",
    body:
      "The caduceus is the staff of Hermes/Mercury: two serpents coiled around a winged rod, their heads meeting at the top. This is deliberately distinguished from the Rod of Asclepius (one serpent, no wings, medicine) — a confusion that caused the US Army Medical Corps to adopt the wrong symbol in 1902. The caduceus is Hermetic: its twin serpents are the solar and lunar currents, the ida and pingala of kundalini yoga, the pillars Jachin and Boaz of Freemasonry. Transmutation occurs when the two opposing currents are balanced and rise together. The wings indicate that this union elevates.",
  },
  {
    name: "Scarab / Khepri",
    tradition: "egyptian",
    assessment: "well-chosen",
    meaning: "Transformation begins in the lowly — nigredo as sacred start",
    body:
      "Khepri is the scarab-headed god who rolls the solar disk above the horizon each dawn — as the dung beetle rolls its ball across the desert floor. The dung is the prima materia: the raw, rejected, putrefied material from which new life is generated. This is the nigredo, the first and blackest phase of the alchemical Great Work, where everything the ego considered valuable must be dissolved. That transformation begins in the dung — not the gold — is the symbol's essential teaching, and one of the archive's recurring psychological themes.",
  },
  {
    name: "Labyrinth",
    tradition: "classical",
    assessment: "well-chosen",
    meaning: "There is only one path — and it leads to the center",
    body:
      "The Cretan labyrinth of Daedalus is not a maze (which has false turns and dead ends). It has a single, continuous path that winds through every part of the structure before arriving at the center — and then back out by the same route. The walk is the initiation: you cannot rush it, skip it, or take shortcuts. Every part of the path must be traversed. In the archive this maps onto the experience of the archive itself: there is no algorithm that shortcircuits the work of watching, listening, and integrating. The center — insight, transformation — is only reached by walking the whole thing.",
  },
  {
    name: "Sigil",
    tradition: "chaos-magick",
    assessment: "well-chosen",
    meaning: "Compressed intention — the unconscious made visible",
    body:
      "The modern magical sigil derives from Austin Osman Spare's technique (developed 1913–1921): take an intention, write it out, eliminate repeated letters, arrange the remaining letters into an abstract image, forget the original intention, and charge the image. Spare's logic was proto-Jungian: the rational mind's resistance to desire blocks manifestation; the unconscious does not censor what the conscious mind doubts. A sigil bypasses censorship by delivering the intention in a form the conscious mind doesn't recognize. In chaos magick — the tradition Peter Carroll codified in Liber Null (1978) — sigils are the foundational working.",
  },

  // ── REQUIRES DEEPER CONTEXT ─────────────────────────────────────
  {
    name: "Black Sun",
    aka: ["Schwarze Sonne", "Sol Niger"],
    tradition: "alchemical",
    assessment: "contextual",
    meaning: "The occluded light — the sun behind the sun",
    body:
      "The Sol Niger is the alchemical Black Sun: the darkened, hidden sun of the nigredo phase, when all prior structures dissolve into chaos before transmutation can begin. In Hermetic texts it represents the invisible source behind the visible solar light — the unmanifest that precedes all manifestation. Its mystic reading ('the sun behind the sun') is accurate and profound: the Black Sun is what remains when you go beyond the visible principle to its invisible root.",
    contextNote:
      "Responsible note: This symbol was extensively adopted by 20th-century fascist occult movements, particularly Himmler's SS mysticism, and remains associated with those currents today. The 12-spoke Black Sun mosaic was installed at Wewelsburg Castle in the 1930s and has since been adopted by white nationalist groups globally. This appropriation does not extinguish the symbol's legitimate alchemical and Hermetic meaning — but responsible esoteric scholarship requires naming the contamination directly. The archive uses this symbol in its mystical-alchemical sense. Readers who encounter it outside this context should exercise discernment.",
  },
  {
    name: "Baphomet",
    tradition: "hermetic",
    assessment: "contextual",
    meaning: "Reconciler of opposites — neither good nor evil, but the current between",
    body:
      "Baphomet as we know it was systematized by Éliphas Lévi in his 1854 masterwork Dogme et Rituel de la Haute Magie (Transcendental Magic). Lévi's image — the winged, goat-headed figure seated between two pillars with the caduceus of Hermes in place of genitalia, one arm pointing up and one down — is an intentional synthesis: male and female, above and below, light and dark, animal and angelic. The Latin inscription Solve et Coagula on the forearms names the alchemical process. Lévi was explicit that Baphomet represented not evil but the absolute — the reconciliation of all polarities into one image. The Knights Templar were accused of worshipping 'Baphomet' in 1307, but no evidence exists that this figure existed before Lévi's 1854 invention.",
    contextNote:
      "The general public's misunderstanding of this symbol — as exclusively Satanic — derives largely from the Church of Satan's 1969 adoption of a variant (the Sigil of Baphomet) and from centuries of anti-Templar and anti-witch propaganda. Lévi's original intent — Baphomet as philosophical principle, not a worshipped entity — is the reading used here.",
  },
  {
    name: "Pentagram",
    aka: ["Five-Pointed Star", "Pentacle"],
    tradition: "hermetic",
    assessment: "contextual",
    meaning: "A seal of mastery — spirit commanding the four elements",
    body:
      "The pentagram — a five-pointed star drawn in one continuous line — is one of the most cross-traditional symbols in esoteric history: Pythagorean mathematicians used it as a sign of health and recognition; medieval Christians used it as a symbol of the five wounds of Christ; Renaissance Hermetics associated each point with one of the four classical elements plus spirit at the apex. In its upright position (one point up), spirit crowns and commands the four material elements — the fundamental statement of esoteric philosophy: consciousness precedes and directs matter.",
    contextNote:
      "The critical distinction: upright (one point ascending) represents spirit governing matter — mastery. Inverted (two points up, one descending) represents matter above spirit — the reversal of the esoteric hierarchy. This orientation distinction is not theatrical decoration; it is the symbol's essential meaning. The archive and the show use the pentagram in its upright, spirit-ascending orientation.",
  },
  {
    name: "Chaos Star",
    aka: ["Chaos Wheel", "Symbol of Chaos", "Eight-Arrowed Star"],
    tradition: "chaos-magick",
    assessment: "contextual",
    meaning: "All directions simultaneously — infinite possibility, zero predetermined path",
    body:
      "The eight-arrowed Chaos Star originates not in ancient occultism but in contemporary fantasy fiction. Michael Moorcock introduced the symbol in his Elric of Melniboné stories beginning in 1961, where it represented the force of Chaos opposed to the single straight arrow of Law. Moorcock designed it as a cosmological metaphor: where Order moves in one direction, Chaos radiates outward in all eight directions simultaneously. The symbol entered formal occult practice when Peter Carroll and Ray Sherwin adopted it for the Illuminates of Thanateros (founded 1978) and it was codified in Carroll's foundational text Liber Null (1978). This provenance matters: the Chaos Star is a modern symbol — approximately 60 years old — not an ancient one, despite frequent misattribution.",
    contextNote:
      "The 8-arrow form and its meaning (unlimited possibility, the refusal of any single prescribed path) align naturally with the archive's chaos-magick and consciousness-expanding themes. The symbol's recent invention does not diminish its utility — it was purpose-built for exactly the conceptual territory the show inhabits.",
  },

  // ── WELL-CHOSEN: CONTINUATION ───────────────────────────────────
  {
    name: "Serpent / Kundalini",
    aka: ["Kundalini", "Nāga", "The Dragon"],
    tradition: "hindu",
    assessment: "well-chosen",
    meaning: "Dormant power awakening — the fire that rises to illuminate",
    body:
      "Kundalini (Sanskrit: 'coiled one') is the latent spiritual energy said to rest at the base of the spine in the muladhara chakra, coiled like a sleeping serpent. Awakening practices — pranayama, meditation, intense devotion — cause it to rise through the sushumna (central channel), activating each chakra in succession until it reaches the sahasrara at the crown, producing enlightenment. The serpent as awakening force appears across traditions: the Nāgas of Hindu and Buddhist cosmology, the Feathered Serpent Quetzalcoatl, Moses' bronze serpent in the wilderness. The archive's engagement with consciousness and awakening maps directly onto this symbol — with the caution that forced or premature kundalini awakening is documented to produce psychological crisis.",
  },
  {
    name: "Phoenix",
    tradition: "classical",
    assessment: "well-chosen",
    meaning: "Rebirth from ash — the self that cannot be permanently destroyed",
    body:
      "The phoenix of Greek mythology (borrowed from the Egyptian Bennu bird of Heliopolis) is the creature that lives for 500 years, builds its own funeral pyre, and is reborn from the ash. The key theological point: it dies and is reborn not through escape from destruction but through it — the fire is not the enemy, it is the mechanism. In the alchemical literature the phoenix corresponds to the rubedo (reddening): the final stage of the Great Work, where the purified material is heated to brilliance, becoming the philosopher's stone. In the archive this symbol tracks every story of cancellation, platform death, and streaming blackout followed by a return.",
  },
  {
    name: "Eye of Providence",
    aka: ["All-Seeing Eye", "Eye of God"],
    tradition: "hermetic",
    assessment: "well-chosen",
    meaning: "Divine witness — consciousness that sees without being seen",
    body:
      "The Eye within a triangle (or radiating light) appears in Renaissance Christian iconography as the Trinity's all-seeing awareness — the eye that cannot be deceived. Freemasonry adopted the symbol in the 18th century as 'the Great Architect observing all.' On the US dollar bill (1782) it is the Eye of Providence over the unfinished pyramid. The esoteric reading: this is not surveillance but witness — the quality of consciousness that observes all phenomena without identification, the Witness self of Vedanta. In the archive it maps onto the archive's own function: the system that watches, records, and remembers what participants say and do — including what they later wish they had not said.",
  },
  {
    name: "Triquetra",
    aka: ["Trinity Knot", "Vesica Piscis Triple"],
    tradition: "universal",
    assessment: "well-chosen",
    meaning: "Three in one — the triad that cannot be separated",
    body:
      "The triquetra — three interlocked arcs forming a continuous, unbroken line — appears in Viking age metalwork, Celtic manuscripts (most famously the Book of Kells), and early Christian iconography representing the Trinity. Its mathematical structure is a triple Vesica Piscis: three circles of equal radius, each center on the circumference of the others. The continuous line with no beginning or end encodes eternity; the three-fold structure encodes the triadic principle: all things divide into three (thesis-antithesis-synthesis, body-mind-spirit, past-present-future, creation-maintenance-destruction). In the archive's Mahavidya framework this maps onto the Tridevi: Saraswati (creation), Lakshmi (maintenance), Kali (dissolution).",
  },
  {
    name: "Lotus",
    aka: ["Padma"],
    tradition: "hindu",
    assessment: "well-chosen",
    meaning: "Enlightenment from the muddy depths — purity untouched by its origins",
    body:
      "The lotus (padma in Sanskrit) grows rooted in mud but opens its flower above the water untouched by the environment it grows through. This botanical fact became the central symbol of Buddhist and Hindu enlightenment: consciousness can be rooted in the material world (the mud of karma and samsara) and still blossom into clarity above it. The thousand-petaled lotus (sahasrara) at the crown of the head in chakra anatomy is the symbol of full awakening. Brahma, Vishnu, Lakshmi, and Saraswati all sit or stand on lotus thrones — the divine as that which rises from but is not polluted by the conditions of its becoming. The archive's repeated engagement with trauma, survived darkness, and transformation tracks this symbol precisely.",
  },
  {
    name: "Butterfly / Psyche",
    aka: ["Soul", "Psyche", "Anima"],
    tradition: "classical",
    assessment: "well-chosen",
    meaning: "The soul in its journey — metamorphosis as initiation",
    body:
      "In ancient Greek the word psyche (ψυχή) meant both 'soul' and 'butterfly.' Psyche is depicted in classical art with butterfly wings — the soul taking flight from the body at death and returning from the underworld after initiation. In Apuleius' 2nd-century Metamorphoses (The Golden Ass), the mortal Psyche undergoes four impossible tasks set by Aphrodite — sorting a mountain of seeds, gathering golden fleece from maddened rams, filling a crystal flask from the Styx, and descending to the underworld — before ascending to Olympus and marrying Eros. The Jungian reading: Psyche's four labors are the four stages of the alchemical Great Work (nigredo, albedo, citrinitas, rubedo). This symbol is the governing mythos of the entire archive: the show is named Cult of Psyche. The soul's initiatory journey is the show's subject matter.",
  },
];

/* ------------------------------------------------------------------ */
/*  Groupings                                                           */
/* ------------------------------------------------------------------ */

const WELL_CHOSEN = SYMBOLS.filter((s) => s.assessment === "well-chosen");
const CONTEXTUAL = SYMBOLS.filter((s) => s.assessment === "contextual");

/* ------------------------------------------------------------------ */
/*  Components                                                          */
/* ------------------------------------------------------------------ */

function AssessmentBadge({ assessment }: { assessment: Assessment }) {
  if (assessment === "contextual") {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-400">
        ⚠ context note
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded border border-accent-gold/20 bg-accent-gold/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-accent-gold/60">
      ✦ verified
    </span>
  );
}

function TraditionBadge({ tradition }: { tradition: Tradition }) {
  const meta = TRADITION_META[tradition];
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.15em] ${meta.color} ${meta.borderColor} bg-transparent`}
    >
      {meta.label}
    </span>
  );
}

function SymbolCard({ symbol }: { symbol: EsotericSymbol }) {
  const meta = TRADITION_META[symbol.tradition];

  return (
    <div
      className={`group rounded-lg border ${symbol.assessment === "contextual" ? "border-amber-500/20" : meta.borderColor} bg-surface p-6 space-y-4 transition-colors ${meta.bgHover}`}
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <AssessmentBadge assessment={symbol.assessment} />
          <TraditionBadge tradition={symbol.tradition} />
        </div>
        <h3
          className={`font-display text-base font-bold ${symbol.assessment === "contextual" ? "text-amber-300" : "text-text-primary"}`}
        >
          {symbol.name}
        </h3>
        {symbol.aka && symbol.aka.length > 0 && (
          <p className="font-mono text-[10px] text-text-muted tracking-wider">
            also: {symbol.aka.join(" · ")}
          </p>
        )}
        <p className={`font-mono text-xs ${meta.color}`}>{symbol.meaning}</p>
      </div>

      {/* Body */}
      <p className="text-sm text-text-muted leading-relaxed">{symbol.body}</p>

      {/* Context note */}
      {symbol.contextNote && (
        <div className="rounded border border-amber-500/20 bg-amber-950/30 p-4 space-y-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-amber-400">
            /// historical context
          </p>
          <p className="text-sm text-amber-200/80 leading-relaxed">
            {symbol.contextNote}
          </p>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function SymbolsPage() {
  return (
    <>
      <PageHero
        title="SYMBOL CODEX"
        subtitle="The twenty signs of the archive — their origins, meanings, and honest assessments"
        backgroundImage="/wiki-page-header.jpg"
        label="symbols"
      />

      <main
        id="main-content"
        className="mx-auto max-w-5xl px-4 py-10 space-y-14"
      >
        {/* Intro */}
        <section className="max-w-2xl space-y-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold">
            /// esoteric_literacy
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            The Cult of Psyche archive engages with symbols drawn from Egyptian,
            Hermetic, Kabbalistic, Hindu, classical, and contemporary occult
            traditions. This codex documents twenty of them — their genuine
            provenance, their meaning within the archive, and, where responsible
            scholarship demands it, the historical contaminations that responsible
            practitioners must name.
          </p>
          <p className="text-sm text-text-muted leading-relaxed">
            Symbols assessed as requiring contextual handling ({CONTEXTUAL.length}) are
            marked with a warning indicator and include an explicit historical
            context note. This is not avoidance — it is the opposite. Esoteric
            literacy requires knowing what a symbol carries, not just what it means.
          </p>
        </section>

        <MysticalDivider />

        {/* Verified symbols */}
        <section className="space-y-6">
          <div className="space-y-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-gold">
              /// verified · authentic selection
            </p>
            <h2 className="font-display text-lg font-bold text-text-primary">
              Authentic & Well-Chosen
            </h2>
            <p className="text-xs text-text-muted">
              {WELL_CHOSEN.length} symbols from the codex, each correctly framed within its tradition.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {WELL_CHOSEN.map((symbol) => (
              <SymbolCard key={symbol.name} symbol={symbol} />
            ))}
          </div>
        </section>

        <MysticalDivider />

        {/* Contextual symbols */}
        <section className="space-y-6">
          <div className="space-y-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-amber-400">
              /// contextual · handle with knowledge
            </p>
            <h2 className="font-display text-lg font-bold text-amber-300">
              Requires Deeper Context
            </h2>
            <p className="text-xs text-text-muted">
              {CONTEXTUAL.length} symbols that are legitimate and correctly used here — but carry historical
              weight, contested provenance, or common misreadings that the tradition demands be named.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {CONTEXTUAL.map((symbol) => (
              <SymbolCard key={symbol.name} symbol={symbol} />
            ))}
          </div>
        </section>

        <MysticalDivider />

        {/* Tradition legend */}
        <SectionCard title="Traditions in this Codex">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {(Object.keys(TRADITION_META) as Tradition[]).map((t) => {
              const meta = TRADITION_META[t];
              const count = SYMBOLS.filter((s) => s.tradition === t).length;
              if (count === 0) return null;
              return (
                <div key={t} className="space-y-1">
                  <p className={`font-mono text-[10px] uppercase tracking-wider font-bold ${meta.color}`}>
                    {meta.label}
                  </p>
                  <p className="font-mono text-[10px] text-text-muted">
                    {count} symbol{count !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </main>
    </>
  );
}
