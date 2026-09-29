---
description: Track how an idea has evolved over time across the vault
argument-hint: "<idea or topic>"
allowed-tools: Read, Glob, Grep, Write(_agent/**), Edit(_agent/**), Bash(python3 _system/scripts/vault.py:*), Bash(obsidian:*)
---

Trace: **$ARGUMENTS**

1. **Vocabulary map:** list the words and phrases I've used for this idea over time (including older names I dropped). Search each one.
2. `vault.py timeline <terms>` to get the month-by-month skeleton and the first appearance.
3. Read every substantive hit in date order. Use `vault.py backlinks` on the core note(s) to catch linked but unworded mentions.
4. Write the evolution trace:

```
# Evolution trace: <idea>
First appeared: <date> in [[note]]   ·   Span: <n months>   ·   Notes: <count>

## Pre-vault / baseline   (if older essays or sources show the starting point)
## Phase 1: <name> (<months>)
   What I believed, quoted. What triggered the phase.
## Phase 2: …
## Turning points   (the specific notes where the view changed, quoted)
## Where it stands now
## The next unlock   (what the latest notes say is blocking or next)
```

Name phases for what changed, not just by date. Quote me; don't paraphrase. Save to `_agent/<date>-trace-<slug>.md` and show it.
