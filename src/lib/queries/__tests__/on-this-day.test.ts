import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));

import { formatMonthDay, monthDayLabel, parseMonthDay, shiftMonthDay, todayMonthDay } from "../on-this-day";

describe("month-day helpers", () => {
  it("parses only real calendar days", () => {
    expect(parseMonthDay("09-25")).toEqual({ month: 9, day: 25 });
    expect(parseMonthDay("02-29")).toEqual({ month: 2, day: 29 });
    for (const bad of ["02-30", "13-01", "00-10", "9-25", "2026-09-25", undefined, null]) expect(parseMonthDay(bad), String(bad)).toBeNull();
  });

  it("steps across month and year ends and keeps Feb 29", () => {
    expect(shiftMonthDay({ month: 12, day: 31 }, 1)).toEqual({ month: 1, day: 1 });
    expect(shiftMonthDay({ month: 1, day: 1 }, -1)).toEqual({ month: 12, day: 31 });
    expect(shiftMonthDay({ month: 2, day: 28 }, 1)).toEqual({ month: 2, day: 29 });
    expect(shiftMonthDay({ month: 3, day: 1 }, -1)).toEqual({ month: 2, day: 29 });
  });

  it("formats and reads today in UTC", () => {
    expect(formatMonthDay({ month: 9, day: 5 })).toBe("09-05");
    expect(monthDayLabel({ month: 9, day: 5 })).toBe("September 5");
    expect(todayMonthDay(new Date("2026-09-25T23:30:00Z"))).toEqual({ month: 9, day: 25 });
  });
});
