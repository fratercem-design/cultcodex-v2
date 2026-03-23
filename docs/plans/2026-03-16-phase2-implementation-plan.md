# Phase 2: Community Layer — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add authentication, reactions, comments, and social sharing to transform CultCodex from a read-only archive into an interactive community hub.

**Architecture:** NextAuth.js v5 handles auth with Google OAuth + email magic link, storing sessions in Postgres. Reactions and comments are server-side API routes with optimistic client-side UI. OG images use Next.js `ImageResponse` for zero-dependency edge-rendered social cards.

**Tech Stack:** Next.js 16.1.6, Prisma 7, NextAuth.js v5, Claude Haiku (comment moderation), ImageResponse (next/og), Tailwind v4, Vitest

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install next-auth and peer deps**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npm install next-auth@beta @auth/prisma-adapter
```

Note: `next-auth@beta` is v5 (the stable v5 ships under beta tag). `@auth/prisma-adapter` connects NextAuth to our Prisma schema.

**Step 2: Verify installation**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npm ls next-auth @auth/prisma-adapter
```

Expected: Both packages listed without errors.

**Step 3: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add package.json package-lock.json
git commit -m "chore: install next-auth v5 and prisma adapter for Phase 2 auth"
```

---

### Task 2: Add Auth + Community Schema to Prisma

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add new enums and models to schema**

Append the following to the end of `prisma/schema.prisma`, after the `Subscriber` model:

```prisma
// ─── Auth & Community ───────────────────────────────

enum CodexUserRole {
  user
  moderator
  admin
}

enum ReactionType {
  fire
  eye
  moon
  skull
  wildcard
}

model CodexUser {
  id          String        @id @default(cuid())
  email       String        @unique
  displayName String
  avatarUrl   String?
  provider    String        // "google" | "email"
  role        CodexUserRole @default(user)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  reactions   EpisodeReaction[]
  comments    CodexComment[]
  reports     CommentReport[]
  sessions    CodexSession[]
  accounts    CodexAccount[]
}

model CodexSession {
  id           String    @id @default(cuid())
  sessionToken String    @unique
  userId       String
  user         CodexUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  expires      DateTime
}

model CodexAccount {
  id                String    @id @default(cuid())
  userId            String
  user              CodexUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  type              String
  provider          String
  providerAccountId String
  access_token      String?
  refresh_token     String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?

  @@unique([provider, providerAccountId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model EpisodeReaction {
  userId       String
  episodeId    String
  reactionType ReactionType
  user         CodexUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  episode      Episode   @relation(fields: [episodeId], references: [id], onDelete: Cascade)
  createdAt    DateTime  @default(now())

  @@id([userId, episodeId, reactionType])
  @@index([episodeId])
}

model CodexComment {
  id            String         @id @default(cuid())
  content       String
  userId        String
  user          CodexUser      @relation(fields: [userId], references: [id], onDelete: Cascade)
  episodeId     String
  episode       Episode        @relation(fields: [episodeId], references: [id], onDelete: Cascade)
  parentId      String?
  parent        CodexComment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies       CodexComment[] @relation("CommentReplies")
  flagged       Boolean        @default(false)
  flaggedReason String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  reports       CommentReport[]

  @@index([episodeId])
  @@index([userId])
  @@index([parentId])
}

model CommentReport {
  id        String       @id @default(cuid())
  commentId String
  comment   CodexComment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  userId    String
  user      CodexUser    @relation(fields: [userId], references: [id], onDelete: Cascade)
  reason    String
  createdAt DateTime     @default(now())

  @@unique([commentId, userId])
}
```

**Step 2: Add relations to Episode model**

In the `Episode` model's relations block, add these two lines after `firstMentionOf`:

```prisma
  reactions          EpisodeReaction[]
  comments           CodexComment[]
```

**Step 3: Generate Prisma client and create migration**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npx prisma generate
npx prisma db push --accept-data-loss
```

Note: We use `db push` for development since we're iterating. The `--accept-data-loss` flag is safe here because these are new tables only.

**Step 4: Verify the generated client has new types**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npx tsx -e "import { CodexUserRole, ReactionType } from './src/generated/prisma/client'; console.log('CodexUserRole:', Object.values(CodexUserRole)); console.log('ReactionType:', Object.values(ReactionType));"
```

Expected: Both enums printed with their values.

**Step 5: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add prisma/schema.prisma src/generated/prisma
git commit -m "feat: add auth, reactions, and comments schema for Phase 2"
```

---

### Task 3: Configure NextAuth.js v5

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Modify: `.env` (add env vars — document what to add, don't commit)

**Step 1: Add env vars to `.env`**

Add these to `C:/Users/John Bates/Projects/cultcodex-v2/.env`:

```env
# NextAuth.js v5
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Note: `NEXTAUTH_SECRET` should be a random 32+ char string. Generate with `openssl rand -base64 32`. Google OAuth credentials need to be created at https://console.cloud.google.com/apis/credentials — for now, leave empty and test with email provider only.

**Step 2: Create the auth configuration**

Create `src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import type { CodexUserRole } from "@/generated/prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Upsert CodexUser on sign-in
      await prisma.codexUser.upsert({
        where: { email: user.email },
        update: {
          avatarUrl: user.image ?? undefined,
        },
        create: {
          email: user.email,
          displayName: user.name ?? user.email.split("@")[0],
          avatarUrl: user.image ?? undefined,
          provider: account?.provider ?? "unknown",
        },
      });

      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const codexUser = await prisma.codexUser.findUnique({
          where: { email: session.user.email },
          select: { id: true, displayName: true, role: true, avatarUrl: true },
        });
        if (codexUser) {
          (session as SessionWithCodex).codexUser = codexUser;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});

// Extended session type
export interface CodexSessionUser {
  id: string;
  displayName: string;
  role: CodexUserRole;
  avatarUrl: string | null;
}

export interface SessionWithCodex {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  codexUser?: CodexSessionUser;
  expires: string;
}

// Helper: get current user ID or null
export async function getCurrentUser(): Promise<CodexSessionUser | null> {
  const session = (await auth()) as SessionWithCodex | null;
  return session?.codexUser ?? null;
}

// Helper: require auth — throws if not authenticated
export async function requireAuth(): Promise<CodexSessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required");
  return user;
}

// Helper: require admin role
export async function requireAdmin(): Promise<CodexSessionUser> {
  const user = await requireAuth();
  if (user.role !== "admin") throw new Error("Admin access required");
  return user;
}
```

**Step 3: Create the NextAuth API route**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

**Step 4: Verify build compiles**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npx next build 2>&1 | tail -20
```

Expected: Build succeeds (auth routes may warn about missing Google credentials, that's OK).

**Step 5: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/lib/auth.ts src/app/api/auth
git commit -m "feat: configure NextAuth.js v5 with Google OAuth and session helpers"
```

---

### Task 4: Create Sign-In Page and Auth UI Components

**Files:**
- Create: `src/app/auth/signin/page.tsx`
- Create: `src/components/auth/user-menu.tsx`
- Modify: `src/components/layout/site-header.tsx`

**Step 1: Create the sign-in page**

Create `src/app/auth/signin/page.tsx`:

```tsx
import { signIn } from "@/lib/auth";
import { PageHero } from "@/components/ui/page-hero";

export default function SignInPage() {
  return (
    <>
      <PageHero
        title="SIGN IN"
        subtitle="Join the Codex"
        backgroundImage="/wiki-page-header.jpg"
      />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-lg border border-border bg-surface p-8 space-y-6">
          <div className="text-center">
            <h2 className="font-display text-lg text-text-primary">
              Welcome to CultCodex
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Sign in to react, comment, and join the conversation.
            </p>
          </div>

          {/* Google Sign-In */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-elevated px-4 py-3 font-mono text-sm text-text-primary transition-colors hover:border-accent-gold/50 hover:bg-surface"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-2 font-mono text-text-muted">
                or
              </span>
            </div>
          </div>

          <p className="text-center text-xs text-text-muted">
            Email sign-in coming soon.
          </p>
        </div>
      </main>
    </>
  );
}
```

**Step 2: Create the user menu component**

Create `src/components/auth/user-menu.tsx`:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

interface UserMenuProps {
  user: {
    displayName: string;
    avatarUrl: string | null;
    role: string;
  } | null;
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <Link
        href="/auth/signin"
        className="rounded-lg border border-accent-gold/30 bg-accent-gold/10 px-3 py-1.5 font-mono text-xs text-accent-gold transition-colors hover:bg-accent-gold/20"
      >
        Sign In
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-xs text-text-primary transition-colors hover:border-accent-gold/30"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt=""
            className="h-5 w-5 rounded-full"
          />
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-gold/20 text-[10px] text-accent-gold">
            {user.displayName[0]?.toUpperCase()}
          </div>
        )}
        <span className="max-w-[100px] truncate">{user.displayName}</span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-border bg-surface py-1 shadow-lg">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-xs text-text-primary font-medium truncate">
              {user.displayName}
            </p>
            <p className="text-[10px] text-text-muted font-mono">
              {user.role.toUpperCase()}
            </p>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full px-3 py-2 text-left text-xs text-accent-crimson hover:bg-elevated transition-colors"
              onClick={() => setOpen(false)}
            >
              Sign Out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Read the site-header to understand its structure**

Read `src/components/layout/site-header.tsx` first, then add the `UserMenu` to the header's right side. Import `auth` from `@/lib/auth` and `UserMenu` from `@/components/auth/user-menu`. Add the user menu after the existing nav links.

The site-header is a server component, so it can call `auth()` directly:

```typescript
import { auth } from "@/lib/auth";
import type { SessionWithCodex } from "@/lib/auth";
import { UserMenu } from "@/components/auth/user-menu";
```

In the JSX, add after the last nav link (before the closing nav/header tag):

```tsx
<UserMenu user={(session as SessionWithCodex)?.codexUser ?? null} />
```

Where `session` is obtained at the top of the component:

```typescript
const session = await auth();
```

Note: The site-header needs to become `async` if it isn't already.

**Step 4: Verify build**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npx next build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/app/auth src/components/auth src/components/layout/site-header.tsx
git commit -m "feat: add sign-in page and user menu in site header"
```

---

### Task 5: Episode Reactions API

**Files:**
- Create: `src/app/api/episodes/[slug]/reactions/route.ts`
- Create: `src/lib/queries/reactions.ts`

**Step 1: Create reactions query helpers**

Create `src/lib/queries/reactions.ts`:

```typescript
import { prisma } from "@/lib/db";
import type { ReactionType } from "@/generated/prisma/client";

export interface ReactionCounts {
  fire: number;
  eye: number;
  moon: number;
  skull: number;
  wildcard: number;
  userReactions: ReactionType[];
}

export async function getReactionCounts(
  episodeId: string,
  userId?: string | null,
): Promise<ReactionCounts> {
  const [counts, userReactions] = await Promise.all([
    prisma.episodeReaction.groupBy({
      by: ["reactionType"],
      where: { episodeId },
      _count: true,
    }),
    userId
      ? prisma.episodeReaction.findMany({
          where: { episodeId, userId },
          select: { reactionType: true },
        })
      : Promise.resolve([]),
  ]);

  const result: ReactionCounts = {
    fire: 0,
    eye: 0,
    moon: 0,
    skull: 0,
    wildcard: 0,
    userReactions: userReactions.map((r) => r.reactionType),
  };

  for (const c of counts) {
    result[c.reactionType] = c._count;
  }

  return result;
}

export async function toggleReaction(
  userId: string,
  episodeId: string,
  reactionType: ReactionType,
): Promise<{ added: boolean }> {
  const existing = await prisma.episodeReaction.findUnique({
    where: {
      userId_episodeId_reactionType: { userId, episodeId, reactionType },
    },
  });

  if (existing) {
    await prisma.episodeReaction.delete({
      where: {
        userId_episodeId_reactionType: { userId, episodeId, reactionType },
      },
    });
    return { added: false };
  }

  await prisma.episodeReaction.create({
    data: { userId, episodeId, reactionType },
  });
  return { added: true };
}
```

**Step 2: Create the reactions API route**

Create `src/app/api/episodes/[slug]/reactions/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getReactionCounts, toggleReaction } from "@/lib/queries/reactions";
import { ReactionType } from "@/generated/prisma/client";

const VALID_REACTIONS: Set<string> = new Set(["fire", "eye", "moon", "skull", "wildcard"]);

// GET: Fetch reaction counts for an episode
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const episode = await prisma.episode.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  const user = await getCurrentUser();
  const counts = await getReactionCounts(episode.id, user?.id);

  return NextResponse.json(counts);
}

// POST: Toggle a reaction (auth required)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to react" }, { status: 401 });
  }

  const { slug } = await params;
  const episode = await prisma.episode.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  const body = await req.json();
  const { type } = body as { type?: string };

  if (!type || !VALID_REACTIONS.has(type)) {
    return NextResponse.json(
      { error: "Invalid reaction type" },
      { status: 400 },
    );
  }

  await toggleReaction(user.id, episode.id, type as ReactionType);
  const counts = await getReactionCounts(episode.id, user.id);

  return NextResponse.json(counts);
}
```

**Step 3: Verify build**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npx next build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/lib/queries/reactions.ts src/app/api/episodes
git commit -m "feat: add reactions API with toggle and count endpoints"
```

---

### Task 6: Reactions UI Component

**Files:**
- Create: `src/components/episodes/reaction-bar.tsx`
- Modify: `src/app/episodes/[slug]/page.tsx`

**Step 1: Create the ReactionBar client component**

Create `src/components/episodes/reaction-bar.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";

interface ReactionBarProps {
  slug: string;
  initialCounts: {
    fire: number;
    eye: number;
    moon: number;
    skull: number;
    wildcard: number;
    userReactions: string[];
  };
  isAuthenticated: boolean;
}

const REACTIONS = [
  { type: "fire", emoji: "🔥", label: "This was heat" },
  { type: "eye", emoji: "👁️", label: "Eye-opening" },
  { type: "moon", emoji: "🌙", label: "Mystical" },
  { type: "skull", emoji: "💀", label: "Dead/hilarious" },
  { type: "wildcard", emoji: "🃏", label: "Chaotic" },
] as const;

export function ReactionBar({
  slug,
  initialCounts,
  isAuthenticated,
}: ReactionBarProps) {
  const [counts, setCounts] = useState(initialCounts);
  const [pending, setPending] = useState<string | null>(null);

  const handleReaction = useCallback(
    async (type: string) => {
      if (!isAuthenticated) {
        window.location.href = "/auth/signin";
        return;
      }
      if (pending) return;

      setPending(type);

      // Optimistic update
      const wasActive = counts.userReactions.includes(type);
      setCounts((prev) => ({
        ...prev,
        [type]: (prev[type as keyof typeof prev] as number) + (wasActive ? -1 : 1),
        userReactions: wasActive
          ? prev.userReactions.filter((r) => r !== type)
          : [...prev.userReactions, type],
      }));

      try {
        const res = await fetch(`/api/episodes/${slug}/reactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        if (res.ok) {
          const data = await res.json();
          setCounts(data);
        }
      } catch {
        // Revert on error
        setCounts((prev) => ({
          ...prev,
          [type]: (prev[type as keyof typeof prev] as number) + (wasActive ? 1 : -1),
          userReactions: wasActive
            ? [...prev.userReactions, type]
            : prev.userReactions.filter((r) => r !== type),
        }));
      } finally {
        setPending(null);
      }
    },
    [slug, counts, pending, isAuthenticated],
  );

  return (
    <div className="flex flex-wrap gap-2">
      {REACTIONS.map(({ type, emoji, label }) => {
        const count = counts[type as keyof typeof counts] as number;
        const isActive = counts.userReactions.includes(type);

        return (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            disabled={pending !== null}
            title={isAuthenticated ? label : "Sign in to react"}
            className={`group flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs transition-all ${
              isActive
                ? "border-accent-gold/50 bg-accent-gold/10 text-accent-gold"
                : "border-border bg-surface text-text-muted hover:border-accent-gold/30 hover:text-text-primary"
            } ${pending === type ? "opacity-50" : ""}`}
          >
            <span className="text-sm">{emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
```

**Step 2: Add ReactionBar to episode detail page**

In `src/app/episodes/[slug]/page.tsx`:

1. Add imports at the top:

```typescript
import { getCurrentUser } from "@/lib/auth";
import { getReactionCounts } from "@/lib/queries/reactions";
import { ReactionBar } from "@/components/episodes/reaction-bar";
```

2. Inside the `EpisodeDetailPage` function, after `const relatedEpisodes = ...`, add:

```typescript
const user = await getCurrentUser();
const reactionCounts = await getReactionCounts(episode.id, user?.id);
```

3. In the JSX, after the "Watch on YouTube" CTA `</a>` block (around line 95) and before the short synopsis, add:

```tsx
{/* Reactions */}
<ReactionBar
  slug={episode.slug}
  initialCounts={reactionCounts}
  isAuthenticated={!!user}
/>
```

**Step 3: Verify build**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npx next build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/components/episodes/reaction-bar.tsx src/app/episodes
git commit -m "feat: add reaction bar UI to episode pages with optimistic updates"
```

---

### Task 7: Comments API with AI Moderation

**Files:**
- Create: `src/lib/queries/comments.ts`
- Create: `src/lib/moderation.ts`
- Create: `src/app/api/episodes/[slug]/comments/route.ts`
- Create: `src/app/api/comments/[id]/report/route.ts`

**Step 1: Create the moderation helper**

Create `src/lib/moderation.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

/**
 * Check if a comment is spam, hate speech, or abusive using Claude Haiku.
 * Returns { flagged: boolean, reason?: string }
 */
export async function moderateComment(
  content: string,
): Promise<{ flagged: boolean; reason?: string }> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-20250414",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: `You are a content moderator. Is the following comment spam, hate speech, or abusive? Reply with ONLY "YES" or "NO" on the first line. If YES, add a brief reason on the second line.\n\nComment: "${content}"`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    const lines = text.trim().split("\n");
    const verdict = lines[0]?.trim().toUpperCase();

    if (verdict === "YES") {
      return { flagged: true, reason: lines[1]?.trim() || "Flagged by AI" };
    }

    return { flagged: false };
  } catch (error) {
    // If moderation fails, let the comment through
    console.error("Moderation error:", error);
    return { flagged: false };
  }
}
```

**Step 2: Create comments query helpers**

Create `src/lib/queries/comments.ts`:

```typescript
import { prisma } from "@/lib/db";

export interface CommentWithUser {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  replies: {
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
    };
  }[];
}

export async function getCommentsForEpisode(
  episodeId: string,
  options?: { take?: number; skip?: number },
): Promise<{ comments: CommentWithUser[]; totalCount: number }> {
  const { take = 20, skip = 0 } = options ?? {};

  const [comments, totalCount] = await Promise.all([
    prisma.codexComment.findMany({
      where: {
        episodeId,
        parentId: null, // top-level only
        flagged: false,
      },
      include: {
        user: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        replies: {
          where: { flagged: false },
          include: {
            user: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.codexComment.count({
      where: { episodeId, flagged: false },
    }),
  ]);

  return { comments, totalCount };
}

export async function createComment(data: {
  content: string;
  userId: string;
  episodeId: string;
  parentId?: string;
  flagged?: boolean;
  flaggedReason?: string;
}) {
  // Validate content length
  if (data.content.length > 2000) {
    throw new Error("Comment too long (max 2000 characters)");
  }
  if (data.content.trim().length === 0) {
    throw new Error("Comment cannot be empty");
  }

  // If parentId, validate it's a top-level comment (no nested replies)
  if (data.parentId) {
    const parent = await prisma.codexComment.findUnique({
      where: { id: data.parentId },
      select: { parentId: true },
    });
    if (!parent) throw new Error("Parent comment not found");
    if (parent.parentId) throw new Error("Cannot reply to a reply");
  }

  return prisma.codexComment.create({
    data: {
      content: data.content.trim(),
      userId: data.userId,
      episodeId: data.episodeId,
      parentId: data.parentId ?? null,
      flagged: data.flagged ?? false,
      flaggedReason: data.flaggedReason ?? null,
    },
    include: {
      user: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });
}
```

**Step 3: Create the comments API route**

Create `src/app/api/episodes/[slug]/comments/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCommentsForEpisode, createComment } from "@/lib/queries/comments";
import { moderateComment } from "@/lib/moderation";

// GET: List comments for an episode (public)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const episode = await prisma.episode.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  const take = Math.min(
    parseInt(req.nextUrl.searchParams.get("take") ?? "20", 10),
    50,
  );
  const skip = parseInt(req.nextUrl.searchParams.get("skip") ?? "0", 10);

  const result = await getCommentsForEpisode(episode.id, { take, skip });
  return NextResponse.json(result);
}

// POST: Create a comment (auth required)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to comment" },
      { status: 401 },
    );
  }

  const { slug } = await params;
  const episode = await prisma.episode.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!episode) {
    return NextResponse.json({ error: "Episode not found" }, { status: 404 });
  }

  const body = await req.json();
  const { content, parentId } = body as {
    content?: string;
    parentId?: string;
  };

  if (!content || content.trim().length === 0) {
    return NextResponse.json(
      { error: "Comment cannot be empty" },
      { status: 400 },
    );
  }

  if (content.length > 2000) {
    return NextResponse.json(
      { error: "Comment too long (max 2000 characters)" },
      { status: 400 },
    );
  }

  // AI moderation
  const moderation = await moderateComment(content);

  try {
    const comment = await createComment({
      content,
      userId: user.id,
      episodeId: episode.id,
      parentId,
      flagged: moderation.flagged,
      flaggedReason: moderation.reason,
    });

    if (moderation.flagged) {
      return NextResponse.json(
        {
          message:
            "Your comment is being reviewed by our moderation system.",
          flagged: true,
        },
        { status: 202 },
      );
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to post comment";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
```

**Step 4: Create the comment report API route**

Create `src/app/api/comments/[id]/report/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to report" },
      { status: 401 },
    );
  }

  const { id: commentId } = await params;
  const body = await req.json();
  const { reason } = body as { reason?: string };

  if (!reason || reason.trim().length === 0) {
    return NextResponse.json(
      { error: "Reason is required" },
      { status: 400 },
    );
  }

  // Check comment exists
  const comment = await prisma.codexComment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });

  if (!comment) {
    return NextResponse.json(
      { error: "Comment not found" },
      { status: 404 },
    );
  }

  // Upsert report (one report per user per comment)
  await prisma.commentReport.upsert({
    where: {
      commentId_userId: { commentId, userId: user.id },
    },
    update: { reason: reason.trim() },
    create: {
      commentId,
      userId: user.id,
      reason: reason.trim(),
    },
  });

  return NextResponse.json({ success: true });
}
```

**Step 5: Verify build**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npx next build 2>&1 | tail -20
```

**Step 6: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/lib/moderation.ts src/lib/queries/comments.ts src/app/api/episodes src/app/api/comments
git commit -m "feat: add comments API with AI moderation and user reporting"
```

---

### Task 8: Comments UI Component

**Files:**
- Create: `src/components/episodes/comment-section.tsx`
- Create: `src/lib/format/relative-time.ts`
- Modify: `src/app/episodes/[slug]/page.tsx`

**Step 1: Create relative time formatter**

Create `src/lib/format/relative-time.ts`:

```typescript
export function relativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return then.toLocaleDateString();
}
```

**Step 2: Create the CommentSection client component**

Create `src/components/episodes/comment-section.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import { relativeTime } from "@/lib/format/relative-time";

interface CommentUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
  replies: {
    id: string;
    content: string;
    createdAt: string;
    user: CommentUser;
  }[];
}

interface CommentSectionProps {
  slug: string;
  initialComments: Comment[];
  initialTotalCount: number;
  isAuthenticated: boolean;
  currentUserId?: string;
}

export function CommentSection({
  slug,
  initialComments,
  initialTotalCount,
  isAuthenticated,
  currentUserId,
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitComment = useCallback(
    async (content: string, parentId?: string) => {
      if (!isAuthenticated) {
        window.location.href = "/auth/signin";
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        const res = await fetch(`/api/episodes/${slug}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, parentId }),
        });

        const data = await res.json();

        if (res.status === 202) {
          // Flagged — show moderation message
          setError("Your comment is being reviewed. It will appear once approved.");
          return;
        }

        if (!res.ok) {
          setError(data.error || "Failed to post comment");
          return;
        }

        if (parentId) {
          // Add reply to parent
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId
                ? { ...c, replies: [...c.replies, { ...data, createdAt: data.createdAt }] }
                : c,
            ),
          );
          setReplyTo(null);
          setReplyText("");
        } else {
          // Add new top-level comment
          setComments((prev) => [{ ...data, replies: [], createdAt: data.createdAt }, ...prev]);
          setNewComment("");
        }
        setTotalCount((prev) => prev + 1);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [slug, isAuthenticated],
  );

  const reportComment = useCallback(
    async (commentId: string) => {
      if (!isAuthenticated) return;
      const reason = prompt("Why are you reporting this comment?");
      if (!reason) return;

      await fetch(`/api/comments/${commentId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      alert("Report submitted. Thank you.");
    },
    [isAuthenticated],
  );

  return (
    <div className="space-y-6">
      {/* Comment form */}
      <div className="space-y-3">
        {isAuthenticated ? (
          <>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts on this episode..."
              maxLength={2000}
              rows={3}
              className="w-full rounded-lg border border-border bg-surface px-4 py-3 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none focus:ring-1 focus:ring-accent-gold resize-none transition-colors"
            />
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-text-muted">
                {newComment.length}/2000
              </span>
              <button
                onClick={() => submitComment(newComment)}
                disabled={submitting || newComment.trim().length === 0}
                className="rounded bg-accent-gold/10 px-4 py-1.5 font-mono text-xs text-accent-gold transition-colors hover:bg-accent-gold/20 disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Comment"}
              </button>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-border bg-surface p-4 text-center">
            <p className="text-sm text-text-muted">
              <a
                href="/auth/signin"
                className="text-accent-gold hover:underline"
              >
                Sign in
              </a>{" "}
              to join the conversation.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-accent-crimson font-mono">{error}</p>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-center text-sm text-text-muted py-4">
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-3">
              {/* Top-level comment */}
              <CommentCard
                comment={comment}
                isAuthenticated={isAuthenticated}
                currentUserId={currentUserId}
                onReply={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                onReport={() => reportComment(comment.id)}
              />

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="ml-8 space-y-3 border-l border-border/50 pl-4">
                  {comment.replies.map((reply) => (
                    <CommentCard
                      key={reply.id}
                      comment={reply}
                      isAuthenticated={isAuthenticated}
                      currentUserId={currentUserId}
                      onReport={() => reportComment(reply.id)}
                      isReply
                    />
                  ))}
                </div>
              )}

              {/* Reply form */}
              {replyTo === comment.id && isAuthenticated && (
                <div className="ml-8 space-y-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    maxLength={2000}
                    rows={2}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none focus:ring-1 focus:ring-accent-gold resize-none transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitComment(replyText, comment.id)}
                      disabled={submitting || replyText.trim().length === 0}
                      className="rounded bg-accent-gold/10 px-3 py-1 font-mono text-[10px] text-accent-gold transition-colors hover:bg-accent-gold/20 disabled:opacity-50"
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => {
                        setReplyTo(null);
                        setReplyText("");
                      }}
                      className="rounded px-3 py-1 font-mono text-[10px] text-text-muted transition-colors hover:text-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Comment card sub-component ──────────────────────────────

function CommentCard({
  comment,
  isAuthenticated,
  currentUserId,
  onReply,
  onReport,
  isReply = false,
}: {
  comment: {
    id: string;
    content: string;
    createdAt: string;
    user: CommentUser;
  };
  isAuthenticated: boolean;
  currentUserId?: string;
  onReply?: () => void;
  onReport: () => void;
  isReply?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="flex items-center gap-2 mb-2">
        {comment.user.avatarUrl ? (
          <img
            src={comment.user.avatarUrl}
            alt=""
            className="h-6 w-6 rounded-full"
          />
        ) : (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-gold/20 text-[10px] text-accent-gold font-bold">
            {comment.user.displayName[0]?.toUpperCase()}
          </div>
        )}
        <span className="font-mono text-xs text-text-primary font-medium">
          {comment.user.displayName}
        </span>
        <span className="font-mono text-[10px] text-text-muted">
          {relativeTime(comment.createdAt)}
        </span>
      </div>
      <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
        {comment.content}
      </p>
      <div className="mt-2 flex gap-3">
        {onReply && !isReply && (
          <button
            onClick={onReply}
            className="font-mono text-[10px] text-text-muted hover:text-accent-gold transition-colors"
          >
            Reply
          </button>
        )}
        {isAuthenticated && comment.user.id !== currentUserId && (
          <button
            onClick={onReport}
            className="font-mono text-[10px] text-text-muted hover:text-accent-crimson transition-colors"
          >
            Report
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Add CommentSection to episode detail page**

In `src/app/episodes/[slug]/page.tsx`:

1. Add imports:

```typescript
import { getCommentsForEpisode } from "@/lib/queries/comments";
import { CommentSection } from "@/components/episodes/comment-section";
```

2. After the `reactionCounts` fetch (added in Task 6), add:

```typescript
const commentsData = await getCommentsForEpisode(episode.id, { take: 20 });
```

3. In the JSX, after the Related Episodes `</section>` block and before the closing `</div>` of the main content column (`lg:col-span-2`), add:

```tsx
{/* Comments */}
<SectionCard title={`Comments (${commentsData.totalCount})`}>
  <CommentSection
    slug={episode.slug}
    initialComments={JSON.parse(JSON.stringify(commentsData.comments))}
    initialTotalCount={commentsData.totalCount}
    isAuthenticated={!!user}
    currentUserId={user?.id}
  />
</SectionCard>
```

Note: `JSON.parse(JSON.stringify(...))` serializes Date objects to strings for the client component.

**Step 4: Verify build**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npx next build 2>&1 | tail -20
```

**Step 5: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/components/episodes/comment-section.tsx src/lib/format/relative-time.ts src/app/episodes
git commit -m "feat: add comment section UI with replies, moderation status, and reporting"
```

---

### Task 9: Admin Moderation API

**Files:**
- Create: `src/app/api/admin/comments/route.ts`
- Create: `src/app/api/admin/comments/[id]/route.ts`

**Step 1: Create admin comments list route**

Create `src/app/api/admin/comments/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET: List flagged comments for admin review
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const flaggedOnly = req.nextUrl.searchParams.get("flagged") === "true";

  const comments = await prisma.codexComment.findMany({
    where: flaggedOnly ? { flagged: true } : undefined,
    include: {
      user: { select: { id: true, displayName: true, email: true } },
      episode: { select: { title: true, slug: true } },
      reports: {
        include: {
          user: { select: { displayName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(comments);
}
```

**Step 2: Create admin comment action route**

Create `src/app/api/admin/comments/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// PATCH: Approve or reject a flagged comment
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action } = body as { action?: "approve" | "delete" };

  if (!action || !["approve", "delete"].includes(action)) {
    return NextResponse.json(
      { error: "Action must be 'approve' or 'delete'" },
      { status: 400 },
    );
  }

  const comment = await prisma.codexComment.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!comment) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  if (action === "approve") {
    await prisma.codexComment.update({
      where: { id },
      data: { flagged: false, flaggedReason: null },
    });
    return NextResponse.json({ success: true, action: "approved" });
  }

  if (action === "delete") {
    await prisma.codexComment.delete({ where: { id } });
    return NextResponse.json({ success: true, action: "deleted" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
```

**Step 3: Verify build**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npx next build 2>&1 | tail -20
```

**Step 4: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/app/api/admin
git commit -m "feat: add admin moderation API for flagged comments"
```

---

### Task 10: Episode OG Images

**Files:**
- Create: `src/app/episodes/[slug]/opengraph-image.tsx`

**Step 1: Create the OG image route**

Create `src/app/episodes/[slug]/opengraph-image.tsx`:

```tsx
import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const alt = "CultCodex Episode";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const episode = await prisma.episode.findUnique({
    where: { slug },
    select: {
      title: true,
      episodeNumber: true,
      airDate: true,
      summaryShort: true,
      series: { select: { title: true } },
    },
  });

  if (!episode) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0A0A0F",
            color: "#F3EEDF",
            fontFamily: "sans-serif",
            fontSize: 48,
          }}
        >
          Episode Not Found
        </div>
      ),
      { ...size },
    );
  }

  const epNum = episode.episodeNumber
    ? `EP.${String(episode.episodeNumber).padStart(3, "0")}`
    : null;

  const airDate = episode.airDate
    ? new Date(episode.airDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0A0A0F",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: Badge area */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {epNum && (
            <div
              style={{
                backgroundColor: "rgba(200, 169, 107, 0.15)",
                border: "1px solid rgba(200, 169, 107, 0.3)",
                borderRadius: "8px",
                padding: "8px 16px",
                color: "#C8A96B",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {epNum}
            </div>
          )}
          {episode.series && (
            <div
              style={{
                backgroundColor: "rgba(110, 75, 174, 0.15)",
                border: "1px solid rgba(110, 75, 174, 0.3)",
                borderRadius: "8px",
                padding: "8px 16px",
                color: "#6E4BAE",
                fontSize: 20,
              }}
            >
              {episode.series.title}
            </div>
          )}
        </div>

        {/* Middle: Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              color: "#F3EEDF",
              fontSize: episode.title.length > 60 ? 36 : 48,
              fontWeight: 700,
              lineHeight: 1.2,
              maxHeight: "200px",
              overflow: "hidden",
            }}
          >
            {episode.title}
          </div>
          {episode.summaryShort && (
            <div
              style={{
                color: "#B6AE9B",
                fontSize: 20,
                lineHeight: 1.4,
                maxHeight: "60px",
                overflow: "hidden",
              }}
            >
              {episode.summaryShort.slice(0, 150)}
              {episode.summaryShort.length > 150 ? "..." : ""}
            </div>
          )}
        </div>

        {/* Bottom: Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              color: "#C8A96B",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: "0.1em",
            }}
          >
            CULTCODEX
          </div>
          {airDate && (
            <div style={{ color: "#B6AE9B", fontSize: 18 }}>{airDate}</div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
```

**Step 2: Verify build**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npx next build 2>&1 | tail -20
```

**Step 3: Test locally**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npm run dev &
# Visit http://localhost:3000/episodes/[any-slug]/opengraph-image in browser
```

**Step 4: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/app/episodes
git commit -m "feat: add auto-generated OG images for episode pages"
```

---

### Task 11: Shareable Quote Cards

**Files:**
- Create: `src/app/quotes/[id]/og/route.tsx`
- Create: `src/components/quotes/share-button.tsx`
- Modify: `src/app/episodes/[slug]/page.tsx` (add share button to quotes)
- Modify: `src/app/search/page.tsx` (add share button to quote results)

**Step 1: Create the quote card image route**

Create `src/app/quotes/[id]/og/route.tsx`:

```tsx
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    select: {
      text: true,
      speaker: { select: { displayName: true } },
      episode: { select: { title: true, episodeNumber: true } },
    },
  });

  if (!quote) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0A0A0F",
            color: "#F3EEDF",
            fontSize: 36,
            fontFamily: "sans-serif",
          }}
        >
          Quote not found
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  const epLabel = quote.episode?.episodeNumber
    ? `EP.${String(quote.episode.episodeNumber).padStart(3, "0")}`
    : null;

  // Adjust font size based on quote length
  const fontSize = quote.text.length > 300 ? 24 : quote.text.length > 150 ? 30 : 36;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0A0A0F",
          padding: "60px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Quote mark */}
        <div style={{ color: "#C8A96B", fontSize: 80, lineHeight: 1, opacity: 0.3 }}>
          &ldquo;
        </div>

        {/* Quote text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              color: "#F3EEDF",
              fontSize,
              fontStyle: "italic",
              lineHeight: 1.5,
              maxHeight: "320px",
              overflow: "hidden",
            }}
          >
            &ldquo;{quote.text.slice(0, 500)}{quote.text.length > 500 ? "..." : ""}&rdquo;
          </div>

          {/* Attribution */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {quote.speaker && (
              <div style={{ color: "#C8A96B", fontSize: 22, fontWeight: 600 }}>
                — {quote.speaker.displayName}
              </div>
            )}
            {quote.episode && (
              <div style={{ color: "#B6AE9B", fontSize: 18 }}>
                {epLabel ? `${epLabel}: ` : ""}
                {quote.episode.title.slice(0, 80)}
              </div>
            )}
          </div>
        </div>

        {/* Branding */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            color: "#C8A96B",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: "0.1em",
            opacity: 0.6,
          }}
        >
          CULTCODEX
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
```

**Step 2: Create the share button component**

Create `src/components/quotes/share-button.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";

interface ShareButtonProps {
  quoteId: string;
  quoteText: string;
}

export function QuoteShareButton({ quoteId, quoteText }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const siteUrl = window.location.origin;
    const cardUrl = `${siteUrl}/quotes/${quoteId}/og`;

    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          text: quoteText,
          url: cardUrl,
        });
        return;
      } catch {
        // User cancelled or not supported, fall through to clipboard
      }
    }

    // Fallback: copy URL to clipboard
    try {
      await navigator.clipboard.writeText(cardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Final fallback
      prompt("Copy this URL:", cardUrl);
    }
  }, [quoteId, quoteText]);

  return (
    <button
      onClick={handleShare}
      title="Share this quote"
      className="font-mono text-[10px] text-text-muted hover:text-accent-gold transition-colors"
    >
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
```

**Step 3: Add share button to quotes on episode pages**

In `src/app/episodes/[slug]/page.tsx`, in the quotes section where each `<blockquote>` is rendered, add the `QuoteShareButton` after the speaker cite:

Add import:
```typescript
import { QuoteShareButton } from "@/components/quotes/share-button";
```

In the quotes map, after the `</cite>` tag (or after the closing `</blockquote>` wrapper div), add:
```tsx
<QuoteShareButton quoteId={q.id} quoteText={q.text} />
```

**Step 4: Add share button to quote search results**

In `src/app/search/page.tsx`, in the quotes section, add the same share button after the quote attribution. Add the import and component similarly.

Note: Since this is a server component page, we need to add the client component import:
```typescript
import { QuoteShareButton } from "@/components/quotes/share-button";
```

In the quotes results map, add after the attribution div:
```tsx
<QuoteShareButton quoteId={quote.id} quoteText={quote.text} />
```

**Step 5: Verify build**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npx next build 2>&1 | tail -20
```

**Step 6: Commit**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add src/app/quotes src/components/quotes src/app/episodes src/app/search
git commit -m "feat: add shareable quote cards with OG image generation and share buttons"
```

---

### Task 12: Push Schema to Neon and Deploy

**Files:**
- No new files

**Step 1: Push schema changes to Neon production database**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
DATABASE_URL="postgresql://neondb_owner:npg_tkoGPp10JQwx@ep-wandering-mud-akzidlw0-pooler.c-3.us-west-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require" npx prisma db push
```

**Step 2: Set auth environment variables on Vercel**

Set these environment variables in the Vercel dashboard or via CLI:

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npx vercel env add NEXTAUTH_SECRET production
npx vercel env add NEXTAUTH_URL production
npx vercel env add GOOGLE_CLIENT_ID production
npx vercel env add GOOGLE_CLIENT_SECRET production
```

Note: `NEXTAUTH_URL` should be `https://cultcodex.me`. `NEXTAUTH_SECRET` should be a 32+ char random string. Google OAuth credentials require setting up at Google Cloud Console with `https://cultcodex.me/api/auth/callback/google` as the redirect URI.

**Step 3: Deploy to Vercel**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
npx vercel --prod
```

**Step 4: Verify deployment**

Visit `https://cultcodex.me` and check:
- Sign In link appears in header
- `/auth/signin` page loads
- Episode pages show reaction bar
- Episode pages show comment section
- Episode OG images generate at `/episodes/[slug]/opengraph-image`

**Step 5: Commit any deployment config changes**

```bash
cd "C:/Users/John Bates/Projects/cultcodex-v2"
git add -A
git status
# Only commit if there are changes
git commit -m "chore: deploy Phase 2 community features to production"
```

---

## Summary

| Task | What | Key Files |
|------|------|-----------|
| 1 | Install next-auth | `package.json` |
| 2 | Auth + community schema | `prisma/schema.prisma` |
| 3 | NextAuth.js config | `src/lib/auth.ts`, `src/app/api/auth/` |
| 4 | Sign-in page + user menu | `src/app/auth/`, `src/components/auth/`, header |
| 5 | Reactions API | `src/lib/queries/reactions.ts`, API route |
| 6 | Reactions UI | `src/components/episodes/reaction-bar.tsx` |
| 7 | Comments API + moderation | `src/lib/moderation.ts`, `src/lib/queries/comments.ts`, API routes |
| 8 | Comments UI | `src/components/episodes/comment-section.tsx` |
| 9 | Admin moderation API | `src/app/api/admin/comments/` |
| 10 | Episode OG images | `src/app/episodes/[slug]/opengraph-image.tsx` |
| 11 | Quote cards + share | `src/app/quotes/[id]/og/`, `src/components/quotes/` |
| 12 | Deploy to production | Neon push, Vercel env vars, deploy |
