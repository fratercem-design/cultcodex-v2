import { THIN_PAGE_MIN_EPISODES } from "@/lib/seo";

/**
 * Topic-page quality floor and consolidation rule.
 *
 * `isThinPage` in `@/lib/seo` already answers "should a crawler index this?" —
 * topics under `THIN_PAGE_MIN_EPISODES` carry `noindex, follow` and are absent
 * from the sitemap (shipped 2026-09-10, `31ab0cc`). That is an *indexability*
 * floor. It does nothing about the pages themselves: a sub-floor topic is still
 * a live URL rendering site chrome plus a title, still reachable from the
 * "Rabbit Hole" block on its neighbours, and still one of ~12k rows the topics
 * index paginates through.
 *
 * This module is the *consolidation* rule layered on top. It reuses the same
 * `THIN_PAGE_MIN_EPISODES` constant deliberately — a second, differently-valued
 * threshold would put the sitemap and the consolidator into disagreement about
 * what "thin" means, which is the exact bug the seo.ts comment warns against.
 *
 * Everything here is pure. `scripts/maintenance/topic-quality-report.ts` drives
 * it against the database read-only; nothing in this file writes.
 */

export interface TopicQualityInput {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  createdAt: Date;
  episodeCount: number;
  peopleCount: number;
  loreCount: number;
  /** `SavedTopic` rows — a member has this topic pinned in their codex. */
  savedCount: number;
}

/**
 * `canonical` — clears the floor; keeps its URL and its index slot.
 * `thin`      — real transcript evidence, but not enough to stand alone.
 * `orphan`    — zero linked episodes. Nothing in the archive supports the page.
 */
export type TopicTier = "canonical" | "thin" | "orphan";

export function tierFor(episodeCount: number): TopicTier {
  if (episodeCount === 0) return "orphan";
  if (episodeCount < THIN_PAGE_MIN_EPISODES) return "thin";
  return "canonical";
}

// ─── Title normalization ───────────────────────────────────────────────────

/**
 * Endings whose trailing "s" is part of the stem. Stripping it invents a
 * different concept ("chaos" → "chao") and would merge unrelated topics.
 *
 * Deliberately narrow. "-as" and "-ys" look like they belong here ("bias",
 * "ethos") but they are how every noun ending in a vowel forms its plural —
 * guarding them strands "mantras", "ideas", "sagas" and "keys" away from their
 * singulars, which is most of what this rule exists to catch. Those few real
 * stems are listed word-by-word instead.
 */
const PROTECTED_SUFFIXES = ["ss", "us", "is", "os"];
const PROTECTED_WORDS = new Set(["bias", "canvas", "atlas", "gas", "alias"]);

function singularize(word: string): string {
  if (word.length < 4 || PROTECTED_WORDS.has(word)) return word;

  if (word.endsWith("ies") && word.length > 4) return `${word.slice(0, -3)}y`;
  for (const stem of ["sses", "shes", "ches", "xes", "zes"]) {
    if (word.endsWith(stem)) return word.slice(0, -2);
  }
  if (!word.endsWith("s")) return word;
  if (PROTECTED_SUFFIXES.some((suffix) => word.endsWith(suffix))) return word;

  const singular = word.slice(0, -1);
  return singular.length >= 3 ? singular : word;
}

/**
 * The merge key. Two topics are candidates for consolidation only when their
 * titles normalize to the same string — which is exactly the relation the
 * hand-maintained 45-pair list in `scripts/_topic-dedup.ts` encodes, computed
 * instead of typed out. Separators are dropped rather than folded to spaces, so
 * "panel-verse" and "panelverse" reach the same key — the same concatenated
 * form `scripts/_topic-audit.ts` already used to surface near-dupes, with
 * per-word singularization added on top.
 *
 * It does NOT do fuzzy or semantic matching: "tarot readings" and "tarot
 * spreads" stay separate topics.
 */
export function normalizeTopicTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(singularize)
    .join("");
}

// ─── Clustering ────────────────────────────────────────────────────────────

export interface TopicCluster {
  key: string;
  /** Highest episode count wins; ties broken by the older row, so the slug
   *  with the longer crawl history is the one that survives. */
  survivor: TopicQualityInput;
  absorbed: TopicQualityInput[];
  /** Episode links the survivor holds once the cluster is merged. Union, not
   *  sum — two topics on the same episode contribute one link, and this is the
   *  count the floor is then re-applied to. Unknown from counts alone, so the
   *  report resolves it from the join table; `null` means "not yet resolved". */
  mergedEpisodeCount: number | null;
}

export function clusterByNormalizedTitle(topics: TopicQualityInput[]): TopicCluster[] {
  const buckets = new Map<string, TopicQualityInput[]>();
  for (const topic of topics) {
    const key = normalizeTopicTitle(topic.title);
    if (!key) continue;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(topic);
    else buckets.set(key, [topic]);
  }

  return [...buckets.entries()]
    .filter(([, members]) => members.length > 1)
    .map(([key, members]) => {
      const ranked = [...members].sort(
        (a, b) =>
          b.episodeCount - a.episodeCount ||
          a.createdAt.getTime() - b.createdAt.getTime() ||
          a.slug.localeCompare(b.slug)
      );
      const [survivor, ...absorbed] = ranked;
      return { key, survivor, absorbed, mergedEpisodeCount: null };
    });
}

// ─── The plan ──────────────────────────────────────────────────────────────

export type TopicAction =
  /** Clears the floor. Untouched. */
  | { kind: "keep"; slug: string }
  /** Folds into `intoSlug`; its own slug 301s there. */
  | { kind: "merge"; slug: string; intoSlug: string }
  /** One episode and no cluster to join — the episode page is the better
   *  destination for both a reader and the link equity. */
  | { kind: "redirect-to-episode"; slug: string }
  /** No episodes, nobody saved it. The row is an enrichment artifact. */
  | { kind: "delete"; slug: string }
  /** No episodes, but a member has it pinned. Deleting breaks their codex, so
   *  the row stays, `noindex` stays, and nothing redirects. */
  | { kind: "retain-noindex"; slug: string };

export interface ConsolidationPlan {
  actions: TopicAction[];
  counts: Record<TopicAction["kind"], number>;
}

/**
 * Applies the rule in order: cluster first, then re-tier on the merged episode
 * count. A topic sitting below the floor on its own can clear it once its
 * singular/plural twin folds in — which is the whole point of merging before
 * judging.
 *
 * `resolveMergedEpisodeCount` supplies the post-merge union for a cluster. The
 * report passes a resolver backed by `EpisodeTopic`; callers without one get
 * the survivor's own count, which under-counts and is therefore safe: it can
 * only leave a page below the floor, never promote one above it.
 */
export function planConsolidation(
  topics: TopicQualityInput[],
  resolveMergedEpisodeCount?: (cluster: TopicCluster) => number
): ConsolidationPlan {
  const clusters = clusterByNormalizedTitle(topics);
  const absorbedInto = new Map<string, string>();
  const mergedCounts = new Map<string, number>();

  for (const cluster of clusters) {
    for (const member of cluster.absorbed) {
      absorbedInto.set(member.id, cluster.survivor.slug);
    }
    mergedCounts.set(
      cluster.survivor.id,
      resolveMergedEpisodeCount?.(cluster) ?? cluster.survivor.episodeCount
    );
  }

  const actions: TopicAction[] = topics.map((topic) => {
    const intoSlug = absorbedInto.get(topic.id);
    if (intoSlug) return { kind: "merge", slug: topic.slug, intoSlug };

    const episodeCount = mergedCounts.get(topic.id) ?? topic.episodeCount;
    switch (tierFor(episodeCount)) {
      case "canonical":
        return { kind: "keep", slug: topic.slug };
      case "thin":
        return { kind: "redirect-to-episode", slug: topic.slug };
      case "orphan":
        return topic.savedCount > 0
          ? { kind: "retain-noindex", slug: topic.slug }
          : { kind: "delete", slug: topic.slug };
    }
  });

  const counts: ConsolidationPlan["counts"] = {
    keep: 0,
    merge: 0,
    "redirect-to-episode": 0,
    delete: 0,
    "retain-noindex": 0,
  };
  for (const action of actions) counts[action.kind] += 1;

  return { actions, counts };
}
