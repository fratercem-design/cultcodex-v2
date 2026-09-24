---
description: Compare what I said I'd do with what I actually did over 30–60 days. Surfaces what I'm avoiding
argument-hint: "[days, default 45]"
allowed-tools: Read, Glob, Grep, Write(_agent/**), Edit(_agent/**), Bash(python3 _system/scripts/vault.py:*), Bash(obsidian:*)
---

Window: the last $ARGUMENTS days. If no number was given, use 45.

1. **Stated intentions:** read `Context/`, every `Projects/` note, and search daily notes for intention language (`vault.py search "I want to" "I will" "I should" "going to" "goal" "priority" "this week" "focus"`).
2. **Actual behaviour:** read the daily notes for the window (`vault.py daily --days N`) and `vault.py recent --days N`. Count what I wrote about, what I report having done, who I met. If a calendar connector is available, add time spent by category.
3. Produce a table: intention · where I stated it (`[[note]]`, date) · evidence of action · drift (on track / slipping / abandoned / never started).
4. **Avoidance:** intentions restated three or more times with no action. Quote each restatement with its date.
5. **Unplanned priorities:** what took my attention that was never a stated intention. That's often the real priority.
6. End with three blunt questions I should answer in tomorrow's daily note.

Save to `_agent/<date>-drift.md` and show it.
