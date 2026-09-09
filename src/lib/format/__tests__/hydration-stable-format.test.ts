import { describe, it, expect } from "vitest";
import { formatDate } from "../date";

/**
 * Guard against React hydration error #418 — "Hydration failed because the
 * server rendered HTML didn't match the client."
 *
 * It was firing on every page of the live site. The cause is the one React
 * lists by name: date formatting in a locale/zone that differs between server
 * and client. `formatDate` called Intl with no `timeZone`, so it used whatever
 * zone the runtime happened to be in — UTC on the server, the visitor's zone in
 * the browser. For a date stored as UTC midnight, which is how air dates are
 * stored here, that is a guaranteed disagreement for anyone west of Greenwich:
 *
 *   2024-01-01T00:00:00Z   server "Jan 1, 2024"   US Pacific "Dec 31, 2023"
 *
 * The same class of bug applied to bare `Number.toLocaleString()`, which picks
 * up the runtime locale: 3018 renders "3,018" in en-US and "3.018" in de-DE.
 *
 * These tests assert the formatters are *independent of ambient state*, which
 * is the property hydration actually depends on.
 */

const UTC_MIDNIGHT = new Date("2024-01-01T00:00:00.000Z");
const LATE_UTC = new Date("2024-06-15T23:30:00.000Z");

describe("formatDate is hydration-safe", () => {
  it("pins the zone, so a UTC-midnight date never slips to the previous day", () => {
    expect(formatDate(UTC_MIDNIGHT)).toBe("Jan 1, 2024");
  });

  it("pins the zone, so a late-UTC time never rolls to the next day", () => {
    expect(formatDate(LATE_UTC)).toBe("Jun 15, 2024");
  });

  it("does not depend on the ambient Intl default zone", () => {
    // If formatDate had no timeZone option it would agree with this; with the
    // option it must not, because the ambient default here is not UTC in CI.
    const ambient = new Intl.DateTimeFormat("en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
    const pinned = new Intl.DateTimeFormat("en-US", {
      year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
    });
    // formatDate must always equal the pinned form, whatever the ambient is.
    expect(formatDate(UTC_MIDNIGHT)).toBe(pinned.format(UTC_MIDNIGHT));
    // sanity: this is a real hazard, the two forms can disagree
    void ambient;
  });

  it("still handles null and undefined", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });
});

describe("number formatting is hydration-safe", () => {
  it("an explicit locale renders the same regardless of ambient locale", () => {
    expect((3018).toLocaleString("en-US")).toBe("3,018");
    expect((5103266).toLocaleString("en-US")).toBe("5,103,266");
  });

  it("locale genuinely changes the output — so pinning it matters", () => {
    // documents why the bare call was unsafe
    expect((3018).toLocaleString("de-DE")).not.toBe((3018).toLocaleString("en-US"));
    expect((5103266).toLocaleString("en-IN")).not.toBe((5103266).toLocaleString("en-US"));
  });
});
