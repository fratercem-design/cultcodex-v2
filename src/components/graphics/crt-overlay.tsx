/**
 * CRTOverlay — fixed full-viewport CRT/VHS mystique layer.
 *
 * Pure-CSS (see globals.css `.crt-overlay`): scanlines, drifting film
 * grain, and a vignette. Sits above content but ignores pointer events,
 * and is auto-disabled under prefers-reduced-motion. Server-safe.
 */
export function CRTOverlay() {
  return (
    <div className="crt-overlay" aria-hidden="true">
      <div className="crt-grain" />
    </div>
  );
}
