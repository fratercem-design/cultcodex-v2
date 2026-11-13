# CultCodex SEO and marketing plan

2026-11-12. Covers cultcodex.me for the next 90 days.

## What this is based on

Measured on the live site and in this repository on 2026-11-11 and 2026-11-12:
page responses, sitemaps, titles, meta descriptions, structured data, workflow
history, and production logs.

Not available, so nothing below depends on it: Search Console data, analytics,
keyword volumes, and backlink data. The Ahrefs and Similarweb connectors are not
authorized in this workspace. Step 1 of the plan is to get Search Console
numbers, because they decide the order of most of what follows.

## Where the site stands

| Area | State |
|---|---|
| Indexable URLs | About 5,700 in the sitemaps: 3,427 episodes, 1,467 topics, 461 lore, 243 people, 95 static pages, 15 series, 3 free Psychenomicon chapters |
| Technical base | Sound. Canonicals, sitemap index, robots.txt with explicit AI-crawler rules, `llms.txt`, RSS, `VideoObject` + `BreadcrumbList` + `WebSite` + `Organization` JSON-LD, thin pages set to noindex |
| Speed | Listing pages answer in under a second since the 2026-11-12 deploy. Transcript search still takes about 22 s (audit item B1) |
| Fresh content | Broken until this branch. 47 of the 50 newest episode pages carry the fallback description "Watch <title> from Cult of Psyche…" because enrichment had not run since 2026-09-24 |
| Reliability | On 2026-11-11 the database pool starved: `/episodes`, `/topics` and `/people` rendered empty after 15 s, uncached episode pages returned 500, and `/sitemaps/episodes.xml` served zero URLs. Resolved by the indexes in #394 |
| Internal linking | 23 sitemap pages had no link from the sidebar, footer, homepage or `/explore` |
| Titles | Hub pages were titled "Quotes — CultCodex", "Series — CultCodex", "Timeline — CultCodex": no show name, so nothing to match a search for the show |

## The position to own

CultCodex cannot outrank YouTube for an episode title, and should not try. It
can win three kinds of search that YouTube serves badly:

1. **Things said on the show.** A viewer remembers a line or a moment and
   searches for it. Transcripts with timestamps answer that; a video page does
   not.
2. **People and feuds.** Searches for a panelist's name plus "Cult of Psyche",
   or for a named conflict. Person pages, the Drama Files and the relationship
   map are the only structured source.
3. **The show's own vocabulary.** Lexicon terms, lore entries and running
   jokes. Nobody else defines them.

Everything in this plan serves one of those three, or converts the visitor once
they arrive.

## Shipped on this branch

| Change | Why it matters for search |
|---|---|
| Enrichment runs daily at 18:30 UTC | New episodes get a real summary, quotes, guests and a specific meta description within a day instead of never |
| A failed enrichment batch now fails the workflow | The seven-week gap went unnoticed because nothing went red |
| Sitemaps no longer cache an empty result when the database fails | A crawler that fetched the episode sitemap during the outage was told the archive had no episodes |
| `/explore` lists every public section in six groups | The 23 unlinked pages now have a crawlable link one click from the sidebar |
| Six hub titles and four descriptions name the show | "Cult of Psyche Quotes", "Cult of Psyche Timeline: Every Episode in Order" and so on |

## Days 1 to 14: clear the backlog and measure

1. **Clear the enrichment backlog.** The daily run does 50 episodes on the free
   model. Dispatch `Enrich CultofPsyche Episodes` by hand with a larger batch
   until the queue is empty, then let the schedule keep up. Check the run's
   notice for the "Found N original episodes needing enrichment" line.
2. **Pull Search Console data.** Export 90 days of queries and pages. Three
   lists decide the rest of this plan: pages with impressions and a position of
   5 to 20 (title and description rewrites pay off fastest there), queries
   containing a person's name, and pages marked "Crawled, currently not
   indexed".
3. **Resubmit the sitemap index** in Search Console after the deploy, and
   inspect two or three episode URLs from late October to confirm the new
   descriptions are picked up.
4. **Alert on failure.** The enrich, transcript-import and scheduled-jobs
   workflows now go red when they break. Turn on GitHub's email notification
   for failed scheduled workflows on this repository so a red run reaches
   someone.
5. **Fix transcript search (B1).** Twenty-two seconds is a dead feature, and it
   is the feature the positioning above rests on. The `pg_trgm` index SQL is in
   `AUDIT-2026-11-10.md`; test it on the staging branch first.

## Days 15 to 45: make the three page types rank

**Episode pages**

- Title pattern. Today: "We Back Open Panel — CultCodex". Many streams share
  generic names ("Good Morning Open Panel" appears repeatedly), so titles
  collide. Add the air date and show name: "We Back Open Panel (Nov 9, 2026) —
  Cult of Psyche transcript". Do this in the episode `generateMetadata`, with a
  test on the 60-character budget.
- Put key moments in the `VideoObject` markup. Enrichment already extracts
  timestamped quotes; emit them as `Clip` entries (`hasPart`) so Google can show
  key moments under the result.
- Answer the question on the page. Enriched episodes have a facts summary. Lead
  with it above the transcript so the first screen is the answer, not the
  player.
- Page weight. An episode with a long transcript is 1.4 to 1.6 MB of HTML
  (audit B11). Render the first part of the transcript and load the rest on
  demand, keeping the full text in the HTML only if Search Console shows
  long-tail queries landing deep in transcripts.

**Person pages**

- 243 are indexable. Each should open with a two-sentence plain description,
  first and latest appearance, appearance count, and most-quoted line. That is
  the block a search for the name should surface.
- Add `Person` JSON-LD with `sameAs` links to the person's own channels where
  they are public and already shown on the page.
- People are the subject of these pages, so the existing corrections flow
  should be linked from every one of them. It is the right thing to do and it
  is also what makes the pages defensible.

**Lexicon and lore**

- Give each lexicon term its own URL if it does not have one (`/lexicon` is a
  single 1.2 MB page today). One term per page with the definition, first use
  with a timestamped link, and related episodes. Add `DefinedTerm` markup.
- Link terms automatically from episode summaries to their lexicon and lore
  pages. Internal links from 3,400 episode pages are the strongest ranking
  signal this site can give itself.

## Days 46 to 90: distribution

Search brings people who already know the show. Growth beyond that comes from
the channels where the audience is.

**YouTube to site**

- Every new stream's description gets one line and a link: "Full transcript and
  timestamps: cultcodex.me/episodes/<slug>". This is the highest-volume referral
  source available and it also earns the episode page its first link on the day
  it is published. The ingest job knows the slug as soon as the video exists, so
  the line can be generated.
- Pin a comment with the same link on streams that pass a view threshold.
- `/from-youtube` already exists as a landing page. Use it as the destination
  for the channel banner and About links, with a UTM tag, so YouTube-sourced
  visits can be separated in analytics.

**Clips**

- Enrichment produces three to five timestamped quotes per episode. Each is a
  ready-made Short: the quote on screen, the moment from the stream, the episode
  URL in the caption. Two a day uses under a third of what one day of streams
  produces.
- The AI-persona scripts and captions in `docs/marketing/ai-personas` cover the
  persona accounts. Clips cover the show's own account. Keep them separate.

**Email**

- The site has a subscriber list (Resend), the free 30-Day Initiation workbook
  as a lead magnet, and a gift email sequence. What is missing is a recurring
  send. `/this-week` already compiles the week's additions; send it as a weekly
  email. It needs no writing once enrichment is current.
- Put the workbook signup on episode pages after the summary, not only on
  `/initiation`.

**Membership conversion**

- The Oracle is the paid product a searcher is most likely to want: they came
  with a question. On episode and person pages, offer one pre-filled Oracle
  question about that page ("What has <person> said about <topic>?").
- Three free Psychenomicon chapters are indexable. End each with the next
  chapter's opening paragraph and the join prompt, so the preview sells the
  sequel.
- Measure it. Define three events in GA4 if they are not there: workbook
  signup, Oracle question asked, checkout started. Without them none of the
  above can be judged.

**Links**

- Guests have their own channels and sites. When a person page is in good
  shape, tell the guest it exists. Some will link to it.
- `/media-kit` and `/appear` exist and were unlinked until this branch. They
  are the pages a podcaster or journalist needs; link them from the YouTube
  About section.
- The methodology and corrections pages are unusual for a fan archive. They are
  the angle for any outreach to people writing about AI-built archives or
  creator tooling.

## What to watch

| Number | Source | Why |
|---|---|---|
| Episodes without a summary | Enrich workflow notice | Should reach zero and stay there |
| Indexed pages vs submitted | Search Console, per sitemap | Shows whether Google accepts the episode pages |
| Clicks on non-brand queries | Search Console | The three positions above are all non-brand |
| Referrals from youtube.com | GA4 | Tests the description-link habit |
| Workbook signups, Oracle questions, checkouts started | GA4 events | The conversion path |
| Red scheduled runs | GitHub Actions | The pipeline failing silently is how the last seven weeks happened |

## Risks

- **Free-model enrichment quality.** The scheduled run uses a free OpenRouter
  model. Read ten of its summaries before trusting it with the whole backlog;
  the workflow can be dispatched with `provider: anthropic` instead.
- **Content about real people.** Person pages, the Drama Files and Feuds rank
  for people's names. Summaries must stay descriptive and transcript-grounded,
  as the enrichment prompt already requires, and corrections must be handled
  quickly. A defamation complaint is a larger risk to the site than any ranking
  loss.
- **Episode titles.** Several recent stream titles contain slurs or accusations
  against named people, and they become page titles and `<h1>`s here. That
  limits which pages can be promoted, may trip ad and social platform filters,
  and is worth a decision on whether the site should display a cleaned title.
- **One machine, one small pool.** A single `shared-cpu-1x` machine with five
  database connections serves everything. The outage on 2026-11-11 will recur
  under a crawl spike unless slow queries are bounded (a statement timeout,
  tested on staging) or a cache sits in front (audit B13).
