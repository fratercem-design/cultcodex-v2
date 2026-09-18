import { getPrisma, disconnect } from "../ingest/lib";
import {
  clusterByNormalizedTitle,
  planConsolidation,
  tierFor,
  type TopicCluster,
  type TopicQualityInput,
} from "../../src/lib/topic-quality";
import { THIN_PAGE_MIN_EPISODES } from "../../src/lib/seo";

/**
 * Read-only. Measures the topic corpus against the quality floor in
 * `src/lib/topic-quality.ts` and prints what consolidation would do.
 *
 * `AUDIT.md` §7.6 flagged thin and duplicate topic content as NOT TESTED — no
 * similarity analysis had ever been run across the topic pages. This is that
 * pass. It writes nothing: every number below is a count, and the plan is a
 * proposal to read before anything is applied.
 *
 *   npx tsx scripts/maintenance/topic-quality-report.ts
 *   npx tsx scripts/maintenance/topic-quality-report.ts --samples 40
 */

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

function bar(count: number, total: number, width = 32): string {
  const filled = total === 0 ? 0 : Math.round((count / total) * width);
  return "█".repeat(filled).padEnd(width, "·");
}

function pct(count: number, total: number): string {
  return total === 0 ? "0.0%" : `${((count / total) * 100).toFixed(1)}%`;
}

async function main() {
  const sampleSize = Number(
    process.argv[process.argv.indexOf("--samples") + 1] ?? 20
  ) || 20;
  const prisma = getPrisma();

  const rows = await prisma.topic.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      createdAt: true,
      _count: { select: { episodes: true, people: true, lore: true, savedBy: true } },
    },
  });

  const topics: TopicQualityInput[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    createdAt: r.createdAt,
    episodeCount: r._count.episodes,
    peopleCount: r._count.people,
    loreCount: r._count.lore,
    savedCount: r._count.savedBy,
  }));

  console.log(`TOPIC QUALITY REPORT — ${topics.length.toLocaleString()} topics`);
  console.log(`Floor: THIN_PAGE_MIN_EPISODES = ${THIN_PAGE_MIN_EPISODES}\n`);

  // ─── 1. Where the corpus actually sits ──────────────────────────────────
  const tiers = { canonical: 0, thin: 0, orphan: 0 };
  for (const t of topics) tiers[tierFor(t.episodeCount)] += 1;

  console.log("=== TIERS (before consolidation) ===");
  for (const [tier, count] of Object.entries(tiers)) {
    console.log(`  ${tier.padEnd(10)} ${bar(count, topics.length)} ${String(count).padStart(6)}  ${pct(count, topics.length)}`);
  }

  // ─── 2. How much prose a topic page actually has ────────────────────────
  // `description` is the only body copy a topic page renders that is not
  // chrome, a count, or a link list — so its length is the honest measure of
  // "thin", not the rendered byte size of the page.
  const lengths = topics.map((t) => t.description?.trim().length ?? 0).sort((a, b) => a - b);
  const empty = lengths.filter((n) => n === 0).length;
  console.log(`\n=== DESCRIPTION LENGTH (chars) ===`);
  console.log(`  empty      ${String(empty).padStart(6)}  ${pct(empty, topics.length)}`);
  for (const p of [25, 50, 75, 90, 99]) {
    console.log(`  p${String(p).padEnd(9)} ${String(percentile(lengths, p)).padStart(6)}`);
  }
  console.log(`  max        ${String(lengths[lengths.length - 1] ?? 0).padStart(6)}`);

  // ─── 3. Near-duplicate clusters ─────────────────────────────────────────
  const clusters = clusterByNormalizedTitle(topics);
  const absorbable = clusters.reduce((n, c) => n + c.absorbed.length, 0);
  console.log(`\n=== NEAR-DUPLICATE CLUSTERS ===`);
  console.log(`  clusters            ${String(clusters.length).padStart(6)}`);
  console.log(`  rows absorbed       ${String(absorbable).padStart(6)}  ${pct(absorbable, topics.length)} of corpus`);

  // Resolve each cluster's post-merge episode count as a true union — two
  // topics on the same episode must not count twice, or the floor is applied
  // to an inflated number and promotes a page that did not earn it.
  const mergedCounts = new Map<string, number>();
  for (const cluster of clusters) {
    const ids = [cluster.survivor.id, ...cluster.absorbed.map((t) => t.id)];
    const links = await prisma.episodeTopic.findMany({
      where: { topicId: { in: ids } },
      select: { episodeId: true },
    });
    mergedCounts.set(cluster.key, new Set(links.map((l) => l.episodeId)).size);
  }
  const resolver = (c: TopicCluster) => mergedCounts.get(c.key) ?? c.survivor.episodeCount;

  const promoted = clusters.filter(
    (c) => tierFor(c.survivor.episodeCount) !== "canonical" && tierFor(resolver(c)) === "canonical"
  );
  console.log(`  survivors promoted  ${String(promoted.length).padStart(6)}  (cleared the floor only once merged)`);

  console.log(`\n  Largest clusters:`);
  for (const c of [...clusters].sort((a, b) => b.absorbed.length - a.absorbed.length).slice(0, sampleSize)) {
    const members = [c.survivor, ...c.absorbed]
      .map((t) => `${t.slug}(${t.episodeCount})`)
      .join(" + ");
    console.log(`    [${c.key}] → ${c.survivor.slug} (${resolver(c)} eps): ${members}`);
  }

  // ─── 4. The plan ────────────────────────────────────────────────────────
  const plan = planConsolidation(topics, resolver);
  console.log(`\n=== PROPOSED ACTIONS ===`);
  for (const [kind, count] of Object.entries(plan.counts)) {
    console.log(`  ${kind.padEnd(20)} ${bar(count, topics.length)} ${String(count).padStart(6)}  ${pct(count, topics.length)}`);
  }

  const surviving = plan.counts.keep + plan.counts["retain-noindex"];
  console.log(`\n  ${topics.length.toLocaleString()} topic rows → ${surviving.toLocaleString()} pages`);
  console.log(`  ${plan.counts.keep.toLocaleString()} indexable (today: ${tiers.canonical.toLocaleString()})`);

  const redirects = plan.counts.merge + plan.counts["redirect-to-episode"];
  console.log(`  ${redirects.toLocaleString()} slugs need a 301 — they are live URLs today`);
  console.log(`  ${plan.counts.delete.toLocaleString()} rows deletable (0 episodes, 0 members saved)`);
  console.log(`  ${plan.counts["retain-noindex"].toLocaleString()} orphans retained because a member saved them`);

  console.log(`\n  Sample of each action:`);
  for (const kind of Object.keys(plan.counts) as Array<keyof typeof plan.counts>) {
    const examples = plan.actions.filter((a) => a.kind === kind).slice(0, 5);
    if (examples.length === 0) continue;
    const rendered = examples
      .map((a) => ("intoSlug" in a ? `${a.slug} → ${a.intoSlug}` : a.slug))
      .join(", ");
    console.log(`    ${kind.padEnd(20)} ${rendered}`);
  }

  await disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await disconnect();
  process.exit(1);
});
