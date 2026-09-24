---
project: cultcodex-v2
task: Trollopedia Phase 2 — Book of Trolls (relationship dossiers on person pages)
effort: E3
phase: complete
progress: 8/8
mode: standard
started: 2026-07-22
updated: 2026-07-22
---

## Problem

The Trollopedia master brief (docs/TROLLOPEDIA_MASTER_BRIEF.md) demands that every claim
carry citation, confidence, timestamp, and provenance, and that relationships be typed,
evolving states with per-episode timelines. The current schema has neither: `RelatedPerson`
is an untyped static edge, and no model carries confidence or provenance. There is also no
substrate for the Psycheverse Timeline.

## Vision

Every future Trollopedia surface — dossiers, feud timelines, lore pages, the Oracle —
hangs its claims off one evidence spine. A relationship between two people reads like a
story: Friend → Debate Rival → Reconciliation, each beat cited to an episode.

## Out of Scope

No UI pages this phase (Phase 2+). No AI ingestion pipeline. No community-contribution
flow. No changes to existing models' columns beyond adding back-relations. No data
backfill of existing RelatedPerson rows.

## Constraints

- Follow the repo's hand-timestamped migration pattern (`prisma/migrations/<ts>_<name>/migration.sql`); Vercel `build:migrate` runs `prisma migrate deploy`.
- Additive only — existing models, routes, and queries must keep working.
- Brief's canon rules baked into the types: claim nature must distinguish documented / opinion / satire / rumor / disputed.
- bun/bunx only.

## Goal

Ship the Phase 1 data layer — `Evidence`, `RelationshipEvent`, `TimelineEvent` models with
supporting enums, a deploy-ready migration, and typed helper functions — with prisma
validate and typecheck clean.

## Criteria

- [x] ISC-1: schema.prisma defines enum `RelationType` with all 14 brief states (probe: Grep)
- [x] ISC-2: schema.prisma defines enums `EvidenceSourceType`, `ConfidenceLevel`, `ClaimNature` (probe: Grep)
- [x] ISC-3: `Evidence` model has claim, nature, confidence, sourceType, sourceUrl, episodeId, timestampSeconds (probe: Read)
- [x] ISC-4: `RelationshipEvent` model links personA/personB with relationType, episodeId, occurredAt, headline, evidenceId (probe: Read)
- [x] ISC-5: `TimelineEvent` model has title, slug, date, category, episodeId, evidenceId (probe: Read)
- [x] ISC-6: `Person` and `Episode` carry back-relations to the new models (probe: Grep)
- [x] ISC-7: Migration SQL dir exists following repo timestamp pattern and creates all 3 tables + 4 enums (probe: Read)
- [x] ISC-8: `bunx prisma validate` passes (probe: Bash)
- [x] ISC-9: `bunx prisma generate` succeeds against the new schema (probe: Bash)
- [x] ISC-10: `src/lib/relationships.ts` exports `currentRelationState()` and `relationshipTimeline()` with typed returns (probe: Read)
- [x] ISC-11: Typecheck passes on the repo (probe: Bash tsc --noEmit)
- [x] ISC-12: Anti: no existing model or migration file modified destructively; git diff on schema shows additions plus back-relations only (probe: Bash git diff)

## Test Strategy

| isc | type | check | threshold | tool |
|---|---|---|---|---|
| 1-6 | static | schema content | exact | Read/Grep |
| 7 | static | migration SQL content | tables+enums present | Read |
| 8-9 | build | prisma validate/generate | exit 0 | Bash |
| 10 | static | helper exports | both functions | Read |
| 11 | build | tsc --noEmit | exit 0 | Bash |
| 12 | anti | git diff review | additive only | Bash |

## Features

| name | satisfies | depends_on | parallelizable |
|---|---|---|---|
| enums | ISC-1,2 | — | no |
| evidence-model | ISC-3 | enums | no |
| relationship-event-model | ISC-4 | enums | no |
| timeline-event-model | ISC-5 | enums | no |
| back-relations | ISC-6 | models | no |
| migration-sql | ISC-7 | models | no |
| lib-helpers | ISC-10 | generate | no |
| verification | ISC-8,9,11,12 | all | no |

## Decisions

- 2026-07-22: Delegation floor (E3 ≥2) waived, show-math: single-file schema authoring where a second model (Forge) would re-derive the same brief→model mapping already fixed in the spec doc; coordination cost exceeds review value at this size. Verification is deterministic (validate/generate/tsc).
- 2026-07-22: ISA written directly (inline) rather than via Skill("ISA") scaffold — task shape was fully determined by the approved plan; scaffold would add a round trip with no new structure.
- 2026-07-22: `RelationshipEvent` is an event log, not a state table — current state is derived (latest event per pair), preserving the brief's "relationships evolve" requirement without a second source of truth.
- 2026-07-22: No pair-ordering constraint enforced in DB; helpers normalize (personAId < personBId) at write time to avoid duplicate mirrored pairs.

## Criteria (Phase 2)

- [x] ISC-13: `src/lib/queries/relationships.ts` exports `getRelationshipDossier(personId)` grouping RelationshipEvents by counterpart with derived current state (probe: Read)
- [x] ISC-14: `RelationshipDossier` component renders per-counterpart card: state badge, chronological beats, turn markers (probe: Read)
- [x] ISC-15: Beats link to their episode and show confidence badge when evidence attached (probe: Read)
- [x] ISC-16: Section carries editorial-synthesis/archival labeling consistent with site voice (probe: Grep)
- [x] ISC-17: Section wired into people/[slug]/page.tsx, renders nothing when a person has no relationship events (probe: Read)
- [x] ISC-18: Query is failure-safe (.catch → empty) matching page conventions (probe: Grep)
- [x] ISC-19: Typecheck passes, no new errors (probe: Bash)
- [x] ISC-20: Anti: no existing component or query modified beyond the page wiring insert (probe: git diff)

## Verification

- ISC-1/2: Grep — RelationType (14 states), EvidenceSourceType, ConfidenceLevel, ClaimNature all present in schema.prisma
- ISC-3/4/5/6: Read — Evidence, RelationshipEvent, TimelineEvent models + Person/Episode back-relations in schema.prisma
- ISC-7: Read — migrations/20260722120000_add_trollopedia_evidence_relationships/migration.sql creates 4 enums, 3 tables, 9 indexes, 7 FKs
- ISC-8: Bash — "The schema at prisma\schema.prisma is valid"
- ISC-9: Bash — "Generated Prisma Client (7.8.0) in 367ms"
- ISC-10: Read — relationships.ts exports normalizePair, currentRelationState, relationshipTimeline, RELATION_LABELS
- ISC-11: Bash tsc --noEmit — only 2 pre-existing stale .next validator errors (deleted obsidian-export route), none from this change
- ISC-12: Bash git diff --stat — schema.prisma +120/-0, purely additive; committed as 082c4a9

## Verification (Phase 2)

- ISC-13: Read — queries/relationships.ts exports getRelationshipDossier, groups by counterpart, sorts longest-history-first
- ISC-14: Read — relationship-dossier.tsx renders counterpart card, StateBadge, ordered beat list with turn dots
- ISC-15: Read — each beat links /episodes/{slug} with EP number and renders CONFIDENCE_LABEL badge when evidence attached
- ISC-16: Grep — "editorial synthesis of {name}'s archive history" line + AiNotice + "/// evolving_states · cited_to_episodes"
- ISC-17: Read — wired at people/[slug]/page.tsx above "Frequently Appears With"; component early-returns null on empty entries
- ISC-18: Grep — findMany(...).catch(() => []) in getRelationshipDossier
- ISC-19: Bash tsc --noEmit filtered of pre-existing obsidian-export errors — exit 0, zero new errors
- ISC-20: Bash git diff --stat — only page.tsx +6 (import + query call + component mount); no existing component/query touched
- Live render: dev server returned GET /people/psyche 200; DB absent in preview sandbox so the section correctly renders nothing. Live data probe DEFERRED-VERIFY until migration is applied to prod and RelationshipEvents are seeded (follow-up: Phase 2b seed/admin).
