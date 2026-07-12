"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import { CodexSigil } from "@/components/graphics/codex-sigil";

const LONG_PRESS_MS = 420;
const MOVE_CANCEL_PX = 12;

/**
 * The brand link, with the dossier's mobile ritual layered on top of the
 * plain "go home" tap: "long-press the center sigil → radial dial opens."
 * Gated on pointerType === "touch" so it's a no-op for desktop mouse users —
 * the same Link keeps navigating normally on a quick tap either way.
 */
export function SigilLongPress() {
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "touch") return;
    firedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY };
    clear();
    timerRef.current = window.setTimeout(() => {
      firedRef.current = true;
      window.dispatchEvent(
        new CustomEvent("cultcodex:openRadialDial", {
          detail: { x: startRef.current!.x, y: startRef.current!.y },
        })
      );
      if (navigator.vibrate) navigator.vibrate(12);
    }, LONG_PRESS_MS);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!startRef.current || timerRef.current == null) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) clear();
  }

  function onClickCapture(e: React.MouseEvent) {
    if (firedRef.current) {
      e.preventDefault();
      firedRef.current = false;
    }
  }

  return (
    <Link
      href="/"
      aria-label="CultCodex — Overview (long-press for quick navigation)"
      className="font-mono text-[12px] font-semibold flex items-center gap-2"
      style={{
        color: "var(--neon)",
        textShadow: "var(--glow-neon)",
        letterSpacing: "0.12em",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={clear}
      onPointerCancel={clear}
      onClickCapture={onClickCapture}
    >
      <CodexSigil size={18} glow title="CultCodex sigil" />
      <span>CULTCODEX</span>
    </Link>
  );
}
