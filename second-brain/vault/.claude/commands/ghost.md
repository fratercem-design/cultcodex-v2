---
description: Answer a question the way I would, in my voice, then score how faithful it is
argument-hint: "<question>"
allowed-tools: Read, Glob, Grep, Write(_agent/**), Edit(_agent/**), Bash(python3 _system/scripts/vault.py:*), Bash(obsidian:*)
---

Question: **$ARGUMENTS**

1. **Build a voice profile.** Read `Context/`, then sample at least 15 notes I wrote, spread across time and folders (`vault.py recent --days 60`, `vault.py hubs`, daily notes from different months). Record: sentence length, vocabulary I reuse, how I open and close thoughts, words I never use, how hedged or blunt I am, recurring metaphors.
2. **Find what I think.** `vault.py search` the key terms of the question (try synonyms too) and read the strongest notes. Separate positions I've stated outright from ones you're inferring.
3. **Write the answer** as I would, in first person, at the length I'd actually write (usually short).
4. **Fidelity check.** Score 1–10 separately on voice and on substance. For each claim in the answer, cite the note it comes from, or mark it `[inferred]`. Name what you had to invent because the vault is silent.

Save to `_agent/<date>-ghost-<slug>.md` (voice profile, answer, fidelity table) and show the answer and scores.
