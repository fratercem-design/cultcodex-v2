import type { SiteCounts } from "@/lib/queries/stats";
import type { LiveChannels } from "@/lib/queries/live-status";

// ─── Single source of truth for sidebar navigation ────────────────────────────
//
// All nav sections and items live here. The TerminalSidebar imports NAV_GROUPS
// from this file — there is no other nav definition in the codebase.
//
// To add, remove, or reorder items: edit this file only.
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
  readonly color: string;
  readonly items: readonly NavItem[];
}

export const NAV_GROUPS: readonly NavGroup[] = [
  {
    title: "LIVE",
    color: "rgba(239,68,68,0.75)",
    items: [
      { href: "/cult-live",    label: "CULT OF PSYCHE",   glyph: "◎", liveKey: "cultOfPsyche" },
      { href: "/irl-newstime", label: "ALEXANDRA MAYERS", glyph: "◎", liveKey: "alexandraMayers" },
    ],
  },
  {
    title: "MAIN",
    color: "var(--accent-gold)",
    items: [
      { href: "/",             label: "OVERVIEW",      glyph: "▢", key: "1" },
      { href: "/episodes",     label: "ARCHIVE",       glyph: "▦", key: "2", countKey: "episodes" },
      { href: "/oracle",       label: "ORACLE",        glyph: "◉", key: "3" },
      { href: "/topics",       label: "SIGNALS",       glyph: "◈", key: "4", countKey: "topics" },
      { href: "/people",       label: "VOICES",        glyph: "◐", key: "5", countKey: "people" },
      { href: "/graph",        label: "NETWORK MAP",   glyph: "✦", key: "6" },
      { href: "/psychenomicon",label: "PSYCHENOMICON", glyph: "▲", key: "7" },
      { href: "/collections",  label: "COLLECTIONS",   glyph: "▣", key: "8" },
    ],
  },
  {
    title: "DISCOVER",
    color: "var(--accent-cyan)",
    items: [
      { href: "/start-here",    label: "START HERE",    glyph: "↳" },
      { href: "/explore",       label: "EXPLORE",       glyph: "◇" },
      { href: "/this-week",     label: "THIS WEEK",     glyph: "◑" },
      { href: "/symbols",       label: "SYMBOL CODEX",  glyph: "✦" },
      { href: "/lexicon",       label: "LEXICON",       glyph: "◈" },
      { href: "/archetype-quiz",label: "ARCHETYPE QUIZ",glyph: "◈" },
      { href: "/tarot",         label: "TAROT DECK",    glyph: "✦", accent: "neon-4" },
      { href: "/cards",         label: "CARD ARCHIVE",  glyph: "◈" },
    ],
  },
  {
    title: "ORACLE",
    color: "var(--neon-4)",
    items: [
      { href: "/red-room",   label: "RED ROOM",    glyph: "◉" },
      { href: "/signals",    label: "SIGNAL LAB",  glyph: "◈" },
      { href: "/salon",      label: "THE SALON",   glyph: "◈" },
      { href: "/corrections",label: "CORRECTIONS", glyph: "▢" },
      { href: "/premium",    label: "INITIATE+",   glyph: "✦" },
    ],
  },
];
