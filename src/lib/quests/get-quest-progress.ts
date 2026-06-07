/**
 * Quest progress evaluation — reuses the same activity gather as ranks.
 */
import { getUserRank } from "@/lib/rankings/get-user-rank";
import { QUESTS, type Quest } from "./quests";

export interface QuestProgress {
  quest: Quest;
  current: number;
  target: number;
  done: boolean;
  pct: number;
}

export async function getQuestProgress(
  userId: string,
  isMember: boolean
): Promise<QuestProgress[]> {
  const { activity } = await getUserRank(userId, isMember);
  return QUESTS.map((quest) => {
    const raw = Math.max(0, Math.floor(quest.metric(activity)));
    const done = raw >= quest.target;
    return {
      quest,
      current: Math.min(raw, quest.target),
      target: quest.target,
      done,
      pct: Math.max(0, Math.min(100, Math.round((raw / quest.target) * 100))),
    };
  });
}

/** Single-quest progress, for the reward gate. */
export async function getSingleQuestProgress(
  userId: string,
  isMember: boolean,
  slug: string
): Promise<QuestProgress | null> {
  const all = await getQuestProgress(userId, isMember);
  return all.find((q) => q.quest.slug === slug) ?? null;
}
