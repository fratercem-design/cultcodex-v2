# Phase 11: Real-Time & Engagement — Design

## Overview

Add real-time updates to comments/reactions via Server-Sent Events, live chat during streams, notification preferences, and new-episode email digests.

## Section 1: SSE for Live Comment & Reaction Updates

### Event Bus

In-memory pub/sub at `src/lib/sse/event-bus.ts`:

```typescript
type Listener = (data: unknown) => void;
class EventBus {
  private channels: Map<string, Set<Listener>>;
  subscribe(channel: string, listener: Listener): () => void;
  publish(channel: string, data: unknown): void;
}
export const eventBus = new EventBus();
```

### SSE Endpoint

`GET /api/sse/episodes/[slug]` — streams events for a specific episode:
- `new-comment` — full comment object (id, displayName, avatarUrl, content, createdAt)
- `new-reaction` — { reactionType, newCount }
- Uses `ReadableStream` with `TextEncoderStream`
- 30-second heartbeat pings
- Cleans up listener on `signal.addEventListener("abort")`

### Integration Points

- `addComment` server action → `eventBus.publish("episode:{slug}", { type: "new-comment", ... })`
- `toggleReaction` server action → `eventBus.publish("episode:{slug}", { type: "new-reaction", ... })`
- `CommentSection` client component → `useEffect` subscribes to `/api/sse/episodes/{slug}`, appends new comments
- `ReactionBar` client component → `useEffect` subscribes to same endpoint, updates counts

### Limitations

In-memory event bus works on a single Vercel serverless instance. For multi-instance scaling, would need Redis pub/sub. Acceptable for current traffic levels.

## Section 2: Live Chat During Streams

### Prisma Model

```prisma
model ChatMessage {
  id          String   @id @default(cuid())
  userId      String
  user        CodexUser @relation(fields: [userId], references: [id])
  displayName String
  avatarUrl   String?
  content     String
  createdAt   DateTime @default(now())
}
```

### API Routes

- `POST /api/live/chat` — authenticated, rate limited (1 per 3 sec), max 500 chars
- `GET /api/sse/live/chat` — SSE stream pushing `new-chat-message` events

### Components

- `LiveChat` client component: scrollable message list, input box, auto-scroll to latest
- Only renders when `isLive === true` on the live page
- Messages cleared when stream goes offline (via `toggleLiveStream` action)

## Section 3: Notification Preferences Page

### Prisma Model

```prisma
model NotificationPreference {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            CodexUser @relation(fields: [userId], references: [id])
  emailNewEpisode Boolean   @default(false)
  emailGoLive     Boolean   @default(false)
  pushGoLive      Boolean   @default(false)
  updatedAt       DateTime  @updatedAt
}
```

### Route

`/settings/notifications` — protected page (requires sign-in):
- Toggle switches for each preference
- Current push subscription status
- Server action `updateNotificationPreferences` saves changes

## Section 4: New Episode Email Digest

### Trigger

When `updateEpisode` server action changes status to `published`:
- Calls `notifyNewEpisode(episode)` in `src/lib/notifications.ts`
- Queries users with `emailNewEpisode: true`
- Sends branded email via Resend (same template style as live notifications)
- Includes episode title, summary, thumbnail, and link

## Section 5: Route & Component Summary

### New Prisma Models
- `ChatMessage` — live chat messages
- `NotificationPreference` — per-user notification settings

### New Routes

| Route | Purpose |
|-------|---------|
| `GET /api/sse/episodes/[slug]` | SSE for episode comments/reactions |
| `GET /api/sse/live/chat` | SSE for live chat |
| `POST /api/live/chat` | Post live chat message |
| `/settings/notifications` | Notification preferences page |

### New Components

| Component | Type | Purpose |
|-----------|------|---------|
| `LiveChat` | Client | Chat panel for live page |
| `NotificationSettings` | Client | Toggle switches for preferences |

### Modified Components

| Component | Change |
|-----------|--------|
| `CommentSection` | Subscribe to SSE for live updates |
| `ReactionBar` | Subscribe to SSE for live counts |

### New Modules

| Module | Purpose |
|--------|---------|
| `src/lib/sse/event-bus.ts` | In-memory pub/sub |
| `src/lib/sse/use-sse.ts` | React hook for SSE subscription |
