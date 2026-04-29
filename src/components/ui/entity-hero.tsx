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
  backgroundImage: string;
  avatarUrl?: string | null;
  fallbackAvatar?: ReactNode;
  badges?: HeroBadge[];
}

export function EntityHero({
  title,
  subtitle,
  backgroundImage,
  avatarUrl,
  fallbackAvatar,
  badges,
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
            <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-accent-gold drop-shadow-md">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 font-mono text-sm text-accent-cyan">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
