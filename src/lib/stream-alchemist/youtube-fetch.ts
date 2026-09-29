import {
  YoutubeTranscript,
  YoutubeTranscriptDisabledError,
  YoutubeTranscriptNotAvailableError,
  YoutubeTranscriptNotAvailableLanguageError,
  YoutubeTranscriptTooManyRequestError,
  YoutubeTranscriptVideoUnavailableError,
} from "youtube-transcript";
import type { CaptionChunk } from "./youtube";

// Server-only. Mirrors the admin transcript sync: the free youtube-transcript
// scraper first, Supadata (paid) only as an explicit opt-in fallback, since
// YouTube often refuses caption requests from cloud IPs.

const SUPADATA_BASE = "https://api.supadata.ai/v1";

export class YouTubeImportError extends Error {
  constructor(
    message: string,
    /** True when a paid fallback might still succeed (blocked or rate-limited, not "no captions"). */
    readonly retryable: boolean,
  ) {
    super(message);
  }
}

export function supadataEnabled(): boolean {
  return process.env.STREAM_ALCHEMIST_SUPADATA === "1" && !!process.env.SUPADATA_API_KEY;
}

export async function fetchFromYouTube(videoId: string): Promise<CaptionChunk[]> {
  try {
    try {
      return await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
    } catch (err) {
      // No English track: take whatever language the video has.
      if (err instanceof YoutubeTranscriptNotAvailableLanguageError) {
        return await YoutubeTranscript.fetchTranscript(videoId);
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof YoutubeTranscriptVideoUnavailableError) {
      throw new YouTubeImportError("That video is private, deleted, or not available here.", false);
    }
    // youtube-transcript reports "disabled" both for videos with no captions and
    // when YouTube withholds captions from a server IP (seen on TED talks that
    // do have captions), so this isn't final: a paid fallback may still work.
    if (err instanceof YoutubeTranscriptDisabledError || err instanceof YoutubeTranscriptNotAvailableError) {
      throw new YouTubeImportError(
        "YouTube didn't return captions for this video. It may not have any yet (live streams usually get auto-captions a few hours after they end), or YouTube may be refusing our request.",
        true,
      );
    }
    if (err instanceof YoutubeTranscriptTooManyRequestError) {
      throw new YouTubeImportError("YouTube is limiting caption requests right now.", true);
    }
    throw new YouTubeImportError("Couldn't get captions from YouTube.", true);
  }
}

interface SupadataResponse {
  content?: CaptionChunk[] | string;
  jobId?: string;
}

/** Supadata returns offsets in milliseconds. Long videos come back as an async job. */
export async function fetchFromSupadata(videoId: string, deadlineAt: number): Promise<CaptionChunk[]> {
  const headers = { "x-api-key": process.env.SUPADATA_API_KEY! };
  const res = await fetch(`${SUPADATA_BASE}/youtube/transcript?${new URLSearchParams({ videoId })}`, { headers });
  if (!res.ok) throw new YouTubeImportError(`Supadata returned ${res.status}.`, false);
  let data = (await res.json()) as SupadataResponse;

  while (data.jobId) {
    if (Date.now() + 5000 > deadlineAt) throw new YouTubeImportError("The transcript is still being prepared. Try again in a minute.", false);
    await new Promise((r) => setTimeout(r, 5000));
    const job = await fetch(`${SUPADATA_BASE}/transcript/${encodeURIComponent(data.jobId)}`, { headers });
    if (!job.ok) throw new YouTubeImportError(`Supadata returned ${job.status}.`, false);
    const body = (await job.json()) as { status: string; result?: SupadataResponse };
    if (body.status === "failed" || body.status === "error") throw new YouTubeImportError("Supadata couldn't transcribe this video.", false);
    data = body.status === "done" && body.result ? body.result : data;
    if (body.status === "done") break;
  }

  if (!Array.isArray(data.content) || !data.content.length) {
    throw new YouTubeImportError("This video has no captions yet.", false);
  }
  return data.content;
}
