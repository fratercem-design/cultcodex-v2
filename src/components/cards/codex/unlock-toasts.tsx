"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { catalogEntry, codexStats } from "@/lib/cards/codex/catalog";
import { CodexCard, RARITY_COLOR } from "./codex-card";
import type { UnsealedCard } from "./unlock-events";

export function UnlockToasts({ cards }: { cards: UnsealedCard[] }) {
  return (
    <div className="cx-toasts" aria-live="polite">
      {cards.map((c) => {
        const entry = catalogEntry(c.slug);
        const [statA, statB, statC] = entry ? codexStats(entry.def) : [0, 0, 0];
        return (
          <div key={c.id} className="cx-toast" style={{ "--cx-accent": RARITY_COLOR[c.rarity] } as CSSProperties}>
            <div style={{ width: 76 }}>
              <CodexCard
                interactive={false}
                card={{
                  slug: c.slug, title: c.title, rarity: c.rarity,
                  cardType: entry?.def.cardType ?? "SIGNAL",
                  subtitle: entry?.def.subtitle, season: entry?.season.number, collectorNo: entry?.no,
                  obtainMethod: entry?.def.obtain, statA, statB, statC,
                }}
              />
            </div>
            <div>
              <div className="cx-toast-kicker">✶ CARD UNSEALED · {c.rarity}</div>
              <div className="cx-toast-title">{c.title}</div>
              <Link href="/cards">Open your Codex →</Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
