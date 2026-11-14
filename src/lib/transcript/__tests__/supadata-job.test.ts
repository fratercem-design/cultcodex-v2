import { describe, expect, it } from "vitest";
import { readSupadataJob } from "../supadata-job";

const chunk = { text: "hello", offset: 8150, duration: 1200, lang: "en" };

describe("readSupadataJob", () => {
  it("reads a completed job with top-level content (the documented shape)", () => {
    expect(readSupadataJob({ status: "completed", content: [chunk], lang: "en" })).toEqual({
      state: "done",
      status: "completed",
      content: [chunk],
    });
  });

  it("still accepts the older done + result.content shape", () => {
    expect(readSupadataJob({ status: "done", result: { content: [chunk] } })).toEqual({
      state: "done",
      status: "done",
      content: [chunk],
    });
  });

  it("reports a finished job with no usable content as empty", () => {
    expect(readSupadataJob({ status: "completed", content: [] })).toMatchObject({ state: "done", content: null });
    expect(readSupadataJob({ status: "completed", content: "plain text" })).toMatchObject({ state: "done", content: null });
  });

  it.each(["queued", "active"])("keeps polling while the job is %s", (status) => {
    expect(readSupadataJob({ status })).toEqual({ state: "pending", status });
  });

  it.each(["failed", "error"])("treats %s as a failed job", (status) => {
    expect(readSupadataJob({ status, error: "boom" })).toEqual({ state: "failed", status });
  });

  it("keeps polling on a body it can't read", () => {
    expect(readSupadataJob(null)).toEqual({ state: "pending", status: "unknown" });
  });
});
