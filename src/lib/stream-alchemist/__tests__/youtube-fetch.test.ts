import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CaptionChunk } from "../youtube";

// A plain stub rather than vi.fn(): the spy's own tracking of rejected
// promises gets reported as a test failure even when the code under test
// handles the rejection.
type Impl = (videoId: string, config?: { lang?: string }) => Promise<CaptionChunk[]>;
let impl: Impl = async () => [];
const calls: Array<[string, { lang?: string } | undefined]> = [];

vi.mock("youtube-transcript", async (importOriginal) => {
  const real = await importOriginal<typeof import("youtube-transcript")>();
  return {
    ...real,
    YoutubeTranscript: {
      fetchTranscript: (videoId: string, config?: { lang?: string }) => {
        calls.push([videoId, config]);
        return impl(videoId, config);
      },
    },
  };
});

const yt = await import("youtube-transcript");
const { fetchFromYouTube, YouTubeImportError } = await import("../youtube-fetch");

async function failureFor(error: Error) {
  impl = async () => {
    throw error;
  };
  return fetchFromYouTube("dQw4w9WgXcQ").then(
    () => null,
    (e) => e,
  );
}

describe("fetchFromYouTube", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("falls back to any language when there's no English track", async () => {
    const cues = [{ text: "hola", offset: 0, duration: 2000 }];
    impl = async (_id, config) => {
      if (config?.lang === "en") throw new yt.YoutubeTranscriptNotAvailableLanguageError("en", ["es"], "dQw4w9WgXcQ");
      return cues;
    };
    await expect(fetchFromYouTube("dQw4w9WgXcQ")).resolves.toEqual(cues);
    expect(calls).toEqual([
      ["dQw4w9WgXcQ", { lang: "en" }],
      ["dQw4w9WgXcQ", undefined],
    ]);
  });

  it("treats a missing or deleted video as final", async () => {
    const err = await failureFor(new yt.YoutubeTranscriptVideoUnavailableError("dQw4w9WgXcQ"));
    expect(err).toBeInstanceOf(YouTubeImportError);
    expect(err.retryable).toBe(false);
  });

  // The package says "disabled" for captioned videos when YouTube blocks the
  // server, so these must stay eligible for the paid fallback.
  it.each([
    ["disabled", new yt.YoutubeTranscriptDisabledError("dQw4w9WgXcQ")],
    ["not available", new yt.YoutubeTranscriptNotAvailableError("dQw4w9WgXcQ")],
    ["rate limited", new yt.YoutubeTranscriptTooManyRequestError()],
    ["unknown", new Error("socket hang up")],
  ])("treats %s as retryable", async (_label, cause) => {
    const err = await failureFor(cause);
    expect(err).toBeInstanceOf(YouTubeImportError);
    expect(err.retryable).toBe(true);
  });
});

describe("fetchFromSupadata async jobs", () => {
  const chunk = { text: "hello", offset: 8150, duration: 1200, lang: "en" };

  async function runJob(jobBody: unknown) {
    vi.useFakeTimers();
    vi.stubEnv("SUPADATA_API_KEY", "test-key");
    const responses = [{ jobId: "job-1" }, jobBody];
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify(responses.shift())));
    try {
      const { fetchFromSupadata } = await import("../youtube-fetch");
      const done = fetchFromSupadata("dQw4w9WgXcQ", Date.now() + 60_000).then(
        (v) => ({ ok: true as const, v }),
        (e) => ({ ok: false as const, e }),
      );
      await vi.advanceTimersByTimeAsync(5000);
      return await done;
    } finally {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
      vi.useRealTimers();
    }
  }

  it("returns the transcript from a completed job (documented shape)", async () => {
    expect(await runJob({ status: "completed", content: [chunk] })).toEqual({ ok: true, v: [chunk] });
  });

  it("still accepts the done + result.content shape", async () => {
    expect(await runJob({ status: "done", result: { content: [chunk] } })).toEqual({ ok: true, v: [chunk] });
  });

  it("reports a failed job", async () => {
    const r = await runJob({ status: "failed", error: "boom" });
    expect(r.ok).toBe(false);
  });
});
