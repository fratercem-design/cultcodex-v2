"use client";

import { catalogEntry, codexStats } from "@/lib/cards/codex/catalog";
import { CARD_MEANINGS } from "@/lib/cards/codex/meanings";
import { CodexCard, RARITY_COLOR } from "@/components/cards/codex/codex-card";

const LABEL = /^\**\s*([A-Z][A-Z' ]{2,40}?)\s*\**\s*[—–:-]\s*/;

/** Split a reading into its labelled sections ("THE CARD — …"). Unlabelled text stays as prose. */
export function parseReading(text: string): { label: string | null; body: string }[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const m = p.match(LABEL);
      return m ? { label: m[1].trim(), body: p.slice(m[0].length).replace(/\*\*/g, "") } : { label: null, body: p.replace(/\*\*/g, "") };
    });
}

/**
 * A divination answer: the drawn card (turned upside down when reversed)
 * above the reading. `text` is the typewriter's progress, so sections appear
 * as they're written.
 */
export function DivinationReading({ slug, reversed, text, done }: { slug: string; reversed: boolean; text: string; done: boolean }) {
  const entry = catalogEntry(slug);
  const meaning = CARD_MEANINGS[slug];
  if (!entry) return <p className="font-serif text-base leading-relaxed text-text-primary whitespace-pre-line">{text}</p>;
  const { def, season, no } = entry;
  const [statA, statB, statC] = codexStats(def);
  const color = RARITY_COLOR[def.rarity];
  const sections = parseReading(text);

  return (
    <div className="space-y-7">
      <div className="flex flex-col items-center gap-3">
        <div className="oracle-drawn-card" style={{ width: 200 }}>
          <div style={{ transform: reversed ? "rotate(180deg)" : undefined, transition: "transform 0.8s ease" }}>
            <CodexCard
              card={{
                slug: def.slug, title: def.title, subtitle: def.subtitle, cardType: def.cardType, rarity: def.rarity,
                flavourText: def.flavour, abilities: def.abilities, statA, statB, statC,
                season: season.number, collectorNo: no, maxSupply: def.maxSupply ?? null, obtainMethod: def.obtain,
              }}
              interactive={!reversed}
            />
          </div>
        </div>
        <p className="font-mono text-[12px] uppercase tracking-[0.2em]" style={{ color }}>
          {def.title} · {reversed ? "Reversed" : "Upright"}
        </p>
        {meaning && (
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">{meaning.keywords.join(" · ")}</p>
        )}
      </div>

      <div className="space-y-5 text-left">
        {sections.map((s, i) =>
          s.label === "THE OMEN" ? (
            <p key={i} className="pt-2 text-center font-serif text-lg sm:text-xl italic text-accent-cyan/90">{s.body}</p>
          ) : (
            <div key={i} className="space-y-1.5">
              {s.label && <p className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color }}>{s.label}</p>}
              <p className="font-serif text-[15px] sm:text-base leading-relaxed text-text-primary">{s.body}</p>
            </div>
          ),
        )}
        {!done && <span className="inline-block w-0.5 h-[1.1em] bg-accent-violet/70 align-middle animate-pulse" />}
      </div>
    </div>
  );
}
