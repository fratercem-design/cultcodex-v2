"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Sector {
  href: string;
  label: string;
  glyph: string;
}

// The dossier's own example set for the dial (Ch. V "mobile rituals").
const SECTORS: Sector[] = [
  { href: "/episodes", label: "Archive", glyph: "▦" },
  { href: "/oracle", label: "Oracle", glyph: "◉" },
  { href: "/cards", label: "Cards", glyph: "⧬" },
  { href: "/graph", label: "Map", glyph: "✦" },
  { href: "/psychenomicon", label: "Lore", glyph: "▲" },
  { href: "/people", label: "Voices", glyph: "◐" },
];

const DEAD_ZONE_PX = 24;
const RADIUS_PX = 92;

function sectorAngle(i: number): number {
  // Index 0 at the top, clockwise — matches how the sectors are laid out.
  return (i / SECTORS.length) * Math.PI * 2 - Math.PI / 2;
}

/** Nearest sector by angular distance to the drag vector, or null inside the
 * dead zone at the center (a "no selection yet" / cancel-by-returning state). */
function angleToIndex(dx: number, dy: number): number | null {
  if (Math.hypot(dx, dy) < DEAD_ZONE_PX) return null;
  const pointerAngle = Math.atan2(dy, dx);
  let best = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < SECTORS.length; i++) {
    let diff = Math.abs(pointerAngle - sectorAngle(i));
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return best;
}

/**
 * "Long-press the center sigil → radial dial opens. Spin to a route.
 * Release to enter." (Dossier Ch. V.) Opened by a `cultcodex:openRadialDial`
 * event (see SigilLongPress) carrying the touch origin; tracks the same
 * ongoing pointer via window-level listeners without needing a second touch.
 *
 * Under prefers-reduced-motion the dossier calls for a plain list instead of
 * the drag gesture — same options, tap to choose, no radial visuals.
 */
export function RadialDialNav() {
  const router = useRouter();
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const originRef = useRef(origin);

  useEffect(() => {
    originRef.current = origin;
  }, [origin]);

  useEffect(() => {
    // Read the media query fresh each time the dial actually opens, rather
    // than syncing it unconditionally on mount — the dial is closed (this
    // component renders null) almost all the time, so there's nothing to
    // keep in sync until the moment a long-press fires this event.
    function onOpen(e: Event) {
      const detail = (e as CustomEvent<{ x: number; y: number }>).detail;
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
      setOrigin(detail);
      setActiveIdx(null);
    }
    window.addEventListener("cultcodex:openRadialDial", onOpen);
    return () => window.removeEventListener("cultcodex:openRadialDial", onOpen);
  }, []);

  const close = useCallback(() => {
    setOrigin(null);
    setActiveIdx(null);
  }, []);

  const select = useCallback(
    (idx: number) => {
      router.push(SECTORS[idx].href);
      if (navigator.vibrate) navigator.vibrate(8);
      close();
    },
    [router, close]
  );

  // Drag tracking — only wired while the dial is open, and only for the
  // gesture version (the reduced-motion list is tap-only, no drag needed).
  useEffect(() => {
    if (!origin || reducedMotion) return;

    function onMove(e: PointerEvent) {
      const o = originRef.current;
      if (!o) return;
      setActiveIdx(angleToIndex(e.clientX - o.x, e.clientY - o.y));
    }
    function onUp(e: PointerEvent) {
      const o = originRef.current;
      if (!o) return;
      const idx = angleToIndex(e.clientX - o.x, e.clientY - o.y);
      if (idx != null) select(idx);
      else close();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", close);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", close);
    };
  }, [origin, reducedMotion, select, close]);

  useEffect(() => {
    if (!origin) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [origin, close]);

  if (!origin) return null;

  if (reducedMotion) {
    return (
      <div className="radial-dial-backdrop" onClick={close} role="presentation">
        <div
          className="radial-dial-list"
          onClick={(e) => e.stopPropagation()}
          role="menu"
          aria-label="Quick navigation"
        >
          {SECTORS.map((s) => (
            <button
              key={s.href}
              type="button"
              role="menuitem"
              className="radial-dial-list__item"
              onClick={() => select(SECTORS.indexOf(s))}
            >
              <span aria-hidden="true">{s.glyph}</span> {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="radial-dial-backdrop" role="presentation">
      <div
        className="radial-dial"
        style={{ left: origin.x, top: origin.y }}
        role="menu"
        aria-label="Quick navigation"
      >
        {SECTORS.map((s, i) => {
          const angle = sectorAngle(i);
          const x = Math.cos(angle) * RADIUS_PX;
          const y = Math.sin(angle) * RADIUS_PX;
          const active = activeIdx === i;
          return (
            <div
              key={s.href}
              className={`radial-dial__sector${active ? " radial-dial__sector--active" : ""}`}
              style={{ transform: `translate(${x}px, ${y}px)` }}
              role="menuitem"
              aria-current={active || undefined}
            >
              <span aria-hidden="true" className="radial-dial__glyph">{s.glyph}</span>
              <span className="radial-dial__label">{s.label}</span>
            </div>
          );
        })}
        <div className="radial-dial__center">
          {activeIdx != null ? SECTORS[activeIdx].label : "choose"}
        </div>
      </div>
    </div>
  );
}
