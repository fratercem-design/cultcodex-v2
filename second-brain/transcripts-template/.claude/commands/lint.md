---
description: Health-check the concept and analysis notes against the transcripts
allowed-tools: Read, Glob, Grep, Write(wiki/concepts/**), Edit(wiki/concepts/**), Write(wiki/analyses/**), Edit(wiki/analyses/**), Edit(log.md), Bash(date)
---

Run a health check on the parts of the wiki Claude maintains (`wiki/concepts/`, `wiki/analyses/`).

Look for:

1. **Uncited claims:** lines with no `[[... (transcript)]]` citation.
2. **Broken links:** `[[links]]` that don't match any note name in the vault.
3. **Stale notes:** concept or analysis notes whose newest citation is older than episodes that clearly discuss the same thing (grep the transcripts for the concept's key terms).
4. **Contradictions:** two notes that say different things about the same event or person.
5. **Missing pages:** ideas mentioned in three or more concept/analysis notes that don't have their own concept note.
6. **Orphans:** concept notes nothing else links to.

Report findings as a checklist grouped by type, each with the note and the evidence. Then ask which ones to fix. Fix only inside `wiki/concepts/` and `wiki/analyses/`; problems in exporter-owned notes (episodes, people, topics, lore, transcripts) are database fixes, so list them separately for me. After fixing, append `## [<today>] lint | <n> fixed` to `log.md`.
