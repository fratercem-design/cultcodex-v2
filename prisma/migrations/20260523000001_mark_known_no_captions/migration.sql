-- Mark known-failing episodes as no_captions so the sync skips them.
-- These were confirmed empty (supadata_empty) or age-restricted (supadata_403)
-- from repeated sync runs, but the old code never wrote the sentinel.

UPDATE "Episode"
SET "transcriptRaw" = 'no_captions'
WHERE status = 'published'
  AND "youtubeVideoId" IS NOT NULL
  AND ("transcriptRaw" IS NULL OR "transcriptRaw" NOT IN ('no_captions'))
  AND slug IN (
    'psyche-awakens-tarot-is-live-59',
    'psyche-awakens-tarot-is-live-53',
    'psyche-awakens-tarot-is-live-36',
    'psyche-awakens-tarot-is-live-13',
    'kitty-gang-slumber-party-open-panel-tarot-and-cats',
    'everyone-hates-me',
    'bidoouh-a-video-exploration',
    'i-m-awake-im-awake',
    'one-more-try-3',
    'last-call-3',
    'the-shocking-truth-about-your-favorite-youtuber',
    'starbucks-run-on-new-ebike',
    'is-anyone-out-there-does-anyone-care',
    'rating-tactical-gear-in-real-time-live',
    'live-streaming-of-psyche-awakens-tarot-3',
    'wednesday-mcdonalds-open-panel-tarot-and-cats',
    'hello',
    'psyche-dancing-in-the-street',
    'the-magician',
    'mystical-tarot-reading-unveiling-secrets-in-a-smoky-aura',
    'a-lot-going-on-get-in-here',
    'tuesday-afternoon-2',
    'psyche-awakens-daily-tarot-livestream',
    'electric-gula-hoop',
    'free-panelverse-troll-decoder-ebook',
    'magus',
    'what-your-resistance-is-actually-protecting-deeptruth-selfawareness',
    'its-a-circus-around-here-lately-cats-funny-dreamscreenai',
    'youtubeshow-tarotreading-openpanel-creatorsofinstagram-spiritualcommunity-liveshow',
    'contact-me-if-you-d-like-to-schedule-an-hour-tarot-reading-for-25-for-a-very-limited-time',
    'toomuch-2',
    'ai-turned-me-into-an-anime-character-aimagic-trending',
    'i-didnt-expect-my-ai-to-do-this-aifilter-viral-trending',
    'your-authentic-power-awakens-now-transformation-strength'
  );

-- Also mark the age-restricted (403) episodes that weren't shown by slug.
-- These are the oldest published episodes with a YouTube video but no transcript
-- segments and no caption sentinel — the remaining ~12 from the failing batch.
UPDATE "Episode" e
SET "transcriptRaw" = 'no_captions'
WHERE e.status = 'published'
  AND e."youtubeVideoId" IS NOT NULL
  AND (e."transcriptRaw" IS NULL OR e."transcriptRaw" NOT IN ('no_captions'))
  AND NOT EXISTS (
    SELECT 1 FROM "TranscriptSegment" ts WHERE ts."episodeId" = e.id
  )
  AND e."airDate" < (
    -- Anchor to the oldest episode that actually has transcript segments
    SELECT MIN(ep."airDate")
    FROM "Episode" ep
    WHERE EXISTS (SELECT 1 FROM "TranscriptSegment" ts WHERE ts."episodeId" = ep.id)
  );
