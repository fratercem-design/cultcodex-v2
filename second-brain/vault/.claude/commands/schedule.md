---
description: Should I take this meeting or commitment? Checks calendar plus what I actually care about
argument-hint: "<request, e.g. 'meet Greg Friday 2pm'>"
allowed-tools: Read, Glob, Grep, Bash(python3 _system/scripts/vault.py:*), Bash(obsidian:*), Bash(date:*)
---

Request: **$ARGUMENTS**

1. `date`. Check the calendar for the requested slot and the day around it, using a calendar connector if one is available. If not, say so and ask me what's already booked. Don't invent anything.
2. Read `Context/` (especially working-hours rules and day-per-domain focus), and the daily notes for the last 7 days.
3. Search the vault for the person, project or topic (`vault.py search`, `vault.py backlinks`). What's my history with it? Is it top of mind in recent notes, or has it gone quiet?
4. Answer in this format:

```
Recommendation: YES / NO / YES, BUT <change>
Why: 2–4 bullets, each citing a calendar fact or a [[note]]
Alternative: a better slot or format (async, shorter, merge with an existing meeting), if any
Prep: what to read in the vault before it
```

Don't book anything. If I reply "book it" and a calendar tool is available, then book it.
