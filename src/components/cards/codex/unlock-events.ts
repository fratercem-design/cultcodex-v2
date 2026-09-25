/** Tiny, dependency-free event channel between sigils/packs and the watcher. */
import type { Rarity } from "@/generated/prisma/client";

export interface UnsealedCard { id: string; slug: string; title: string; rarity: Rarity }

export function announceUnsealed(cards: UnsealedCard[]) {
  if (cards.length) window.dispatchEvent(new CustomEvent("codex:unsealed", { detail: cards }));
}

/** Ask the watcher to re-check Trials now (e.g. after opening a pack). */
export function requestTrialCheck() {
  window.dispatchEvent(new Event("codex:check"));
}
