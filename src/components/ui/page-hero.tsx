import Image from "next/image";
import { SacredGeometryOverlay, FloatingParticles } from "@/components/graphics/sacred-geometry";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
  label?: string;
}

export function PageHero({ title, subtitle, backgroundImage, label }: PageHeroProps) {
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
      <div className="absolute inset-0 bg-gradient-to-t from-void via-black/60 to-black/40" />
      <SacredGeometryOverlay />
      <FloatingParticles count={8} />
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-6">
        {label && (
          <p
            className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.4em]"
            style={{ color: "var(--neon)", textShadow: "var(--glow-neon)" }}
          >
            {"// "}{label}
          </p>
        )}
        <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-accent-gold drop-shadow-md">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 font-mono text-sm text-accent-cyan">{subtitle}</p>
        )}
      </div>
    </section>
  );
}
