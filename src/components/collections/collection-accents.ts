/**
 * Shared accent → Tailwind class map for the themed-collection surface.
 * Keep this file pure (no JSX) so both server and client bits can import it.
 */
import type { CollectionAccent } from "@/lib/collections/themed-collections";

export interface AccentClasses {
  icon: string;
  title: string;
  eyebrow: string;
  border: string;
  hoverBorder: string;
  hoverBg: string;
  bgDim: string;
  sectionBar: string; // vertical bar next to section headers
}

const MAP: Record<CollectionAccent, AccentClasses> = {
  gold: {
    icon: "text-accent-gold",
    title: "text-accent-gold",
    eyebrow: "text-accent-gold",
    border: "border-accent-gold/30",
    hoverBorder: "hover:border-accent-gold/60",
    hoverBg: "hover:bg-accent-gold-dim",
    bgDim: "bg-accent-gold-dim",
    sectionBar: "bg-accent-gold",
  },
  cyan: {
    icon: "text-accent-cyan",
    title: "text-accent-cyan",
    eyebrow: "text-accent-cyan",
    border: "border-accent-cyan/30",
    hoverBorder: "hover:border-accent-cyan/60",
    hoverBg: "hover:bg-accent-cyan-dim",
    bgDim: "bg-accent-cyan-dim",
    sectionBar: "bg-accent-cyan",
  },
  violet: {
    icon: "text-accent-violet",
    title: "text-accent-violet",
    eyebrow: "text-accent-violet",
    border: "border-accent-violet/30",
    hoverBorder: "hover:border-accent-violet/60",
    hoverBg: "hover:bg-accent-violet-dim",
    bgDim: "bg-accent-violet-dim",
    sectionBar: "bg-accent-violet",
  },
  crimson: {
    icon: "text-accent-crimson",
    title: "text-accent-crimson",
    eyebrow: "text-accent-crimson",
    border: "border-accent-crimson/30",
    hoverBorder: "hover:border-accent-crimson/60",
    hoverBg: "hover:bg-red-950/30",
    bgDim: "bg-red-950/20",
    sectionBar: "bg-accent-crimson",
  },
  mixed: {
    icon: "text-accent-gold",
    title: "text-accent-gold",
    eyebrow: "text-accent-cyan",
    border: "border-accent-gold/30",
    hoverBorder: "hover:border-accent-gold/60",
    hoverBg: "hover:bg-accent-gold-dim",
    bgDim: "bg-accent-gold-dim",
    sectionBar: "bg-accent-gold",
  },
};

export function accentFor(accent: CollectionAccent): AccentClasses {
  return MAP[accent];
}
