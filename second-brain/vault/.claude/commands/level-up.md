---
description: Assess where I am from the vault and propose the commands and habits that would take me further
allowed-tools: Read, Glob, Grep, Write(_agent/**), Edit(_agent/**), Bash(python3 _system/scripts/vault.py:*), Bash(obsidian:*), Bash(ls:*)
---

Step back to a higher level of abstraction.

1. Read `Context/`, `vault.py stats`, `hubs`, `tags`, and a sample of 20 notes across time.
2. List the existing commands in `.claude/commands/` and what each does.
3. From the evidence, assess my current level: as a thinker and writer in this vault (note habits, linking, how often ideas graduate) and in my projects (where they stand, where they're stuck). Quote the notes that support each judgement.
4. Propose 5–8 **new slash commands** that would move me from that level to the next one. For each: name, one-line purpose, why *my* vault specifically calls for it (cited), and the step list the command would follow.
5. Propose 3 **habit changes** in how I write notes that would make every command sharper.

Save to `_agent/<date>-level-up.md`. For any command I pick, write it to `_agent/drafts/commands/<name>.md` in the same format as the files in `.claude/commands/`, and give me the `mv` line to install it.
