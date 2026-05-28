import Image from "next/image";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/status-badge";

interface HeroBadge {
  label: string;
  variant: "green" | "purple" | "gold" | "muted";
}

interface EntityHeroProps {
  title: string;
  subtitle?: string;
  label?: string;
  backgroundImage: string;
  avatarUrl?: string | null;
  fallbackAvatar?: ReactNode;
  badges?: HeroBadge[];
  neonTitle?: boolean;
}

export function EntityHero({
  title,
  subtitle,
  label,
  backgroundImage,
  avatarUrl,
  fallbackAvatar,
  badges,
  neonTitle,
}: EntityHeroProps) {
  return (
    <section className="relative flex min-h-[160px] sm:min-h-[200px] items-end overflow-hidden">
      <Image
        src={backgroundImage}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-void via-black/70 to-black/50" />

      {/* Top-right badges */}
      {badges && badges.length > 0 && (
        <div className="absolute top-4 right-4 z-10 flex items-start gap-2">
          {badges.map((b) => (
            <StatusBadge key={b.label} label={b.label} variant={b.variant} />
          ))}
        </div>
      )}

      {/* Title area */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-6">
        <div className="flex items-end gap-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt=""
              width={80}
              height={80}
              className="h-14 w-14 sm:h-20 sm:w-20 rounded-full border-2 border-accent-gold/40 object-cover shadow-lg"
            />
          ) : (
            fallbackAvatar
          )}
          <div>
            {label && (
              <p
                className="mb-1 font-mono text-[10px] uppercase tracking-[0.4em]"
                style={{ color: "var(--neon)", textShadow: "var(--glow-neon)" }}
              >
                {"// "}{label}
              </p>
            )}
            {neonTitle ? (
              <h1
                className="font-serif text-2xl sm:text-3xl font-black tracking-tight drop-shadow-md"
                style={{
                  color: "#fff",
                  textShadow:
                    "0 0 6px #d946ef, 0 0 14px #d946ef, 0 0 30px #a21caf, 0 0 60px #7e22ce, 0 0 100px #6b21a8",
                  animation: "neon-pulse 2.4s ease-in-out infinite",
                }}
              >
                {title}
              </h1>
            ) : (
              <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-accent-gold drop-shadow-md">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 font-mono text-sm text-accent-cyan">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {neonTitle && (
        <style>{`
          @keyframes neon-pulse {
            0%, 100% { text-shadow: 0 0 6px #d946ef, 0 0 14px #d946ef, 0 0 30px #a21caf, 0 0 60px #7e22ce, 0 0 100px #6b21a8; }
            50%       { text-shadow: 0 0 10px #e879f9, 0 0 24px #e879f9, 0 0 50px #c026d3, 0 0 90px #9333ea, 0 0 140px #7c3aed; }
          }
        `}</style>
      )}
    </section>
  );
}
