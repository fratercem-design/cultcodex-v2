"use client";

// Floating appearance controls (bottom-left): a small terminal-styled button
// that opens two switches — "Ambient visuals" (matrix rain + CRT scanlines) and
// "High contrast". State lives in localStorage via @/lib/appearance and is
// mirrored as <html> classes; this component just reflects and flips it.

import { useEffect, useRef, useState } from "react";
import {
  getAmbient,
  getContrast,
  getAudioPref,
  setAmbient,
  setContrast,
  setAudioPref,
  subscribeAppearance,
  type AmbientPref,
  type ContrastPref,
  type AudioPref,
} from "@/lib/appearance";
import { enableAmbient, disableAmbient, isAudioSupported } from "@/lib/audio/ambient-engine";

function Switch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="appearance-switch"
    >
      <span className="appearance-switch__text">
        <span className="appearance-switch__label">{label}</span>
        <span className="appearance-switch__hint">{hint}</span>
      </span>
      <span className="appearance-switch__track" aria-hidden="true">
        <span className="appearance-switch__thumb" />
      </span>
    </button>
  );
}

export function AppearanceControls() {
  const [open, setOpen] = useState(false);
  const [ambient, setAmb] = useState<AmbientPref>("on");
  const [contrast, setCon] = useState<ContrastPref>("normal");
  const [audio, setAud] = useState<AudioPref>("off");
  const rootRef = useRef<HTMLDivElement>(null);

  // Mirror persisted state (and any cross-tab changes) into local state.
  useEffect(() => {
    const sync = () => {
      setAmb(getAmbient());
      setCon(getContrast());
      setAud(getAudioPref());
    };
    sync();
    return subscribeAppearance(sync);
  }, []);

  // Audio enabled in a previous session → a stored preference is not itself
  // a user gesture, so the browser won't let it resume on its own. Instead,
  // pick it back up silently on the visitor's first genuine interaction with
  // the page, wherever that happens to land.
  useEffect(() => {
    if (audio !== "on" || !isAudioSupported()) return;
    const resume = () => enableAmbient();
    window.addEventListener("pointerdown", resume, { once: true, capture: true });
    window.addEventListener("keydown", resume, { once: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", resume, { capture: true });
      window.removeEventListener("keydown", resume, { capture: true });
    };
  }, [audio]);

  function toggleAudio() {
    const next: AudioPref = audio === "on" ? "off" : "on";
    setAudioPref(next);
    if (next === "on") enableAmbient();
    else disableAmbient();
  }

  // Close on outside click / Escape when open.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="appearance-controls">
      {open && (
        <div className="appearance-panel" role="group" aria-label="Appearance settings">
          <div className="appearance-panel__title">DISPLAY</div>
          <Switch
            label="Ambient visuals"
            hint="Matrix rain & CRT scanlines"
            checked={ambient === "on"}
            onChange={() => setAmbient(ambient === "on" ? "off" : "on")}
          />
          <Switch
            label="High contrast"
            hint="Brighter text, darker background"
            checked={contrast === "high"}
            onChange={() => setContrast(contrast === "high" ? "normal" : "high")}
          />
          {isAudioSupported() && (
            <Switch
              label="Ambient audio"
              hint="A low drone, tape hiss, reveal chimes — off by default"
              checked={audio === "on"}
              onChange={toggleAudio}
            />
          )}
        </div>
      )}
      <button
        type="button"
        className="appearance-fab"
        aria-label="Appearance settings"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Adjustments / sliders glyph — display settings */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M18 18h2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="16" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="8" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="16" cy="18" r="2.2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
    </div>
  );
}
