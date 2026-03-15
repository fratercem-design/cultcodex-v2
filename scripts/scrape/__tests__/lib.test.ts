import { describe, it, expect } from "vitest";
import { parseDuration, formatDuration, parsePublishedDate } from "../lib";

describe("parseDuration", () => {
  it("parses hours, minutes, seconds", () => {
    expect(parseDuration("PT2H48M43S")).toBe("2:48:43");
  });

  it("parses minutes and seconds only", () => {
    expect(parseDuration("PT29M31S")).toBe("29:31");
  });

  it("parses seconds only", () => {
    expect(parseDuration("PT45S")).toBe("0:45");
  });

  it("parses hours and minutes without seconds", () => {
    expect(parseDuration("PT1H30M")).toBe("1:30:00");
  });

  it("pads minutes and seconds with leading zeros", () => {
    expect(parseDuration("PT1H5M3S")).toBe("1:05:03");
  });

  it("returns null for empty or invalid input", () => {
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("invalid")).toBeNull();
  });
});

describe("formatDuration", () => {
  it("formats total seconds to H:MM:SS", () => {
    expect(formatDuration(3723)).toBe("1:02:03");
  });

  it("formats under an hour to MM:SS", () => {
    expect(formatDuration(125)).toBe("2:05");
  });

  it("formats zero", () => {
    expect(formatDuration(0)).toBe("0:00");
  });
});

describe("parsePublishedDate", () => {
  it("extracts YYYY-MM-DD from ISO datetime", () => {
    expect(parsePublishedDate("2025-09-18T15:30:00Z")).toBe("2025-09-18");
  });

  it("returns null for empty input", () => {
    expect(parsePublishedDate("")).toBeNull();
    expect(parsePublishedDate(undefined)).toBeNull();
  });
});
