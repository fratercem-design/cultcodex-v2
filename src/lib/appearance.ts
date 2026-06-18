"use client";

// User-controlled appearance preferences, persisted to localStorage and applied
// as classes on <html> (`ambient-off`, `high-contrast`). A tiny pre-paint script
// in the root layout applies the same classes before first paint to avoid a
// flash; this module keeps them in sync at runtime and notifies subscribers
// (the toggle UI re-renders; the matrix canvas starts/stops its RAF).

export type AmbientPref = "on" | "off";
export type ContrastPref = "normal" | "high";

const AMBIENT_KEY = "cc-ambient";
const CONTRAST_KEY = "cc-contrast";
export const APPEARANCE_EVENT = "cc:appearance-change";

export function getAmbient(): AmbientPref {
  if (typeof window === "undefined") return "on";
  return window.localStorage.getItem(AMBIENT_KEY) === "off" ? "off" : "on";
}

export function getContrast(): ContrastPref {
  if (typeof window === "undefined") return "normal";
  return window.localStorage.getItem(CONTRAST_KEY) === "high" ? "high" : "normal";
}

function apply(): void {
  const root = document.documentElement;
  root.classList.toggle("ambient-off", getAmbient() === "off");
  root.classList.toggle("high-contrast", getContrast() === "high");
}

export function setAmbient(v: AmbientPref): void {
  window.localStorage.setItem(AMBIENT_KEY, v);
  apply();
  window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT));
}

export function setContrast(v: ContrastPref): void {
  window.localStorage.setItem(CONTRAST_KEY, v);
  apply();
  window.dispatchEvent(new CustomEvent(APPEARANCE_EVENT));
}

// Fires on same-tab changes (CustomEvent) and cross-tab changes (storage).
export function subscribeAppearance(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(APPEARANCE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(APPEARANCE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
