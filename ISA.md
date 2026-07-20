---
project: cultcodex-v2
task: Fun layer — easter eggs, drama files, fun hub, articles, free-chapter pipeline
effort: E3
phase: build
progress: 0/12
mode: standard
started: 2026-07-19
updated: 2026-07-19
---

## Problem

CultCodex is a rigorous archive but has little playfulness beyond /meow. There is no free
sample of the Psychenomicon (everything is sealed behind Initiate+), no home for humorous
lore, no drama recaps, and no article surface for show-derived writing.

## Vision

A visitor pokes around and realizes the site is *playing with them* — a glyph that was
always in the footer, a console that whispers, a basement of suppressed files. Free
Psychenomicon chapters convert curiosity into subscriptions. The humor lives inside the
occult voice, never breaking character.

## Out of Scope

No schema migrations. No new datastores. No AI-generation pipeline for drama content in
this pass (display layer only; entries are authored via existing admin/seed paths). No
fabricated drama about real, identifiable people. No changes to Stripe/subscription logic.

## Constraints

- Existing Prisma models only; `LoreEntry.category` + `CanonStatus.humorous` are the substrate.
- Free-chapter selection is config-driven (env `PSYCHENOMICON_FREE_CHAPTERS`, default 1,2,3) — no DB flag.
- Paid chapters must remain sealed for non-subscribers; default-deny.
- Site voice: occult-terminal aesthetic (font-mono microlabels, /// prefixes, accent-violet/gold).
- Secret pages are noindex.

## Goal

Ship five thin features — free-chapter preview pipeline, /drama, /fun, /articles, and a
linked easter-egg chain (console → footer glyph → /basement) — with zero migrations,
typecheck-clean, deployed to cultcodex.me.

## Criteria

- [ ] ISC-1: `src/lib/psychenomicon.ts` exports `isFreePreviewChapter(n)` reading env `PSYCHENOMICON_FREE_CHAPTERS` with default `[1,2,3]` (probe: Read)
- [ ] ISC-2: Non-subscriber requesting a free chapter sees full LayerViewer content plus a free-preview banner (probe: Read of page.tsx gate logic)
- [ ] ISC-3: Non-subscriber requesting a non-free chapter still gets the sealed screen (probe: Read — default-deny branch intact)
- [ ] ISC-4: Chapters index renders for non-subscribers with FREE badges on free chapters and lock marks on sealed ones (probe: Read)
- [ ] ISC-5: `/drama` page lists LoreEntry category="drama" with tabloid-occult styling (probe: Read)
- [ ] ISC-6: `/fun` hub lists canonStatus=humorous lore and links /drama, /articles, /archetype-quiz, /oracle (probe: Read)
- [ ] ISC-7: `/articles` page lists LoreEntry category="article", detail links to existing /lore/[slug] (probe: Read)
- [ ] ISC-8: `/basement` secret page exists, noindex, redacted-files flavor, hints at /meow (probe: Read)
- [ ] ISC-9: Console sigil client component logs styled ψ message hinting at /basement, mounted in layout (probe: Grep layout.tsx)
- [ ] ISC-10: Footer contains near-invisible ψ glyph linking /basement and visible links to Fun/Drama/Articles (probe: Grep site-footer.tsx)
- [ ] ISC-11: Typecheck passes on the repo (probe: Bash tsc --noEmit / next build)
- [ ] ISC-12: Anti: no Prisma schema/migration files modified; no paid chapter readable without subscription (probe: git diff --stat shows no prisma/ changes)

## Test Strategy

ISC-1..10 | static | Read/Grep of written files | exact content | Read/Grep
ISC-11 | build | typecheck exits 0 | exit code | Bash
ISC-12 | anti | git diff excludes prisma/; gate default-deny | diff inspection | Bash

## Features

free-chapter-pipeline | satisfies ISC-1..4 | depends_on none | parallelizable yes
drama-files | satisfies ISC-5 | depends_on none | parallelizable yes
fun-hub | satisfies ISC-6 | depends_on drama-files (links) | parallelizable yes
articles | satisfies ISC-7 | depends_on none | parallelizable yes
easter-egg-chain | satisfies ISC-8..10 | depends_on none | parallelizable yes

## Decisions

- 2026-07-19: John explicitly overrode the "hold features until deck ships" dashboard gate via AskUserQuestion.
- 2026-07-19: Free chapters via env-config constant, not DB flag — zero-migration, reversible, simple-over-clever.
- 2026-07-19: Drama/fun/articles reuse LoreEntry (category + humorous status) — no new models.
- 2026-07-19: show-your-math (delegation floor E3 ≥2 relaxed): single-repo surgical edits; Forge/Anvil hand-off overhead exceeds review value at this size. ISA written inline (E1-exception style) to preserve budget for the build itself.
- 2026-07-19: No fabricated drama about real people — defamation risk; display layer ships empty-state-ready, content authored by John.
