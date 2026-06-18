"use client";

// Floating appearance controls (bottom-left): a small terminal-styled button
// that opens two switches — "Ambient visuals" (matrix rain + CRT scanlines) and
// "High contrast". State lives in localStorage via @/lib/appearance and is
// mirrored as <html> classes; this component just reflects and flips it.

import { useEffect, useRef, useState } from "react";
import {
  getAmbient,
  getContrast,
  setAmbient,
  setContrast,
  subscribeAppearance,
  type AmbientPref,
  type ContrastPref,
} from "@/lib/appearance";

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
  const rootRef = useRef<HTMLDivElement>(null);

  // Mirror persisted state (and any cross-tab changes) into local state.
  useEffect(() => {
    const sync = () => {
      setAmb(getAmbient());
      setCon(getContrast());
    };
    sync();
    return subscribeAppearance(sync);
  }, []);

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
