---
description: End-of-day processing. Extract action items, surface vault connections, flag stale confidence markers
allowed-tools: Read, Glob, Grep, Write(_agent/**), Edit(_agent/**), Bash(python3 _system/scripts/vault.py:*), Bash(obsidian:*), Bash(date:*)
---

Process today's daily note. Don't edit it; I'll make changes myself.

1. Run `date`. Read `Daily/<today>.md`. If it doesn't exist, say so and stop.
2. Read the previous 3 daily notes (`python3 _system/scripts/vault.py daily --days 3`) for continuity.
3. **Action items:** every commitment, "I should", "need to", question to follow up, or person to contact. Mark which are new today and which are repeats from earlier days (repeats are the ones I'm avoiding).
4. **Connections:** for each person, project or idea mentioned today, check whether a note exists (`vault.py search`, `vault.py backlinks`). List:
   - mentions that should be `[[links]]` but are plain text
   - `[[links]]` to notes that don't exist yet (`vault.py unresolved`) that today's writing adds weight to
   - older notes that today's thinking connects to, with the specific older passage quoted
5. **Confidence check:** run `vault.py confidence`. For any hypothesis today's note supports or undercuts, say which way and quote the line. Flag hypotheses not edited in 30+ days that today's note touches.
6. **Ideas:** run `vault.py ideas --days 1`. Which lines today are worth graduating (see `/graduate`)?

Write the result to `_agent/<today>-close-day.md` with those five headings and show a short summary. Finish with one question for tomorrow morning.
