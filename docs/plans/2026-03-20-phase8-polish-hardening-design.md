# Phase 8: Polish & Production Hardening — Design

## Overview

Production-harden the CultCodex wiki with loading skeletons, error boundaries, SEO (sitemap, robots, JSON-LD), mobile responsiveness fixes, and an accessibility pass.

## Section 1: Loading Skeletons

Add `loading.tsx` to every route group. Next.js wraps pages in `<Suspense>` automatically.

Skeleton components:
- `EpisodeCardSkeleton` — thumbnail placeholder + 3 shimmer text lines
- `EntityHeroSkeleton` — shimmer block matching hero height (200px)
- `CardGridSkeleton` — renders 6-12 skeleton cards in grid layout

Routes: `/`, `/episodes`, `/episodes/[slug]`, `/people`, `/people/[slug]`, `/lore`, `/lore/[slug]`, `/topics`, `/topics/[slug]`, `/series`, `/series/[slug]`, `/quotes`, `/search`

Styling: `animate-pulse` shimmer, dark surface colors matching palette.

## Section 2: Error Boundaries

`src/app/error.tsx` — client component catching runtime errors. Dark-themed error card with purple/gold aesthetic, error message, "Try Again" button calling `reset()`.

`src/app/not-found.tsx` — 404 page with thematic message ("This transmission was lost in the void"), search bar, and links to homepage/episodes.

## Section 3: SEO

`src/app/sitemap.ts` — dynamic sitemap querying DB for all published episodes, people, lore, topics, series slugs with `lastModified` dates.

`src/app/robots.ts` — allow all crawlers, point to sitemap, block `/api/` and `/auth/`.

JSON-LD structured data:
- Episode detail: `VideoObject` schema (title, description, air date, thumbnail)
- Homepage: `WebSite` schema with `SearchAction` for sitelinks search box

## Section 4: Mobile Responsiveness

- Hero sections: reduce title to `text-xl` below `sm:`, reduce `min-h` to 160px
- Glance bars: verify flex-wrap, no horizontal overflow
- Sidebar layouts: verify sidebar after main content on mobile
- Episode toolbar: add `flex-wrap` if needed
- Homepage hero: reduce logo to 80px on mobile

## Section 5: Accessibility

- Skip-to-content link (visually hidden, visible on focus)
- Global focus ring styles via `focus-visible:ring-2 ring-accent-green`
- Image alt text audit (decorative `alt=""`, meaningful alt text for avatars)
- ARIA labels on icon-only buttons (ViewToggle, RandomEpisodeButton)
- Color contrast check on `text-text-muted`

## Section 6: File Summary

New files (17):
- 12 `loading.tsx` skeleton files
- 1 `error.tsx`, 1 `not-found.tsx`
- `sitemap.ts`, `robots.ts`, `skip-link.tsx`

Modified files (~10):
- Layout, homepage, episode detail, hero components, button components, search input, globals.css
