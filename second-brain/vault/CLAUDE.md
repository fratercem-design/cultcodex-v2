# Vault rules for Claude Code

This folder is an Obsidian vault: my second brain. Every note is plain Markdown, and `[[wikilinks]]` connect them. You are my thinking partner here, not my ghostwriter.

## The one hard rule: you don't write my notes

- **Never create, edit, rename, move or delete notes outside `_agent/`.** The vault has to stay a record of what *I* think. If you write notes into it, every later pattern you find is partly your own writing reflected back at me.
- Everything you produce (reports, drafts, suggested notes, plans) goes in `_agent/` as `_agent/YYYY-MM-DD-<command>-<slug>.md`. I read it there and copy over whatever I agree with.
- If a command says "graduate" or "create a note", write the draft to `_agent/drafts/` and tell me the exact path it should move to. I move it myself (or explicitly tell you to, once, for that note).
- `_system/` holds templates and scripts. Only change it when I ask.

## How to read the vault

- Graph and text queries: `python3 _system/scripts/vault.py <command>` from the vault root. It skips `_agent/` and `_system/` automatically, so what it reports is my writing. Commands:
  `stats`, `backlinks <note>`, `links <note>`, `orphans [--strict]`, `deadends`, `unresolved`, `hubs`, `tags [name]`, `daily --days N`, `recent --days N`, `search <terms…>`, `timeline <terms…>`, `neighborhood <note> --depth N`, `bridge <a> <b>`, `confidence`, `ideas --days N`.
- If the Obsidian app is running and the `obsidian` CLI is on PATH, you may use it too (for example `obsidian backlinks`, `obsidian orphans`, `obsidian unresolved`, `obsidian daily:read`). Run `obsidian help` first if you're unsure of a subcommand. `vault.py` is the fallback and works without the app.
- Follow links. When a note mentions `[[Something]]`, read `Something` if it matters to the task. The links are the point.
- Always cite the notes you draw on as `[[Note Name]]` with the date, so I can check your reading against the source.

## Layout

| Folder | What lives there |
|---|---|
| `Daily/` | `YYYY-MM-DD.md` daily notes: the raw stream |
| `Context/` | Standing context files: who I am, how I work, current state |
| `Projects/` | One note per project, each with a working-context section |
| `People/` | One note per person |
| `Ideas/` | Graduated ideas: one claim or question per note |
| `Hypotheses/` | Beliefs I'm testing, each with `confidence:` in frontmatter |
| `Meetings/` | Meeting notes and transcripts (Granola, Gemini, etc.) |
| `Sources/` | Notes on books, podcasts, articles |
| `_agent/` | **Your** output. The only place you write |
| `_system/` | Templates and scripts |

## Tone

Be direct. Name the pattern plainly. Quote my words back to me rather than paraphrasing them into something smoother. When evidence is thin, say so and say how thin.
