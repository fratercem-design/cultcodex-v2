# First 18 Scripts

Format for every script: 9:16, 1080p, 20–35 seconds. Attach the persona's character sheet as
image 1. **Hook** = the on-screen caption for the first 1.5 seconds. **VO** = what the
character says. **CTA** = the last line, which always points to the bio link.

`[PULL: …]` means you fill in a real quote/date from the archive before generating.
Ask the Oracle or search `/search`, then copy the speaker, episode and date exactly.
Never let the video model make these up.

Type key: 🎙 talking-to-camera · 🎞 silent B-roll + on-screen text

---

## The Archivist (receipts)

**A1 🎙 "On this day"**
- Hook: `On this day in the archive…`
- Scene: The Stacks
- VO: "On this day, [PULL: date, year], [PULL: speaker] said this on air: '[PULL: quote, under 20 words].' Nobody reacted. [PULL: N] months later, it was the only thing anyone was talking about. I wrote it down. I always write it down."
- CTA: "The full transcript's in the Codex. Link in bio."

**A2 🎙 "Trace the running joke"**
- Hook: `Where did this running joke actually start?`
- Scene: The Index Wall
- VO: "Everyone says '[PULL: running joke / phrase].' Almost nobody knows where it started. First mention: [PULL: episode, date]. It came back [PULL: count] times. The strangest one was [PULL: episode] — go look at that one."
- CTA: "Search any phrase in the Codex. It remembers."

**A3 🎞 "Receipts" carousel-style**
- Hook: `3 times they called it before it happened`
- Scene: Reading Lectern, slow push-in on the ledger. On-screen text cards: three `[PULL]` predictions, each with its date → the date it came true.
- CTA text: `The Prophet archetype, apparently. Link in bio.`

**A4 🎙 "Ask me anything"**
- Hook: `You asked: [PULL: real comment question]`
- Scene: The Stacks
- VO: "Good question. The answer's in [PULL: episode], at [PULL: timestamp]. [One-sentence summary of the answer from the transcript.] You could've found that yourself, you know. The Oracle gives you three free questions a month."
- CTA: "Ask it. Link in bio."

**A5 🎞 "The Vault"**
- Hook: `Most people have never watched the first transmission`
- Scene: Vault Door opening, the camera drifts in. On-screen: `[PULL: first episode title]` · `[PULL: date]` · `[PULL: one striking line]`
- CTA text: `Every episode since, indexed. Link in bio.`

**A6 🎙 "Why I keep the archive"**
- Hook: `Why would anyone keep all of this?`
- Scene: Reading Lectern
- VO: "Because livestreams disappear. VODs get deleted, clips lose their context, and people remember it wrong. Hundreds of hours of it, searchable down to the sentence. Somebody had to keep it."
- CTA: "The archive's open. Link in bio."

---

## Nyx (atmosphere)

**N1 🎙 "A signal came in"**
- Hook: `3:07am. A signal came in.`
- Scene: The Booth
- VO: "It's three in the morning and you're still awake. Me too. Tonight's transmission is from [PULL: Nightmare Frequencies episode, date]. Listen to what happens at [PULL: timestamp]. [One-sentence eerie description, taken from the transcript.] Don't watch it alone."
- CTA: "Tune in. Link in bio."

**N2 🎞 "Tapes you shouldn't play"**
- Hook: `Tapes labelled DO NOT PLAY`
- Scene: The Tape Wall, a hand pulls a cassette. On-screen text: three `[PULL]` episode titles from the darker channel, each with a one-line "why".
- CTA text: `I played them anyway. Link in bio.`

**N3 🎙 "Send me your nightmares"**
- Hook: `Tell me your worst recurring nightmare 👇`
- Scene: Rooftop Antenna
- VO: "I collect nightmares. Not the monsters. The ones where the door is in the wrong place, or someone you love has the wrong face. Put yours in the comments. The strangest one gets read on air."
- CTA: "Then come find the frequency. Link in bio."
- *(An engagement bait post. Read the best comments in N-series follow-ups.)*

**N4 🎞 "Static"**
- Hook: `If the screen freezes on this frame, turn it off`
- Scene: Static Room, every CRT holding the same frozen frame, then one flickers. No VO, low drone, static swells.
- CTA text: `Nightmare Frequencies — archived. Link in bio.`

**N5 🎙 "The dream that repeated"**
- Hook: `The same dream, told twice, years apart`
- Scene: The Booth
- VO: "On [PULL: date], someone described a dream on stream. [PULL: 1-line paraphrase]. On [PULL: later date], someone else described the same one. Different person, same hallway. I don't have an explanation. I just have the timestamps."
- CTA: "Check them yourself. Link in bio."

**N6 🎙 "Why 3am"**
- Hook: `Why does everything strange happen after 3am?`
- Scene: Rooftop Antenna
- VO: "People say it's the witching hour. I think it's simpler than that. After three, nobody is performing any more. They're tired, the filter's off, and the real signal comes through. That's the only time I broadcast."
- CTA: "Late-night archive. Link in bio."

---

## Madame Sulphur (archetypes and relationships)

Every line of archetype description below comes from `src/lib/archetypes.ts`, so it
matches the quiz results exactly.

**S1 🎙 "Signs you're a Mirror Walker"**
- Hook: `Signs you're the rarest archetype`
- Scene: Reading Table
- VO: "Darling, people tell you things they've never told anyone. You don't give opinions, you ask the one question nobody else thought of, and then they see themselves. That's a Mirror Walker, the rarest of the eight, and the most powerful."
- CTA: "Take the quiz and find out if it's you. It's free. Link in bio."

**S2 🎙 "Which archetype are you dating?"**
- Hook: `Which archetype are you dating? (be honest)`
- Scene: Parlour Sofa (podcast)
- VO: "If he laughs at everything sacred, but somehow understands it better than you do, that's a Trickster. Fun. Exhausting. If she's quietly building a spreadsheet of your whole relationship, that's an Architect. She loves you, that's what the spreadsheet is. And if they always stand at the edge of the room? An Exile. They're not cold, darling. They just see clearer from there."
- CTA: "Send this to them. Then take the quiz. Link in bio."

**S3 🎞 "The 8 archetypes as…"**
- Hook: `The 8 archetypes at a party`
- Scene: Archetype Wall, a slow pan with one glyph per beat. On-screen:
  - ◉ Oracle — sees the drama three moves before it happens
  - ⌬ Alchemist — turns one overheard sentence into a thesis
  - ☽ Trickster — the reason there's drama
  - ◐ Mirror Walker — somehow knows everyone's secrets by midnight
  - ☉ Prophet — "I told you this would happen" (they did)
  - ▦ Architect — organised the party
  - ⏚ Exile — best view in the room, by the door
  - ✦ Familiar — has been to every party. Nobody remembers inviting them.
- CTA text: `Which one are you? Quiz in bio.`

**S4 🎙 "The Prophet's curse"**
- Hook: `If you're always right too early…`
- Scene: Reading Table, turning over a card
- VO: "You say it, nobody listens, and three years later it happens exactly the way you said. You don't feel smug, darling, you feel tired. That's the Prophet. You're uncomfortable in real time, and people only understand you looking back."
- CTA: "Find your archetype. Free quiz, link in bio."

**S5 🎙 "Worst match"**
- Hook: `The two archetypes that should never date`
- Scene: Parlour Sofa
- VO: "An Architect and a Trickster. One builds the system, the other tests whether it can survive being laughed at. It's a disaster, darling. It's also the best love story in the deck. Tell me your pair in the comments and I'll read it."
- CTA: "Don't know yours? Link in bio."
- *(Engagement bait: reply to top comments with S-series follow-ups.)*

**S6 🎙 "The Familiar"**
- Hook: `This one's for the ones who never left`
- Scene: The Doorway
- VO: "You were there before it was interesting. You watched without anyone noticing and remembered without keeping records. You cared, and nobody gave you credit. That's the Familiar. The archive is a monument to you, darling. Your attention wasn't wasted."
- CTA: "Find your place in it. Link in bio."

---

## Posting order (days 3–5)

| Slot | Archivist | Nyx | Madame Sulphur |
|---|---|---|---|
| Day 3 AM | A6 | N6 | S3 |
| Day 3 PM | A1 | N1 | S1 |
| Day 4 AM | A3 | N4 | S2 |
| Day 4 PM | A2 | N3 | S5 |
| Day 5 AM | A5 | N2 | S4 |
| Day 5 PM | A4 | N5 | S6 |

Post at 9am and 9pm in the audience's main timezone. For Nyx, move the PM slot to around 11pm. After
18 posts, add 4 more of the winner's best-performing format to reach the 10-per-account
test from the video.
