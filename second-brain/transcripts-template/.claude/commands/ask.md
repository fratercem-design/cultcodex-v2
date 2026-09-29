---
description: Answer a question from the transcripts, with timestamped citations
argument-hint: "<question>"
allowed-tools: Read, Glob, Grep, Write(wiki/analyses/**), Edit(wiki/analyses/**), Edit(log.md), Bash(date)
---

Question: **$ARGUMENTS**

1. Check `wiki/analyses/` and `wiki/concepts/` for an existing answer. If one covers it, start from there and check whether newer episodes change it.
2. Read `index.md` and follow links to the relevant people, topics, lore and episode notes.
3. Grep `raw/transcripts/` for the key terms, their spelling variants and any `aliases` from the people notes. Read the matching paragraphs and enough around them to get the context right.
4. Answer directly. Every claim gets a citation: `[[<transcript note>]] at [h:mm:ss](youtube link)`. Quote the transcript for the important bits. Say plainly where the evidence is thin, missing, or relies on AI summaries rather than transcript lines.
5. If the answer took real digging and would be useful again, save it as `wiki/analyses/<short title>.md` (frontmatter `type: analysis`, `question:`, `date:`), append `## [<today>] ask | <short title>` to `log.md`, and tell me the path. For a quick lookup, don't save anything.
