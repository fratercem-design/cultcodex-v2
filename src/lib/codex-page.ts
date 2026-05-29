import type { CSSProperties } from "react";

export interface BannerTheme {
  label: string;
  style: CSSProperties;
  accent: string;
}

export const BANNER_THEMES: Record<string, BannerTheme> = {
  void:    { label: "Void",    style: { background: "linear-gradient(135deg, #120028 0%, #0d001a 50%, #060010 100%)" }, accent: "#b39ddb" },
  crimson: { label: "Crimson", style: { background: "linear-gradient(135deg, #1a0008 0%, #2a0010 50%, #0d0005 100%)" }, accent: "#ff3860" },
  emerald: { label: "Signal",  style: { background: "linear-gradient(135deg, #001a0e 0%, #001208 50%, #000d06 100%)" }, accent: "#00FF9C" },
  gold:    { label: "Oracle",  style: { background: "linear-gradient(135deg, #1a0f00 0%, #120a00 50%, #0d0800 100%)" }, accent: "#FFD700" },
  violet:  { label: "Mythic",  style: { background: "linear-gradient(135deg, #120018 0%, #0d0012 50%, #080010 100%)" }, accent: "#E040FB" },
  aurora:  { label: "Aurora",  style: { background: "linear-gradient(135deg, #001a18 0%, #001218 50%, #000d12 100%)" }, accent: "#00e5ff" },
  abyss:   { label: "Abyss",   style: { background: "linear-gradient(135deg, #000d1a 0%, #000812 50%, #00060d 100%)" }, accent: "#4fc3f7" },
  frost:   { label: "Frost",   style: { background: "linear-gradient(135deg, #0a0d1a 0%, #080c18 50%, #060a14 100%)" }, accent: "#80deea" },
};
