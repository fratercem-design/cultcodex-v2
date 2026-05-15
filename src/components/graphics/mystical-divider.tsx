// Decorative SVG dividers with mystical/occult motifs
import { cn } from "@/lib/utils";

interface DividerProps {
  className?: string;
}

/** Ornamental divider with central diamond and radiating lines */
export function MysticalDivider({ className }: DividerProps) {
  return (
    <div className={cn("flex items-center justify-center py-4", className)} aria-hidden="true">
      <svg width="280" height="16" viewBox="0 0 280 16" fill="none" className="text-accent-gold/30">
        {/* Left line */}
        <line x1="0" y1="8" x2="115" y2="8" stroke="currentColor" strokeWidth="0.5" />
        {/* Left dots */}
        <circle cx="100" cy="8" r="1" fill="currentColor" opacity="0.5" />
        <circle cx="108" cy="8" r="1.5" fill="currentColor" opacity="0.7" />
        {/* Center diamond */}
        <path d="M140 2l6 6-6 6-6-6z" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.1" />
        <circle cx="140" cy="8" r="2" fill="currentColor" opacity="0.4" />
        {/* Right dots */}
        <circle cx="172" cy="8" r="1.5" fill="currentColor" opacity="0.7" />
        <circle cx="180" cy="8" r="1" fill="currentColor" opacity="0.5" />
        {/* Right line */}
        <line x1="165" y1="8" x2="280" y2="8" stroke="currentColor" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

/** Smaller ornamental break — triple dot pattern */
export function OrnamentalBreak({ className }: DividerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-3 py-3", className)} aria-hidden="true">
      <svg width="80" height="8" viewBox="0 0 80 8" fill="none" className="text-accent-gold/25">
        <circle cx="10" cy="4" r="1" fill="currentColor" />
        <circle cx="25" cy="4" r="1.5" fill="currentColor" />
        <path d="M40 0l4 4-4 4-4-4z" fill="currentColor" fillOpacity="0.5" />
        <circle cx="55" cy="4" r="1.5" fill="currentColor" />
        <circle cx="70" cy="4" r="1" fill="currentColor" />
      </svg>
    </div>
  );
}

/** Full-width decorative border — used above/below sections */
export function SacredBorder({ className }: DividerProps) {
  return (
    <div className={cn("w-full", className)} aria-hidden="true">
      <svg width="100%" height="12" viewBox="0 0 800 12" preserveAspectRatio="none" fill="none" className="text-accent-gold/15">
        {/* Repeating ornamental pattern */}
        <pattern id="sacred-pattern" x="0" y="0" width="40" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 6h15" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="20" cy="6" r="2" stroke="currentColor" strokeWidth="0.5" fill="none" />
          <path d="M25 6h15" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
        <rect width="800" height="12" fill="url(#sacred-pattern)" />
      </svg>
    </div>
  );
}

/** Section header ornament — small decorative element next to titles */
export function TitleOrnament({ className }: DividerProps) {
  return (
    <svg width="24" height="8" viewBox="0 0 24 8" fill="none" className={cn("text-accent-gold/40 inline-block mr-2", className)} aria-hidden="true">
      <path d="M0 4h8" stroke="currentColor" strokeWidth="0.8" />
      <path d="M12 0l4 4-4 4-4-4z" fill="currentColor" fillOpacity="0.4" />
      <path d="M16 4h8" stroke="currentColor" strokeWidth="0.8" />
    </svg>
  );
}
