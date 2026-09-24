# Thin topic pages — quality floor and consolidation rule

Status: **proposal.** Nothing in this change alters a rendered page, a sitemap
entry or a database row. It adds the rule as testable code and a read-only
report that measures the corpus against it. Applying the plan is a second pass,
after the floor below is agreed.

## What the repo actually says

The task that opened this thread cited an audit item "SEO-04", ~13,743 topic
pages at a median of ~1,676 characters, and a "Phase 4 roadmap" for thin-page
consolidation. None of those are in this repository:

| Claim | What is in the repo |
|---|---|
| Audit item `SEO-04` | No such id. `AUDIT.md` numbers its findings `F1`–`F11`; `docs/audit-completion-notes.md` uses `CC-1xx`–`CC-6xx`. |
| ~13,743 topic pages | `AUDIT.md` §7.3 (2026-08-28): **11,944 topics**, 8,815 lore. `docs/CULT_MASTERS_HANDBOOK.md` §9 item 7: 11,683. |
| Median ~1,676 chars | Never measured. `AUDIT.md` §7.6 is explicitly **`[NOT TESTED]`** — "I did not run a similarity analysis". The nearest real figure is a live sample of ~240–330 visible words *including nav and footer*, in `src/app/__tests__/sitemap-linked.test.ts`. |
| "Phase 4 roadmap" for thin pages | `docs/plans/2026-03-17-phase4-*` is the cross-page *visual* upgrade. The topic work under "Phase 4" in `audit-completion-notes.md` is `CC-401`: 17 near-duplicate pairs merged by hand. |

Treat the numbers above as the baseline. The report script added here produces
the real distribution, which nobody has measured yet.

## A floor already exists

`THIN_PAGE_MIN_EPISODES = 2` in `src/lib/seo.ts` shipped on 2026-09-10
(`31ab0cc`). Topics and lore entries under it already carry `noindex, follow`
and are already excluded from the sitemap, and `sitemap-linked.test.ts` pins the
two to agree.

So the open problem is not "set a floor". It is that a sub-floor topic is still
a live URL: reachable from the Rabbit Hole block on its neighbours, paginated
through on `/topics`, and rendering chrome plus a title to anyone who lands on
it. Indexability was solved; the pages were not.

## Proposed floor

**Keep `THIN_PAGE_MIN_EPISODES = 2`. Do not introduce a second threshold.**

A separate consolidation threshold would let the sitemap and the consolidator
disagree about what "thin" means — the precise failure the comment on that
constant warns about. `src/lib/topic-quality.ts` imports it rather than
restating it. Three tiers fall out of it:

| Tier | Rule | Meaning |
|---|---|---|
| `canonical` | `episodes >= 2` | Clears the floor. Indexed, in the sitemap, keeps its URL. |
| `thin` | `episodes == 1` | Real transcript evidence, not enough to stand alone. |
| `orphan` | `episodes == 0` | Nothing in the archive supports the page. An enrichment artifact. |

Episode count is the measure rather than character count because it is the only
signal that is *evidence*: a long `description` is LLM prose about a topic,
while a linked episode is a transcript the claim came from. Enriching a page
that is thin on prose is cheap; a page with no episodes cannot be enriched from
data at all, because there is no data.

## Proposed consolidation rule

Applied in this order — merging happens **before** the floor is judged, so a
topic that is sub-floor alone can clear it once its twin folds in.

1. **Cluster by normalized title.** Lowercase, strip diacritics, drop every
   separator, singularize per word. Two topics are candidates only when their
   titles normalize to the same key. This is the same concatenated form
   `scripts/_topic-audit.ts` already used to surface near-dupes, with
   singularization added — which computes the hand-maintained 45-pair list in
   `scripts/_topic-dedup.ts` instead of requiring someone to type it out.
   It is not fuzzy or semantic: `tarot readings` / `tarot reading` collapse,
   `tarot readings` / `tarot spreads` do not.
2. **Pick the survivor:** most episodes, ties to the older row, then slug order.
   The older row has the longer crawl history, so it is the better URL to keep.
3. **Re-tier on the merged episode count,** counted as a *union* over
   `EpisodeTopic` — two topics on the same episode contribute one link. Summing
   would inflate the count and promote pages that did not earn it.
4. **Act per topic:**
   - `keep` — clears the floor. Untouched.
   - `merge` — relations re-pointed to the survivor; its slug 301s there.
   - `redirect-to-episode` — one episode, no cluster to join. The episode page
     is the better destination for a reader and for the link equity.
   - `delete` — zero episodes, zero members saved. The row is an artifact.
   - `retain-noindex` — zero episodes, but a member has it pinned. The row
     stays and nothing redirects; deleting would break their saved codex.

Deliberately conservative in both directions: a missed merge leaves a page as it
is today, while a wrong merge silently destroys a topic's episode links. Every
guard in `singularize` exists because of that asymmetry.

## Enrichment of the survivors — from data already in the database

No new hand-written copy, and no new LLM generation. A canonical topic page
already has more in the database than it renders:

- **Quotes.** `Quote` joins to `Episode`, and a topic joins to its episodes — so
  every canonical topic can render real, attributed transcript lines. This is
  the largest single win and it is pure reuse.
- **The synthesized description** already built in `generateMetadata` (episode,
  people and lore counts as a sentence) currently only reaches the `<meta>` tag.
  It belongs in the body too.
- **Span.** First and last appearance dates are derivable from the linked
  episodes and are not shown.
- **Rabbit Hole** already computes related topics; it renders below the fold.

## Open question

The floor stays at 2 in this proposal. The alternative is 3, which would cut the
canonical set substantially further. The report script prints the corpus at both
so the trade is visible before anything is applied.

## What ships here

- `src/lib/topic-quality.ts` — tiers, normalization, clustering, plan. Pure.
- `src/lib/__tests__/topic-quality.test.ts` — 16 tests, including the pairs
  sampled from the existing hand-written dedup list.
- `scripts/maintenance/topic-quality-report.ts` — read-only measurement.

Applying the plan needs a follow-up: a slug-alias table plus a middleware
redirect (thousands of merged slugs will not fit `next.config.ts`, and per
that file's own comment a server-component `redirect()` returns a 200 with a
client hop rather than a true 301). That is a schema change, so it needs the
`Run DB Migrations` action as a pre-deploy gate per `CLAUDE.md`.
