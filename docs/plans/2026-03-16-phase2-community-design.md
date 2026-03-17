# Phase 2: Community Layer — Design Document

**Goal:** Transform CultCodex from a read-only archive into an interactive community hub with authentication, reactions, comments, and social sharing.

**Audience:** Both existing Cult of Psyche viewers and new discoverers arriving via search/social.

---

## Section 1: Authentication

**Approach:** NextAuth.js v5 with database session strategy (Postgres).

**Providers:**
- Google OAuth — one-click sign-in, covers most users
- Email magic link — fallback for users who prefer not to use Google

**Schema — new models:**

```prisma
model CodexUser {
  id          String   @id @default(cuid())
  email       String   @unique
  displayName String
  avatarUrl   String?
  provider    String   // "google" | "email"
  role        CodexUserRole @default(user)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

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

enum CodexUserRole {
  user
  moderator
  admin
}
```

**Key decisions:**
- Named `CodexUser` (not `User`) to avoid collision with any future models
- Database sessions (not JWT) since we already have Postgres
- Minimal profile — no user profile pages in Phase 2
- Role system supports future moderator features

---

## Section 2: Episode Reactions

**Reaction set (5 on-brand emojis):**
- 🔥 `fire` — "this was heat"
- 👁️ `eye` — "eye-opening"
- 🌙 `moon` — "mystical/spiritual"
- 💀 `skull` — "dead/hilarious"
- 🃏 `wildcard` — "chaotic/unexpected"

**Schema:**

```prisma
enum ReactionType {
  fire
  eye
  moon
  skull
  wildcard
}

model EpisodeReaction {
  userId       String
  episodeId    String
  reactionType ReactionType
  user         CodexUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  episode      Episode   @relation(fields: [episodeId], references: [id], onDelete: Cascade)
  createdAt    DateTime  @default(now())

  @@id([userId, episodeId, reactionType])
}
```

**Behavior:**
- One reaction per type per user per episode (toggle on/off)
- Users can apply multiple different reaction types to same episode
- Reaction bar appears below video embed on episode pages
- Shows aggregated counts for each emoji type
- Anonymous visitors see counts but get "Sign in to react" tooltip
- Optimistic UI updates (toggle immediately, sync to server)

**API:**
- `POST /api/episodes/[slug]/reactions` — body: `{ type: "fire" }` — toggles reaction
- Response includes updated counts for all reaction types

---

## Section 3: Episode Comments

**Schema:**

```prisma
model CodexComment {
  id             String    @id @default(cuid())
  content        String    // max 2000 chars, enforced in API
  userId         String
  user           CodexUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  episodeId      String
  episode        Episode   @relation(fields: [episodeId], references: [id], onDelete: Cascade)
  parentId       String?
  parent         CodexComment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies        CodexComment[] @relation("CommentReplies")
  flagged        Boolean   @default(false)
  flaggedReason  String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  reports        CommentReport[]

  @@index([episodeId])
  @@index([userId])
  @@index([parentId])
}

model CommentReport {
  id        String    @id @default(cuid())
  commentId String
  comment   CodexComment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  userId    String
  user      CodexUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  reason    String
  createdAt DateTime  @default(now())

  @@unique([commentId, userId])
}
```

**Threading:** One level deep only — replies to top-level comments, no nested replies.

**Moderation (AI-assisted):**
1. On comment submit, send text to Claude Haiku: "Is this comment spam, hate speech, or abusive? Reply YES or NO only."
2. If YES → `flagged: true`, hidden from public view, queued for admin review
3. If NO → published immediately, visible to all
4. Cost: ~$0.0001 per comment (negligible)
5. Users can also report comments → adds to admin review queue

**UI on episode page:**
- Comment section after Related Episodes section
- Shows comment count in section header ("Comments (12)")
- Each comment: avatar, display name, relative timestamp ("2h ago"), content, reply button
- Replies indented one level under parent
- "Sign in to comment" prompt for anonymous visitors
- Newest-first ordering

**API:**
- `GET /api/episodes/[slug]/comments` — list comments with replies (public, paginated)
- `POST /api/episodes/[slug]/comments` — create comment (auth required), body: `{ content, parentId? }`
- `POST /api/comments/[id]/report` — flag a comment (auth required), body: `{ reason }`
- `GET /api/admin/comments?flagged=true` — admin review queue (admin role required)
- `PATCH /api/admin/comments/[id]` — approve/delete flagged comment (admin role required)

---

## Section 4: Social Sharing — OG Images & Quote Cards

**Episode OG images:**
- Auto-generated via Next.js `opengraph-image.tsx` convention in `src/app/episodes/[slug]/`
- Uses `ImageResponse` API (built into Next.js, edge-rendered, CDN-cached)
- Layout: Sacred Terminal dark background (#0A0A0F), episode number badge in gold, title in parchment, series name, air date, CultCodex logo/wordmark
- Size: 1200x630px (Twitter/Facebook standard)
- When shared on social media → rich preview card automatically

**Shareable quote cards:**
- Route: `src/app/quotes/[id]/card.png/route.ts` (or `opengraph-image.tsx`)
- Layout: Dark background, large gold quotation marks, quote text in parchment/serif, speaker name in gold, episode reference in muted, CultCodex branding bottom-right
- "Share" button on every quote in episode pages and search results
- Click copies the quote card URL to clipboard
- URL works as OG image when pasted in Twitter/Discord/WhatsApp

**Implementation:** `ImageResponse` from `next/og` — zero external dependencies, generates PNG on the edge.

---

## Non-Goals (Phase 2)

- User profile pages
- Comment voting/scoring
- Clip creation/editing
- Email notifications for replies
- Comment editing/deletion by users
- Rate limiting (defer to Phase 3 if needed)
