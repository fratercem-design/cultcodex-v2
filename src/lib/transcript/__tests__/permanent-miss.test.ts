import { describe, expect, it } from "vitest";
import { isPermanentMiss } from "../permanent-miss";

describe("isPermanentMiss", () => {
  it.each([
    'supadata_404: {"error":"transcript-unavailable","message":"No transcript"}',
    'supadata_404:  {"error":"not-found"}',
    "supadata_empty",
    "supadata_empty_job",
  ])("treats %s as permanent", (reason) => {
    expect(isPermanentMiss(reason)).toBe(true);
  });

  it.each([
    // Bare body: the URL was wrong, not the video.
    "supadata_404: 404 Not Found",
    "supadata_404: ",
    // Could be a bad key or plan, which would stamp every episode.
    'supadata_403: {"error":"forbidden"}',
    "supadata_429: limit",
    "supadata_500: oops",
    "supadata_timeout",
    "supadata_fetch: TypeError: fetch failed",
    "supadata_job_deadline",
    "supadata_job_timeout",
    "supadata_job_fetch",
    "supadata_job_failed",
    "supadata_job_error",
    "supadata_job_502",
    // YouTube blocks datacenter IPs, so these say nothing about the video.
    "yt_no_captions",
    "yt_empty",
    "yt_timeout",
  ])("treats %s as transient", (reason) => {
    expect(isPermanentMiss(reason)).toBe(false);
  });
});
