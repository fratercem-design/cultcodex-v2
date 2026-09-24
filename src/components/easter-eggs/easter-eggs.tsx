"use client";

/**
 * Site-wide surprises. None of them are documented anywhere a visitor would
 * look; the Basement and the console hint at a few.
 *
 *   Typed words (outside text fields): psyche · moth · static · oracle ·
 *     echo · gong · sudo · xyzzy
 *   Idle whisper after 3 minutes without input (once per session)
 *   Tab title changes while the tab is hidden
 *   Omens: 3:33 local time, full moon, Halloween, Friday the 13th
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioPref } from "@/lib/appearance";
import { playBell } from "@/lib/audio/ambient-engine";
import { PROPHECIES, activeOmens, type Omen } from "@/lib/easter-eggs";
import "./easter-eggs.css";

type Effect = "moths" | "static" | "glitch" | "shake" | null;

const WORDS: Record<string, { effect?: Effect; whisper?: () => string; bell?: boolean }> = {
  psyche: { effect: "moths", whisper: () => "The soul had wings before it had a name." },
  moth:   { effect: "moths" },
  static: { effect: "static" },
  oracle: { effect: "glitch", whisper: () => PROPHECIES[Math.floor(Math.random() * PROPHECIES.length)] },
  echo:   { whisper: () => "echo… echo… ech…" },
  gong:   { effect: "shake", bell: true, whisper: () => "GONGED." },
  sudo:   { whisper: () => "Permission denied. The archive answers to no one." },
  xyzzy:  { whisper: () => "Nothing happens." },
};
const MAX_WORD = Math.max(...Object.keys(WORDS).map((w) => w.length));

const IDLE_MS = 180_000;
const IDLE_LINES = [
  "still there?",
  "the archive is listening.",
  "the stairs go further down than the basement.",
  "try typing psyche.",
  "somebody else is reading this page right now.",
];
const HIDDEN_TITLES = ["◐ the signal waits", "come back to the archive", "someone is still talking", "✶ you left the door open"];

const OMEN_LINE: Record<Omen, string> = {
  "3:33": "3:33. You're awake too.",
  "full-moon": "The moon is full. The archive is louder tonight.",
  halloween: "The veil is thin tonight. Mind the moths.",
  "friday-13": "Friday the 13th. Nothing is wrong. Probably.",
};

function isTyping(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName);
}

export function EasterEggs() {
  const [effect, setEffect] = useState<Effect>(null);
  const [whisper, setWhisper] = useState<string | null>(null);
  const [omens, setOmens] = useState<Omen[]>([]);
  const buffer = useRef("");
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const say = useCallback((line: string, ms = 3600) => {
    setWhisper(line);
    later(() => setWhisper((w) => (w === line ? null : w)), ms);
  }, [later]);

  const fire = useCallback((fx: Effect, ms: number) => {
    setEffect(fx);
    later(() => setEffect((e) => (e === fx ? null : e)), ms);
  }, [later]);

  // Typed words.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || e.key.length !== 1) return;
      buffer.current = (buffer.current + e.key.toLowerCase()).slice(-MAX_WORD);
      const word = Object.keys(WORDS).find((w) => buffer.current.endsWith(w));
      if (!word) return;
      buffer.current = "";
      const egg = WORDS[word];
      if (egg.effect) fire(egg.effect, egg.effect === "moths" ? 6500 : 1400);
      if (egg.whisper) say(egg.whisper());
      if (egg.bell && getAudioPref() === "on") playBell();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fire, say]);

  // Idle whisper, once per session.
  useEffect(() => {
    let idle = 0;
    const arm = () => {
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        try {
          if (sessionStorage.getItem("cc-idle-whisper")) return;
          sessionStorage.setItem("cc-idle-whisper", "1");
        } catch { /* storage blocked: whisper anyway */ }
        say(IDLE_LINES[Math.floor(Math.random() * IDLE_LINES.length)], 6000);
      }, IDLE_MS);
    };
    const events = ["pointermove", "keydown", "scroll", "touchstart"] as const;
    events.forEach((ev) => window.addEventListener(ev, arm, { passive: true }));
    arm();
    return () => {
      window.clearTimeout(idle);
      events.forEach((ev) => window.removeEventListener(ev, arm));
    };
  }, [say]);

  // Tab title while hidden (only once the page has been open a little while).
  useEffect(() => {
    const openedAt = Date.now();
    let saved: string | null = null;
    const onVis = () => {
      if (document.hidden && Date.now() - openedAt > 10_000) {
        saved = document.title;
        document.title = HIDDEN_TITLES[Math.floor(Math.random() * HIDDEN_TITLES.length)];
      } else if (!document.hidden && saved !== null) {
        document.title = saved;
        saved = null;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Omens: checked now and every 30s (3:33 only lasts a minute).
  useEffect(() => {
    const seen = new Set<Omen>();
    const tick = () => {
      const now = activeOmens(new Date());
      setOmens(now);
      for (const o of now) {
        if (seen.has(o)) continue;
        seen.add(o);
        say(OMEN_LINE[o], 6000);
        if (o === "halloween") fire("moths", 6500);
      }
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [say, fire]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (omens.length) root.dataset.omen = omens.join(" ");
    else delete root.dataset.omen;
  }, [omens]);

  const fullMoon = omens.includes("full-moon");

  return (
    <>
      {effect === "moths" && (
        <div className="ee-moths" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <svg key={i} className="ee-moth" viewBox="-20 -14 40 28" style={{ top: `${8 + ((i * 37) % 80)}%`, animationDelay: `${i * 0.45}s` }}>
              <path d="M0 -2 C6 -14 18 -12 16 -2 C15 4 6 2 0 0 Z M0 1 C6 3 12 8 8 13 C4 15 1 8 0 3 Z" fill="#e8dcc0" />
              <path d="M0 -2 C-6 -14 -18 -12 -16 -2 C-15 4 -6 2 0 0 Z M0 1 C-6 3 -12 8 -8 13 C-4 15 -1 8 0 3 Z" fill="#e8dcc0" />
              <ellipse rx="1.4" ry="6" cy="1" fill="#8a7c5c" />
            </svg>
          ))}
        </div>
      )}
      {effect === "static" && <div className="ee-static" aria-hidden="true" />}
      {(effect === "glitch" || effect === "shake") && <div className={`ee-${effect}`} aria-hidden="true" />}
      {whisper && <div className="ee-whisper" role="status">{whisper}</div>}
      {fullMoon && (
        <div className="ee-moon" title={OMEN_LINE["full-moon"]} aria-hidden="true">●</div>
      )}
    </>
  );
}
