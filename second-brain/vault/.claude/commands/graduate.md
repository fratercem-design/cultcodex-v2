---
description: Promote the best ideas buried in recent daily notes into standalone, linked notes
argument-hint: "[days, default 14]"
allowed-tools: Read, Glob, Grep, Write(_agent/**), Edit(_agent/**), Bash(python3 _system/scripts/vault.py:*), Bash(obsidian:*)
---

Daily notes are full of ideas that never become notes, so they never compound through backlinks. Fix that for the last $ARGUMENTS days (14 if no number was given).

1. **Scan:** `vault.py ideas --days N` for tagged or labelled ideas, then read `vault.py daily --days N` in full for untagged original thinking: claims, questions, theories, "what if"s, sharp observations.
2. **Cross-reference:** for each candidate, `vault.py search` its key terms. Does a standalone note already cover it? Is the idea repeated across days (a strong signal)?
3. **Present candidates** as a numbered list, best first, maximum 10:
   `n. <proposed title> — from [[YYYY-MM-DD]] — "<quoted line>" — repeated N× — related: [[a]], [[b]] — suggest: NEW NOTE / ADD TO [[existing]] / DISMISS`
4. **Wait for me** to pick numbers and choices.
5. **For each chosen idea:** write a draft to `_agent/drafts/<Title>.md`:
   - frontmatter: `created`, `source: "[[YYYY-MM-DD]]"`, `tags: [idea]`
   - the core claim or question in one sentence, in my words
   - context: the quoted passage from the daily note
   - a short working draft (mini-essay or open questions), clearly marked `<!-- agent draft: rewrite in your own words -->`
   - `## Connections` with `[[backlinks]]` to related notes and one line on why each is related
   For "ADD TO existing", write the proposed addition to `_agent/drafts/` and name the target note.
6. Finish with the move commands, e.g. `mv "_agent/drafts/<Title>.md" "Ideas/"`, so I can promote each one after editing.
