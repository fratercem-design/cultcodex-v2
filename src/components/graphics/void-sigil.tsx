"use client";

// Animated mystical sigil for 404 page and loading states
import { cn } from "@/lib/utils";

interface VoidSigilProps {
  className?: string;
  size?: number;
  animate?: boolean;
}

/** Animated sacred geometry sigil — rotating circles, pulsing core */
export function VoidSigil({ className, size = 160, animate = true }: VoidSigilProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      className={cn("text-accent-violet", className)}
    >
      {/* Outer ring */}
      <circle
        cx="80" cy="80" r="72"
        stroke="currentColor"
        strokeWidth="0.8"
        opacity="0.2"
        strokeDasharray="4 6"
      >
        {animate && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 80 80"
            to="360 80 80"
            dur="60s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* Middle ring */}
      <circle
        cx="80" cy="80" r="55"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.25"
      >
        {animate && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="360 80 80"
            to="0 80 80"
            dur="45s"
            repeatCount="indefinite"
          />
        )}
      </circle>

      {/* Inner geometric — hexagram */}
      <g opacity="0.3">
        {animate && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 80 80"
            to="360 80 80"
            dur="30s"
            repeatCount="indefinite"
          />
        )}
        <polygon
          points="80,40 115,60 115,100 80,120 45,100 45,60"
          stroke="currentColor"
          strokeWidth="0.8"
          fill="none"
        />
        <polygon
          points="80,45 110,63 110,97 80,115 50,97 50,63"
          stroke="currentColor"
          strokeWidth="0.5"
          fill="currentColor"
          fillOpacity="0.03"
        />
      </g>

      {/* Cross lines */}
      <g opacity="0.15">
        <line x1="80" y1="25" x2="80" y2="135" stroke="currentColor" strokeWidth="0.5" />
        <line x1="25" y1="80" x2="135" y2="80" stroke="currentColor" strokeWidth="0.5" />
        <line x1="41" y1="41" x2="119" y2="119" stroke="currentColor" strokeWidth="0.5" />
        <line x1="119" y1="41" x2="41" y2="119" stroke="currentColor" strokeWidth="0.5" />
      </g>

      {/* Cardinal point dots */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x = 80 + 55 * Math.cos(rad);
        const y = 80 + 55 * Math.sin(rad);
        return (
          <circle
            key={angle}
            cx={x}
            cy={y}
            r={angle % 90 === 0 ? 2.5 : 1.5}
            fill="currentColor"
            opacity={angle % 90 === 0 ? 0.5 : 0.3}
          />
        );
      })}

      {/* Core glow */}
      <circle cx="80" cy="80" r="12" fill="currentColor" opacity="0.08">
        {animate && (
          <animate
            attributeName="opacity"
            values="0.05;0.15;0.05"
            dur="3s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      <circle cx="80" cy="80" r="6" fill="currentColor" opacity="0.15">
        {animate && (
          <animate
            attributeName="opacity"
            values="0.1;0.25;0.1"
            dur="2s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      <circle cx="80" cy="80" r="2.5" fill="currentColor" opacity="0.4" />

      {/* Inner tri-points */}
      <g opacity="0.2">
        {[0, 120, 240].map((angle) => {
          const rad = ((angle - 90) * Math.PI) / 180;
          const x = 80 + 30 * Math.cos(rad);
          const y = 80 + 30 * Math.sin(rad);
          return <circle key={angle} cx={x} cy={y} r="1.5" fill="currentColor" />;
        })}
      </g>
    </svg>
  );
}

/** Smaller pulsing orb for loading states */
export function PulsingOrb({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={cn("text-accent-violet", className)}>
      <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="0.8" opacity="0.2" strokeDasharray="3 4">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 20 20"
          to="360 20 20"
          dur="8s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="20" cy="20" r="8" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
      <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.1">
        <animate attributeName="opacity" values="0.05;0.2;0.05" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="20" cy="20" r="1.5" fill="currentColor" opacity="0.4" />
    </svg>
  );
}
