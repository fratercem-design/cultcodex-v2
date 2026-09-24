---
description: Connect two domains through the vault's link graph
argument-hint: "<domain A> <domain B>"
allowed-tools: Read, Glob, Grep, Write(_agent/**), Edit(_agent/**), Bash(python3 _system/scripts/vault.py:*), Bash(obsidian:*)
---

Connect: **$ARGUMENTS** (the first argument is domain A, the rest is domain B; if unclear, ask).

1. Run `vault.py bridge "<A>" "<B>" --depth 2`. It lists each neighbourhood, the shared notes and the shortest link path.
2. Read the core notes in each neighbourhood (up to about 12 per side), plus every shared note.
3. Find **bridges**: specific ideas in A that shed light on something in B, or the reverse. For each:
   - a name for the bridge
   - the passage from side A and the passage from side B, quoted with `[[note]]` and date
   - the combined idea in one or two sentences
   - what it suggests I do or make
4. Rank by surprise: obvious bridges last.
5. Suggest the note I'd write if I believed the best bridge (title plus a three-line outline), as a draft in `_agent/drafts/`.

Save to `_agent/<date>-connect-<a>-<b>.md` and show it.
