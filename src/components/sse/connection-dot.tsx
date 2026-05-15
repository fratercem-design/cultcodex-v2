"use client";

interface ConnectionDotProps {
  status: "open" | "connecting" | "reconnecting";
}

/**
 * Renders an inline pulsing dot when the SSE connection is non-open.
 * Returns null when status === "open" so there is no layout shift in the
 * common case — the absence of a dot is the "healthy" signal.
 */
export function ConnectionDot({ status }: ConnectionDotProps) {
  if (status === "open") return null;

  const label =
    status === "reconnecting"
      ? "Reconnecting to live updates…"
      : "Connecting to live updates…";

  return (
    <span
      role="status"
      aria-label={label}
      title={label}
      className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-2 align-middle"
    />
  );
}
