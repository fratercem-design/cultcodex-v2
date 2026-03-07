# CultCodex v2: Matrix Archive — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build CultCodex v2 from foundation through vertical slice (Phases 0–3), delivering a working episode archive with person pages, lore pages, transcript viewer, and search.

**Architecture:** Next.js 14+ App Router with server components for data-fetching pages. Prisma ORM connects to a local PostgreSQL 18 instance (native install — Docker not available on this machine). shadcn/ui provides accessible primitives; Tailwind CSS with custom design tokens creates the matrix-noir aesthetic. Vitest handles unit/component tests.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS 3, shadcn/ui, Prisma 5, PostgreSQL 18, Vitest, React Testing Library

**Project Root:** `C:\Users\John Bates\Projects\cultcodex-v2`

**Reference:** `docs/plans/2026-03-07-cultcodex-v2-design.md`

---

## Phase 0 — Foundation

### Task 1: Scaffold Next.js Project

**Files:**
- Create: entire project scaffold via `create-next-app`

**Step 1: Run create-next-app**

```bash
cd "C:\Users\John Bates\Projects"
npx create-next-app@latest cultcodex-v2-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

> **Note:** We scaffold into a temp name (`cultcodex-v2-app`) then move contents into the existing `cultcodex-v2` directory which already has our `docs/` folder and git history.

**Step 2: Move scaffold contents into project root**

```bash
# Copy scaffold contents (except .git) into the existing project
cd "C:\Users\John Bates\Projects"
xcopy /E /I /Y cultcodex-v2-app\* cultcodex-v2\
xcopy /E /I /H /Y cultcodex-v2-app\.eslintrc.json cultcodex-v2\
rmdir /S /Q cultcodex-v2-app
```

**Step 3: Verify scaffold works**

```bash
cd "C:\Users\John Bates\Projects\cultcodex-v2"
npm run dev
```

Expected: Next.js dev server starts on http://localhost:3000, shows default page.
Stop the server with Ctrl+C.

**Step 4: Commit**

```bash
cd "C:\Users\John Bates\Projects\cultcodex-v2"
git add -A
git commit -m "feat: scaffold Next.js 14 project with TypeScript and Tailwind"
```

---

### Task 2: Install Core Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install production dependencies**

```bash
cd "C:\Users\John Bates\Projects\cultcodex-v2"
npm install prisma @prisma/client clsx tailwind-merge lucide-react class-variance-authority
```

**Step 2: Install dev dependencies**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @types/node tsx
```

**Step 3: Verify install**

```bash
npx prisma --version
npx vitest --version
```

Expected: Prisma CLI version prints. Vitest version prints.

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install Prisma, Vitest, shadcn utilities, and dev dependencies"
```

---

### Task 3: Create .gitignore and Environment Files

**Files:**
- Create: `.gitignore`
- Create: `.env`
- Create: `.env.example`

**Step 1: Write .gitignore**

Ensure the generated `.gitignore` includes these additional entries (append if needed):

```
# Environment
.env
.env.local
.env.production

# Prisma
prisma/migrations/**/migration_lock.toml

# IDE
.idea/
.vscode/
*.swp

# OS
Thumbs.db
.DS_Store
```

**Step 2: Create .env with database URL**

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cultcodex_v2?schema=public"
```

**Step 3: Create .env.example**

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/cultcodex_v2?schema=public"
```

**Step 4: Commit**

```bash
git add .gitignore .env.example
git commit -m "chore: add .gitignore and .env.example"
```

> **Note:** `.env` itself is gitignored — only `.env.example` is committed.

---

### Task 4: Set Up PostgreSQL Database

**Files:**
- None (system-level setup)

**Step 1: Check if PostgreSQL is already running**

```bash
psql --version
```

If `psql` is available, skip to Step 3.

**Step 2: Install PostgreSQL 18 (if not installed)**

The installer is at `C:\Users\John Bates\postgresql_18.exe`. Run it:
- Use default port 5432
- Set superuser password to `postgres`
- Accept default locale
- Finish and ensure the service starts

After install, add PostgreSQL bin dir to PATH (usually `C:\Program Files\PostgreSQL\18\bin`):

```bash
# Verify
psql --version
```

Expected: `psql (PostgreSQL) 18.x`

**Step 3: Create the database**

```bash
psql -U postgres -c "CREATE DATABASE cultcodex_v2;"
```

Enter password `postgres` when prompted.

**Step 4: Verify connection**

```bash
psql -U postgres -d cultcodex_v2 -c "SELECT 1 AS connected;"
```

Expected: Returns `1` in the `connected` column.

---

### Task 5: Initialize Prisma

**Files:**
- Create: `prisma/schema.prisma`

**Step 1: Initialize Prisma**

```bash
cd "C:\Users\John Bates\Projects\cultcodex-v2"
npx prisma init
```

Expected: Creates `prisma/schema.prisma` with default content and updates `.env`.

**Step 2: Verify the generated schema has correct datasource**

Open `prisma/schema.prisma` and confirm it contains:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Step 3: Test connection**

```bash
npx prisma db pull
```

Expected: Completes without error (empty schema since DB is fresh).

**Step 4: Commit**

```bash
git add prisma/
git commit -m "feat: initialize Prisma with PostgreSQL datasource"
```

---

### Task 6: Write Prisma Schema — Enums and Core Models

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Replace schema content with enums and core models**

Write the full schema to `prisma/schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ───────────────────────────────────────────

enum ContentStatus {
  draft
  published
  archived
}

enum PersonType {
  guest
  host
  mentioned
  recurring
}

enum CanonStatus {
  canonical
  speculative
  community_myth
  disputed
  humorous
}

enum SeriesType {
  music_video
  panel
  tarot
  story
  documentary
  other
}

enum MediaType {
  video
  audio
  article
}

// ─── Core Models ─────────────────────────────────────

model Episode {
  id              String        @id @default(cuid())
  title           String
  slug            String        @unique
  episodeNumber   Int?          @unique
  airDate         DateTime?
  duration        String?
  youtubeVideoId  String?
  thumbnailUrl    String?
  summaryShort    String?
  summaryLong     String?
  cutOfPsyche     String?
  transcriptRaw   String?
  transcriptHtml  String?
  transcriptJson  Json?
  searchText      String?
  status          ContentStatus @default(draft)
  seriesId        String?
  series          Series?       @relation(fields: [seriesId], references: [id])
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  // Relations
  segments           TranscriptSegment[]
  quotes             Quote[]
  guests             EpisodeGuest[]
  mentionedPeople    EpisodeMentionedPerson[]
  loreEntries        EpisodeLore[]
  topics             EpisodeTopic[]
  relatedFrom        RelatedEpisode[]  @relation("relatedFrom")
  relatedTo          RelatedEpisode[]  @relation("relatedTo")
  firstAppearanceOf  Person[]          @relation("firstAppearance")
  firstMentionOf     LoreEntry[]       @relation("firstMention")

  @@index([airDate])
  @@index([status])
}

model Series {
  id            String       @id @default(cuid())
  title         String
  slug          String       @unique
  description   String?
  type          SeriesType   @default(other)
  coverImageUrl String?
  sortOrder     Int          @default(0)
  status        ContentStatus @default(draft)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  episodes   Episode[]
  mediaItems MediaItem[]
}

model Person {
  id                       String     @id @default(cuid())
  displayName              String
  slug                     String     @unique
  altNames                 String[]
  shortBio                 String?
  loreSummary              String?
  avatarUrl                String?
  personType               PersonType @default(guest)
  searchText               String?
  firstAppearanceEpisodeId String?
  firstAppearanceEpisode   Episode?   @relation("firstAppearance", fields: [firstAppearanceEpisodeId], references: [id])
  createdAt                DateTime   @default(now())
  updatedAt                DateTime   @updatedAt

  // Relations
  quotes             Quote[]
  guestAppearances   EpisodeGuest[]
  mentions           EpisodeMentionedPerson[]
  topics             PersonTopic[]
  loreConnections    PersonLore[]
  relatedFrom        RelatedPerson[] @relation("relatedPersonFrom")
  relatedTo          RelatedPerson[] @relation("relatedPersonTo")

  @@index([personType])
}

model LoreEntry {
  id                    String      @id @default(cuid())
  title                 String
  slug                  String      @unique
  category              String?
  summary               String?
  fullEntry             String?
  canonStatus           CanonStatus @default(speculative)
  searchText            String?
  firstMentionEpisodeId String?
  firstMentionEpisode   Episode?    @relation("firstMention", fields: [firstMentionEpisodeId], references: [id])
  createdAt             DateTime    @default(now())
  updatedAt             DateTime    @updatedAt

  // Relations
  episodes        EpisodeLore[]
  people          PersonLore[]
  topics          LoreTopic[]
  relatedFrom     RelatedLore[] @relation("relatedLoreFrom")
  relatedTo       RelatedLore[] @relation("relatedLoreTo")

  @@index([canonStatus])
}

model Topic {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  episodes  EpisodeTopic[]
  people    PersonTopic[]
  lore      LoreTopic[]
}

model Quote {
  id                   String   @id @default(cuid())
  text                 String
  speakerPersonId      String?
  speaker              Person?  @relation(fields: [speakerPersonId], references: [id])
  episodeId            String?
  episode              Episode? @relation(fields: [episodeId], references: [id])
  transcriptSegmentId  String?
  transcriptSegment    TranscriptSegment? @relation(fields: [transcriptSegmentId], references: [id])
  timestampSeconds     Int?
  context              String?
  significance         String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([speakerPersonId])
  @@index([episodeId])
}

model TranscriptSegment {
  id           String   @id @default(cuid())
  episodeId    String
  episode      Episode  @relation(fields: [episodeId], references: [id], onDelete: Cascade)
  startSeconds Int
  endSeconds   Int
  speakerLabel String?
  text         String
  searchText   String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  quotes Quote[]

  @@index([episodeId])
  @@index([startSeconds])
}

model MediaItem {
  id              String      @id @default(cuid())
  title           String
  slug            String      @unique
  type            MediaType   @default(video)
  youtubeVideoId  String?
  transcriptRaw   String?
  summary         String?
  seriesId        String?
  series          Series?     @relation(fields: [seriesId], references: [id])
  releaseDate     DateTime?
  durationSeconds Int?
  status          ContentStatus @default(draft)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([seriesId])
}

// ─── Join Tables ─────────────────────────────────────

model EpisodeGuest {
  episodeId String
  personId  String
  episode   Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)
  person    Person  @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@id([episodeId, personId])
}

model EpisodeMentionedPerson {
  episodeId String
  personId  String
  episode   Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)
  person    Person  @relation(fields: [personId], references: [id], onDelete: Cascade)

  @@id([episodeId, personId])
}

model EpisodeLore {
  episodeId   String
  loreEntryId String
  episode     Episode   @relation(fields: [episodeId], references: [id], onDelete: Cascade)
  loreEntry   LoreEntry @relation(fields: [loreEntryId], references: [id], onDelete: Cascade)

  @@id([episodeId, loreEntryId])
}

model EpisodeTopic {
  episodeId String
  topicId   String
  episode   Episode @relation(fields: [episodeId], references: [id], onDelete: Cascade)
  topic     Topic   @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([episodeId, topicId])
}

model PersonTopic {
  personId String
  topicId  String
  person   Person @relation(fields: [personId], references: [id], onDelete: Cascade)
  topic    Topic  @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([personId, topicId])
}

model PersonLore {
  personId    String
  loreEntryId String
  person      Person    @relation(fields: [personId], references: [id], onDelete: Cascade)
  loreEntry   LoreEntry @relation(fields: [loreEntryId], references: [id], onDelete: Cascade)

  @@id([personId, loreEntryId])
}

model LoreTopic {
  loreEntryId String
  topicId     String
  loreEntry   LoreEntry @relation(fields: [loreEntryId], references: [id], onDelete: Cascade)
  topic       Topic     @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([loreEntryId, topicId])
}

model RelatedEpisode {
  episodeAId String
  episodeBId String
  episodeA   Episode @relation("relatedFrom", fields: [episodeAId], references: [id], onDelete: Cascade)
  episodeB   Episode @relation("relatedTo", fields: [episodeBId], references: [id], onDelete: Cascade)

  @@id([episodeAId, episodeBId])
}

model RelatedPerson {
  personAId String
  personBId String
  personA   Person @relation("relatedPersonFrom", fields: [personAId], references: [id], onDelete: Cascade)
  personB   Person @relation("relatedPersonTo", fields: [personBId], references: [id], onDelete: Cascade)

  @@id([personAId, personBId])
}

model RelatedLore {
  loreAId String
  loreBId String
  loreA   LoreEntry @relation("relatedLoreFrom", fields: [loreAId], references: [id], onDelete: Cascade)
  loreB   LoreEntry @relation("relatedLoreTo", fields: [loreBId], references: [id], onDelete: Cascade)

  @@id([loreAId, loreBId])
}
```

**Step 2: Validate the schema**

```bash
cd "C:\Users\John Bates\Projects\cultcodex-v2"
npx prisma validate
```

Expected: `The schema at prisma/schema.prisma is valid.`

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: write complete Prisma schema with all models, enums, and join tables"
```

---

### Task 7: Configure Tailwind Design Tokens

**Files:**
- Modify: `tailwind.config.ts`
- Create: `src/app/globals.css` (modify existing)

**Step 1: Update tailwind.config.ts with design tokens**

Replace `tailwind.config.ts` with:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#0a0a0a",
        surface: "#141414",
        elevated: "#1c1c1c",
        border: "#2a2a2a",
        "text-primary": "#e8e8e8",
        "text-muted": "#6b6b6b",
        accent: {
          green: "#39ff14",
          "green-dim": "rgba(57, 255, 20, 0.2)",
          purple: "#b44aff",
          "purple-dim": "rgba(180, 74, 255, 0.13)",
          gold: "#c9a227",
        },
      },
      fontFamily: {
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "monospace"],
        sans: ["var(--font-geist)", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "scanline": "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(57, 255, 20, 0.03) 2px, rgba(57, 255, 20, 0.03) 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

**Step 2: Update globals.css with CSS custom properties**

Replace `src/app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --bg-void: #0a0a0a;
    --bg-surface: #141414;
    --bg-elevated: #1c1c1c;
    --border: #2a2a2a;
    --text-primary: #e8e8e8;
    --text-muted: #6b6b6b;
    --accent-green: #39ff14;
    --accent-green-dim: rgba(57, 255, 20, 0.2);
    --accent-purple: #b44aff;
    --accent-purple-dim: rgba(180, 74, 255, 0.13);
    --accent-gold: #c9a227;

    --background: var(--bg-void);
    --foreground: var(--text-primary);
  }

  body {
    background-color: var(--bg-void);
    color: var(--text-primary);
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  ::selection {
    background-color: var(--accent-green-dim);
    color: var(--accent-green);
  }
}

@layer utilities {
  .glow-green {
    box-shadow: 0 0 8px rgba(57, 255, 20, 0.3), 0 0 24px rgba(57, 255, 20, 0.1);
  }

  .glow-purple {
    box-shadow: 0 0 8px rgba(180, 74, 255, 0.3), 0 0 24px rgba(180, 74, 255, 0.1);
  }

  .border-glow-green {
    border-color: var(--accent-green);
    box-shadow: 0 0 4px rgba(57, 255, 20, 0.2);
  }
}
```

**Step 3: Install tailwindcss-animate**

```bash
npm install tailwindcss-animate
```

**Step 4: Verify build**

```bash
npm run build
```

Expected: Build succeeds without errors.

**Step 5: Commit**

```bash
git add tailwind.config.ts src/app/globals.css package.json package-lock.json
git commit -m "feat: configure Tailwind with matrix-noir design tokens and custom utilities"
```

---

### Task 8: Set Up Fonts

**Files:**
- Modify: `src/app/layout.tsx`

**Step 1: Update layout.tsx with JetBrains Mono and Geist fonts**

Replace `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CultCodex — Matrix Archive",
  description: "The sacred intelligence terminal of the Cult of Psyche",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrains.variable} ${geist.variable} font-sans antialiased bg-void text-text-primary min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
```

> **Note:** `create-next-app` with `--tailwind` includes `GeistVF.woff` in `src/app/fonts/`. If it's named differently (e.g. `GeistSans`), adjust the import path accordingly.

**Step 2: Verify dev server starts**

```bash
npm run dev
```

Expected: Dev server starts, no font errors in console. Stop with Ctrl+C.

**Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: set up JetBrains Mono and Geist fonts"
```

---

### Task 9: Set Up shadcn/ui

**Files:**
- Create: `components.json`
- Create: `src/lib/utils.ts`

**Step 1: Initialize shadcn/ui**

```bash
cd "C:\Users\John Bates\Projects\cultcodex-v2"
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Neutral**
- CSS variables: **Yes**
- `tailwind.config.ts` location: **tailwind.config.ts**
- `globals.css` location: **src/app/globals.css**
- Components alias: **@/components**
- Utils alias: **@/lib/utils**
- React Server Components: **Yes**

**Step 2: Install a starter component to verify**

```bash
npx shadcn@latest add button badge separator
```

**Step 3: Verify components exist**

```bash
ls src/components/ui/
```

Expected: `button.tsx`, `badge.tsx`, `separator.tsx` present.

**Step 4: Commit**

```bash
git add components.json src/lib/utils.ts src/components/ tailwind.config.ts src/app/globals.css
git commit -m "feat: initialize shadcn/ui with button, badge, separator components"
```

---

### Task 10: Set Up Vitest

**Files:**
- Create: `vitest.config.ts`
- Create: `src/__tests__/setup.ts`
- Create: `src/__tests__/smoke.test.ts`

**Step 1: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**Step 2: Create test setup file**

`src/__tests__/setup.ts`:

```typescript
import "@testing-library/jest-dom/vitest";
```

**Step 3: Write a smoke test**

`src/__tests__/smoke.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("Smoke test", () => {
  it("runs vitest successfully", () => {
    expect(1 + 1).toBe(2);
  });
});
```

**Step 4: Add test script to package.json**

Add to `"scripts"` in `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 5: Run the smoke test**

```bash
npm test
```

Expected: 1 test passes.

**Step 6: Commit**

```bash
git add vitest.config.ts src/__tests__/ package.json
git commit -m "feat: set up Vitest with smoke test"
```

---

### Task 11: Create Prisma Client Singleton and Run Migration

**Files:**
- Create: `src/lib/db.ts`
- Create: `prisma/migrations/` (auto-generated)

**Step 1: Create Prisma client singleton**

`src/lib/db.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

**Step 2: Run initial migration**

```bash
cd "C:\Users\John Bates\Projects\cultcodex-v2"
npx prisma migrate dev --name init
```

Expected: Migration created, Prisma Client generated.

**Step 3: Verify generated client works**

```bash
npx prisma studio
```

Expected: Prisma Studio opens in browser, shows all tables. Close it (Ctrl+C).

**Step 4: Commit**

```bash
git add src/lib/db.ts prisma/migrations/
git commit -m "feat: create Prisma client singleton and run initial migration"
```

---

## Phase 1 — App Shell

### Task 12: Create cn() Utility and Shared Types

**Files:**
- Modify: `src/lib/utils.ts` (may already exist from shadcn)
- Create: `src/types/index.ts`

**Step 1: Ensure cn() utility exists**

Verify `src/lib/utils.ts` contains (shadcn usually creates this):

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Step 2: Create shared types**

`src/types/index.ts`:

```typescript
export type EntityType = "episode" | "person" | "lore" | "topic" | "series" | "quote";

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}

export interface ArchiveStats {
  episodes: number;
  people: number;
  loreEntries: number;
  quotes: number;
  series: number;
  topics: number;
}
```

**Step 3: Commit**

```bash
git add src/lib/utils.ts src/types/
git commit -m "feat: add shared types and verify cn() utility"
```

---

### Task 13: Build Site Header

**Files:**
- Create: `src/components/layout/site-header.tsx`

**Step 1: Write the failing test**

`src/components/layout/__tests__/site-header.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteHeader } from "../site-header";

describe("SiteHeader", () => {
  it("renders the archive name", () => {
    render(<SiteHeader />);
    expect(screen.getByText("CULTCODEX")).toBeInTheDocument();
  });

  it("renders navigation links", () => {
    render(<SiteHeader />);
    expect(screen.getByRole("link", { name: /episodes/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /people/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /lore/i })).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/layout/__tests__/site-header.test.tsx
```

Expected: FAIL — `site-header` module not found.

**Step 3: Write implementation**

`src/components/layout/site-header.tsx`:

```tsx
import Link from "next/link";

const navItems = [
  { label: "Episodes", href: "/episodes" },
  { label: "People", href: "/people" },
  { label: "Lore", href: "/lore" },
  { label: "Series", href: "/series" },
  { label: "Quotes", href: "/quotes" },
  { label: "Topics", href: "/topics" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-void/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-mono text-sm font-bold tracking-widest text-accent-green"
        >
          CULTCODEX
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-mono text-xs uppercase tracking-wider text-text-muted hover:text-accent-green transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          className="font-mono text-xs text-text-muted hover:text-accent-green border border-border rounded px-3 py-1 transition-colors"
          aria-label="Search the archive"
        >
          ⌘K Search
        </button>
      </div>
    </header>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/layout/__tests__/site-header.test.tsx
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/components/layout/
git commit -m "feat: build site header with navigation and search trigger"
```

---

### Task 14: Build Site Footer

**Files:**
- Create: `src/components/layout/site-footer.tsx`

**Step 1: Write the failing test**

`src/components/layout/__tests__/site-footer.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteFooter } from "../site-footer";

describe("SiteFooter", () => {
  it("renders archive identity", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/cult of psyche/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/layout/__tests__/site-footer.test.tsx
```

Expected: FAIL.

**Step 3: Write implementation**

`src/components/layout/site-footer.tsx`:

```tsx
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-void py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-mono text-xs text-text-muted">
            CULT OF PSYCHE — MATRIX ARCHIVE
          </p>
          <p className="font-mono text-[10px] text-text-muted/50">
            CultCodex v2 · The sacred intelligence terminal
          </p>
        </div>
      </div>
    </footer>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/layout/__tests__/site-footer.test.tsx
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/layout/
git commit -m "feat: build site footer"
```

---

### Task 15: Create Shared UI Primitives — PageShell, SectionCard, TerminalPanel

**Files:**
- Create: `src/components/ui/page-shell.tsx`
- Create: `src/components/ui/section-card.tsx`
- Create: `src/components/ui/terminal-panel.tsx`

**Step 1: Write tests**

`src/components/ui/__tests__/primitives.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageShell } from "../page-shell";
import { SectionCard } from "../section-card";
import { TerminalPanel } from "../terminal-panel";

describe("PageShell", () => {
  it("renders title and children", () => {
    render(
      <PageShell title="Test Page" subtitle="A test page">
        <p>Content</p>
      </PageShell>
    );
    expect(screen.getByText("Test Page")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});

describe("SectionCard", () => {
  it("renders title and children", () => {
    render(
      <SectionCard title="Card Title">
        <p>Card content</p>
      </SectionCard>
    );
    expect(screen.getByText("Card Title")).toBeInTheDocument();
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });
});

describe("TerminalPanel", () => {
  it("renders with header and content", () => {
    render(
      <TerminalPanel header="SYS::LOG">
        <p>Terminal content</p>
      </TerminalPanel>
    );
    expect(screen.getByText("SYS::LOG")).toBeInTheDocument();
    expect(screen.getByText("Terminal content")).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/ui/__tests__/primitives.test.tsx
```

Expected: FAIL.

**Step 3: Write implementations**

`src/components/ui/page-shell.tsx`:

```tsx
interface PageShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function PageShell({ title, subtitle, children }: PageShellProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-mono text-2xl font-bold tracking-tight text-accent-green">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 font-mono text-sm text-text-muted">{subtitle}</p>
        )}
      </div>
      {children}
    </main>
  );
}
```

`src/components/ui/section-card.tsx`:

```tsx
import { cn } from "@/lib/utils";

interface SectionCardProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export function SectionCard({ title, className, children }: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-4",
        className
      )}
    >
      {title && (
        <h3 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
```

`src/components/ui/terminal-panel.tsx`:

```tsx
import { cn } from "@/lib/utils";

interface TerminalPanelProps {
  header?: string;
  className?: string;
  children: React.ReactNode;
}

export function TerminalPanel({ header, className, children }: TerminalPanelProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-accent-green/20 bg-void overflow-hidden",
        className
      )}
    >
      {header && (
        <div className="border-b border-accent-green/20 bg-accent-green-dim px-4 py-2">
          <span className="font-mono text-xs font-bold text-accent-green">
            {header}
          </span>
        </div>
      )}
      <div className="p-4 font-mono text-sm">{children}</div>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/ui/__tests__/primitives.test.tsx
```

Expected: All 3 tests PASS.

**Step 5: Commit**

```bash
git add src/components/ui/page-shell.tsx src/components/ui/section-card.tsx src/components/ui/terminal-panel.tsx src/components/ui/__tests__/
git commit -m "feat: add PageShell, SectionCard, TerminalPanel UI primitives"
```

---

### Task 16: Create More UI Primitives — StatusBadge, MetaRow, EmptyState

**Files:**
- Create: `src/components/ui/status-badge.tsx`
- Create: `src/components/ui/meta-row.tsx`
- Create: `src/components/ui/empty-state.tsx`

**Step 1: Write tests**

`src/components/ui/__tests__/more-primitives.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "../status-badge";
import { MetaRow } from "../meta-row";
import { EmptyState } from "../empty-state";

describe("StatusBadge", () => {
  it("renders label text", () => {
    render(<StatusBadge label="Published" variant="green" />);
    expect(screen.getByText("Published")).toBeInTheDocument();
  });
});

describe("MetaRow", () => {
  it("renders label and value", () => {
    render(<MetaRow label="Air Date" value="2024-01-15" />);
    expect(screen.getByText("Air Date")).toBeInTheDocument();
    expect(screen.getByText("2024-01-15")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders message", () => {
    render(<EmptyState message="No episodes found" />);
    expect(screen.getByText("No episodes found")).toBeInTheDocument();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/components/ui/__tests__/more-primitives.test.tsx
```

Expected: FAIL.

**Step 3: Write implementations**

`src/components/ui/status-badge.tsx`:

```tsx
import { cn } from "@/lib/utils";

type BadgeVariant = "green" | "purple" | "gold" | "muted";

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: "border-accent-green/30 text-accent-green bg-accent-green-dim",
  purple: "border-accent-purple/30 text-accent-purple bg-accent-purple-dim",
  gold: "border-accent-gold/30 text-accent-gold bg-accent-gold/10",
  muted: "border-border text-text-muted bg-surface",
};

export function StatusBadge({ label, variant = "muted" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider",
        variantStyles[variant]
      )}
    >
      {label}
    </span>
  );
}
```

`src/components/ui/meta-row.tsx`:

```tsx
interface MetaRowProps {
  label: string;
  value: React.ReactNode;
}

export function MetaRow({ label, value }: MetaRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
      <span className="font-mono text-xs text-text-muted shrink-0">{label}</span>
      <span className="font-mono text-xs text-text-primary text-right">{value}</span>
    </div>
  );
}
```

`src/components/ui/empty-state.tsx`:

```tsx
interface EmptyStateProps {
  message: string;
  suggestion?: string;
}

export function EmptyState({ message, suggestion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="font-mono text-sm text-text-muted">{message}</p>
      {suggestion && (
        <p className="mt-2 font-mono text-xs text-text-muted/60">{suggestion}</p>
      )}
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/components/ui/__tests__/more-primitives.test.tsx
```

Expected: All 3 tests PASS.

**Step 5: Commit**

```bash
git add src/components/ui/status-badge.tsx src/components/ui/meta-row.tsx src/components/ui/empty-state.tsx src/components/ui/__tests__/
git commit -m "feat: add StatusBadge, MetaRow, EmptyState UI primitives"
```

---

### Task 17: Integrate Layout Shell into Root Layout

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Update root layout to use SiteHeader and SiteFooter**

Update `src/app/layout.tsx` to import and render the header/footer:

```tsx
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CultCodex — Matrix Archive",
  description: "The sacred intelligence terminal of the Cult of Psyche",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrains.variable} ${geist.variable} font-sans antialiased bg-void text-text-primary min-h-screen flex flex-col`}
      >
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
```

**Step 2: Create a placeholder homepage**

Replace `src/app/page.tsx` with:

```tsx
import { PageShell } from "@/components/ui/page-shell";
import { TerminalPanel } from "@/components/ui/terminal-panel";

export default function HomePage() {
  return (
    <PageShell
      title="MATRIX ARCHIVE"
      subtitle="The sacred intelligence terminal of the Cult of Psyche"
    >
      <TerminalPanel header="SYS::STATUS">
        <p className="text-accent-green">Archive online. Loading data feeds...</p>
        <p className="mt-2 text-text-muted">
          Episodes: — · People: — · Lore: — · Quotes: —
        </p>
      </TerminalPanel>
    </PageShell>
  );
}
```

**Step 3: Verify dev server renders the shell**

```bash
npm run dev
```

Expected: Homepage shows header with CULTCODEX, nav links, the terminal panel, and footer. Stop with Ctrl+C.

**Step 4: Run all tests**

```bash
npm test
```

Expected: All tests pass.

**Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx
git commit -m "feat: integrate layout shell with header, footer, and placeholder homepage"
```

---

## Phase 2 — Database

### Task 18: Create Seed Data Script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add prisma seed config)

**Step 1: Write the seed script**

`prisma/seed.ts`:

```typescript
import { PrismaClient, ContentStatus, PersonType, CanonStatus, SeriesType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create a series
  const mainSeries = await prisma.series.create({
    data: {
      title: "The Cult of Psyche",
      slug: "cult-of-psyche",
      description: "The main livestream series exploring consciousness, tarot, and the mysteries of the psyche.",
      type: SeriesType.panel,
      sortOrder: 1,
      status: ContentStatus.published,
    },
  });

  // Create people
  const host = await prisma.person.create({
    data: {
      displayName: "Psyche",
      slug: "psyche",
      shortBio: "Host of the Cult of Psyche.",
      personType: PersonType.host,
      searchText: "psyche host cult",
    },
  });

  const guest1 = await prisma.person.create({
    data: {
      displayName: "Dr. Arcana",
      slug: "dr-arcana",
      altNames: ["The Doctor", "Arcana"],
      shortBio: "Recurring guest and occult scholar.",
      personType: PersonType.recurring,
      searchText: "dr arcana doctor occult scholar",
    },
  });

  const guest2 = await prisma.person.create({
    data: {
      displayName: "Luna Veil",
      slug: "luna-veil",
      shortBio: "Tarot reader and consciousness researcher.",
      personType: PersonType.guest,
      searchText: "luna veil tarot consciousness",
    },
  });

  // Create topics
  const topicTarot = await prisma.topic.create({
    data: { title: "Tarot", slug: "tarot", description: "Tarot card readings, symbolism, and divination." },
  });

  const topicConsciousness = await prisma.topic.create({
    data: { title: "Consciousness", slug: "consciousness", description: "Exploration of awareness, perception, and the mind." },
  });

  const topicMythology = await prisma.topic.create({
    data: { title: "Mythology", slug: "mythology", description: "Ancient myths, archetypes, and storytelling." },
  });

  // Create lore entries
  const lore1 = await prisma.loreEntry.create({
    data: {
      title: "The Psyche Protocol",
      slug: "psyche-protocol",
      category: "doctrine",
      summary: "The founding principles of the Cult of Psyche.",
      canonStatus: CanonStatus.canonical,
      searchText: "psyche protocol founding principles doctrine",
    },
  });

  const lore2 = await prisma.loreEntry.create({
    data: {
      title: "The Veil Theory",
      slug: "veil-theory",
      category: "concept",
      summary: "The hypothesis that reality consists of layered veils of perception.",
      canonStatus: CanonStatus.speculative,
      searchText: "veil theory reality perception layers",
    },
  });

  // Create episodes
  const ep1 = await prisma.episode.create({
    data: {
      title: "Welcome to the Cult",
      slug: "welcome-to-the-cult",
      episodeNumber: 1,
      airDate: new Date("2023-01-15"),
      duration: "2:15:30",
      summaryShort: "The inaugural episode establishing the Cult of Psyche.",
      summaryLong: "In this first episode, Psyche introduces the mission of the Cult — to explore consciousness, tarot, and the hidden architecture of reality. Dr. Arcana joins as the first guest.",
      status: ContentStatus.published,
      seriesId: mainSeries.id,
      searchText: "welcome cult inaugural first episode psyche arcana",
      guests: { create: [{ personId: guest1.id }] },
      topics: { create: [{ topicId: topicConsciousness.id }, { topicId: topicTarot.id }] },
      loreEntries: { create: [{ loreEntryId: lore1.id }] },
    },
  });

  const ep2 = await prisma.episode.create({
    data: {
      title: "Beyond the Veil",
      slug: "beyond-the-veil",
      episodeNumber: 2,
      airDate: new Date("2023-01-22"),
      duration: "1:45:00",
      summaryShort: "Luna Veil explores perception and the nature of reality.",
      summaryLong: "Luna Veil joins to discuss her Veil Theory — the idea that reality consists of layered veils of perception that can be traversed through altered states of consciousness.",
      status: ContentStatus.published,
      seriesId: mainSeries.id,
      searchText: "beyond veil luna perception reality layers consciousness",
      guests: { create: [{ personId: guest2.id }] },
      topics: { create: [{ topicId: topicConsciousness.id }, { topicId: topicMythology.id }] },
      loreEntries: { create: [{ loreEntryId: lore2.id }] },
    },
  });

  const ep3 = await prisma.episode.create({
    data: {
      title: "The Arcana Codex",
      slug: "the-arcana-codex",
      episodeNumber: 3,
      airDate: new Date("2023-01-29"),
      duration: "2:30:00",
      summaryShort: "Dr. Arcana reveals the hidden codex of tarot symbolism.",
      status: ContentStatus.published,
      seriesId: mainSeries.id,
      searchText: "arcana codex tarot symbolism hidden",
      guests: { create: [{ personId: guest1.id }] },
      topics: { create: [{ topicId: topicTarot.id }, { topicId: topicMythology.id }] },
    },
  });

  // Create transcript segments for episode 1
  await prisma.transcriptSegment.createMany({
    data: [
      { episodeId: ep1.id, startSeconds: 0, endSeconds: 30, speakerLabel: "Psyche", text: "Welcome to the Cult of Psyche. I am your host, and tonight we begin something extraordinary.", searchText: "welcome cult psyche host tonight begin extraordinary" },
      { episodeId: ep1.id, startSeconds: 31, endSeconds: 75, speakerLabel: "Psyche", text: "Joining me is Dr. Arcana, one of the foremost scholars of the occult tradition.", searchText: "joining dr arcana foremost scholars occult tradition" },
      { episodeId: ep1.id, startSeconds: 76, endSeconds: 120, speakerLabel: "Dr. Arcana", text: "Thank you for having me. The Cult of Psyche represents something rare — a genuine attempt to bridge ancient wisdom and modern consciousness research.", searchText: "thank you cult psyche rare genuine bridge ancient wisdom modern consciousness research" },
    ],
  });

  // Create quotes
  await prisma.quote.create({
    data: {
      text: "Welcome to the Cult of Psyche. I am your host, and tonight we begin something extraordinary.",
      speakerPersonId: host.id,
      episodeId: ep1.id,
      timestampSeconds: 0,
      context: "Opening words of the first episode",
      significance: "The founding statement of the entire archive",
    },
  });

  await prisma.quote.create({
    data: {
      text: "The Cult of Psyche represents something rare — a genuine attempt to bridge ancient wisdom and modern consciousness research.",
      speakerPersonId: guest1.id,
      episodeId: ep1.id,
      timestampSeconds: 76,
      context: "Dr. Arcana's first appearance on the show",
      significance: "Defines the show's mission from an outside perspective",
    },
  });

  // Link people to lore
  await prisma.personLore.createMany({
    data: [
      { personId: host.id, loreEntryId: lore1.id },
      { personId: guest2.id, loreEntryId: lore2.id },
    ],
  });

  // Set first appearances
  await prisma.person.update({
    where: { id: host.id },
    data: { firstAppearanceEpisodeId: ep1.id },
  });
  await prisma.person.update({
    where: { id: guest1.id },
    data: { firstAppearanceEpisodeId: ep1.id },
  });
  await prisma.person.update({
    where: { id: guest2.id },
    data: { firstAppearanceEpisodeId: ep2.id },
  });

  // Set first mentions
  await prisma.loreEntry.update({
    where: { id: lore1.id },
    data: { firstMentionEpisodeId: ep1.id },
  });
  await prisma.loreEntry.update({
    where: { id: lore2.id },
    data: { firstMentionEpisodeId: ep2.id },
  });

  console.log("✅ Seed complete:");
  console.log("   Episodes: 3");
  console.log("   People: 3 (1 host, 1 recurring, 1 guest)");
  console.log("   Topics: 3");
  console.log("   Lore entries: 2");
  console.log("   Transcript segments: 3");
  console.log("   Quotes: 2");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Step 2: Add prisma seed config to package.json**

Add to `package.json` at the top level:

```json
"prisma": {
  "seed": "npx tsx prisma/seed.ts"
}
```

**Step 3: Run the seed**

```bash
cd "C:\Users\John Bates\Projects\cultcodex-v2"
npx prisma db seed
```

Expected: Prints seed summary with 3 episodes, 3 people, etc.

**Step 4: Verify data in Prisma Studio**

```bash
npx prisma studio
```

Expected: All tables have data. Close (Ctrl+C).

**Step 5: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: create comprehensive seed data with episodes, people, lore, and quotes"
```

---

### Task 19: Write Query Helpers — Episodes

**Files:**
- Create: `src/lib/queries/episodes.ts`
- Create: `src/lib/queries/__tests__/episodes.test.ts`

**Step 1: Write the failing test**

`src/lib/queries/__tests__/episodes.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildEpisodeInclude, formatEpisodeForCard, type EpisodeWithRelations } from "../episodes";

describe("buildEpisodeInclude", () => {
  it("returns a Prisma include object", () => {
    const include = buildEpisodeInclude();
    expect(include).toHaveProperty("series");
    expect(include).toHaveProperty("guests");
    expect(include).toHaveProperty("topics");
  });
});

describe("formatEpisodeForCard", () => {
  it("formats episode data for card display", () => {
    const episode = {
      id: "1",
      title: "Test Episode",
      slug: "test-episode",
      episodeNumber: 42,
      airDate: new Date("2024-01-15"),
      summaryShort: "A test episode.",
      status: "published" as const,
      guests: [{ person: { displayName: "Guest One", slug: "guest-one" } }],
      topics: [{ topic: { title: "Tarot", slug: "tarot" } }],
    } as unknown as EpisodeWithRelations;

    const card = formatEpisodeForCard(episode);
    expect(card.title).toBe("Test Episode");
    expect(card.episodeNumber).toBe(42);
    expect(card.guestNames).toEqual(["Guest One"]);
    expect(card.topicNames).toEqual(["Tarot"]);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/queries/__tests__/episodes.test.ts
```

Expected: FAIL.

**Step 3: Write implementation**

`src/lib/queries/episodes.ts`:

```typescript
import { prisma } from "@/lib/db";
import type { Prisma, Episode, ContentStatus } from "@prisma/client";

// Type for episode with all relations loaded
export type EpisodeWithRelations = Prisma.EpisodeGetPayload<{
  include: ReturnType<typeof buildEpisodeInclude>;
}>;

export function buildEpisodeInclude() {
  return {
    series: true,
    guests: { include: { person: true } },
    mentionedPeople: { include: { person: true } },
    loreEntries: { include: { loreEntry: true } },
    topics: { include: { topic: true } },
    quotes: { include: { speaker: true } },
    segments: { orderBy: { startSeconds: "asc" as const } },
  } satisfies Prisma.EpisodeInclude;
}

export interface EpisodeCardData {
  id: string;
  title: string;
  slug: string;
  episodeNumber: number | null;
  airDate: Date | null;
  summaryShort: string | null;
  status: ContentStatus;
  guestNames: string[];
  topicNames: string[];
}

export function formatEpisodeForCard(episode: EpisodeWithRelations): EpisodeCardData {
  return {
    id: episode.id,
    title: episode.title,
    slug: episode.slug,
    episodeNumber: episode.episodeNumber,
    airDate: episode.airDate,
    summaryShort: episode.summaryShort,
    status: episode.status,
    guestNames: episode.guests.map((g) => g.person.displayName),
    topicNames: episode.topics.map((t) => t.topic.title),
  };
}

export async function getEpisodes(options?: {
  status?: ContentStatus;
  take?: number;
  skip?: number;
  orderBy?: "airDate" | "episodeNumber";
  order?: "asc" | "desc";
}) {
  const {
    status = "published",
    take = 20,
    skip = 0,
    orderBy = "episodeNumber",
    order = "desc",
  } = options ?? {};

  return prisma.episode.findMany({
    where: { status },
    include: buildEpisodeInclude(),
    orderBy: { [orderBy]: order },
    take,
    skip,
  });
}

export async function getEpisodeBySlug(slug: string) {
  return prisma.episode.findUnique({
    where: { slug },
    include: buildEpisodeInclude(),
  });
}

export async function getEpisodeCount(status?: ContentStatus) {
  return prisma.episode.count({
    where: status ? { status } : undefined,
  });
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/queries/__tests__/episodes.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/queries/
git commit -m "feat: add episode query helpers with typed includes and card formatting"
```

---

### Task 20: Write Query Helpers — People, Lore, Stats

**Files:**
- Create: `src/lib/queries/people.ts`
- Create: `src/lib/queries/lore.ts`
- Create: `src/lib/queries/stats.ts`

**Step 1: Write implementations**

`src/lib/queries/people.ts`:

```typescript
import { prisma } from "@/lib/db";
import type { Prisma, PersonType } from "@prisma/client";

export function buildPersonInclude() {
  return {
    firstAppearanceEpisode: true,
    guestAppearances: { include: { episode: true } },
    mentions: { include: { episode: true } },
    topics: { include: { topic: true } },
    loreConnections: { include: { loreEntry: true } },
    quotes: { include: { episode: true } },
  } satisfies Prisma.PersonInclude;
}

export async function getPeople(options?: {
  type?: PersonType;
  take?: number;
  skip?: number;
}) {
  const { type, take = 50, skip = 0 } = options ?? {};

  return prisma.person.findMany({
    where: type ? { personType: type } : undefined,
    include: buildPersonInclude(),
    orderBy: { displayName: "asc" },
    take,
    skip,
  });
}

export async function getPersonBySlug(slug: string) {
  return prisma.person.findUnique({
    where: { slug },
    include: buildPersonInclude(),
  });
}
```

`src/lib/queries/lore.ts`:

```typescript
import { prisma } from "@/lib/db";
import type { Prisma, CanonStatus } from "@prisma/client";

export function buildLoreInclude() {
  return {
    firstMentionEpisode: true,
    episodes: { include: { episode: true } },
    people: { include: { person: true } },
    topics: { include: { topic: true } },
  } satisfies Prisma.LoreEntryInclude;
}

export async function getLoreEntries(options?: {
  canon?: CanonStatus;
  category?: string;
  take?: number;
  skip?: number;
}) {
  const { canon, category, take = 50, skip = 0 } = options ?? {};

  return prisma.loreEntry.findMany({
    where: {
      ...(canon ? { canonStatus: canon } : {}),
      ...(category ? { category } : {}),
    },
    include: buildLoreInclude(),
    orderBy: { title: "asc" },
    take,
    skip,
  });
}

export async function getLoreBySlug(slug: string) {
  return prisma.loreEntry.findUnique({
    where: { slug },
    include: buildLoreInclude(),
  });
}
```

`src/lib/queries/stats.ts`:

```typescript
import { prisma } from "@/lib/db";
import type { ArchiveStats } from "@/types";

export async function getArchiveStats(): Promise<ArchiveStats> {
  const [episodes, people, loreEntries, quotes, series, topics] =
    await Promise.all([
      prisma.episode.count({ where: { status: "published" } }),
      prisma.person.count(),
      prisma.loreEntry.count(),
      prisma.quote.count(),
      prisma.series.count(),
      prisma.topic.count(),
    ]);

  return { episodes, people, loreEntries, quotes, series, topics };
}
```

**Step 2: Write tests**

`src/lib/queries/__tests__/helpers.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { buildPersonInclude } from "../people";
import { buildLoreInclude } from "../lore";

describe("buildPersonInclude", () => {
  it("returns include with expected relations", () => {
    const include = buildPersonInclude();
    expect(include).toHaveProperty("guestAppearances");
    expect(include).toHaveProperty("quotes");
    expect(include).toHaveProperty("topics");
  });
});

describe("buildLoreInclude", () => {
  it("returns include with expected relations", () => {
    const include = buildLoreInclude();
    expect(include).toHaveProperty("episodes");
    expect(include).toHaveProperty("people");
    expect(include).toHaveProperty("topics");
  });
});
```

**Step 3: Run tests**

```bash
npm test
```

Expected: All tests pass.

**Step 4: Commit**

```bash
git add src/lib/queries/
git commit -m "feat: add people, lore, and stats query helpers"
```

---

### Task 21: Write Format Utilities

**Files:**
- Create: `src/lib/format/date.ts`
- Create: `src/lib/format/duration.ts`
- Create: `src/lib/format/text.ts`

**Step 1: Write tests**

`src/lib/format/__tests__/format.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { formatDate, formatRelativeDate } from "../date";
import { formatDuration } from "../duration";
import { truncate, slugify } from "../text";

describe("formatDate", () => {
  it("formats a date", () => {
    const result = formatDate(new Date("2024-01-15"));
    expect(result).toContain("2024");
  });

  it("returns placeholder for null", () => {
    expect(formatDate(null)).toBe("—");
  });
});

describe("formatDuration", () => {
  it("formats duration string", () => {
    expect(formatDuration("2:15:30")).toBe("2h 15m");
  });

  it("handles minutes-only duration", () => {
    expect(formatDuration("45:00")).toBe("45m");
  });

  it("returns placeholder for null", () => {
    expect(formatDuration(null)).toBe("—");
  });
});

describe("truncate", () => {
  it("truncates long text", () => {
    const result = truncate("This is a very long piece of text that should be truncated", 20);
    expect(result.length).toBeLessThanOrEqual(23); // 20 + "..."
    expect(result).toContain("...");
  });

  it("does not truncate short text", () => {
    expect(truncate("Short", 20)).toBe("Short");
  });
});

describe("slugify", () => {
  it("creates a URL slug", () => {
    expect(slugify("Hello World! 123")).toBe("hello-world-123");
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/format/__tests__/format.test.ts
```

Expected: FAIL.

**Step 3: Write implementations**

`src/lib/format/date.ts`:

```typescript
export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatRelativeDate(date: Date | null | undefined): string {
  if (!date) return "—";
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
```

`src/lib/format/duration.ts`:

```typescript
export function formatDuration(duration: string | null | undefined): string {
  if (!duration) return "—";

  const parts = duration.split(":").map(Number);

  if (parts.length === 3) {
    const [h, m] = parts;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  if (parts.length === 2) {
    const [m] = parts;
    return `${m}m`;
  }

  return duration;
}

export function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
```

`src/lib/format/text.ts`:

```typescript
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/format/__tests__/format.test.ts
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/lib/format/
git commit -m "feat: add date, duration, and text format utilities"
```

---

## Phase 3 — Vertical Slice

### Task 22: Build Episode Card Component

**Files:**
- Create: `src/components/archive/episode-card.tsx`

**Step 1: Write the failing test**

`src/components/archive/__tests__/episode-card.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EpisodeCard } from "../episode-card";

const mockEpisode = {
  id: "1",
  title: "Welcome to the Cult",
  slug: "welcome-to-the-cult",
  episodeNumber: 1,
  airDate: new Date("2024-01-15"),
  summaryShort: "The inaugural episode.",
  status: "published" as const,
  guestNames: ["Dr. Arcana"],
  topicNames: ["Consciousness", "Tarot"],
};

describe("EpisodeCard", () => {
  it("renders episode title", () => {
    render(<EpisodeCard episode={mockEpisode} />);
    expect(screen.getByText("Welcome to the Cult")).toBeInTheDocument();
  });

  it("renders episode number", () => {
    render(<EpisodeCard episode={mockEpisode} />);
    expect(screen.getByText(/EP\.001/)).toBeInTheDocument();
  });

  it("renders guest names", () => {
    render(<EpisodeCard episode={mockEpisode} />);
    expect(screen.getByText("Dr. Arcana")).toBeInTheDocument();
  });

  it("links to episode detail", () => {
    render(<EpisodeCard episode={mockEpisode} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/episodes/welcome-to-the-cult");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/components/archive/__tests__/episode-card.test.tsx
```

Expected: FAIL.

**Step 3: Write implementation**

`src/components/archive/episode-card.tsx`:

```tsx
import Link from "next/link";
import { formatDate } from "@/lib/format/date";
import { StatusBadge } from "@/components/ui/status-badge";
import type { EpisodeCardData } from "@/lib/queries/episodes";

interface EpisodeCardProps {
  episode: EpisodeCardData;
}

export function EpisodeCard({ episode }: EpisodeCardProps) {
  const epNum = episode.episodeNumber
    ? `EP.${String(episode.episodeNumber).padStart(3, "0")}`
    : null;

  return (
    <Link
      href={`/episodes/${episode.slug}`}
      className="group block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-green/30 hover:bg-elevated"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            {epNum && (
              <span className="font-mono text-[10px] text-accent-green font-bold">
                {epNum}
              </span>
            )}
            <span className="font-mono text-[10px] text-text-muted">
              {formatDate(episode.airDate)}
            </span>
          </div>
          <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-green transition-colors truncate">
            {episode.title}
          </h3>
          {episode.summaryShort && (
            <p className="mt-1 text-xs text-text-muted line-clamp-2">
              {episode.summaryShort}
            </p>
          )}
        </div>
      </div>

      {(episode.guestNames.length > 0 || episode.topicNames.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {episode.guestNames.map((name) => (
            <StatusBadge key={name} label={name} variant="purple" />
          ))}
          {episode.topicNames.map((name) => (
            <StatusBadge key={name} label={name} variant="muted" />
          ))}
        </div>
      )}
    </Link>
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/components/archive/__tests__/episode-card.test.tsx
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/components/archive/
git commit -m "feat: build EpisodeCard component with guest/topic badges"
```

---

### Task 23: Build Episodes Index Page

**Files:**
- Create: `src/app/episodes/page.tsx`

**Step 1: Write the page**

`src/app/episodes/page.tsx`:

```tsx
import { PageShell } from "@/components/ui/page-shell";
import { EpisodeCard } from "@/components/archive/episode-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getEpisodes, formatEpisodeForCard, getEpisodeCount } from "@/lib/queries/episodes";

export const metadata = {
  title: "Episodes — CultCodex",
  description: "Browse all Cult of Psyche episodes",
};

export default async function EpisodesPage() {
  const [episodes, totalCount] = await Promise.all([
    getEpisodes({ take: 50, orderBy: "episodeNumber", order: "desc" }),
    getEpisodeCount("published"),
  ]);

  const cards = episodes.map(formatEpisodeForCard);

  return (
    <PageShell
      title="EPISODES"
      subtitle={`${totalCount} transmissions in the archive`}
    >
      {cards.length === 0 ? (
        <EmptyState
          message="No episodes in the archive yet"
          suggestion="Episodes will appear here once data is ingested"
        />
      ) : (
        <div className="grid gap-3">
          {cards.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
```

**Step 2: Verify in browser**

```bash
npm run dev
```

Navigate to http://localhost:3000/episodes. Expected: Shows 3 seeded episodes with guest badges and topic chips. Stop dev server.

**Step 3: Commit**

```bash
git add src/app/episodes/
git commit -m "feat: build episodes index page with server-side data loading"
```

---

### Task 24: Build Episode Detail Page

**Files:**
- Create: `src/app/episodes/[slug]/page.tsx`
- Create: `src/components/archive/entity-chip-list.tsx`
- Create: `src/components/archive/related-entities.tsx`

**Step 1: Create entity chip list component**

`src/components/archive/entity-chip-list.tsx`:

```tsx
import Link from "next/link";
import type { EntityType } from "@/types";

interface EntityChip {
  label: string;
  slug: string;
  type: EntityType;
}

interface EntityChipListProps {
  title: string;
  entities: EntityChip[];
}

const typeToPath: Record<EntityType, string> = {
  episode: "/episodes",
  person: "/people",
  lore: "/lore",
  topic: "/topics",
  series: "/series",
  quote: "/quotes",
};

export function EntityChipList({ title, entities }: EntityChipListProps) {
  if (entities.length === 0) return null;

  return (
    <div>
      <h4 className="font-mono text-xs text-text-muted uppercase tracking-wider mb-2">
        {title}
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {entities.map((entity) => (
          <Link
            key={`${entity.type}-${entity.slug}`}
            href={`${typeToPath[entity.type]}/${entity.slug}`}
            className="inline-flex items-center rounded border border-border bg-surface px-2 py-0.5 font-mono text-[11px] text-text-primary hover:border-accent-green/30 hover:text-accent-green transition-colors"
          >
            {entity.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create the episode detail page**

`src/app/episodes/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getEpisodeBySlug } from "@/lib/queries/episodes";
import { PageShell } from "@/components/ui/page-shell";
import { SectionCard } from "@/components/ui/section-card";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { MetaRow } from "@/components/ui/meta-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import { formatDate } from "@/lib/format/date";
import { formatDuration } from "@/lib/format/duration";
import { formatSeconds } from "@/lib/format/duration";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);
  if (!episode) return { title: "Not Found — CultCodex" };
  return {
    title: `${episode.title} — CultCodex`,
    description: episode.summaryShort ?? undefined,
  };
}

export default async function EpisodeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const episode = await getEpisodeBySlug(slug);

  if (!episode) notFound();

  const epNum = episode.episodeNumber
    ? `EP.${String(episode.episodeNumber).padStart(3, "0")}`
    : null;

  return (
    <PageShell
      title={episode.title}
      subtitle={[epNum, formatDate(episode.airDate), formatDuration(episode.duration)]
        .filter(Boolean)
        .join(" · ")}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          {episode.summaryLong && (
            <SectionCard title="Summary">
              <p className="text-sm text-text-primary leading-relaxed">
                {episode.summaryLong}
              </p>
            </SectionCard>
          )}

          {/* Transcript segments */}
          {episode.segments.length > 0 && (
            <TerminalPanel header="TRANSCRIPT">
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {episode.segments.map((seg) => (
                  <div key={seg.id} className="flex gap-3">
                    <span className="shrink-0 font-mono text-[10px] text-accent-green/60 w-12 text-right pt-0.5">
                      {formatSeconds(seg.startSeconds)}
                    </span>
                    <div>
                      {seg.speakerLabel && (
                        <span className="font-mono text-[10px] text-accent-purple font-bold uppercase">
                          {seg.speakerLabel}
                        </span>
                      )}
                      <p className="text-sm text-text-primary">{seg.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TerminalPanel>
          )}

          {/* Quotes */}
          {episode.quotes.length > 0 && (
            <SectionCard title="Notable Quotes">
              <div className="space-y-4">
                {episode.quotes.map((q) => (
                  <blockquote
                    key={q.id}
                    className="border-l-2 border-accent-gold/50 pl-4"
                  >
                    <p className="text-sm text-text-primary italic">
                      &ldquo;{q.text}&rdquo;
                    </p>
                    {q.speaker && (
                      <cite className="mt-1 block font-mono text-xs text-accent-gold not-italic">
                        — {q.speaker.displayName}
                      </cite>
                    )}
                  </blockquote>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Meta */}
          <SectionCard title="Metadata">
            <div className="space-y-0">
              {epNum && <MetaRow label="Episode" value={epNum} />}
              <MetaRow label="Aired" value={formatDate(episode.airDate)} />
              <MetaRow label="Duration" value={formatDuration(episode.duration)} />
              <MetaRow
                label="Status"
                value={<StatusBadge label={episode.status} variant="green" />}
              />
              {episode.series && (
                <MetaRow label="Series" value={episode.series.title} />
              )}
            </div>
          </SectionCard>

          {/* Guests */}
          <SectionCard>
            <EntityChipList
              title="Guests"
              entities={episode.guests.map((g) => ({
                label: g.person.displayName,
                slug: g.person.slug,
                type: "person" as const,
              }))}
            />
          </SectionCard>

          {/* Topics */}
          <SectionCard>
            <EntityChipList
              title="Topics"
              entities={episode.topics.map((t) => ({
                label: t.topic.title,
                slug: t.topic.slug,
                type: "topic" as const,
              }))}
            />
          </SectionCard>

          {/* Lore */}
          <SectionCard>
            <EntityChipList
              title="Lore"
              entities={episode.loreEntries.map((l) => ({
                label: l.loreEntry.title,
                slug: l.loreEntry.slug,
                type: "lore" as const,
              }))}
            />
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
```

**Step 3: Verify in browser**

```bash
npm run dev
```

Navigate to http://localhost:3000/episodes/welcome-to-the-cult. Expected: Episode detail with summary, transcript segments, quotes sidebar, guests/topics/lore chips. Stop dev server.

**Step 4: Commit**

```bash
git add src/app/episodes/ src/components/archive/
git commit -m "feat: build episode detail page with transcript, quotes, and entity sidebar"
```

---

### Task 25: Build People Index and Person Detail Pages

**Files:**
- Create: `src/app/people/page.tsx`
- Create: `src/app/people/[slug]/page.tsx`
- Create: `src/components/archive/person-card.tsx`

**Step 1: Create person card**

`src/components/archive/person-card.tsx`:

```tsx
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PersonType } from "@prisma/client";

interface PersonCardProps {
  person: {
    displayName: string;
    slug: string;
    shortBio: string | null;
    personType: PersonType;
    appearanceCount: number;
  };
}

const typeVariant: Record<PersonType, "green" | "purple" | "gold" | "muted"> = {
  host: "green",
  recurring: "purple",
  guest: "muted",
  mentioned: "muted",
};

export function PersonCard({ person }: PersonCardProps) {
  return (
    <Link
      href={`/people/${person.slug}`}
      className="group block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-purple/30 hover:bg-elevated"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-purple transition-colors">
            {person.displayName}
          </h3>
          {person.shortBio && (
            <p className="mt-1 text-xs text-text-muted line-clamp-2">
              {person.shortBio}
            </p>
          )}
        </div>
        <StatusBadge label={person.personType} variant={typeVariant[person.personType]} />
      </div>
      <p className="mt-2 font-mono text-[10px] text-text-muted">
        {person.appearanceCount} appearance{person.appearanceCount !== 1 ? "s" : ""}
      </p>
    </Link>
  );
}
```

**Step 2: Create people index page**

`src/app/people/page.tsx`:

```tsx
import { PageShell } from "@/components/ui/page-shell";
import { PersonCard } from "@/components/archive/person-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getPeople } from "@/lib/queries/people";

export const metadata = {
  title: "People — CultCodex",
  description: "Guests, hosts, and figures of the Cult of Psyche",
};

export default async function PeoplePage() {
  const people = await getPeople({ take: 100 });

  return (
    <PageShell title="PEOPLE" subtitle="Guests, hosts, and figures of the archive">
      {people.length === 0 ? (
        <EmptyState message="No people in the archive yet" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => (
            <PersonCard
              key={person.id}
              person={{
                displayName: person.displayName,
                slug: person.slug,
                shortBio: person.shortBio,
                personType: person.personType,
                appearanceCount: person.guestAppearances.length + person.mentions.length,
              }}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
```

**Step 3: Create person detail page**

`src/app/people/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getPersonBySlug } from "@/lib/queries/people";
import { PageShell } from "@/components/ui/page-shell";
import { SectionCard } from "@/components/ui/section-card";
import { MetaRow } from "@/components/ui/meta-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import { formatDate } from "@/lib/format/date";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PersonDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const person = await getPersonBySlug(slug);

  if (!person) notFound();

  const allEpisodes = [
    ...person.guestAppearances.map((g) => g.episode),
    ...person.mentions.map((m) => m.episode),
  ];

  // Deduplicate by id
  const uniqueEpisodes = Array.from(
    new Map(allEpisodes.map((e) => [e.id, e])).values()
  ).sort((a, b) => (b.airDate?.getTime() ?? 0) - (a.airDate?.getTime() ?? 0));

  return (
    <PageShell
      title={person.displayName}
      subtitle={person.shortBio ?? undefined}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Bio / Lore Summary */}
          {person.loreSummary && (
            <SectionCard title="Lore Summary">
              <p className="text-sm text-text-primary leading-relaxed">
                {person.loreSummary}
              </p>
            </SectionCard>
          )}

          {/* Appearances */}
          <SectionCard title={`Appearances (${uniqueEpisodes.length})`}>
            <div className="space-y-2">
              {uniqueEpisodes.map((ep) => (
                <EntityChipList
                  key={ep.id}
                  title=""
                  entities={[
                    {
                      label: `${ep.episodeNumber ? `EP.${String(ep.episodeNumber).padStart(3, "0")} — ` : ""}${ep.title}`,
                      slug: ep.slug,
                      type: "episode",
                    },
                  ]}
                />
              ))}
            </div>
          </SectionCard>

          {/* Quotes */}
          {person.quotes.length > 0 && (
            <SectionCard title="Quotes">
              <div className="space-y-4">
                {person.quotes.map((q) => (
                  <blockquote
                    key={q.id}
                    className="border-l-2 border-accent-gold/50 pl-4"
                  >
                    <p className="text-sm text-text-primary italic">
                      &ldquo;{q.text}&rdquo;
                    </p>
                    {q.episode && (
                      <cite className="mt-1 block font-mono text-[10px] text-text-muted not-italic">
                        {q.episode.title}
                      </cite>
                    )}
                  </blockquote>
                ))}
              </div>
            </SectionCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SectionCard title="Dossier">
            <MetaRow
              label="Type"
              value={<StatusBadge label={person.personType} variant="purple" />}
            />
            {person.firstAppearanceEpisode && (
              <MetaRow
                label="First Seen"
                value={formatDate(person.firstAppearanceEpisode.airDate)}
              />
            )}
            {person.altNames.length > 0 && (
              <MetaRow label="Also Known As" value={person.altNames.join(", ")} />
            )}
          </SectionCard>

          <SectionCard>
            <EntityChipList
              title="Topics"
              entities={person.topics.map((t) => ({
                label: t.topic.title,
                slug: t.topic.slug,
                type: "topic",
              }))}
            />
          </SectionCard>

          <SectionCard>
            <EntityChipList
              title="Lore Connections"
              entities={person.loreConnections.map((l) => ({
                label: l.loreEntry.title,
                slug: l.loreEntry.slug,
                type: "lore",
              }))}
            />
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
```

**Step 4: Verify in browser**

```bash
npm run dev
```

Navigate to http://localhost:3000/people then http://localhost:3000/people/dr-arcana. Expected: People grid with type badges, person detail with appearances, quotes, and lore sidebar. Stop dev server.

**Step 5: Commit**

```bash
git add src/app/people/ src/components/archive/person-card.tsx
git commit -m "feat: build people index and person detail pages"
```

---

### Task 26: Build Lore Index and Lore Detail Pages

**Files:**
- Create: `src/app/lore/page.tsx`
- Create: `src/app/lore/[slug]/page.tsx`
- Create: `src/components/archive/lore-card.tsx`

**Step 1: Create lore card**

`src/components/archive/lore-card.tsx`:

```tsx
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CanonStatus } from "@prisma/client";

interface LoreCardProps {
  lore: {
    title: string;
    slug: string;
    category: string | null;
    summary: string | null;
    canonStatus: CanonStatus;
  };
}

const canonVariant: Record<CanonStatus, "green" | "purple" | "gold" | "muted"> = {
  canonical: "gold",
  speculative: "purple",
  community_myth: "green",
  disputed: "muted",
  humorous: "muted",
};

export function LoreCard({ lore }: LoreCardProps) {
  return (
    <Link
      href={`/lore/${lore.slug}`}
      className="group block rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent-gold/30 hover:bg-elevated"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-sans text-sm font-medium text-text-primary group-hover:text-accent-gold transition-colors">
          {lore.title}
        </h3>
        <StatusBadge
          label={lore.canonStatus.replace("_", " ")}
          variant={canonVariant[lore.canonStatus]}
        />
      </div>
      {lore.category && (
        <p className="mt-1 font-mono text-[10px] text-text-muted uppercase">
          {lore.category}
        </p>
      )}
      {lore.summary && (
        <p className="mt-2 text-xs text-text-muted line-clamp-3">
          {lore.summary}
        </p>
      )}
    </Link>
  );
}
```

**Step 2: Create lore index page**

`src/app/lore/page.tsx`:

```tsx
import { PageShell } from "@/components/ui/page-shell";
import { LoreCard } from "@/components/archive/lore-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getLoreEntries } from "@/lib/queries/lore";

export const metadata = {
  title: "Lore — CultCodex",
  description: "Concepts, doctrines, and myths of the Cult of Psyche",
};

export default async function LorePage() {
  const entries = await getLoreEntries({ take: 100 });

  return (
    <PageShell title="LORE ARCHIVE" subtitle="Concepts, doctrines, myths, and memes">
      {entries.length === 0 ? (
        <EmptyState message="No lore entries yet" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {entries.map((entry) => (
            <LoreCard
              key={entry.id}
              lore={{
                title: entry.title,
                slug: entry.slug,
                category: entry.category,
                summary: entry.summary,
                canonStatus: entry.canonStatus,
              }}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
```

**Step 3: Create lore detail page**

`src/app/lore/[slug]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { getLoreBySlug } from "@/lib/queries/lore";
import { PageShell } from "@/components/ui/page-shell";
import { SectionCard } from "@/components/ui/section-card";
import { MetaRow } from "@/components/ui/meta-row";
import { StatusBadge } from "@/components/ui/status-badge";
import { EntityChipList } from "@/components/archive/entity-chip-list";
import { formatDate } from "@/lib/format/date";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function LoreDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getLoreBySlug(slug);

  if (!entry) notFound();

  return (
    <PageShell title={entry.title} subtitle={entry.category ?? undefined}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {entry.summary && (
            <SectionCard title="Summary">
              <p className="text-sm text-text-primary leading-relaxed">
                {entry.summary}
              </p>
            </SectionCard>
          )}

          {entry.fullEntry && (
            <SectionCard title="Full Entry">
              <div className="prose prose-invert prose-sm max-w-none text-text-primary">
                {entry.fullEntry}
              </div>
            </SectionCard>
          )}
        </div>

        <div className="space-y-6">
          <SectionCard title="Classification">
            <MetaRow
              label="Canon Status"
              value={
                <StatusBadge
                  label={entry.canonStatus.replace("_", " ")}
                  variant="gold"
                />
              }
            />
            {entry.category && <MetaRow label="Category" value={entry.category} />}
            {entry.firstMentionEpisode && (
              <MetaRow
                label="First Mention"
                value={formatDate(entry.firstMentionEpisode.airDate)}
              />
            )}
          </SectionCard>

          <SectionCard>
            <EntityChipList
              title="Episodes"
              entities={entry.episodes.map((e) => ({
                label: e.episode.title,
                slug: e.episode.slug,
                type: "episode",
              }))}
            />
          </SectionCard>

          <SectionCard>
            <EntityChipList
              title="People"
              entities={entry.people.map((p) => ({
                label: p.person.displayName,
                slug: p.person.slug,
                type: "person",
              }))}
            />
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
```

**Step 4: Verify in browser**

```bash
npm run dev
```

Navigate to http://localhost:3000/lore and http://localhost:3000/lore/psyche-protocol. Expected: Lore grid with canon badges, detail page with linked episodes and people. Stop dev server.

**Step 5: Commit**

```bash
git add src/app/lore/ src/components/archive/lore-card.tsx
git commit -m "feat: build lore index and detail pages with canon status badges"
```

---

### Task 27: Wire Up Homepage with Live Stats

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/archive/archive-stats.tsx`

**Step 1: Create archive stats component**

`src/components/archive/archive-stats.tsx`:

```tsx
import type { ArchiveStats } from "@/types";

interface ArchiveStatsProps {
  stats: ArchiveStats;
}

const statItems = [
  { key: "episodes" as const, label: "Episodes" },
  { key: "people" as const, label: "People" },
  { key: "loreEntries" as const, label: "Lore Entries" },
  { key: "quotes" as const, label: "Quotes" },
  { key: "series" as const, label: "Series" },
  { key: "topics" as const, label: "Topics" },
];

export function ArchiveStatsDisplay({ stats }: ArchiveStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {statItems.map((item) => (
        <div
          key={item.key}
          className="rounded-lg border border-border bg-surface p-3 text-center"
        >
          <p className="font-mono text-2xl font-bold text-accent-green">
            {stats[item.key]}
          </p>
          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Update homepage**

Replace `src/app/page.tsx` with:

```tsx
import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";
import { TerminalPanel } from "@/components/ui/terminal-panel";
import { SectionCard } from "@/components/ui/section-card";
import { EpisodeCard } from "@/components/archive/episode-card";
import { ArchiveStatsDisplay } from "@/components/archive/archive-stats";
import { getEpisodes, formatEpisodeForCard } from "@/lib/queries/episodes";
import { getArchiveStats } from "@/lib/queries/stats";

export default async function HomePage() {
  const [stats, recentEpisodes] = await Promise.all([
    getArchiveStats(),
    getEpisodes({ take: 5, orderBy: "episodeNumber", order: "desc" }),
  ]);

  const recentCards = recentEpisodes.map(formatEpisodeForCard);

  return (
    <PageShell
      title="MATRIX ARCHIVE"
      subtitle="The sacred intelligence terminal of the Cult of Psyche"
    >
      <div className="space-y-8">
        {/* Archive status */}
        <TerminalPanel header="SYS::STATUS">
          <p className="text-accent-green">Archive online. All data feeds nominal.</p>
        </TerminalPanel>

        {/* Stats */}
        <ArchiveStatsDisplay stats={stats} />

        {/* Recent episodes */}
        <SectionCard title="Recent Transmissions">
          {recentCards.length > 0 ? (
            <div className="grid gap-3">
              {recentCards.map((ep) => (
                <EpisodeCard key={ep.id} episode={ep} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No transmissions yet.</p>
          )}
          <div className="mt-4">
            <Link
              href="/episodes"
              className="font-mono text-xs text-accent-green hover:underline"
            >
              View all episodes →
            </Link>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
```

**Step 3: Verify in browser**

```bash
npm run dev
```

Navigate to http://localhost:3000. Expected: Live stats (3 episodes, 3 people, etc.), recent episode cards, matrix aesthetic. Stop dev server.

**Step 4: Commit**

```bash
git add src/app/page.tsx src/components/archive/archive-stats.tsx
git commit -m "feat: wire up homepage with live archive stats and recent episodes"
```

---

### Task 28: Run Full Test Suite and Final Build Check

**Step 1: Run all tests**

```bash
cd "C:\Users\John Bates\Projects\cultcodex-v2"
npm test
```

Expected: All tests pass (smoke, header, footer, primitives, query helpers, format utils, episode card).

**Step 2: Run production build**

```bash
npm run build
```

Expected: Build succeeds. All pages generate without errors.

**Step 3: Run production preview**

```bash
npm start
```

Navigate to:
- http://localhost:3000 — Homepage with stats
- http://localhost:3000/episodes — Episode index
- http://localhost:3000/episodes/welcome-to-the-cult — Episode detail
- http://localhost:3000/people — People index
- http://localhost:3000/people/dr-arcana — Person detail
- http://localhost:3000/lore — Lore index
- http://localhost:3000/lore/psyche-protocol — Lore detail

All pages should render with data. Stop the server (Ctrl+C).

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: Phase 0-3 complete — vertical slice with episodes, people, lore, and live stats"
```

---

## Summary

| Phase | Tasks | Key Outputs |
|-------|-------|-------------|
| 0 — Foundation | 1–11 | Next.js scaffold, Prisma schema, PostgreSQL, design tokens, Vitest, shadcn/ui |
| 1 — App Shell | 12–17 | SiteHeader, SiteFooter, PageShell, SectionCard, TerminalPanel, StatusBadge, MetaRow, EmptyState |
| 2 — Database | 18–21 | Seed data (3 eps, 3 people, 2 lore, 3 topics, 2 quotes, 3 segments), query helpers, format utils |
| 3 — Vertical Slice | 22–28 | Episodes index/detail, People index/detail, Lore index/detail, Homepage with live stats |

**Total: 28 tasks across 4 phases**

After this plan completes, the archive will have a working vertical slice: episodes flow into people flow into lore, all cross-linked, with the matrix-noir aesthetic and live database stats. Phase 4+ builds on this foundation.
