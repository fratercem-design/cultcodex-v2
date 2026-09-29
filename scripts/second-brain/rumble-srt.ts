/**
 * Folds the local Rumble caption files (scripts/ingest/data/rumble-transcripts)
 * into the vault. A caption file for a stream the export already has becomes
 * that episode's transcript when the database has none; every other file gets
 * its own caption-only episode, so no Rumble transcript is left out.
 */
import {
  MATCH_WINDOW_MS,
  normalize,
  parseRumbleTitle,
  rumbleIdFromUrl,
  type IndexRow,
} from "../ops/rumble-transcripts";
import type { VaultEpisode } from "./vault-render";

export interface RumblePlan {
  /** Exported episodes with no DB transcript, keyed by id → .srt filename to use instead. */
  attach: Map<string, string>;
  /** Streams the export doesn't have, as caption-only episodes. */
  standalone: VaultEpisode[];
  /** Standalone episode id → .srt filename. */
  standaloneFiles: Map<string, string>;
  /** Files whose stream already has a DB transcript in the export. */
  skipped: number;
}

export function planRumbleTranscripts(rows: IndexRow[], episodes: VaultEpisode[]): RumblePlan {
  const plan: RumblePlan = { attach: new Map(), standalone: [], standaloneFiles: new Map(), skipped: 0 };
  const byRumble = new Map(episodes.filter((e) => e.rumbleVideoId).map((e) => [e.rumbleVideoId!, e]));
  // Rumble splits a stream into several VODs; each episode takes one file at most.
  const claimed = new Set<string>();

  for (const row of rows) {
    const rumbleId = rumbleIdFromUrl(row.rumbleUrl);
    const { title, airDate } = parseRumbleTitle(row.title);
    const gap = (e: VaultEpisode) =>
      airDate && e.airDate ? Math.abs(e.airDate.getTime() - airDate.getTime()) : Infinity;

    let ep = rumbleId ? byRumble.get(rumbleId) : undefined;
    if (!ep) {
      ep = episodes
        .filter(
          (e) =>
            !claimed.has(e.id) &&
            (!e.rumbleVideoId || e.rumbleVideoId === rumbleId) &&
            normalize(e.title) === normalize(title) &&
            gap(e) <= MATCH_WINDOW_MS
        )
        .sort((a, b) => gap(a) - gap(b))[0];
    }

    if (ep && !claimed.has(ep.id)) {
      claimed.add(ep.id);
      if (ep.hasTranscript) plan.skipped++;
      else {
        plan.attach.set(ep.id, row.filename);
        ep.hasTranscript = true; // so its episode note links the transcript
      }
      continue;
    }

    const id = `rumble:${rumbleId ?? row.filename}`;
    plan.standaloneFiles.set(id, row.filename);
    plan.standalone.push({
      id,
      title,
      slug: id,
      episodeNumber: null,
      airDate,
      duration: null,
      youtubeVideoId: null,
      rumbleVideoId: rumbleId,
      contentType: "livestream",
      seriesTitle: null,
      summaryShort: null,
      summaryLong: null,
      summaryFacts: null,
      summaryThemes: null,
      guestIds: [],
      mentionedIds: [],
      topicIds: [],
      loreIds: [],
      quotes: [],
      hasTranscript: true,
      captionsOnly: true,
    });
  }
  return plan;
}
