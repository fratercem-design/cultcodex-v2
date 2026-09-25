# Second Brain: Obsidian + Claude Code

A working version of the "Obsidian as a second brain for Claude Code" setup: a vault of linked Markdown notes you write, plus Claude Code slash commands that read the whole vault and its link graph. Use them to load context in one step, plan your day, trace how your ideas changed, and point out patterns you haven't noticed.

What's in this kit:

| Piece | What it does |
|---|---|
| `vault/` | A ready-to-open Obsidian vault: folders, templates, starter context files, Obsidian settings |
| `vault/.claude/commands/` | 13 slash commands: `/context`, `/today`, `/close-day`, `/ghost`, `/challenge`, `/emerge`, `/drift`, `/ideas`, `/trace`, `/connect`, `/schedule`, `/graduate`, `/level-up` |
| `vault/_system/scripts/vault.py` | Gives Claude the link graph (backlinks, orphans, dead ends, unresolved links, tags, neighbourhoods, bridges, timelines). Standard-library Python, and Obsidian doesn't need to be running |
| `vault/.claude/hooks/guard_writes.py` | Enforces the core rule: **Claude only writes to `_agent/`, never into your notes** |
| `vault/CLAUDE.md` | The rules Claude follows inside the vault |
| `install.sh` | Creates a new vault, or adds the kit to a vault you already have |

> **Looking for the transcript wiki?** See [Transcript vault](#transcript-vault-every-episode-as-a-linked-wiki) at the bottom. It's a separate vault generated from the CultCodex database, not your personal notes.

---

## 1. The idea in 60 seconds

1. **Claude Code** is an agent that works on your computer through plain language. It can read and write files.
2. **What it does for you depends on the context it has.** Retyping that context every session is the bottleneck.
3. **A file is a perfect memory.** Explain a project once in a file and you can pass it in whenever you want.
4. **Obsidian** is an editor for a folder of Markdown files (a *vault*) that lets you link notes with `[[wikilinks]]`. The links form a graph of how your ideas relate.
5. **Claude Code with the graph** can follow those links. It can see that a note about film connects to a note about world-building, which connects to a person you met. That lets it point out patterns across a year of notes that you'd never spot yourself.
6. **You maintain the vault; the agent reads it.** If the agent makes a bad call, you fix the vault rather than re-explaining things to the agent.

---

## 2. Install (about 10 minutes)

### Prerequisites

- **Obsidian** (free): https://obsidian.md
- **Claude Code**: `npm install -g @anthropic-ai/claude-code` (needs Node 18+), then run `claude` once to log in
- **Python 3**: preinstalled on macOS and most Linux. On macOS without it, run `xcode-select --install`

### Option A: new vault (recommended if you're starting out)

```bash
git clone <this repo>   # or download just the second-brain/ folder
cd second-brain
./install.sh                    # creates ~/SecondBrain
# or: ./install.sh ~/Documents/MyVault
```

### Option B: you already have an Obsidian vault

```bash
./install.sh --into ~/path/to/your/vault
```

This adds `.claude/`, `_system/`, `_agent/`, `CLAUDE.md` and the three `Context/` starter files. **Nothing that already exists gets overwritten.** If your vault already has a `CLAUDE.md`, copy the sections from `vault/CLAUDE.md` into it yourself. If your daily notes live somewhere other than `Daily/` or aren't named `YYYY-MM-DD.md`, `vault.py` still finds them by name anywhere in the vault.

### Option C: use the commands from any directory

```bash
./install.sh --into ~/SecondBrain --global
```

This also installs the commands as `/vault:context`, `/vault:trace` and so on in `~/.claude/commands/vault/`, pointed at your vault path, so they work from any project. Two things differ from running Claude inside the vault: the write-guard hook and the vault's pre-approved permissions only apply when Claude is started from the vault folder, so global runs will ask permission more often.

### Open it

1. Obsidian → **Open folder as vault** → choose the folder.
2. Terminal: `cd ~/SecondBrain && claude`
3. Type `/` and you should see the commands listed. Run `/context`.

> Running Claude inside Obsidian (optional): install a terminal plugin from Community plugins (search "Terminal"), open it in a side pane, and run `claude` there. Then your notes and the agent sit side by side, which is how the setup in the video looks. Any terminal works the same way.

---

## 3. Day one: seed the vault (the part that matters)

The commands are only as good as what you've written. Before anything else:

1. **Fill in the three `Context/` files** (about 15 minutes):
   - `About Me.md`: what you do, what you're trying to become, your projects, key people
   - `How I Work.md`: your weekly shape (a focus domain per day works well), meeting rules, tools
   - `Current State.md`: this month's focus, what shifted, what you're stuck on, what you're avoiding
2. **Create one note per active project** from the `Project` template (Ctrl/Cmd+P → "Templates: Insert template"). Keep its **Working context** section current. This is the file an agent reads before helping with that project.
3. **Create a note for each important person** (Person template) and link to them whenever they come up.
4. **Start writing daily notes.** Click the calendar icon or run "Daily notes: Open today's daily note". Write messily: what happened, what you're thinking, questions. Link liberally.

### How to link (the lesson from a year of doing this)

> Don't backlink to broad categories like `[[podcast]]` or `[[fitness]]`. Make a note for each of your **patterns, theories, projects and perspectives**, get them out of your head, and link to *those*.

- Link **people**, **projects** and **named ideas** every time they come up: `Talked to [[Sam]] about [[Always-on documentary]]`.
- It's fine to link a note that doesn't exist yet. Those "unresolved links" are signals of latent interest, and `/ideas` and `/emerge` look for them.
- Tag strong ideas `#idea` so `/graduate` finds them. Untagged ones get picked up too, just less reliably.
- For beliefs you're testing, use the `Hypothesis` template and set `confidence: low | medium | high`. `/close-day` and `/challenge` check these.
- Meeting transcripts (Granola, Gemini, Otter): paste them into `Meetings/` using the `Meeting` template, add *your* takeaways at the top, and link the people and project.

---

## 4. The commands

Run them from a Claude Code session started in the vault folder. Every command writes its output to `_agent/YYYY-MM-DD-<command>….md` and shows you a summary.

### Daily operations

| Command | When | What it does |
|---|---|---|
| `/context [focus]` | Start of any session | Reads `Context/`, the last 7 days of daily notes, recent notes and hubs, and follows links one hop. Briefs you, then waits. After this you never have to re-explain your projects. |
| `/today` | Morning | Calendar + tasks + messages (if those connectors are set up) + the past week of notes, turned into a prioritised plan. Flags where your **calendar doesn't match what you're actually thinking about**, and checks your day-per-domain rule. |
| `/close-day` | Evening | Pulls action items out of today's note (and flags ones you've repeated for days), finds plain-text mentions that should be links, connects today's thinking to older notes, updates hypotheses against their confidence ratings, and lists ideas worth graduating. |
| `/schedule <request>` | Someone asks for time | *"Can I meet Greg Friday at 2pm?"* → YES / NO / YES, BUT, based on the calendar plus what the vault says you care about right now. It never books without your go-ahead. |

### Thinking tools

| Command | What it does |
|---|---|
| `/trace <idea>` | How your thinking on something evolved: first appearance, phases, turning points (quoted), where it stands now, and what's likely to unlock it next. |
| `/connect <A> <B>` | Uses the link graph (`vault.py bridge`) to find the shared notes and shortest path between two domains, then names concrete bridges between them. Try odd pairs. |
| `/emerge [domain]` | Surfaces what the vault implies but never says: conclusions from scattered premises, patterns you haven't named, directions you haven't spelled out. Each finding needs 3 or more supporting notes. |
| `/challenge <belief>` | Pressure-tests a belief using only your own history: contradictions quoted side by side, counter-evidence you noted and ignored, and drift you never argued for. |
| `/drift [days]` | Compares what you *said* you'd do with what you *did* over 30–60 days. Flags anything restated three or more times without action. |
| `/ghost <question>` | Builds a profile of your voice from the vault, answers as you would, then scores its own fidelity and marks every claim as cited or `[inferred]`. |

### Building on top of it

| Command | What it does |
|---|---|
| `/ideas [days]` | The deep scan. Structure (orphans, dead ends, unresolved links, tags, hubs) plus the stream (daily notes) plus context, turned into a report: tools to build, tools to start using, systems to implement, subjects to investigate, things to write, **conversations to have with real people from your vault**, and a top five to do now. Every item cites the notes behind it. It takes several minutes because it reads a lot. |
| `/graduate [days]` | Scans recent daily notes for ideas worth promoting, proposes up to 10 candidates, and waits for you to pick. It then drafts standalone linked notes in `_agent/drafts/` and gives you the `mv` line to promote each one after you've rewritten it. |
| `/level-up` | Steps up a level: assesses where you are as a thinker and in your projects, then proposes **new commands** and note-writing habits that would take you further. It drafts the ones you pick into `_agent/drafts/commands/`. |

### A weekly rhythm

- **Every session:** `/context`
- **Daily:** `/today` in the morning, write through the day, `/close-day` in the evening
- **Weekly:** `/graduate`, then `/drift 7`
- **Monthly:** `/ideas`, `/emerge`, and one `/trace` on whatever you're most invested in
- **When you're about to commit to something big:** `/challenge`

---

## 5. The rule that keeps it honest: separation

> "I want to control all the files in my Obsidian vault because I always want it to pull from what *I* think about things, not what it thinks. If it starts making its own files in this vault, when it's finding patterns, is it finding patterns about things it's written or things I've written?"

The kit enforces this three ways:

1. **`CLAUDE.md`** tells Claude to write only in `_agent/`.
2. **`guard_writes.py`** (a PreToolUse hook in `.claude/settings.json`) *blocks* any Write or Edit to a path in the vault outside `_agent/`. To lift it deliberately for one session, start Claude with `VAULT_ALLOW_WRITES=1 claude`.
3. **`vault.py` ignores `_agent/`, `_system/` and `CLAUDE.md`**, so agent output never feeds back into pattern detection.

Your workflow: read the report in `_agent/`, then copy what you agree with into your own notes, **in your own words**.

---

## 6. `vault.py`: the graph layer

Everything the commands know about links comes from this script. You can run it yourself:

```bash
cd ~/SecondBrain
python3 _system/scripts/vault.py stats                    # overview
python3 _system/scripts/vault.py backlinks "Greg"         # who links here, with the linking lines
python3 _system/scripts/vault.py links "Project X"        # outgoing links (+ unresolved)
python3 _system/scripts/vault.py orphans [--strict]       # notes nothing links to
python3 _system/scripts/vault.py deadends                 # notes that link nowhere
python3 _system/scripts/vault.py unresolved               # [[links]] to notes you haven't written
python3 _system/scripts/vault.py hubs --limit 20          # most connected notes
python3 _system/scripts/vault.py tags [idea]              # tag counts, or notes with a tag
python3 _system/scripts/vault.py daily --days 7           # recent daily notes, full text
python3 _system/scripts/vault.py recent --days 7          # notes created/edited recently
python3 _system/scripts/vault.py search agents delegation # chronological full-text search
python3 _system/scripts/vault.py timeline obsidian        # month-by-month mention chart
python3 _system/scripts/vault.py neighborhood "Film" --depth 2
python3 _system/scripts/vault.py bridge "Filmmaking" "World Building"
python3 _system/scripts/vault.py confidence               # rated hypotheses + staleness
python3 _system/scripts/vault.py ideas --days 14          # idea-shaped lines in daily notes
```

Add `--vault <path>` (or set `VAULT_PATH`) to run it from elsewhere, and `--include-agent` to include `_agent/`.

### Official Obsidian CLI (optional)

Recent Obsidian versions ship a command-line interface that talks to the running app (enable it in Settings → General → Command line interface). The commands are allowed to use it (`Bash(obsidian:*)`), and it's handy for things that need the live app, such as opening a note or appending to today's daily note. Subcommand names vary by version, so run `obsidian help` to see yours. `vault.py` covers every graph query the commands need and works with the app closed, which is why it's the default.

---

## 7. Hooking up calendar, tasks and messages

`/today` and `/schedule` use whatever connectors your Claude Code session has, and say which ones they couldn't reach rather than guessing. To add them:

- **MCP servers:** `claude mcp add …` for Google Calendar, your task app (Todoist, Linear, Things), Slack, Gmail and so on. See https://docs.claude.com/en/docs/claude-code/mcp
- **macOS Calendar/Reminders/Messages:** use an MCP server for Apple apps, or export to a file the command can read.
- **Without connectors:** paste your calendar into today's daily note under `## Focus`. The commands read it from there.

---

## 8. Make your own commands

Every command is just a Markdown file in `.claude/commands/`. The filename becomes the command name, `$ARGUMENTS` is replaced with whatever you type after it, and the frontmatter sets the description and pre-approved tools:

```markdown
---
description: One line shown in the / menu
argument-hint: "<what to pass>"
allowed-tools: Read, Glob, Grep, Write(_agent/**), Bash(python3 _system/scripts/vault.py:*)
---
Steps for Claude, in plain language. Use vault.py for graph queries.
Write output to _agent/<date>-<name>.md.
```

The fastest way to get good ones is to let the vault suggest them: run `/level-up` or `/ideas`, pick a suggestion, and say "build it".

Ideas people build next: `/weekly` (a weekly review), `/prep <person>` (everything the vault knows before a meeting), `/project <name>` (loads one project's context in depth), `/publish` (turns a graduated idea into an outline for an essay or post), `/team-vault` (a shared vault a team can query together).

---

## 9. Privacy

Your vault is your inner life in plain text. Before you run this:

- Everything Claude reads is sent to the model provider for that session. Don't put anything in a vault used with an agent that you wouldn't want processed that way.
- Consider **separate vaults** for separate purposes: one personal, one for work or a team. Run `claude` in the one that fits the task.
- When you demo on screen, even "demo versions" of commands can surface personal notes. Use a separate demo vault.
- Giving an autonomous agent (anything that acts without you prompting it) read access to your whole second brain is a bigger step than using it interactively. Start with read-only and one scoped folder.
- `_agent/` holds summaries of your private notes. Treat it with the same care as the notes.

---

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| Commands don't appear after `/` | Start `claude` **from the vault folder** (the one containing `.claude/`). Or use `--global`. |
| "Blocked: … is one of the user's notes" | That's the guard working. Output belongs in `_agent/`. For a deliberate exception, use `VAULT_ALLOW_WRITES=1 claude`. |
| `vault.py` finds no daily notes | They need to be named `YYYY-MM-DD.md` (any folder). Set Obsidian's daily note format to `YYYY-MM-DD`. |
| Links not detected | `vault.py` reads `[[wikilinks]]` and `[text](note.md)`. Links inside code blocks are ignored on purpose. |
| Commands are slow | Expected. `/ideas` reads a lot of notes and can take 5+ minutes; that's what makes its answers specific to you. Run a lighter command (`/context`, `/trace`) when you need speed. |
| Permission prompts every time | The vault's `.claude/settings.json` pre-approves `vault.py`, reads, and writes to `_agent/`. Anything else will still ask, deliberately. |

### Obsidian settings (if you used `--into`)

Settings → Daily notes: folder `Daily`, format `YYYY-MM-DD`, template `_system/templates/Daily Note`.
Settings → Templates: folder `_system/templates`.
Settings → Files & links: turn on "Automatically update internal links".

---

## Transcript vault: every episode as a linked wiki

A second, separate vault built from the CultCodex database, following Andrej Karpathy's "LLM wiki" pattern: raw transcripts you never edit, a linked wiki on top, and Claude Code growing the wiki over time. Because the database already holds the people, topics, lore and quotes the enrichment pipeline extracted, the first build costs nothing: no LLM ingest pass over hundreds of transcripts.

### Build it

```bash
npm run brain:export                          # -> second-brain/transcripts-vault (gitignored)
npm run brain:export -- --out ~/CultBrain     # or anywhere else, e.g. its own git repo
```

Needs the real `DATABASE_URL` in `.env.local`. Then in Obsidian: **Open folder as vault** → pick the output folder. Start Claude Code in that folder (`cd ~/CultBrain && claude`, or a terminal plugin inside Obsidian).

### What you get

| Path | Contents |
|---|---|
| `index.md` | Catalog: people by number of appearances, topics, lore, episodes by year with one-line summaries |
| `raw/transcripts/` | Every transcript, grouped into paragraphs, each starting with a timestamp that links to that moment on YouTube |
| `wiki/episodes/` | Summary, guests, mentions, topics, lore, quotes, and a link to the transcript |
| `wiki/people/` | Bio, every appearance and mention, their quotes. Alternate names are Obsidian `aliases`, so `[[Psy]]` finds `Psyche` |
| `wiki/topics/`, `wiki/lore/` | One note each, linking every episode they appear in |
| `wiki/concepts/`, `wiki/analyses/` | Empty at first. This is where Claude writes what it learns |
| `CLAUDE.md` | The rules and workflows Claude follows in the vault |

The graph view hides `raw/` and colours people, lore, topics and Claude's notes differently, so it stays readable with thousands of notes.

### Using it

| Command | What it does |
|---|---|
| `/ask <question>` | Answers from the wiki and transcripts with timestamped citations. Worth-keeping answers are saved to `wiki/analyses/` |
| `/ingest` | After a re-export, reads the new episodes listed in `log.md` and folds them into concept notes (running bits, arcs, feuds) |
| `/lint` | Health check: uncited claims, broken links, stale or contradictory concept notes, missing pages |

### Keeping it current

Re-run `npm run brain:export` after the normal ingest pipeline. It only rewrites files that changed, deletes notes for records that were removed, logs new episodes in `log.md`, and never touches `wiki/concepts/`, `wiki/analyses/`, or your edits to `CLAUDE.md`. Then run `/ingest` in the vault. Fix wrong facts in episode, people, topic or lore notes in the database (admin panel), not in the vault: the next export overwrites them.

Only `published` and `unavailable` episodes are exported.
