import type { SiteCounts } from "@/lib/queries/stats";
import type { LiveChannels } from "@/lib/queries/live-status";

// ─── Single source of truth for sidebar navigation ────────────────────────────
//
// All nav sections and items live here. The TerminalSidebar imports NAV_GROUPS
// from this file — there is no other nav definition in the codebase.
//
// To add, remove, or reorder items: edit this file only.
//
// SIZE IS THE POINT. This was 36 persistent items across six groups, which is
// a product dump rather than a map - it advertised /shop ("coming soon") and
// five sister sites on *.vercel.app preview hosts, and split "SIGNALS"
// (/topics) from "SIGNAL LAB" (/signals) in a way nobody could parse.
//
// Everything removed is still reachable: /explore links every former sidebar
// destination, which was verified before the cut, so this collapses a
// duplicate surface rather than orphaning pages. Park new experiments on
// /explore and promote them here only once they earn a permanent slot.
//
// The countKey badge values come from the getCounts() SiteCounts object passed
// through the root layout → TerminalSidebar at render time.

export type AccentKey = "neon" | "neon-4";
export type CountKey = keyof Pick<SiteCounts, "episodes" | "topics" | "people">;

export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly glyph: string;
  readonly key?: string;
  readonly countKey?: CountKey;
  readonly accent?: AccentKey;
  readonly liveKey?: keyof LiveChannels;
  readonly external?: boolean;
}

export interface NavGroup {
  readonly title: string;
  /** Rule, dot, and (unless textColor is set) label color for the group. */
  readonly color: string;
  /**
   * Optional override for the group's title and item text, for groups whose
   * `color` is too dark to read against the sidebar background.
   */
  readonly textColor?: string;
  readonly items: readonly NavItem[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    title: "LIVE",
    color: "rgba(239,68,68,0.75)",
    textColor: "var(--accent-live-text)",
    items: [
      { href: "/cult-live",    label: "CULT OF PSYCHE",  glyph: "◎", liveKey: "cultOfPsyche" },
    ],
  },
  {
    // Plain word first, codex word in the page itself (2026-09 redesign):
    // six destinations built on three verbs — Search finds, People/Explore
    // trace, the Oracle asks. Topics now lives inside Explore; the Network
    // Map lives inside People.
    title: "MAIN",
    color: "var(--accent-gold)",
    textColor: "var(--accent-gold-text)",
    items: [
      { href: "/",              label: "OVERVIEW",      glyph: "▢", key: "1" },
      { href: "/search",        label: "SEARCH",        glyph: "◌", key: "2" },
      { href: "/episodes",      label: "EPISODES",      glyph: "▦", key: "3", countKey: "episodes" },
      { href: "/people",        label: "PEOPLE",        glyph: "◐", key: "4", countKey: "people" },
      { href: "/explore",       label: "EXPLORE",       glyph: "◇", key: "5" },
      { href: "/oracle",        label: "ORACLE",        glyph: "◉", key: "6" },
      { href: "/psychenomicon", label: "PSYCHENOMICON", glyph: "▲", key: "7" },
    ],
  },
  {
    title: "GUIDE",
    color: "var(--color-ink-3)",
    textColor: "var(--color-ink-2)",
    items: [
      { href: "/start-here",         label: "START HERE",  glyph: "↳" },
      { href: "/about/methodology",  label: "METHODOLOGY", glyph: "◆" },
      { href: "/corrections",        label: "CORRECTIONS", glyph: "▢" },
    ],
  },
  {
    title: "MEMBERS",
    color: "var(--color-member)",
    textColor: "var(--color-member)",
    items: [
      { href: "/premium",    label: "INITIATE+",   glyph: "✦" },
    ],
  },
];
