---
description: Load full context about my life, work and current state before we start
argument-hint: "[optional focus, e.g. a project name]"
allowed-tools: Read, Glob, Grep, Bash(python3 _system/scripts/vault.py:*), Bash(obsidian:*)
---

Build a working picture of me before I ask for anything. Don't write any files.

1. Read every file in `Context/` in full.
2. Run `python3 _system/scripts/vault.py daily --days 7` and read the output.
3. Run `python3 _system/scripts/vault.py recent --days 7` and `python3 _system/scripts/vault.py hubs --limit 10`.
4. Follow links one hop: for each project, person or idea that the context files or the last week of daily notes link to repeatedly, read that note. Prioritise notes in `Projects/` with a "Working context" section.
5. If `$ARGUMENTS` names a focus, also read `python3 _system/scripts/vault.py neighborhood "$ARGUMENTS" --depth 2` and the notes closest to it.

Then reply with a short briefing, no more than about 25 lines:
- **Now:** what I'm working on and what's live this week
- **Projects:** each active project in one line, with its current open question
- **People:** who's come up recently and why
- **Open loops:** things I said I'd do and haven't mentioned since
- **Notes read:** the list of files you loaded

End with "Context loaded. What are we working on?" and wait.
