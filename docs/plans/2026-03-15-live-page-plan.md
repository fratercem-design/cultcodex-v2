# Live Page + Notifications Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/live` page with YouTube embed + chat, site-wide live banner, and email + push notification lead capture.

**Architecture:** Manual toggle API sets live status in Postgres. Frontend polls `/api/live/status` every 30s to render banner + live page state. Subscribers receive email (Resend) and browser push (web-push) when toggled live.

**Tech Stack:** Next.js 16, Prisma 7 (PostgreSQL), Resend, web-push, Service Worker

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install resend and web-push**

Run:
```bash
cd "C:\Users\John Bates\Projects\cultcodex-v2"
npm install resend web-push
npm install -D @types/web-push
```

**Step 2: Generate VAPID keys**

Run:
```bash
npx web-push generate-vapid-keys
```

Save the output — you'll need VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY for `.env`.

**Step 3: Add env vars to `.env`**

Add to `.env`:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
LIVE_TOGGLE_SECRET=pick-a-random-string
VAPID_PUBLIC_KEY=<from step 2>
VAPID_PRIVATE_KEY=<from step 2>
VAPID_SUBJECT=mailto:psychetarotchannel@gmail.com
```

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add resend and web-push dependencies for live notifications"
```

---

### Task 2: Database Schema — LiveStatus + Subscriber Models

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add models to schema**

Append to `prisma/schema.prisma`:

```prisma
// ─── Live Stream ────────────────────────────────────

model LiveStatus {
  id        String    @id @default("singleton")
  isLive    Boolean   @default(false)
  videoId   String?
  title     String?
  startedAt DateTime?
  endedAt   DateTime?
  updatedAt DateTime  @updatedAt
}

model Subscriber {
  id               String   @id @default(cuid())
  email            String?  @unique
  pushSubscription Json?
  verified         Boolean  @default(false)
  createdAt        DateTime @default(now())

  @@index([email])
}
```

**Step 2: Generate migration and Prisma client**

Run:
```bash
cd "C:\Users\John Bates\Projects\cultcodex-v2"
npx prisma migrate dev --name add-live-status-and-subscriber
```

Expected: Migration created, client regenerated.

**Step 3: Seed the singleton LiveStatus row**

Create a quick seed addition. Run in the project directory:

```bash
npx tsx -e "
const { PrismaClient } = require('./src/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
prisma.liveStatus.upsert({
  where: { id: 'singleton' },
  create: { id: 'singleton', isLive: false },
  update: {},
}).then(() => { console.log('LiveStatus singleton created'); process.exit(0); });
"
```

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add LiveStatus and Subscriber models for live stream feature"
```

---

### Task 3: API — GET /api/live/status

**Files:**
- Create: `src/app/api/live/status/route.ts`

**Step 1: Create the route**

```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await prisma.liveStatus.findUnique({
      where: { id: "singleton" },
      select: { isLive: true, videoId: true, title: true, startedAt: true },
    });

    return NextResponse.json(status ?? { isLive: false, videoId: null, title: null, startedAt: null });
  } catch {
    return NextResponse.json({ isLive: false, videoId: null, title: null, startedAt: null });
  }
}
```

**Step 2: Test manually**

Run dev server, visit `http://localhost:3000/api/live/status`.
Expected: `{"isLive":false,"videoId":null,"title":null,"startedAt":null}`

**Step 3: Commit**

```bash
git add src/app/api/live/status/route.ts
git commit -m "feat: add GET /api/live/status endpoint"
```

---

### Task 4: API — POST /api/live/toggle

**Files:**
- Create: `src/app/api/live/toggle/route.ts`
- Create: `src/lib/notifications.ts`

**Step 1: Create the notifications helper**

Create `src/lib/notifications.ts`:

```typescript
import { Resend } from "resend";
import webPush from "web-push";
import { prisma } from "@/lib/db";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:psychetarotchannel@gmail.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function notifySubscribers(title: string, videoId: string) {
  const subscribers = await prisma.subscriber.findMany();
  let emailCount = 0;
  let pushCount = 0;

  // Send emails
  const emailSubs = subscribers.filter((s) => s.email);
  if (resend && emailSubs.length > 0) {
    const emails = emailSubs.map((s) => s.email!);
    try {
      await resend.emails.send({
        from: "CultCodex <notifications@cultcodex.me>",
        to: emails,
        subject: `🔴 LIVE NOW: ${title}`,
        html: buildEmailHtml(title, videoId),
      });
      emailCount = emails.length;
    } catch (err) {
      console.error("Email send failed:", err);
    }
  }

  // Send push notifications
  const pushSubs = subscribers.filter((s) => s.pushSubscription);
  const payload = JSON.stringify({
    title: "Cult of Psyche is LIVE!",
    body: title,
    icon: "/logo.jpg",
    badge: "/favicon.jpg",
    url: "/live",
  });

  for (const sub of pushSubs) {
    try {
      await webPush.sendNotification(
        sub.pushSubscription as webPush.PushSubscription,
        payload
      );
      pushCount++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 410 || statusCode === 404) {
        // Subscription expired — remove it
        await prisma.subscriber.delete({ where: { id: sub.id } });
      }
      console.error("Push send failed:", err);
    }
  }

  return { emailCount, pushCount };
}

function buildEmailHtml(title: string, videoId: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;color:#e8e8e8;font-family:monospace;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:30px;">
      <img src="https://cultcodex.me/logo.jpg" alt="Cult of Psyche" width="80" height="80" style="border-radius:50%;border:2px solid #ffd700;" />
    </div>
    <div style="text-align:center;padding:20px;background:#1a0033;border:1px solid #ffd700;border-radius:8px;">
      <div style="font-size:12px;color:#ff4444;letter-spacing:3px;margin-bottom:8px;">● LIVE NOW</div>
      <h1 style="color:#ffd700;font-size:22px;margin:0 0 12px;">${title}</h1>
      <p style="color:#00d9ff;font-size:13px;margin:0 0 24px;">The stream is live on Cult of Psyche</p>
      <a href="https://cultcodex.me/live" style="display:inline-block;padding:12px 32px;background:#ffd700;color:#0a0a0a;text-decoration:none;font-weight:bold;font-size:14px;border-radius:4px;">
        Watch Now →
      </a>
    </div>
    <div style="text-align:center;margin-top:30px;">
      <a href="https://www.youtube.com/watch?v=${videoId}" style="color:#6b6b6b;font-size:11px;text-decoration:underline;">
        Watch on YouTube
      </a>
    </div>
    <div style="text-align:center;margin-top:20px;padding-top:20px;border-top:1px solid #2a2a2a;">
      <p style="color:#6b6b6b;font-size:10px;margin:0;">
        You're receiving this because you subscribed at cultcodex.me
      </p>
    </div>
  </div>
</body>
</html>`;
}
```

**Step 2: Create the toggle route**

Create `src/app/api/live/toggle/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifySubscribers } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (key !== process.env.LIVE_TOGGLE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const current = await prisma.liveStatus.findUnique({
    where: { id: "singleton" },
  });

  const goingLive = !current?.isLive;
  let body: { videoId?: string; title?: string } = {};

  try {
    body = await req.json();
  } catch {
    // No body is fine for toggling off
  }

  const updated = await prisma.liveStatus.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      isLive: goingLive,
      videoId: body.videoId ?? null,
      title: body.title ?? "Cult of Psyche Live Stream",
      startedAt: goingLive ? new Date() : null,
      endedAt: goingLive ? null : new Date(),
    },
    update: {
      isLive: goingLive,
      videoId: goingLive ? (body.videoId ?? current?.videoId) : current?.videoId,
      title: goingLive ? (body.title ?? "Cult of Psyche Live Stream") : current?.title,
      startedAt: goingLive ? new Date() : current?.startedAt,
      endedAt: goingLive ? null : new Date(),
    },
  });

  let notified = { emailCount: 0, pushCount: 0 };
  if (goingLive && updated.videoId) {
    notified = await notifySubscribers(
      updated.title ?? "Cult of Psyche Live Stream",
      updated.videoId
    );
  }

  return NextResponse.json({
    isLive: updated.isLive,
    videoId: updated.videoId,
    title: updated.title,
    notified: goingLive ? notified : undefined,
  });
}
```

**Step 3: Test manually**

```bash
curl -X POST "http://localhost:3000/api/live/toggle" \
  -H "x-live-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"videoId":"dQw4w9WgXcQ","title":"Test Stream"}'
```

Expected: `{"isLive":true,"videoId":"dQw4w9WgXcQ","title":"Test Stream","notified":{"emailCount":0,"pushCount":0}}`

**Step 4: Commit**

```bash
git add src/lib/notifications.ts src/app/api/live/toggle/route.ts
git commit -m "feat: add POST /api/live/toggle with email and push notifications"
```

---

### Task 5: API — POST /api/subscribe + GET /api/subscribe/vapid

**Files:**
- Create: `src/app/api/subscribe/route.ts`
- Create: `src/app/api/subscribe/vapid/route.ts`

**Step 1: Create subscribe route**

Create `src/app/api/subscribe/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/db";

const subscribeSchema = z.object({
  email: z.email().optional(),
  pushSubscription: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = subscribeSchema.parse(body);

    if (!data.email && !data.pushSubscription) {
      return NextResponse.json(
        { error: "Email or push subscription required" },
        { status: 400 }
      );
    }

    if (data.email) {
      // Upsert by email — add push subscription if provided
      await prisma.subscriber.upsert({
        where: { email: data.email },
        create: {
          email: data.email,
          pushSubscription: data.pushSubscription ?? undefined,
          verified: true,
        },
        update: {
          pushSubscription: data.pushSubscription
            ? data.pushSubscription
            : undefined,
        },
      });
    } else if (data.pushSubscription) {
      // Push-only subscriber
      await prisma.subscriber.create({
        data: {
          pushSubscription: data.pushSubscription,
          verified: true,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
```

**Step 2: Create VAPID public key route**

Create `src/app/api/subscribe/vapid/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    publicKey: process.env.VAPID_PUBLIC_KEY ?? null,
  });
}
```

**Step 3: Commit**

```bash
git add src/app/api/subscribe/route.ts src/app/api/subscribe/vapid/route.ts
git commit -m "feat: add subscribe and VAPID endpoints for lead capture"
```

---

### Task 6: Service Worker for Push Notifications

**Files:**
- Create: `public/sw.js`

**Step 1: Create service worker**

Create `public/sw.js`:

```javascript
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "The stream is live!",
    icon: data.icon || "/logo.jpg",
    badge: data.badge || "/favicon.jpg",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/live" },
    actions: [{ action: "watch", title: "Watch Now" }],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "Cult of Psyche is LIVE!",
      options
    )
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/live";
  event.waitUntil(clients.openWindow(url));
});
```

**Step 2: Commit**

```bash
git add public/sw.js
git commit -m "feat: add service worker for push notifications"
```

---

### Task 7: LiveBanner Component (site-wide)

**Files:**
- Create: `src/components/layout/live-banner.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create the LiveBanner client component**

Create `src/components/layout/live-banner.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface LiveStatusData {
  isLive: boolean;
  videoId: string | null;
  title: string | null;
}

export function LiveBanner() {
  const [status, setStatus] = useState<LiveStatusData | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/live/status", { cache: "no-store" });
        const data = await res.json();
        setStatus(data);
      } catch {
        // Silently fail — banner just won't show
      }
    }

    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!status?.isLive) return null;

  return (
    <Link
      href="/live"
      className="relative z-[60] flex items-center justify-center gap-2 bg-gradient-to-r from-[#1a0033] via-[#2d0050] to-[#1a0033] border-b border-[#ffd700]/30 px-4 py-2 transition-colors hover:from-[#2d0050] hover:via-[#3d0070] hover:to-[#2d0050]"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
      <span className="font-mono text-xs font-bold tracking-wider text-[#ffd700]">
        LIVE NOW
      </span>
      <span className="hidden sm:inline font-mono text-xs text-[#00d9ff]">
        — {status.title ?? "Watch the stream"} →
      </span>
      <span className="sm:hidden font-mono text-xs text-[#00d9ff]">→</span>
    </Link>
  );
}
```

**Step 2: Add LiveBanner to root layout**

Modify `src/app/layout.tsx`. Add import and place `<LiveBanner />` above `<SiteHeader />`:

Change:
```tsx
import { SiteHeader } from "@/components/layout/site-header";
```
To:
```tsx
import { SiteHeader } from "@/components/layout/site-header";
import { LiveBanner } from "@/components/layout/live-banner";
```

Change:
```tsx
        <SiteHeader />
```
To:
```tsx
        <LiveBanner />
        <SiteHeader />
```

**Step 3: Commit**

```bash
git add src/components/layout/live-banner.tsx src/app/layout.tsx
git commit -m "feat: add site-wide live banner with polling"
```

---

### Task 8: SubscribeForm Component

**Files:**
- Create: `src/components/live/subscribe-form.tsx`

**Step 1: Create the client component**

Create `src/components/live/subscribe-form.tsx`:

```tsx
"use client";

import { useState } from "react";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [pushStatus, setPushStatus] = useState<"idle" | "loading" | "granted" | "denied" | "unsupported">("idle");
  const [message, setMessage] = useState("");

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("You'll be notified when we go live!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage("Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  async function handleEnablePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("unsupported");
      return;
    }

    setPushStatus("loading");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      // Get VAPID key
      const vapidRes = await fetch("/api/subscribe/vapid");
      const { publicKey } = await vapidRes.json();

      if (!publicKey) {
        setPushStatus("denied");
        return;
      }

      // Convert VAPID key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Send subscription to server
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          pushSubscription: subscription.toJSON(),
        }),
      });

      setPushStatus("granted");
    } catch (err) {
      console.error("Push subscription failed:", err);
      setPushStatus("denied");
    }
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <h3 className="mb-1 font-mono text-sm font-bold text-[#ffd700]">
        GET NOTIFIED WHEN WE GO LIVE
      </h3>
      <p className="mb-4 font-mono text-xs text-text-muted">
        Never miss a stream — get an email or push notification.
      </p>

      <form onSubmit={handleEmailSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 rounded border border-border bg-void px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted/50 focus:border-[#ffd700]/50 focus:outline-none focus:ring-1 focus:ring-[#ffd700]/30"
          required
          disabled={status === "loading" || status === "success"}
        />
        <button
          type="submit"
          disabled={status === "loading" || status === "success"}
          className="rounded border border-[#ffd700] bg-[#ffd700]/10 px-4 py-2 font-mono text-xs font-bold text-[#ffd700] transition hover:bg-[#ffd700]/20 disabled:opacity-50"
        >
          {status === "loading" ? "..." : status === "success" ? "✓" : "Notify Me"}
        </button>
      </form>

      {message && (
        <p className={`mt-2 font-mono text-xs ${status === "success" ? "text-accent-green" : "text-red-400"}`}>
          {message}
        </p>
      )}

      <div className="mt-3 border-t border-border pt-3">
        <button
          onClick={handleEnablePush}
          disabled={pushStatus === "loading" || pushStatus === "granted"}
          className="w-full rounded border border-[#00d9ff]/30 bg-[#00d9ff]/5 px-4 py-2 font-mono text-xs text-[#00d9ff] transition hover:bg-[#00d9ff]/10 disabled:opacity-50"
        >
          {pushStatus === "loading"
            ? "Enabling..."
            : pushStatus === "granted"
              ? "✓ Push Notifications Enabled"
              : pushStatus === "denied"
                ? "Notifications Blocked"
                : pushStatus === "unsupported"
                  ? "Push Not Supported"
                  : "🔔 Enable Push Notifications"}
        </button>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

**Step 2: Commit**

```bash
git add src/components/live/subscribe-form.tsx
git commit -m "feat: add subscribe form component with email and push support"
```

---

### Task 9: /live Page

**Files:**
- Create: `src/app/live/page.tsx`

**Step 1: Create the live page**

Create `src/app/live/page.tsx`:

```tsx
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/ui/page-hero";
import { LivePlayer } from "./live-player";
import { SubscribeForm } from "@/components/live/subscribe-form";

export const metadata: Metadata = {
  title: "Live — CultCodex",
  description: "Watch Cult of Psyche live streams",
};

export const dynamic = "force-dynamic";

export default async function LivePage() {
  const status = await prisma.liveStatus.findUnique({
    where: { id: "singleton" },
  });

  const isLive = status?.isLive ?? false;
  const videoId = status?.videoId ?? null;
  const title = status?.title ?? "Cult of Psyche Live Stream";

  return (
    <>
      <PageHero
        title={isLive ? "🔴 LIVE NOW" : "LIVE STREAM"}
        subtitle={isLive ? title : "Next stream coming soon..."}
        backgroundImage="/hero-bg.jpg"
      />

      <main className="mx-auto max-w-7xl px-4 py-6">
        {isLive && videoId ? (
          <LivePlayer videoId={videoId} />
        ) : videoId ? (
          /* Offline but has a last-played video — show replay */
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="mb-3 font-mono text-xs text-text-muted">
                LAST STREAM REPLAY
              </p>
              <div className="aspect-video w-full overflow-hidden rounded">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            <SubscribeForm />
          </div>
        ) : (
          /* No video at all */
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-surface p-8 text-center">
              <p className="font-mono text-lg text-[#ffd700]">
                No stream scheduled yet
              </p>
              <p className="mt-2 font-mono text-xs text-text-muted">
                Subscribe below to get notified when we go live
              </p>
            </div>
            <SubscribeForm />
          </div>
        )}
      </main>
    </>
  );
}
```

**Step 2: Create the LivePlayer client component**

Create `src/app/live/live-player.tsx`:

```tsx
"use client";

interface LivePlayerProps {
  videoId: string;
}

export function LivePlayer({ videoId }: LivePlayerProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
      {/* Video */}
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-[#ffd700]/20">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Chat */}
      <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border px-4 py-2">
          <p className="font-mono text-xs font-bold text-[#ffd700]">
            LIVE CHAT
          </p>
        </div>
        <div className="flex-1 min-h-[400px] lg:min-h-0">
          <iframe
            src={`https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${typeof window !== "undefined" ? window.location.hostname : "cultcodex.me"}&dark_theme=1`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/app/live/page.tsx src/app/live/live-player.tsx
git commit -m "feat: add /live page with YouTube embed, chat, and subscribe form"
```

---

### Task 10: Add "Live" to Navigation

**Files:**
- Modify: `src/components/layout/site-header.tsx`

**Step 1: Add Live link to nav**

In `src/components/layout/site-header.tsx`, add `{ label: "Live", href: "/live" }` to the `navItems` array:

Change:
```typescript
const navItems = [
  { label: "Episodes", href: "/episodes" },
```
To:
```typescript
const navItems = [
  { label: "Live", href: "/live" },
  { label: "Episodes", href: "/episodes" },
```

**Step 2: Commit**

```bash
git add src/components/layout/site-header.tsx
git commit -m "feat: add Live link to site navigation"
```

---

### Task 11: Verify and Deploy

**Step 1: Run the build**

```bash
cd "C:\Users\John Bates\Projects\cultcodex-v2"
npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Add env vars to Vercel**

In Vercel dashboard or CLI, add:
- `RESEND_API_KEY`
- `LIVE_TOGGLE_SECRET`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

**Step 3: Run the Prisma migration on Neon**

```bash
DATABASE_URL="<neon-connection-string>" npx prisma migrate deploy
```

**Step 4: Deploy**

```bash
npx vercel --prod
```

**Step 5: Test toggle**

```bash
curl -X POST "https://cultcodex.me/api/live/toggle" \
  -H "x-live-secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"videoId":"YOUR_VIDEO_ID","title":"Test Stream"}'
```

Verify banner appears on site, /live page shows embed.

Toggle off:
```bash
curl -X POST "https://cultcodex.me/api/live/toggle" \
  -H "x-live-secret: YOUR_SECRET"
```

**Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete live stream page with notifications"
```
