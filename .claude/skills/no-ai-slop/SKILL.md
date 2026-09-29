---
name: no-ai-slop
description: Sweep CultCodex's visitor-facing copy for AI-sounding writing (stock words like "unlock", "curated", "journey", "delve", "seamless"; "not X, it's Y" contrasts; aphorism kickers; em-dash clusters) and rewrite it plainly. Use when the user runs /no-ai-slop, asks to strip AI patterns or "slop" from site copy, or asks to make page text sound less generated. Optional argument: a path or page to limit the sweep (e.g. /no-ai-slop src/app/premium).
---

# No AI slop

Rewrite visitor-facing copy so it reads like a person wrote it for this site. The goal is plain, specific language, not a word swap.

## Scope

**In scope:** text a visitor reads. That means JSX text, headings, button labels, `metadata` titles and descriptions, OG image text, email templates in `src/lib/email*` or `src/emails`, and user-facing strings in `src/components`.

**Out of scope, leave as written:**
- Code comments, identifiers, log messages, admin-only pages (`src/app/admin`), API routes, tests, scripts.
- Quoted or canon material: lyric quotes, show quotes, transcript text, and anything in quotation marks attributed to a person.
- Jokes and deliberate in-world voice. The site has a mythic/occult register ("the vault", "transmission", "initiate", "Oracle", "signal", "codex"). That vocabulary is the brand, not slop. Keep it.
- Doctrine and lore pages (`/lore/psychenomicon`, `/handbook`, doctrine sections, Psychenomicon chapters). Their voice is intentional.
- Database content (AI-generated summaries, lore, profiles). That is the enrichment pipeline's job, not a copy edit.
- Legal pages (`/privacy`, `/terms`, `/refund`), except for obvious filler.

If an argument is given, sweep only that path.

## What to fix

1. **Stock AI words.** Replace with the plain word, or cut the sentence if it says nothing. Common offenders on this site:
   - "unlock" / "unlocks" → "get", "open", "includes", "gives you". On paywalls: "Subscribe to read", "Included with Initiate+".
   - "curated" → drop it or "picked", "selected", "hand-picked" only if a person actually picked it.
   - "journey" → name the actual thing (the path, the archive, the series).
   - "delve", "dive into", "deep dive" → "read", "look at", "explore" only if it's literal.
   - "seamless(ly)", "robust", "leverage", "elevate", "transformative", "pivotal", "crucial", "underscores", "showcase", "tapestry", "testament", "realm" (outside in-world lore), "navigate the …", "embark", "foster", "harness", "vibrant", "immersive", "unparalleled", "cutting-edge", "game-changing".
2. **"Not X, it's Y" contrasts and stacked negations.** Say what it is: "This isn't a fan wiki — it's a living archive" → "A searchable archive of every stream."
3. **Aphorism kickers.** A short profound-sounding closer after the real point ("Because the signal never lies.", "The archive remembers."). Cut, unless it's in-world voice on a lore page.
4. **Rule-of-three padding.** Lists of three vague adjectives or verbs ("explore, discover, and connect"). Keep only what is concrete.
5. **Em-dash clusters.** More than one em dash in a sentence, or dashes used where a period or comma works. Convert to periods, commas or parentheses. A single em dash is fine.
6. **Empty intensifiers and hype.** "truly", "incredibly", "powerful", "ultimate", "everything you need". Cut or replace with a specific fact: a number, a feature, a price.
7. **Vague marketing sentences.** If a sentence could appear on any website, replace it with something specific to CultCodex (episode counts, what search covers, what a tier includes) or delete it.

## How to work

1. Find candidates:
   ```bash
   grep -rnoiE '\b(unlock(s|ing)?|curated|journey|delve|dive into|deep dive|seamless(ly)?|robust|leverage|elevate(s)?|transformative|pivotal|crucial|underscores?|showcases?|tapestry|testament|embark|foster|harness|vibrant|immersive|unparalleled|cutting-edge|game-chang\w*|navigat(e|ing) the)\b' src/app src/components --include=*.tsx --include=*.ts | grep -vE '/api/|/admin/|__tests__'
   grep -rnE '—[^—]{1,80}—' src/app src/components --include=*.tsx | grep -vE '/api/|/admin/|__tests__'
   grep -rniE "(isn.t|is not|not just|more than) (a|an|just)\b[^.]{0,60}(it.s|it is|—)" src/app src/components --include=*.tsx
   ```
2. Read each hit in context. Check it is visitor-facing and not in the out-of-scope list. Skip matches in comments, class names, variable names and slugs.
3. Rewrite the sentence, not just the word. Keep facts, prices, tier names, links and in-world terms exactly as they are. Match the length of the surrounding copy. Don't make a headline longer.
4. Keep the change a copy edit: no layout, component or logic changes. If a string is used as a key, slug, analytics event or test fixture, leave it.
5. Verify:
   ```bash
   npx tsc --noEmit
   npx eslint <changed files>
   npx vitest run
   ```
   Snapshot or text tests may assert old copy. Update the assertion only when the new copy is the intended change.
6. Commit with a message listing what kinds of changes were made and what was deliberately left, in the style of `b2bc718` ("copy: strip AI patterns from site copy, …").

## Report back

Tell the user how many strings changed and in which pages, with 3–5 before/after examples. List anything you deliberately left alone and why (lore voice, quotes, legal text). Do not claim the site is "slop-free". Say what the sweep covered.
