SELECT
  (SELECT count(*) FROM public."Episode") AS episodes,
  (SELECT count(*) FROM public."Person") AS people,
  (SELECT count(*) FROM public."CodexUser") AS users,
  (SELECT count(*) FROM public."TranscriptSegment") AS segments;
