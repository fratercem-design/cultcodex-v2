---
description: Morning review. Calendar, tasks, messages and the past week of notes into a prioritised plan
argument-hint: "[optional: anything specific about today]"
allowed-tools: Read, Glob, Grep, Write(_agent/**), Edit(_agent/**), Bash(python3 _system/scripts/vault.py:*), Bash(obsidian:*), Bash(date:*)
---

Plan my day from what I've actually been thinking about, not only from what's on the calendar.

1. Run `date` to get today's date and weekday.
2. Read all of `Context/`, then `python3 _system/scripts/vault.py daily --days 7`.
3. If today's daily note already exists (`Daily/<today>.md`), read it. Notes there override everything else.
4. Pull live sources if you have tools for them (calendar, task manager, email, Slack, iMessage MCP connectors). Use whatever's connected; skip what isn't and say which sources you couldn't reach. Never guess at calendar contents.
5. Compare the two sides:
   - Which calendar items match subjects I've been writing about? Which don't connect to anything in the vault?
   - Which subjects dominate my notes but have no time on the calendar?
   - If `Context/` defines a focus for today's weekday (for example a day-per-domain schedule), is today's calendar honouring it?
6. Check `python3 _system/scripts/vault.py confidence` for hypotheses a meeting today could test.

Write the plan to `_agent/<today>-today.md` in this shape, and show it to me:

```
# Today — <weekday, date>
## The one thing
## Schedule (with a note on each block: why it matters or why to question it)
## Priorities (max 5, each tied to a note: [[Note]])
## Mismatches (calendar ≠ what I care about)
## Open loops from the last 7 days
## Suggested line for today's daily note
```

$ARGUMENTS
