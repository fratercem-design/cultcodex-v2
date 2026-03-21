# Phase 12: Social & Sharing — Design

## Overview

Add share buttons, favorites system, and user profile pages to make CultCodex stickier and more shareable.

## Section 1: Share Buttons Component

Reusable `ShareButtons` client component at `src/components/ui/share-buttons.tsx`.

**Actions:**
- **Twitter/X** — Opens `twitter.com/intent/tweet?text={text}&url={url}` in new window
- **Copy Link** — Copies page URL to clipboard, shows "Copied ✓" for 2 seconds
- **Embed Code** — Copies `<iframe>` embed snippet (quotes only)

**Props:**
```typescript
interface ShareButtonsProps {
  url: string;
  title: string;
  type: "episode" | "quote" | "person";
  quoteText?: string;
}
```

**Placement:**
- Episode detail: below PageHero, next to ReactionBar
- Quote cards: small share icon on hover (Twitter + Copy Link)
- Person detail: below PageHero

Styling: row of small icon buttons, font-mono text-[10px], muted default, accent-green on hover.

## Section 2: Favorites System

### Prisma Model

```prisma
model Favorite {
  id        String   @id @default(cuid())
  userId    String
  user      CodexUser @relation(fields: [userId], references: [id])
  episodeId String
  episode   Episode  @relation(fields: [episodeId], references: [id])
  createdAt DateTime @default(now())

  @@unique([userId, episodeId])
  @@index([userId])
}
```

### API

`POST /api/episodes/[slug]/favorite` — toggles on/off, returns `{ favorited: boolean, count: number }`.

### Components

- `FavoriteButton` client component — heart icon, filled when favorited, shows count. On episode detail pages next to ShareButtons, and on EpisodeCard/EpisodeListItem on hover.

### /favorites Page

Protected route. Grid of favorited episodes using EpisodeCard, sorted by date favorited. Empty state for no favorites. Link in user menu dropdown.

## Section 3: User Profile Pages

### Route: `/user/[id]`

Public profile pages showing user activity.

**Profile header:** Avatar, display name, "Member since {date}", stats row (comments, reactions, favorites).

**Tabs (URL param driven):**

| Tab | Content |
|-----|---------|
| Activity (default) | Combined feed of recent comments and reactions, last 50 items |
| Comments | All comments grouped by episode with links |
| Favorites | Grid of favorited episodes (public) |

**Activity feed items:**
- Comment: "Commented on EP.042 — Title" + truncated text + timestamp
- Reaction: "Reacted 🔥 to EP.015 — Title" + timestamp

### Queries: `src/lib/queries/user-profile.ts`

- `getUserProfile(userId)` — user info + counts
- `getUserActivity(userId, take, skip)` — combined comment + reaction feed
- `getUserComments(userId, take, skip)` — paginated comments
- `getUserFavorites(userId)` — favorited episodes

### Profile Links

User avatars/names in comments and live chat link to `/user/[id]`.

## Section 4: Route & Component Summary

### New Prisma Model
- `Favorite` — userId + episodeId unique pair

### New Routes

| Route | Purpose |
|-------|---------|
| `POST /api/episodes/[slug]/favorite` | Toggle favorite |
| `/user/[id]` | Public user profile |
| `/favorites` | Current user's favorites (protected) |

### New Components

| Component | Type | Purpose |
|-----------|------|---------|
| `ShareButtons` | Client | Twitter/X, copy link, embed code |
| `FavoriteButton` | Client | Heart toggle with count |
| `UserProfileTabs` | Client | Activity/Comments/Favorites tabs |
| `ActivityFeedItem` | Server | Single activity item |

### Modified Components

| Component | Change |
|-----------|--------|
| Episode detail page | Add ShareButtons + FavoriteButton |
| QuoteHighlightCard | Add small share icon on hover |
| Person detail page | Add ShareButtons |
| EpisodeCard | Add FavoriteButton on hover |
| Comment section | Link user names to /user/[id] |
| LiveChat | Link display names to /user/[id] |
| User menu | Add Favorites + Profile links |
