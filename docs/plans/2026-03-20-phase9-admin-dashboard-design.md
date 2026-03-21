# Phase 9: Admin Dashboard — Design

## Overview

A protected `/admin` section for managing CultCodex content. Single admin user (hardcoded by email). Built on the existing NextAuth + Google OAuth + `requireAdmin()` infrastructure.

## Auth & Layout

- Per-route protection using existing `requireAdmin()` — no middleware.ts
- Admin layout with dark sidebar nav (240px, links to each section, user avatar, "Back to Site")
- Same dark palette as public site with distinct sidebar to signal admin context

## Dashboard (`/admin`)

- Stats grid: episode, people, lore, topic, series, quote, comment, and flagged comment counts
- Recent activity: 10 most recently updated episodes
- Quick actions: Toggle Live, Run Enrichment, Import Episodes
- Enrichment status: count of enriched JSON files vs total episodes

## Episode Management (`/admin/episodes`)

- Paginated table: EP#, Title, Status, Air Date, Guests, Topics, Actions
- Sortable by EP# and air date, filterable by status, searchable by title
- Edit page (`/admin/episodes/[id]/edit`): title, slug, episode number, air date, status, summaries, YouTube URL, thumbnail URL, content type
- Bulk status change via checkbox + dropdown
- No create (pipeline handles that) or delete (against repo rules)

## People Management (`/admin/people`)

- Paginated table: Name, Type, Appearances, Quotes, Actions
- Edit page: display name, slug, short bio, lore summary, person type, avatar URL, alt names
- Merge people: reassign all relations from source to target, soft-delete source

## Lore Management (`/admin/lore`)

- Paginated table: Title, Canon Status, Category, Episodes, Actions
- Edit page: title, slug, summary, full entry, category, canon status

## Topics & Series

- Same CRUD pattern, simpler forms, fewer fields
- `/admin/topics` and `/admin/series` with table + edit pages

## Comment Moderation (`/admin/comments`)

- Flagged comments first (by report count), then recent
- Per-comment: Approve (clear flag) or Delete
- Bulk moderation with checkboxes
- Uses existing `/api/admin/comments/[id]` API — no new routes

## Live Stream Controls (`/admin/live`)

- Status card showing live/offline, video ID, title, timestamps
- Toggle button calling existing `/api/live/toggle` endpoint
- Video ID + title inputs when going live
- Server action wraps the API call (keeps secret server-side)

## Components

- `AdminSidebar` — nav + user info
- `AdminTable` — generic sortable/selectable data table
- `AdminFormField` — form field wrapper (label, input, error)
- `AdminStatCard` — count card for dashboard

## Server Actions

Single file `src/app/admin/actions.ts`:
- `updateEpisode`, `bulkUpdateEpisodeStatus`
- `updatePerson`, `mergePeople`
- `updateLoreEntry`, `updateTopic`, `updateSeries`
- `moderateComment`, `bulkModerateComments`
- `toggleLiveStream`

## Routes

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard |
| `/admin/episodes` | Episode table |
| `/admin/episodes/[id]/edit` | Edit episode |
| `/admin/people` | People table |
| `/admin/people/[id]/edit` | Edit person + merge |
| `/admin/lore` | Lore table |
| `/admin/lore/[id]/edit` | Edit lore |
| `/admin/topics` | Topics table + inline edit |
| `/admin/series` | Series table + inline edit |
| `/admin/comments` | Moderation queue |
| `/admin/live` | Live stream controls |
