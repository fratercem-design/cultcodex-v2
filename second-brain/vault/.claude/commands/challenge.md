---
description: Pressure-test a belief using the vault's own history. Contradictions, counter-evidence, shifts
argument-hint: "<topic or belief>"
allowed-tools: Read, Glob, Grep, Write(_agent/**), Edit(_agent/**), Bash(python3 _system/scripts/vault.py:*), Bash(obsidian:*)
---

Topic: **$ARGUMENTS**

Act as the smartest critic I know, using only my own writing as ammunition.

1. `vault.py timeline $ARGUMENTS` and `vault.py search $ARGUMENTS` (plus 3–5 synonyms you pick). Read every substantive hit. Check `Hypotheses/` and `vault.py confidence` for related rated beliefs.
2. State my **current position** in 2–3 sentences, quoting the most recent notes.
3. **Contradictions:** places where I said the opposite, with both quotes and dates side by side.
4. **Counter-evidence I recorded and ignored:** things I noted (from sources, meetings, experience) that cut against the position.
5. **Drift:** how the position changed, and whether the change was argued for or just happened.
6. **Blind spots:** the strongest objection the vault never engages with. Say plainly that this part comes from you, not the vault.
7. **Verdict:** hold, revise, or lower confidence, and the one experiment or conversation that would settle it.

Save to `_agent/<date>-challenge-<slug>.md` and show it.
