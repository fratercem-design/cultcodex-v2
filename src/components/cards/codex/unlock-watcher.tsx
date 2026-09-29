"use client";

/**
 * Mounted site-wide. As a signed-in visitor moves around, it asks the server
 * whether any Trial is now complete (throttled) and toasts each card that
 * gets unsealed. Secret sigils and pack openings announce through the
 * `codex:unsealed` / `codex:check` window events (unlock-events.ts).
 * The card-rendering toast code only loads once there's something to show.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { getAudioPref } from "@/lib/appearance";
import { playBell } from "@/lib/audio/ambient-engine";
import type { UnsealedCard } from "./unlock-events";

const UnlockToasts = dynamic(() => import("./unlock-toasts").then((m) => m.UnlockToasts), { ssr: false });

const THROTTLE_MS = 45_000;
// Module scope, not sessionStorage: signing in reloads the page, which resets
// this, so a visitor who just signed in gets checked right away.
let signedOut = false;
let lastCheck = 0;

export function UnlockWatcher() {
  const pathname = usePathname();
  const [toasts, setToasts] = useState<UnsealedCard[]>([]);
  const timers = useRef<number[]>([]);

  const push = useCallback((cards: UnsealedCard[]) => {
    setToasts((t) => [...t, ...cards].slice(-3));
    if (getAudioPref() === "on") playBell();
    for (const c of cards) {
      timers.current.push(window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== c.id)), 9000));
    }
  }, []);

  const check = useCallback(async (force = false) => {
    if (signedOut) return;
    const now = Date.now();
    if (!force && now - lastCheck < THROTTLE_MS) return;
    lastCheck = now;
    try {
      const res = await fetch("/api/cards/trials", { method: "POST" });
      if (res.status === 401) { signedOut = true; return; }
      const json = (await res.json()) as { granted?: UnsealedCard[] };
      if (json.granted?.length) push(json.granted);
    } catch { /* offline or cold DB — try again on the next page */ }
  }, [push]);

  // check() only sets state after an awaited fetch, never synchronously.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void check(); }, [pathname, check]);

  useEffect(() => {
    const onUnsealed = (e: Event) => push((e as CustomEvent<UnsealedCard[]>).detail);
    const onCheck = () => { void check(true); };
    window.addEventListener("codex:unsealed", onUnsealed);
    window.addEventListener("codex:check", onCheck);
    const pending = timers.current;
    return () => {
      window.removeEventListener("codex:unsealed", onUnsealed);
      window.removeEventListener("codex:check", onCheck);
      pending.forEach(clearTimeout);
    };
  }, [push, check]);

  return toasts.length > 0 ? <UnlockToasts cards={toasts} /> : null;
}
