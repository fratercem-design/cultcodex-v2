export function formatDuration(duration: string | null | undefined): string {
  if (!duration) return "—";

  const parts = duration.split(":").map(Number);

  if (parts.length === 3) {
    const [h, m] = parts;
    // Don't show "0m" for zero-duration episodes
    if (h === 0 && m === 0) return "—";
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  if (parts.length === 2) {
    const [m] = parts;
    if (m === 0) return "—";
    return `${m}m`;
  }

  return duration;
}

export function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
