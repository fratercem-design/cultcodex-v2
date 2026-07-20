# The Panelverse Game Show — Graphics & Song Kit

Everything you need to run the show on stream and dress it up in Canva. The
live board at **cultcodex.me/gameshow** already renders in the brand look and
works as an OBS/StreamYard browser source — this kit is for the surrounding
package (title card, lower-thirds, thumbnails, and a theme song).

---

## 1. Brand kit (paste these into Canva → Brand Kit)

Canva Pro lets you save a Brand Kit with exact colors + fonts. Use these — they
are the site's real tokens, so the Canva assets and the live board match.

**Colors**
| Name | Hex | Use |
|------|-----|-----|
| Void | `#04060A` | background (near-black) |
| Surface | `#0C0B11` | cards / panels |
| Bruise (violet) | `#4A2D6E` | primary accent, round labels |
| Ember (red) | `#C8392E` | highlights, "REVEAL", drama |
| Phosphor (cyan) | `#62E4C8` | correct answers, quotes |
| Bone (text) | `#EBE3D2` | body text |
| Ash (muted) | `#9A907D` | captions, microlabels |

**Fonts** (match the site): a **display serif** for titles (site uses a
Cinzel/serif-display feel) and a **monospace** for microlabels + letters
(A/B/C/D). In Canva: pair *Cinzel* (headings) with *Space Mono* or *IBM Plex
Mono* (labels). All microlabels are UPPERCASE with wide letter-spacing and a
`///` prefix, e.g. `/// LIVE PLAY`.

**Motif:** the psi glyph **ψ**, terminal `///` prefixes, thin 1px borders, a
faint CRT scanline overlay. Keep everything on the near-black void.

---

## 2. Canva assets to build (sizes + copy)

1. **Title card / intro (1920×1080)** — big Cinzel "THE PANELVERSE GAME SHOW",
   Bruise underline, kicker `/// FIVE ROUNDS · ONE HUNDRED QUESTIONS`, ψ watermark.
2. **Round bumpers (1920×1080, one each)** — icon + round name, Ember on void:
   - 📜 REAL OR FAKE: LORE
   - 🎭 TWO TRUTHS & A LIE
   - 🔮 PROPHECY OR BOGUS
   - 🗣️ DID PSYCHE SAY IT?
   - 🕯️ CODEX CLUEDO
3. **Lower-third (1920×240, transparent PNG)** — "ANSWER IN CHAT: A / B / C / D",
   monospace, Phosphor letters. Sits under the browser source.
4. **Scoreboard frame (optional, 600×1080 side panel)** — "THE ROOM vs THE CODEX",
   two tallies, hand-updated by you or a mod.
5. **YouTube thumbnail (1280×720)** — ψ, a blurred question, big "CAN CHAT BEAT
   THE CODEX?", Ember/Bruise. (I can generate this via the Art skill on request.)

**Layout rule:** the live board is the center stage; Canva pieces are the
frame — intro bumper before you screen-share the board, round bumper between
rounds, lower-third pinned underneath.

---

## 3. Theme song — "Chat Takes Notes"

A 30–45s stinger you can drop under the intro card. Generate the audio in
**Suno** or **Udio** (paste the prompt), then import the MP3 into Canva's
title-card as background audio.

**Suno/Udio prompt:**
> Dark synth game-show theme, occult carnival energy, 90 BPM, minor key,
> hammered organ stabs and a game-show buzzer, whispered "psss- psss" vocal
> texture, triumphant reveal sting at the end. Mysterious but playful. Instrumental
> verses with a short chanted hook. ~40 seconds.

**Hook lyrics (the chanted part):**
```
Myth wakes up — and chaos takes notes,
Pick a letter, cast your votes.
The Codex knows what the Codex knows…
Can you beat it? Here we GO.
```

**Round-transition sting (spoken, your voice, 3s):**
> "The Codex is listening. Answer in the chat."

---

## 4. Run-of-show (how to actually play it live)

1. Roll the **intro card** (with the song) for ~15s.
2. Screen-share **cultcodex.me/gameshow** as an OBS/StreamYard browser source.
3. Pick a round from the lobby. Read the prompt aloud.
4. Chat answers with a **letter** (A/B/C/D). Give ~20s.
5. Press **Space** to reveal — correct answer lights up Phosphor green, the
   Codex's ruling appears. Award the room a point if chat mostly nailed it.
6. **Space** again (or →) for the next question. Between rounds, cut to a bumper.

**Keyboard while streaming:** `Space`/`Enter` reveal & advance · `← →` navigate
· `R` toggles the answer. No mouse needed once you're rolling.

**Codex Cluedo** is the finale: chat locks a full guess (who + where + with what);
closest full answer wins the round. The "solution" is the host's call — lean into
it, it's for laughs.

---

## 5. Where the questions come from

All 100 questions are generated from the live Xata database — real humorous
lore, real recorded prophecies, real Psyche transcript quotes, and real
location/artifact/character entries. Decoys are authored and checked so nothing
false is ever labelled true. To regenerate after new episodes land:

```
npx dotenvx run -- npx tsx scripts/_mine-gameshow.ts     # re-mine (writes _gameshow-raw.json)
node -e '...curate...'                                    # writes _gameshow-clean.json
npx tsx scripts/gen-gameshow-bank.ts                      # writes src/lib/data/gameshow-questions.json
```
