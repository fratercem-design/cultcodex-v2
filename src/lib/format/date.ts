/**
 * `timeZone: "UTC"` is load-bearing, not decoration.
 *
 * Without it Intl formats in the runtime's zone: the server renders in UTC and
 * the browser renders in the visitor's zone, so the same instant comes out as
 * two different dates and React throws a hydration mismatch (error #418) on
 * every page showing a date. An air date stored as UTC midnight is the common
 * case here, and it is exactly the one that breaks:
 *
 *   2024-01-01T00:00:00Z  ->  UTC "Jan 1, 2024"  /  US Pacific "Dec 31, 2023"
 *
 * These are calendar dates, not moments in time, so UTC is also the correct
 * reading — an episode that aired on the 1st should not read as the 31st
 * because the visitor happens to be west of Greenwich.
 */
export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

export function formatRelativeDate(date: Date | null | undefined): string {
  if (!date) return "—";
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
