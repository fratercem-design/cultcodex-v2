export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clueFor, codexStats, currentSeason, seasonDaysLeft } from "@/lib/cards/codex/catalog";
import { TRIAL_BY_ID } from "@/lib/cards/codex/trials";
import { checkTrials, type GrantedCard, type TrialProgress } from "@/lib/cards/codex/codex";
import { CodexApp, type CodexEntry } from "./codex-app";
import type { CodexCardData } from "@/components/cards/codex/codex-card";

export const metadata: Metadata = {
  title: "The Codex — CultCodex Cards",
  description:
    "Collect the CultCodex card set. Fifty Season I cards: pull them from packs, earn them through Trials, or find the three hidden around the site. Every account gets a free Initiation Pack.",
  alternates: { canonical: "/cards" },
};

type Owned = { quantity: number; isFoil: boolean; isNew: boolean };

export default async function CodexPage() {
  const season = currentSeason();
  const user = await getCurrentUser();

  let justUnsealed: GrantedCard[] = [];
  let progress: TrialProgress[] = [];
  const owned = new Map<string, Owned>();
  let legacy: { card: CodexCardData; owned: Owned }[] = [];
  let initiationClaimed = false;
  let balance = 0;

  if (user) {
    // Retroactive: anything earned since the last visit is granted before we
    // read the collection, so it shows up owned (and announced) right away.
    ({ granted: justUnsealed, progress } = await checkTrials(user.id).catch(() => ({ granted: [], progress: [] })));
    const [rows, wallet] = await Promise.all([
      prisma.ownedCard.findMany({ where: { userId: user.id }, include: { card: true } }).catch(() => []),
      prisma.userWallet.findUnique({ where: { userId: user.id }, select: { balance: true, initiationClaimedAt: true } }).catch(() => null),
    ]);
    initiationClaimed = !!wallet?.initiationClaimedAt;
    balance = wallet?.balance ?? 0;

    const legacyBySlug = new Map<string, { card: CodexCardData; owned: Owned }>();
    for (const row of rows) {
      const target = row.card.season === 0 ? legacyBySlug.get(row.card.slug)?.owned : owned.get(row.card.slug);
      const merged: Owned = {
        quantity: (target?.quantity ?? 0) + row.quantity,
        isFoil: (target?.isFoil ?? false) || row.isFoil,
        isNew: (target?.isNew ?? false) || row.isNew,
      };
      const c = row.card;
      if (c.season === 0) {
        legacyBySlug.set(c.slug, {
          card: {
            slug: c.slug, title: c.title, subtitle: c.subtitle, cardType: c.cardType, rarity: c.rarity,
            flavourText: c.flavourText, abilities: c.abilities, statA: c.statA, statB: c.statB, statC: c.statC,
            artUrl: c.artUrl, season: 0, maxSupply: c.maxSupply,
          },
          owned: merged,
        });
      }
      else owned.set(row.card.slug, merged);
    }
    legacy = [...legacyBySlug.values()];

    // Seen now — clear NEW flags after this render has captured them.
    prisma.ownedCard.updateMany({ where: { userId: user.id, isNew: true }, data: { isNew: false } }).catch(() => {});
  }

  const progressById = new Map(progress.map((p) => [p.trialId, p]));
  const entries: CodexEntry[] = season.cards.map((def, i) => {
    const [statA, statB, statC] = codexStats(def);
    const trial = def.questId ? TRIAL_BY_ID.get(def.questId) : undefined;
    return {
      card: {
        slug: def.slug,
        title: def.title,
        subtitle: def.subtitle,
        cardType: def.cardType,
        rarity: def.rarity,
        flavourText: def.flavour,
        abilities: def.abilities,
        statA, statB, statC,
        season: season.number,
        collectorNo: i + 1,
        maxSupply: def.maxSupply ?? null,
        obtainMethod: def.obtain,
      },
      obtain: def.obtain,
      clue: clueFor(def),
      href: trial?.href ?? (def.obtain === "pack" ? "/cards/packs" : undefined),
      progress: trial ? progressById.get(trial.id) ?? null : null,
      unit: trial?.unit,
      owned: owned.get(def.slug) ?? null,
    };
  });

  return (
    <CodexApp
      season={{
        number: season.number, numeral: season.numeral, name: season.name, tagline: season.tagline, palette: season.palette,
        daysLeft: seasonDaysLeft(season),
      }}
      entries={entries}
      legacy={legacy}
      signedIn={!!user}
      initiationClaimed={initiationClaimed}
      balance={balance}
      justUnsealed={justUnsealed.map((g) => ({ id: g.id, slug: g.slug, title: g.title, rarity: g.rarity }))}
    />
  );
}
