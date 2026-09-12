import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import { MysticalDivider, OrnamentalBreak } from "@/components/graphics/mystical-divider";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ArchiveDisclaimer } from "@/components/ui/archive-disclaimer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/mythic-map" },
  title: "The Mythic Map — CULT CODEX",
  description:
    "Archetypes, symbols, and recurring themes of the Cult of Psyche archive. A narrative map of the mythic system.",
};

/* ───────────────────────── Data ───────────────────────── */

const ARCHETYPES = [
  {
    name: "The Oracle / Priestess",
    symbol: "Tarot deck, veil, star",
    color: "text-accent-gold-text",
    border: "border-accent-gold/30",
    glow: "shadow-accent-gold/10",
    meaning:
      "Interprets chaos, turns feeling into pattern, gives language to what is hidden.",
    examples: "Psyche Awakens Tarot series, Tarot Talks Health & Relationships",
    conflict:
      "Resolves uncertainty but attracts projection\u2014the reader names what others avoid.",
  },
  {
    name: "The Fool / Initiate",
    symbol: "Cliff edge, open road, small bag",
    color: "text-accent-cyan",
    border: "border-accent-cyan/30",
    glow: "shadow-accent-cyan/10",
    meaning:
      "New beginning, spiritual risk, willingness to enter the unknown.",
    examples: "The Fool: Journey Through The Tarot Series",
    conflict:
      "Starts motion. Creates vulnerability, naivete, and exposure to tests.",
  },
  {
    name: "The Magician / Operator",
    symbol: "Wand, circuit, altar-terminal",
    color: "text-accent-violet-text",
    border: "border-accent-violet/30",
    glow: "shadow-accent-violet/10",
    meaning:
      "Will, manifestation, applied symbolism\u2014turning intuition into action.",
    examples:
      "The Cult of Psyche Codex, Book Outline Revealed",
    conflict:
      "Converts insight into system, but risks overcontrol or power-seeking.",
  },
  {
    name: "The Witness / Boundary Keeper",
    symbol: "Key, mountain, eye, gate",
    color: "text-text-primary",
    border: "border-text-muted/30",
    glow: "shadow-text-muted/5",
    meaning:
      "Observes rather than lunges; contains energy; protects sacred space.",
    examples: "The Degree That Watches, New Start",
    conflict:
      "Stops the archive from dissolving into chaos; sets law, frame, and threshold.",
  },
  {
    name: "The Scapegoat / Truth-Teller",
    symbol: "Stage, mask, serpent eye, phoenix",
    color: "text-accent-crimson-text",
    border: "border-accent-crimson/30",
    glow: "shadow-accent-crimson/10",
    meaning:
      "The figure onto whom communal fear is projected\u2014exposes corruption and buried truth.",
    examples:
      "The Golden Ass: Book 3, Lilith in Scorpio",
    conflict:
      "Absorbs group tension; forces confrontation with projection, reputation, and authority wounds.",
  },
  {
    name: "The Familiar",
    symbol: "Cat eye, moon, paw, glowing eyes",
    color: "text-orange-400",
    border: "border-orange-400/30",
    glow: "shadow-orange-400/10",
    meaning:
      "Companion intelligence, intuitive witness, house spirit, tonal anchor.",
    examples:
      "Cats as a top recurring topic across the archive",
    conflict:
      "Softens intensity while silently observing everything.",
  },
];

const SYMBOLS = [
  {
    category: "Threshold Symbols",
    color: "text-accent-gold-text",
    items: [
      "Gates & Courts \u2014 The Codex\u2019s 10 gates and 5 courts",
      "Keys & Veils \u2014 Hidden knowledge, barriers to true seeing",
      "Roses \u2014 Reversal of transformation, salvation",
      "Reflections & Mirrors \u2014 Self-recognition, omen",
    ],
  },
  {
    category: "Digital-Sacred Symbols",
    color: "text-accent-cyan",
    items: [
      "Codex / Terminal \u2014 The archive as sacred intelligence",
      "Cathedral of Code \u2014 Digital theology",
      "Livestream Rain \u2014 Baptism through broadcast",
      "Ritual public space \u2014 Where interface becomes altar",
    ],
  },
  {
    category: "Transformation Symbols",
    color: "text-accent-violet-text",
    items: [
      "Donkey & Owl \u2014 Humiliation and wisdom",
      "Shadow & Anima \u2014 Integration of the unconscious",
      "Lilith \u2014 Taboo feminine, authority wounds",
      "Fire & Rebirth \u2014 Destruction preceding renewal",
    ],
  },
];

const THEMES = [
  {
    letter: "A",
    title: "Divination as Diagnosis",
    color: "text-accent-gold-text",
    body: "Here, tarot diagnoses relationships, protection issues, shadow material, mythic patterns, and audience questions in real time.",
  },
  {
    letter: "B",
    title: "Myth as Psychological Technology",
    color: "text-accent-cyan",
    body: "Myth works as an active interpretive device. Stories like The Golden Ass and the Quantum Scary Tales function as instruments for reading consciousness, power, and misrecognition.",
  },
  {
    letter: "C",
    title: "Public Spirituality Under Pressure",
    color: "text-accent-violet-text",
    body: "What happens when spirituality becomes public performance? Open panels, community conflict, doxxing, safety concerns, and sacred-space philosophy collide.",
  },
  {
    letter: "D",
    title: "Projection, Shadow & Misunderstood Identity",
    color: "text-accent-crimson-text",
    body: "The archive\u2019s deepest psychological theme. Lilith in Scorpio, the scapegoat logic of The Golden Ass, The Mortal Veil, and The Paradox of Being Nice all revolve around the figure who gets projected onto yet still reveals truth.",
  },
  {
    letter: "E",
    title: "Hybrid Sacred-Tech Aesthetics",
    color: "text-text-primary",
    body: "Codex, terminal, code, digital resurrection, livestream rain: a cyber-mystical style where interface becomes altar.",
  },
];

const TIMELINE = [
  {
    year: "2024",
    label: "Intimate Oracle",
    color: "bg-accent-gold",
    description:
      "Personal tarot sessions blending mythology, alchemy, sacred geometry, psalms, protection, and cats.",
  },
  {
    year: "2025",
    label: "Public Expansion",
    color: "bg-accent-violet",
    description:
      "Explosion of open panels, community conflict, occult history, boundaries, fame, and safety protocols.",
  },
  {
    year: "2026",
    label: "Codified Myth-System",
    color: "bg-accent-cyan",
    description:
      "Systematized naming: The Codex, The Fool, The Priestess, fairy-tale retellings, goddess episodes, and Codex language.",
  },
];

const LORE_TABLE = [
  {
    archetype: "Oracle / Priestess",
    symbol: "Tarot deck, veil, star",
    meaning: "Interprets chaos into pattern",
    episodes: "Psyche Awakens Tarot, Tarot Talks",
    conflict: "Attracts projection by naming what others avoid",
  },
  {
    archetype: "Fool / Initiate",
    symbol: "Cliff, bag, open road",
    meaning: "Spiritual risk, new beginning",
    episodes: "The Fool: Journey Through The Tarot",
    conflict: "Creates vulnerability and exposure to tests",
  },
  {
    archetype: "Magician / Operator",
    symbol: "Wand, circuit, altar",
    meaning: "Applied symbolism, manifestation",
    episodes: "The Codex, Book Outline Revealed",
    conflict: "Risks overcontrol or power-seeking",
  },
  {
    archetype: "Witness / Keeper",
    symbol: "Key, mountain, eye",
    meaning: "Observes, contains, protects",
    episodes: "The Degree That Watches, New Start",
    conflict: "Sets law and threshold against chaos",
  },
  {
    archetype: "Scapegoat / Truth-Teller",
    symbol: "Stage, mask, phoenix",
    meaning: "Exposes corruption via projection",
    episodes: "Golden Ass: Book 3, Lilith in Scorpio",
    conflict: "Absorbs group tension, reveals cruelty",
  },
  {
    archetype: "The Familiar",
    symbol: "Cat eye, moon, paw",
    meaning: "Intuitive companion, house spirit",
    episodes: "Cats topic across archive",
    conflict: "Softens intensity, silently observes",
  },
  {
    archetype: "Community Chorus",
    symbol: "Panel grid, chat, mic",
    meaning: "Collective witness, reaction engine",
    episodes: "Open Panel series (143+ episodes)",
    conflict: "Amplifies meaning or distortion",
  },
  {
    archetype: "Transformer",
    symbol: "Donkey, owl, roses, fire",
    meaning: "Change through humiliation and reversal",
    episodes: "The Golden Ass: Book 3",
    conflict: "Punishes ego, opens symbolic rebirth",
  },
  {
    archetype: "Archivist / Codex Builder",
    symbol: "Codex seal, terminal, quotes",
    meaning: "Makes fleeting performance durable",
    episodes: "CultCodex itself, Book Outline",
    conflict: "Prevents disappearance of live chaos",
  },
];

/* ───────────────────────── Page ───────────────────────── */

export default function MythicMapPage() {
  return (
    <>
      <PageHero
        title="THE MYTHIC MAP"
        subtitle="Archetypes, symbols & narrative currents of the archive"
        backgroundImage="/lore-header.jpg"
      
      label="mythic_map"
    />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Start Here", href: "/start-here" },
          { label: "The Mythic Map" },
        ]}
      />

      <main id="main-content" className="mx-auto max-w-5xl px-4 py-10 space-y-12">
        {/* ── Intro ── */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-sm text-text-muted leading-relaxed">
            The Cult of Psyche archive behaves like a mythic-social system with recurring engines:
            divination, myth retelling, livestream community theater,
            psychological transformation, and digital-age spiritual boundary work.
          </p>
          <p className="font-mono text-xs text-accent-gold-text/80">
            oracle insight &rarr; public reaction &rarr; projection &rarr; boundary
            formation &rarr; mythic transformation &rarr; codex memory
          </p>
        </section>

        <MysticalDivider />

        {/* ── Core Archetypes ── */}
        <section className="space-y-6">
          <h2 className="font-display text-lg font-bold text-accent-gold-text tracking-tight">
            Core Archetypes
          </h2>
          <p className="text-xs text-text-muted max-w-2xl">
            Six recurring figures that drive the archive&apos;s narrative engine.
            Each archetype has a shadow side and a conflict function within the
            mythic system.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {ARCHETYPES.map((a) => (
              <div
                key={a.name}
                className={`rounded-lg border ${a.border} bg-surface p-5 space-y-3 shadow-lg ${a.glow}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`font-display text-sm font-bold ${a.color}`}>
                    {a.name}
                  </h3>
                  <span className="shrink-0 font-mono text-[10px] text-text-muted">
                    {a.symbol}
                  </span>
                </div>
                <p className="text-xs text-text-primary leading-relaxed">
                  {a.meaning}
                </p>
                <p className="text-[11px] text-text-muted leading-relaxed italic">
                  {a.conflict}
                </p>
                <p className="font-mono text-[10px] text-text-muted">
                  <span className="text-accent-gold-text/80">see:</span>{" "}
                  {a.examples}
                </p>
              </div>
            ))}
          </div>
        </section>

        <OrnamentalBreak />

        {/* ── Narrative Map ── */}
        <section className="space-y-6">
          <h2 className="font-display text-lg font-bold text-accent-cyan tracking-tight">
            The Narrative Map
          </h2>
          <p className="text-xs text-text-muted max-w-2xl">
            Five axes radiate from the center of the archive. Together they form
            the recurring loop: seeker enters, oracle interprets, public stage
            creates pressure, projection appears, boundaries emerge,
            transformation happens, and the experience is absorbed into the Codex.
          </p>

          {/* Constellation */}
          <div className="relative rounded-xl border border-border bg-void p-6 sm:p-10 overflow-hidden">
            {/* Faint radial lines */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.06]" aria-hidden="true">
              <svg width="500" height="500" viewBox="0 0 500 500" className="text-accent-gold-text">
                {[0, 72, 144, 216, 288].map((angle) => (
                  <line
                    key={angle}
                    x1="250"
                    y1="250"
                    x2={250 + 240 * Math.cos((angle * Math.PI) / 180)}
                    y2={250 + 240 * Math.sin((angle * Math.PI) / 180)}
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                ))}
                <circle cx="250" cy="250" r="60" stroke="currentColor" strokeWidth="0.5" fill="none" />
                <circle cx="250" cy="250" r="150" stroke="currentColor" strokeWidth="0.3" fill="none" />
                <circle cx="250" cy="250" r="230" stroke="currentColor" strokeWidth="0.2" fill="none" />
              </svg>
            </div>

            {/* Center node */}
            <div className="relative z-10 flex flex-col items-center text-center mb-8">
              <div className="w-28 h-28 rounded-full border-2 border-accent-gold/40 bg-accent-gold/5 flex items-center justify-center">
                <div className="text-center">
                  <p className="font-display text-xs font-bold text-accent-gold-text">
                    PSYCHE
                  </p>
                  <p className="font-mono text-[8px] text-text-muted mt-0.5">
                    ritual host node
                  </p>
                  <p className="font-mono text-[7px] text-accent-gold-text/80 mt-0.5">
                    oracle &middot; host &middot; witness
                  </p>
                </div>
              </div>
            </div>

            {/* Five axes */}
            <div className="relative z-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  axis: "1",
                  title: "Revelation",
                  color: "text-accent-gold-text",
                  borderColor: "border-accent-gold/20",
                  path: "Oracle \u2192 Tarot \u2192 Priestess \u2192 Fool\u2019s Journey",
                  verb: "reads \u2192 reveals",
                },
                {
                  axis: "2",
                  title: "Transformation",
                  color: "text-accent-violet-text",
                  borderColor: "border-accent-violet/20",
                  path: "Shadow \u2192 Projection \u2192 Scapegoat \u2192 Integration",
                  verb: "provokes \u2192 transforms",
                },
                {
                  axis: "3",
                  title: "Containment",
                  color: "text-text-primary",
                  borderColor: "border-text-muted/20",
                  path: "Panel \u2192 Policy \u2192 Sacred Space",
                  verb: "tests \u2192 contains",
                },
                {
                  axis: "4",
                  title: "Companions",
                  color: "text-orange-400",
                  borderColor: "border-orange-400/20",
                  path: "Cats \u2192 Familiars \u2192 Intuition",
                  verb: "grounds \u2192 witnesses",
                },
                {
                  axis: "5",
                  title: "Techno-Mysticism",
                  color: "text-accent-cyan",
                  borderColor: "border-accent-cyan/20",
                  path: "Codex \u2192 Cathedral of Code \u2192 Livestream Ritual",
                  verb: "archives \u2192 sanctifies",
                },
              ].map((ax) => (
                <div
                  key={ax.axis}
                  className={`rounded-lg border ${ax.borderColor} bg-surface/50 p-4 space-y-2`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-text-muted">
                      AXIS {ax.axis}
                    </span>
                    <h3
                      className={`font-display text-sm font-bold ${ax.color}`}
                    >
                      {ax.title}
                    </h3>
                  </div>
                  <p className="font-mono text-[10px] text-text-muted leading-relaxed">
                    {ax.path}
                  </p>
                  <p className="font-mono text-[9px] text-accent-gold-text/80 italic">
                    {ax.verb}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <MysticalDivider />

        {/* ── Recurring Symbols ── */}
        <section className="space-y-6">
          <h2 className="font-display text-lg font-bold text-accent-violet-text tracking-tight">
            Recurring Symbols
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {SYMBOLS.map((group) => (
              <SectionCard key={group.category} title={group.category}>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-xs text-text-primary leading-relaxed"
                    >
                      <span
                        className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${
                          group.color === "text-accent-gold-text"
                            ? "bg-accent-gold/60"
                            : group.color === "text-accent-cyan"
                              ? "bg-accent-cyan/60"
                              : "bg-accent-violet/60"
                        }`}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ))}
          </div>
        </section>

        <OrnamentalBreak />

        {/* ── Recurring Themes ── */}
        <section className="space-y-6">
          <h2 className="font-display text-lg font-bold text-accent-crimson-text tracking-tight">
            Recurring Themes
          </h2>
          <div className="space-y-4">
            {THEMES.map((t) => (
              <div
                key={t.letter}
                className="flex gap-4 rounded-lg border border-border bg-surface p-4"
              >
                <span
                  className={`font-display text-2xl font-black ${t.color} opacity-40 shrink-0 leading-none`}
                >
                  {t.letter}
                </span>
                <div className="space-y-1">
                  <h3 className={`font-display text-sm font-bold ${t.color}`}>
                    {t.title}
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    {t.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <MysticalDivider />

        {/* ── Timeline Arc ── */}
        <section className="space-y-6">
          <h2 className="font-display text-lg font-bold text-text-primary tracking-tight">
            Timeline Arc
          </h2>
          <p className="text-xs text-text-muted max-w-2xl">
            The archive evolves in three stages: personal divination expands into
            public spectacle and conflict, which then crystallizes into a codified
            myth-system.
          </p>
          <div className="relative flex flex-col sm:flex-row gap-4">
            {/* Connecting line */}
            <div
              className="absolute hidden sm:block top-1/2 left-0 right-0 h-px bg-border -translate-y-1/2 z-0"
              aria-hidden="true"
            />
            {TIMELINE.map((era) => (
              <div
                key={era.year}
                className="relative z-10 flex-1 rounded-lg border border-border bg-surface p-5 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-3 w-3 rounded-full ${era.color}`}
                    aria-hidden="true"
                  />
                  <span className="font-mono text-xs font-bold text-text-primary">
                    {era.year}
                  </span>
                </div>
                <h3 className="font-display text-sm font-bold text-text-primary">
                  {era.label}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  {era.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <MysticalDivider />

        {/* ── Lore Bible Table ── */}
        <section className="space-y-6">
          <h2 className="font-display text-lg font-bold text-accent-gold-text tracking-tight">
            Lore Bible
          </h2>
          <p className="text-xs text-text-muted max-w-2xl">
            The complete reference table of archetypes, their symbols, meanings,
            anchor episodes, and conflict functions within the mythic system.
          </p>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-elevated">
                  <th className="px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Archetype
                  </th>
                  <th className="px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Symbol
                  </th>
                  <th className="px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted hidden sm:table-cell">
                    Meaning
                  </th>
                  <th className="px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted hidden lg:table-cell">
                    Example Episodes
                  </th>
                  <th className="px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-text-muted hidden md:table-cell">
                    Conflict Function
                  </th>
                </tr>
              </thead>
              <tbody>
                {LORE_TABLE.map((row, i) => (
                  <tr
                    key={row.archetype}
                    className={`border-b border-border/50 ${
                      i % 2 === 0 ? "bg-surface" : "bg-void"
                    }`}
                  >
                    <td className="px-3 py-2.5 font-display text-xs font-medium text-text-primary">
                      {row.archetype}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-text-muted">
                      {row.symbol}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-text-muted hidden sm:table-cell">
                      {row.meaning}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-accent-gold-text/80 hidden lg:table-cell">
                      {row.episodes}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-text-muted italic hidden md:table-cell">
                      {row.conflict}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <OrnamentalBreak />

        {/* ── Bottom line ── */}
        <section className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 p-6 text-center space-y-3">
          <p className="text-sm text-text-primary leading-relaxed max-w-2xl mx-auto">
            The dominant CultCodex story is a recurring drama of{" "}
            <span className="text-accent-gold-text font-medium">revelation</span>,{" "}
            <span className="text-accent-violet-text font-medium">projection</span>,{" "}
            <span className="text-accent-cyan font-medium">transformation</span>, and{" "}
            <span className="text-text-primary font-medium">containment</span>&mdash;hosted
            through tarot, myth, cats, livestream ritual, and digital symbolism.
          </p>
          <p className="text-xs text-text-muted italic">
            The core protagonist is usually some version of the intuitive outsider
            who must read signs, survive spectacle, set boundaries, and turn chaos
            into meaning.
          </p>
        </section>

        {/* ── Navigation ── */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/start-here"
            className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-gold/30 hover:bg-elevated"
          >
            <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-gold-text transition-colors">
              Start Here
            </h3>
            <p className="mt-1 text-xs text-text-muted">
              Choose your path into the archive
            </p>
          </Link>
          <Link
            href="/lore"
            className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-cyan/30 hover:bg-elevated"
          >
            <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-cyan transition-colors">
              Lore Archive
            </h3>
            <p className="mt-1 text-xs text-text-muted">
              Concepts, doctrines, and myths
            </p>
          </Link>
          <Link
            href="/topics"
            className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-violet/30 hover:bg-elevated"
          >
            <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-violet-text transition-colors">
              Topics
            </h3>
            <p className="mt-1 text-xs text-text-muted">
              Browse by theme and subject
            </p>
          </Link>
        </div>

        <ArchiveDisclaimer variant="full" />
      </main>
    </>
  );
}
