# ⛧ The Cult Master's Handbook
### Operating cultcodex.me — everything the archive needs from its keeper

> For John (Psyche). One document to run the machine: ship, feed, clean, monetize, watch.
> Last verified against the live system: 2026-07-19 (build `85c2ca1` era).

---

## 1. The Machine at a Glance

| Layer | What it is |
|---|---|
| App | Next.js in `~\cultcodex-v2`, deployed on Vercel (project `psychetarotchannels-projects/cultcodex-v2`) |
| Domain | cultcodex.me |
| DB | PostgreSQL (Xata) via Prisma |
| AI pipeline | YouTube captions → Whisper (fallback) → Claude enrichment (summaries, guests, topics, quotes, lore) |
| Payments | Stripe — Initiate+ $10/mo, Oracle tier $25/mo (annual variants via `STRIPE_PRICE_*` envs) |
| Oracle | `/api/oracle/ask` — Claude on Bedrock, Groq fallback, cached, budget-capped |
| Auth | Google OAuth |
| Analytics | Google Analytics (consent-gated), GSC + Bing verified |

**The one rule:** nothing un-enriched or junk-looking ever surfaces on a money page (home, /reports, /premium). Data rot is the #1 trust killer — the 2026-07 audit scored the site 64/100 and this was most of the gap.

---

## 2. Shipping Changes (the deploy ritual)

Since 2026-07-08, **`git push origin master` auto-deploys production.** CLI deploys are deprecated.

```bash
cd ~/cultcodex-v2
git status --short          # MUST be clean or intentionally staged — NEVER git stash (history of corruption)
bun x tsc --noEmit          # typecheck
bun run build               # catch build errors locally, not on Vercel
git add <files> && git commit -m "..."
git push origin master
```

**Verify the deploy actually landed** (don't trust the push):

```bash
# The homepage carries a build fingerprint:
curl -s https://cultcodex.me | rg -o 'build-commit" content="[a-f0-9]{7}'
# Deployment status:
vercel ls cultcodex-v2 --yes | head -5
```

Normal build time ≈ 2 minutes. If a deployment sits in "Initializing" >10 min, check the Vercel dashboard for a queued/stuck build; cancel + redeploy from there.

If you have uncommitted work you didn't write (another session's), **commit it as its own commit first** — never mix it into yours, never stash it.

---

## 3. Feeding the Archive (ingest & enrichment)

- **Auto-ingest:** `src/app/api/cron/ingest-latest` pulls new uploads on a cron.
- **Full channel sync:** `src/app/api/admin/sync-channel-full` (admin).
- **Scrape → ingest:** `scripts/scrape/youtube-to-ingest.ts` — all ingest paths route through the **content-hygiene seam** (`src/lib/content-hygiene.ts`), so promo boilerplate is stripped before it ever reaches the DB.
- Episodes display **provenance badges** (transcript-backed vs inferred) and a Data grade — this honesty is a feature; keep it.

**When a fresh episode looks broken on the site** ("No Transcript", CashApp text, "NO SUMMARY"): it's an un-enriched row. Either wait for enrichment, or run the cleanup ops below. Longer term the fix is the audit's "enrichment gate": don't feature episodes until `display_ready`.

---

## 4. Cleaning Data Rot (the hygiene ritual)

All maintenance ops live behind one endpoint:

```
POST https://cultcodex.me/api/admin/data-ops
Auth: header  X-Maint-Key: $PEOPLE_MAINT_KEY   (in .env.local)
       or     X-Enrich-Secret (Vercel-side env)
```

**Scrub boilerplate summaries** (StreamYard, vidIQ, CashApp templates, taglines):

```bash
cd ~/cultcodex-v2
KEY=$(rg -o 'PEOPLE_MAINT_KEY=.*' .env.local | sed 's/.*=//')
# ALWAYS dry-run first and READ THE SAMPLES:
curl -s -X POST https://cultcodex.me/api/admin/data-ops \
  -H "Content-Type: application/json" -H "X-Maint-Key: $KEY" \
  -d '{"op":"clean-episode-summaries","dryRun":true}'
# only after the samples look right:
#   -d '{"op":"clean-episode-summaries","dryRun":false}'
```

**Pattern discipline (learned the hard way, twice):**
- Patterns must be **template/phrase-anchored, never keyword- or line-anchored**. A line-anchored CashApp pattern nulled 11 legitimate summaries in the 2026-07-19 dry run; a keyword-anchored StreamYard pattern had 68/73 false positives on 2026-07-09.
- The op runs with **deployed** code — push pattern changes and confirm the build fingerprint before re-running.
- New junk patterns go in `BOILERPLATE_PATTERNS` in `src/lib/content-hygiene.ts`; test locally with a small bun script (pure junk → nulled, glued prose → prose survives, legit mentions → untouched).

**Junk entities** ("None", "Unknown", extraction artifacts): `JUNK_PERSON_NAMES` / `isJunkPersonName()` in content-hygiene; `/reports` filters them. Extend the list there, and use the same filter on any new public inventory surface (People, graph).

**People dedup:** the risky people-merge decision list from the 2026-07 cleanup is pending your call (Psyche/"Psyche (Trix)", Beeta/Beta, Elisa/Alisa Jordana, Jamie/Jamie Halo…). data-ops has people ops; always dry-run.

---

## 5. The Oracle (your AI employee)

- Route: `src/app/api/oracle/ask/route.ts`.
- **Free taste:** 3 questions/month, no account (trial-tracked). This is the top conversion asset — never fully gate it.
- **Initiate+ meter:** ~100 questions/month (`INITIATE_MONTHLY_CAP` env, default 100). Oracle tier + admins unmetered.
- **Cost protection, layered:** per-IP rate limit (15/window) → per-user monthly meter → global daily LLM budget (`consumeLlmBudget`) → Groq free-model fallback when throttled. Meter fails OPEN (never lock out a paying user over a counter error); the daily breaker fails CLOSED.
- Spend caps outside the app: AWS Budget $50/mo + alerts, OpenAI $10 cap, Cloudflare rate rule on `/api/`.

---

## 6. Money

- Tiers defined in `src/lib/subscription-tiers.ts`; checkout button defaults to **annual** ("N months free" framing).
- Stripe handles all card data; the app stores only customer ID + status.
- Grant a person admin/lifetime: data-ops `grant-admin` op (mirrors `/admin/grant-access`).
- Founder's Editions of the Living Oracle Deck: hand-minted via `/claim/card` links (№1 is yours).

---

## 7. Watching the Machine

| Check | How |
|---|---|
| All sites up | `bun ~/.claude/PAI/USER/PROJECTS/CheckSites.ts` |
| Deployed version | build-commit meta (see §2) |
| Deploy queue | `vercel ls cultcodex-v2 --yes` |
| Console errors | Interceptor skill → open page, read console |
| Search health | `https://cultcodex.me/search?q=manipulation` should return ~850 results |
| SEO | GSC (verified 07-10) + Bing (07-13); sitemap submitted |

**Weekly ritual (15 min):** CheckSites → open homepage as a stranger (does anything look junk?) → dry-run `clean-episode-summaries` (0 changes = healthy) → glance at Stripe + AWS budget emails → skim `/corrections` queue.

---

## 8. Known Traps (do not rediscover these)

1. **Never `git stash`** in this repo — weeks of corruption history. Commit instead.
2. **Line-anchored hygiene patterns kill legit summaries** — phrase-anchor, dry-run, read samples.
3. **Push ≠ deployed** — always confirm the fingerprint; builds can stick in "Initializing".
4. **AI prose legitimately mentions sponsor words** — never match on keywords alone.
5. **`bedrockModelId` fail-fast seam** (fixed `7bf19ae`): enrichment fallback model must stay non-Bedrock-routed.
6. **Supabase pauses idle free projects** — not used here (Xata), but Grimoire's cron trick is the pattern if ever needed.
7. **Episode numbers ≠ chronology** — EP numbers and air dates disagree in places; sort by date, not number.

---

## 9. The Compass (from the 2026-07-19 audit, 64/100)

Priority order for raising the score — full report in the audit session / `PAI/MEMORY/WORK/cultcodex-master-audit/`:

1. ~~CashApp boilerplate stripped~~ ✅ shipped 07-19
2. ~~None/Unknown off /reports~~ ✅ shipped 07-19
3. Suppress un-enriched episodes from homepage featured surfaces
4. Auto-skip the splash gate for first-time visitors
5. Sidebar: 6 primary destinations + collapsible Vault
6. Free Oracle answer streamed live on /oracle (the Beetle sample, but real)
7. Topic consolidation (11,683 → ~200 canonical signals)
8. People dedup pass
9. One free sample Guest Intelligence Report as the demo
10. Saga pages for drama arcs — the pages Reddit links to

**North star:** the Oracle becomes the front door; the archive is its evidence base. What is remembered, lives.
