---
description: Fold newly exported episodes into the concept notes
argument-hint: "[episode note name, or blank for everything new in log.md]"
allowed-tools: Read, Glob, Grep, Write(wiki/concepts/**), Edit(wiki/concepts/**), Edit(log.md), Bash(date)
---

Ingest: **$ARGUMENTS**

1. Work out which episodes to ingest. If an episode was named above, use it. Otherwise read `log.md` and take the episodes listed in `export` entries newer than the last `ingest` entry. If the only export is the first export, ask me which date range or person to start with rather than reading hundreds of episodes.
2. For each episode, oldest first: read its note in `wiki/episodes/`, then skim its transcript in `raw/transcripts/` for the moments that matter (new running bits, claims about people, lore, turning points, callbacks to older episodes).
3. List the existing notes in `wiki/concepts/` and update the ones this episode adds evidence to. Create a new concept note only when the idea shows up in at least two episodes or is plainly a big deal. Follow the concept shape in `CLAUDE.md`. Every added line cites the transcript and timestamp.
4. When the new episode contradicts a concept note, keep both and put the conflict under "Open questions / contradictions" with both citations.
5. Append to `log.md`: `## [<today>] ingest | <n> episodes`, then the episodes and the concept notes you created or changed as `[[links]]`.
6. Tell me what changed in a few lines, and anything that looked important but you weren't sure about.
