---
description: Surface ideas the vault implies but never states. Conclusions from scattered premises, unnamed patterns
argument-hint: "[optional domain to focus on]"
allowed-tools: Read, Glob, Grep, Write(_agent/**), Edit(_agent/**), Bash(python3 _system/scripts/vault.py:*), Bash(obsidian:*)
---

Find what I'm circling without having said it. $ARGUMENTS

1. Map the terrain: `vault.py stats`, `vault.py hubs`, `vault.py tags`, `vault.py unresolved`, `vault.py orphans`.
2. Read the last 60 days of daily notes (`vault.py daily --days 60`) plus the top hubs. If a domain was given, start from `vault.py neighborhood "<domain>" --depth 2`.
3. Look for:
   - **Unstated conclusions:** premise A in one note and premise B in another that together imply C, where C appears nowhere.
   - **Unnamed patterns:** the same shape turning up in unrelated domains (a startup note, a parenting note, a film note) that I've never named.
   - **Latent interests:** unresolved links and orphans that keep getting mentioned and never get written up.
   - **Unarticulated directions:** where the last 60 days are heading if I keep going.
4. For each finding give it a **name** (a phrase I could use as a note title), the evidence quoted with `[[note]]` and date, and a confidence score. Only include findings with at least 3 supporting notes, and say how many.

Keep the 5–7 strongest. Save to `_agent/<date>-emerge.md` and show them.
