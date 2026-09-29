---
description: Deep 30-day vault scan. Cross-domain patterns and graph analysis into ideas across every domain
argument-hint: "[days, default 30]"
allowed-tools: Read, Glob, Grep, Write(_agent/**), Edit(_agent/**), Bash(python3 _system/scripts/vault.py:*), Bash(obsidian:*)
---

This is a long one. Tell me you're starting, then work through it; run independent reads in parallel.

Window: the last $ARGUMENTS days. If no number was given, use 30.

**Gather**
- Structure: `vault.py stats`, `orphans`, `deadends`, `unresolved`, `tags`, `hubs`.
- Stream: `vault.py daily --days N`, `vault.py recent --days N`, `vault.py ideas --days N`.
- Context: everything in `Context/` and each active project's working-context note.
- Calendar, if a connector exists.

**Analyse**
- Cross-domain patterns (the same idea turning up in two or more folders or domains)
- Orphans worth noting: substantial notes nothing links to
- Unresolved links that reveal latent interests
- Hidden relationships: notes that should link and don't
- What's working, as evidenced in my own notes

**Write the report** to `_agent/<date>-ideas.md`:

```
# Idea generation report — <date>
## Structural highlights
## What's working
## Tools to build          (include slash commands for this vault)
## Tools to start using
## Systems to implement
## Subjects to investigate
## Things to write and publish
## Conversations to have   (real people from People/, and why each)
## Things to watch / read / buy
## Top 5 high-impact — do now
```

Every item has to cite the notes that prompted it (`[[note]]`). Anything without a citation gets cut. If a "tool to build" is a slash command, offer to build it with `/graduate`-style care: draft in `_agent/drafts/`, then I approve.
