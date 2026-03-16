# Live Page + Notifications Design

**Date:** 2026-03-15
**Status:** Approved

## Overview

Add a `/live` page to CultCodex with embedded YouTube video + chat, a site-wide live banner, and lead capture with email + browser push notifications when going live.

## Architecture

### Database

Two new Prisma models:

- `LiveStatus` — singleton row tracking current live state, video ID, title, timestamps
- `Subscriber` — email and/or push subscription for notifications

### API Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/live/status` | GET | Public | Returns `{ isLive, videoId, title }`, polled every 30s |
| `/api/live/toggle` | POST | Secret key | Flips live on/off, sends notifications |
| `/api/subscribe` | POST | Public | Saves email and/or push subscription |
| `/api/subscribe/vapid` | GET | Public | Returns VAPID public key for push registration |

### Live Detection

Manual toggle via `/api/live/toggle?key=SECRET`. No YouTube API polling needed — zero quota cost, instant control.

### Notification Flow

On toggle to live:
1. Update `LiveStatus` row (isLive=true, videoId, title, startedAt)
2. Query all subscribers
3. Send email via Resend to each email subscriber
4. Send Web Push to each push subscriber
5. Return count of notified subscribers

On toggle to offline:
1. Update `LiveStatus` row (isLive=false, endedAt)

### Frontend

**`/live` page:**
- Live state: YouTube video embed (16:9) + YouTube chat iframe, side-by-side desktop / stacked mobile
- Offline state: "Next stream coming soon" hero, replay embed if videoId exists, subscribe form

**`<LiveBanner />`:**
- Sticky bar above site header on all pages
- Pulsing red/gold "LIVE NOW — Watch the stream →"
- Only renders when isLive=true
- Added to root layout.tsx

**`<SubscribeForm />`:**
- Email input + "Notify Me" button
- "Enable Push Notifications" button for browser push opt-in
- Client component with toast feedback

**`/public/sw.js`:**
- Service worker for push event handling
- Displays native notification with logo + stream title
- Click-through to /live

### Dependencies

- `resend` — email delivery (free: 100/day, 3,000/month)
- `web-push` — server-side push notifications (VAPID-based, free)

### Environment Variables

- `RESEND_API_KEY` — from resend.com
- `LIVE_TOGGLE_SECRET` — random secret string
- `VAPID_PUBLIC_KEY` — generated via web-push
- `VAPID_PRIVATE_KEY` — generated via web-push

### YouTube Channel

- Channel: `youtube.com/@cultofpsyche`
- Embed URL pattern: `https://www.youtube.com/embed/{videoId}`
- Chat embed: `https://www.youtube.com/live_chat?v={videoId}&embed_domain=cultcodex.me`
