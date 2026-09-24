import Image from "next/image";
import "./shadow-oracle.css";

/**
 * The Shadow Oracle: the face of the Oracle's divination mode. A still image
 * brought to life with layered CSS: drifting camera, eyes that pulse and
 * flare, a failing neon sign, breathing candles, rising smoke and a
 * holographic sheen. Every layer is positioned in % of the source image, so
 * it stays aligned at any size. Motion stops under prefers-reduced-motion.
 */
// Candle flames, as [left %, top %, animation delay s] of the source image.
const CANDLES: [number, number, number][] = [
  [6.3, 48.7, 0], [10.5, 54, -1.3], [18.8, 43.8, -0.6], [24.8, 40, -2.4],
  [72.8, 41.2, -1.7], [87.8, 53.7, -2.1], [94.8, 52.8, -0.9],
];

export function ShadowOracle({ variant = "hero" }: { variant?: "hero" | "silent" }) {
  return (
    <figure className={`so so-${variant}`} aria-label="The Shadow Oracle, enthroned on the archive's drives">
      <div className="so-stage">
        <Image
          src="/oracle/shadow-oracle.webp"
          alt=""
          fill
          sizes="(max-width: 700px) 100vw, 680px"
          className="so-img"
          priority={variant === "hero"}
        />
        {CANDLES.map(([left, top, delay]) => (
          <span key={left} className="so-candle" style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s` }} />
        ))}
        <span className="so-sign" />
        <span className="so-eye" style={{ left: "47.7%" }} />
        <span className="so-eye" style={{ left: "52.3%" }} />
        <span className="so-smoke so-smoke-a" />
        <span className="so-smoke so-smoke-b" />
        <span className="so-sheen" />
        <span className="so-vignette" />
      </div>
    </figure>
  );
}
