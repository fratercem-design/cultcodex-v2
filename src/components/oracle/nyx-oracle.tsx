import Image from "next/image";
import "./nyx-oracle.css";

/**
 * Nyx, the High Priestess: the face of the Oracle page. A 10s ping-pong loop
 * (5s Kling clip played forward then reversed, so it never jumps) over a
 * still poster of its first frame. The poster is what reduced-motion users see.
 */
export function NyxOracle() {
  return (
    <figure className="nyx" aria-label="Nyx, the High Priestess, enthroned among the stars">
      <div className="nyx-stage">
        <Image src="/oracle/nyx.webp" alt="" fill sizes="420px" className="nyx-media" priority />
        <video
          className="nyx-media nyx-video"
          src="/oracle/nyx-loop.mp4"
          poster="/oracle/nyx.webp"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
        <span className="nyx-vignette" />
      </div>
    </figure>
  );
}
