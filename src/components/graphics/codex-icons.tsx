// Custom SVG icon set for CultCodex — mystical/occult themed
// Replaces emoji icons with scalable, on-brand vector graphics

import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
  size?: number;
}

const defaults = { size: 20 };

/** 🎬 Episodes / Transmissions — eye with signal waves */
export function IconTransmission({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 5C7.03 5 3 8.13 3 12s4.03 7 9 7 9-3.13 9-7-4.03-7-9-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 3.5C5 5 3 8.2 3 12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      <path d="M16 3.5c3 1.5 5 4.7 5 8.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/** 👤 People — stylized face with third eye */
export function IconPerson({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="6" r="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/** 📜 Lore — ancient scroll with seal */
export function IconScroll({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <path d="M8 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 7a2 2 0 0 1 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 17a2 2 0 0 0 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="10" y1="11" x2="17" y2="11" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="10" y1="14" x2="14" y2="14" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <circle cx="12" cy="18" r="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/** 💬 Quotes — speech mark with mystical accent */
export function IconQuote({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <path d="M10 8H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 1-2 2v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 8h-4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 1-2 2v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="7" r="0.5" fill="currentColor" opacity="0.3" />
      <circle cx="18" cy="7" r="0.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/** 🏷️ Topics — tag with occult symbol */
export function IconTopic({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <path d="M4 4h7.586a1 1 0 0 1 .707.293l8.414 8.414a1 1 0 0 1 0 1.414l-5.586 5.586a1 1 0 0 1-1.414 0L5.293 11.293A1 1 0 0 1 5 10.586V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.5" cy="7.5" r="1.5" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

/** 📚 Series — stacked books with bookmark */
export function IconSeries({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <rect x="4" y="4" width="5" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="3" width="5" height="17" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <rect x="16" y="5" width="5" height="15" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11.5 3v5l1.5-1.5L14.5 8V3" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/** 🎤 Guests / Microphone */
export function IconMicrophone({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <rect x="9" y="3" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 11a7 7 0 0 0 14 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" />
      <line x1="9" y1="22" x2="15" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** 📝 Transcript segments */
export function IconTranscript({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8" y1="7" x2="16" y2="7" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="8" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <line x1="8" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <circle cx="6" cy="7" r="0.5" fill="currentColor" opacity="0.3" />
      <circle cx="6" cy="10" r="0.5" fill="currentColor" opacity="0.3" />
      <circle cx="6" cy="13" r="0.5" fill="currentColor" opacity="0.3" />
      <circle cx="6" cy="16" r="0.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/** 🔥 Reactions / Fire */
export function IconFlame({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <path d="M12 2c.5 4-3 6-3 10a5 5 0 0 0 10 0c0-4-3-5.5-3-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 22a3 3 0 0 1-3-3c0-2 3-3 3-6 0 3 3 4 3 6a3 3 0 0 1-3 3Z" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

/** 🗨️ Comments */
export function IconComment({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <path d="M21 12a9 9 0 0 1-9 9 9.04 9.04 0 0 1-4.24-1.05L3 21l1.05-4.76A9 9 0 1 1 21 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="12" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="16" cy="12" r="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/** 🔗 Links */
export function IconLink({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <path d="M10 13a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 11a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** 🔄 Recurring */
export function IconRecurring({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <path d="M3 12a9 9 0 0 1 15-6.7V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M21 12a9 9 0 0 1-15 6.7V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 5.3h3V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 18.7H6V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 🎭 Guest mask */
export function IconMask({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <path d="M2 12c0-3 2.5-8 10-8s10 5 10 8-2.5 6-10 6-10-3-10-6Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="11" r="2" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="16" cy="11" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path d="M10 15c.5.5 1.2 1 2 1s1.5-.5 2-1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

/** 🟡 Canonical status */
export function IconCanonical({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 4v3M12 17v3M4 12h3M17 12h3" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

/** 🟣 Speculative status */
export function IconSpeculative({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-violet-text", className)}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M12 8v4l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

/** 🟢 Community myth */
export function IconCommunity({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-cyan", className)}>
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="18" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M8.5 14a6 6 0 0 0 7 0" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

/** 🔮 Crystal ball — used for mystical/404 */
export function IconCrystalBall({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-violet-text", className)}>
      <circle cx="12" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="12" cy="20" rx="6" ry="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 18.5c1.3 0.3 2.6 0.5 4 0.5s2.7-0.2 4-0.5" stroke="currentColor" strokeWidth="1" opacity="0.3" />
      <path d="M9 7c-.5 1-1 2.5 0 4s3 2 4.5 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
      <circle cx="10" cy="8" r="1" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

/** ⌘ Search icon */
export function IconSearch({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
    </svg>
  );
}

/** Tarot card icon */
export function IconTarot({ className, size = defaults.size }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={cn("text-accent-gold-text", className)}>
      <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7" y="4" width="10" height="16" rx="1" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
      <path d="M12 7l1.5 3 3.5.5-2.5 2.5.5 3.5L12 15l-3 1.5.5-3.5L7 10.5l3.5-.5Z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" opacity="0.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" opacity="0.2" />
    </svg>
  );
}
