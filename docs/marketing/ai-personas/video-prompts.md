# Video Prompts

Shot-by-shot prompts for the 3 intro posts and the 18 scripts in [`scripts.md`](./scripts.md),
written for Kling (image-to-video). They also work in Higgsfield.

Video models make 5–10 second clips, and each script runs 20–35 seconds, so every video
is 3–4 shots that you join in CapCut or Instagram Edits. Each shot below lists its
**start frame**, its **length**, the **prompt** and, for talking shots, the **line** spoken in it.

## How to make each shot

1. **Start frame.** Upload the character's reference image as the start frame or image reference:
   [`madame-sulphur-reference.png`](./madame-sulphur-reference.png),
   [`archivist-reference.png`](./archivist-reference.png) or
   [`nyx-reference.png`](./nyx-reference.png). For shots set somewhere else (the Vault, the
   Tape Wall), first make a still of that scene from `personas.md` with the reference
   image attached, then use that still as the start frame.
2. **Prompt.** Paste the shot prompt, then that character's **style block** (below) at the end.
3. **Settings:** 9:16, the length listed, the highest quality your plan allows.
   Paste the **negative prompt** below into the negative prompt box.
4. **Talking shots (🎙):** generate the clip with the mouth moving, then use **Lip Sync**
   with the line recorded in the character's voice (voice prompts are in `personas.md`). If
   your tool makes speech itself, add `She/They say: "<line>"` to the prompt instead.
5. **Text on screen:** add hooks, cards and dates in your editor, never in the prompt.
   AI video garbles lettering.
6. **`[PULL: …]`:** only appears in spoken lines and on-screen text, never in a prompt.
   Fill it with the real archive detail before recording the line.

**Negative prompt (all shots):**
```
text, letters, captions, subtitles, watermark, logo, extra fingers, deformed hands, face morphing, identity change, cartoon, plastic skin, airbrushed, camera shake, jump cut, fast motion
```

### Style blocks (paste at the end of every prompt for that character)

**The Archivist**
```
Same person as the reference image: cracked bone-white porcelain half-mask over one side of the face, one sharp dark eye, short dark hair, ink-stained fingers, charcoal wool coat with handwritten index cards on the lapel, glowing ember-red sigil pendant on a brass chain. Warm candlelight in sulphur-gold, near-black shadows, dust in the air. Photorealistic, 35mm film look, shallow depth of field, slow and still.
```

**Nyx**
```
Same woman as the reference image: choppy black bob with a blunt fringe, glowing phosphor-green eyes, silver vintage headphones with a coiled cord around her neck, black turtleneck, drop earrings, silver rings. Lit by the cold green-grey glow of CRT monitors full of static, with a red rim light from a glowing bulb. Foam-covered walls, deep shadows. Photorealistic, grainy late-night film look, slow and still.
```

**Madame Sulphur**
```
Same woman as the reference image: silver-streaked dark hair in a heavy braid over one shoulder, gold-leaf freckles across her cheekbones, plum velvet robe, stacked antique gold rings. Warm light from a hanging brass lamp, incense smoke, dark room beyond. Photorealistic, rich warm colour, shallow depth of field, slow and still.
```

---

## Intro posts (Day 1)

One shot each, 5–10 s. They're silent, with the caption doing the talking.

**The Archivist intro**
- Start frame: reference image · 8 s
- Prompt: `Very slow push-in toward the Archivist seated at a reading desk. They lift their eyes from an open ledger to look straight into the lens. Candle flames flicker; one page settles.`

**Nyx intro**
- Start frame: reference image · 8 s
- Prompt: `Very slow push-in on Nyx at her microphone. The CRT behind her flickers through static. She looks into the lens and the corner of her mouth lifts into a half-smile. The red bulb pulses once.`

**Madame Sulphur intro**
- Start frame: reference image · 8 s
- Prompt: `Very slow push-in on Madame Sulphur at her tarot table. She looks up into the lens with a knowing smile and turns one card face-up with two fingers. Incense smoke drifts across the lamp light.`

---

## The Archivist

**A1 🎙 "On this day"** (scene: The Stacks)

| # | Start frame | Length | Prompt | Line |
|---|---|---|---|---|
| 1 | Reference | 8 s | `The Archivist at the reading desk looks up into the lens and begins to speak, calm and precise. Candles flicker behind them.` | "On this day, [PULL: date, year], [PULL: speaker] said this on air." |
| 2 | Stacks still | 6 s | `Close-up of ink-stained fingers turning a ledger page to a handwritten entry. Slow push-in on the page.` | *(the quote, read as voiceover)* "[PULL: quote]" |
| 3 | Reference | 8 s | `Back on the Archivist, speaking to camera with a dry, faintly amused look. A slight tilt of the head.` | "Nobody reacted. [PULL: N] months later, it was the only thing anyone was talking about." |
| 4 | Reference | 6 s | `The Archivist closes the ledger gently and rests a hand on it, still looking at the lens.` | "I wrote it down. I always write it down. The full transcript's in the Codex. Link in bio." |

**A2 🎙 "Trace the running joke"** (scene: The Index Wall)

| # | Start frame | Length | Prompt | Line |
|---|---|---|---|---|
| 1 | Index Wall still | 8 s | `The Archivist stands at a wall of index cards joined by red thread, turns to the lens and speaks.` | "Everyone says '[PULL: phrase].' Almost nobody knows where it started." |
| 2 | Index Wall still | 6 s | `Close-up: a finger follows a red thread from card to card across the wall, slow tracking shot.` | "First mention: [PULL: episode, date]. It came back [PULL: count] times." |
| 3 | Index Wall still | 8 s | `The Archivist taps one card, then looks back at the lens.` | "The strangest one was [PULL: episode]. Go look at that one. Search any phrase in the Codex. Link in bio." |

**A3 🎞 "Receipts"** (scene: The Reading Lectern, no speech)

| # | Start frame | Length | Prompt | On-screen text (add in editor) |
|---|---|---|---|---|
| 1 | Lectern still | 10 s | `Slow push-in on a heavy open ledger on a lectern. Candlelight flickers across the handwriting. A green-lit CRT beside it holds a paused frame.` | `3 times they called it before it happened` |
| 2 | Lectern still | 10 s | `Pages turn slowly by themselves in a faint draught, three times, settling on a new spread each time.` | One card per page turn: `[PULL: prediction] · said [PULL: date] → happened [PULL: date]` |
| 3 | Reference | 6 s | `The Archivist closes the ledger and looks into the lens, unimpressed.` | `The Prophet archetype, apparently. Link in bio.` |

**A4 🎙 "Ask me anything"** (scene: The Stacks)

| # | Start frame | Length | Prompt | Line |
|---|---|---|---|---|
| 1 | Reference | 6 s | `The Archivist reads from a small card in their hand, then looks up into the lens.` | "Good question." |
| 2 | Stacks still | 8 s | `The Archivist pulls a bound transcript from a shelf, opens it and runs a finger down the page.` | "The answer's in [PULL: episode], at [PULL: timestamp]. [One-sentence answer from the transcript.]" |
| 3 | Reference | 8 s | `The Archivist looks at the lens with a dry half-smile, almost teasing.` | "You could've found that yourself, you know. The Oracle gives you three free questions a month. Ask it. Link in bio." |

*Put the question as the on-screen hook in shot 1.*

**A5 🎞 "The Vault"** (scene: The Vault Door, no speech)

| # | Start frame | Length | Prompt | On-screen text (add in editor) |
|---|---|---|---|---|
| 1 | Vault still | 10 s | `A round brass vault door swings slowly open, warm light spilling out across a dark stone floor. Dust drifts in the beam.` | `Most people have never watched the first transmission` |
| 2 | Vault still | 10 s | `The camera drifts through the open vault door into a room of endless candlelit shelves.` | `[PULL: first episode title] · [PULL: date]` then `"[PULL: one striking line]"` |
| 3 | Reference | 5 s | `The Archivist, at the far end of the vault, looks up into the lens.` | `Every episode since, indexed. Link in bio.` |

**A6 🎙 "Why I keep the archive"** (scene: The Reading Lectern)

| # | Start frame | Length | Prompt | Line |
|---|---|---|---|---|
| 1 | Reference | 8 s | `The Archivist stands at the lectern, looks into the lens and speaks quietly.` | "Because livestreams disappear. VODs get deleted." |
| 2 | Lectern still | 6 s | `Close-up of the CRT beside the ledger: the paused frame breaks into static and goes dark.` | "Clips lose their context, and people remember it wrong." |
| 3 | Reference | 8 s | `Slow pull-back from the Archivist to reveal shelves of bound transcripts stretching into the dark.` | "Hundreds of hours of it, searchable down to the sentence. Somebody had to keep it. The archive's open. Link in bio." |

---

## Nyx

**N1 🎙 "A signal came in"** (scene: The Booth)

| # | Start frame | Length | Prompt | Line |
|---|---|---|---|---|
| 1 | Reference | 8 s | `Nyx leans toward the microphone and speaks softly into the lens. A CRT behind her flickers.` | "It's three in the morning and you're still awake. Me too." |
| 2 | Booth still | 6 s | `Close-up: Nyx's ringed fingers turn a dial on an old receiver. The needle twitches; static swells on the screens.` | "Tonight's transmission is from [PULL: episode, date]." |
| 3 | Reference | 8 s | `Nyx stays very still and looks into the lens; the green in her eyes catches the light. A slow push-in.` | "Listen to what happens at [PULL: timestamp]. [One-sentence eerie description.] Don't watch it alone. Link in bio." |

**N2 🎞 "Tapes you shouldn't play"** (scene: The Tape Wall, no speech)

| # | Start frame | Length | Prompt | On-screen text (add in editor) |
|---|---|---|---|---|
| 1 | Tape Wall still | 8 s | `Slow tracking shot along shelves of unlabelled cassette tapes in red light. A reel-to-reel turns slowly.` | `Tapes labelled DO NOT PLAY` |
| 2 | Tape Wall still | 10 s | `A ringed hand pulls one cassette from the shelf, then a second, then a third, holding each up to the light.` | One card per tape: `[PULL: episode title] · [PULL: one-line why]` |
| 3 | Booth still | 6 s | `The hand slides a cassette into an old deck and presses play. The CRTs flare with static.` | `I played them anyway. Link in bio.` |

*Leave the tape labels blank in the image and write the names on in the editor.*

**N3 🎙 "Send me your nightmares"** (scene: The Rooftop Antenna)

| # | Start frame | Length | Prompt | Line |
|---|---|---|---|---|
| 1 | Rooftop still | 8 s | `Nyx sits on a rooftop ledge at 3am beside a rusted antenna, city lights below, a deep violet sky. She turns to the lens.` | "I collect nightmares." |
| 2 | Rooftop still | 8 s | `Wide shot: wind moves her hair and the coiled headphone cord. The antenna's red light blinks.` | "Not the monsters. The ones where the door is in the wrong place, or someone you love has the wrong face." |
| 3 | Rooftop still | 8 s | `Close on Nyx, looking into the lens with a faint smile.` | "Put yours in the comments. The strangest one gets read on air." |

**N4 🎞 "Static"** (scene: The Static Room, no speech, low drone)

| # | Start frame | Length | Prompt | On-screen text (add in editor) |
|---|---|---|---|---|
| 1 | Static Room still | 10 s | `A dark room lit only by a wall of old CRT televisions, all frozen on the same blurred frame of an empty hallway. Total stillness.` | `If the screen freezes on this frame, turn it off` |
| 2 | Static Room still | 8 s | `One screen flickers. Then all of them dissolve into rolling static at once and the light pulses.` | — |
| 3 | Static Room still | 5 s | `Every screen cuts to black at the same moment. Silence.` | `Nightmare Frequencies — archived. Link in bio.` |

*Add a low drone that rises with the static, and cut the sound dead on shot 3.*

**N5 🎙 "The dream that repeated"** (scene: The Booth)

| # | Start frame | Length | Prompt | Line |
|---|---|---|---|---|
| 1 | Reference | 8 s | `Nyx at the microphone, speaking to the lens in a low, even voice.` | "On [PULL: date], someone described a dream on stream. [PULL: one-line paraphrase]." |
| 2 | Static Room still | 6 s | `Slow push down a dim, empty hallway on a CRT screen, the image soft and grainy.` | "On [PULL: later date], someone else described the same one." |
| 3 | Reference | 8 s | `Back on Nyx; she lifts one shoulder in a small shrug and holds the lens.` | "Different person, same hallway. I don't have an explanation. I just have the timestamps. Link in bio." |

**N6 🎙 "Why 3am"** (scene: The Rooftop Antenna)

| # | Start frame | Length | Prompt | Line |
|---|---|---|---|---|
| 1 | Rooftop still | 8 s | `Nyx on the rooftop ledge at night, headphones on, looks over at the lens.` | "People say it's the witching hour. I think it's simpler than that." |
| 2 | Rooftop still | 8 s | `Slow pan across a sleeping city of dark windows, one or two still lit.` | "After three, nobody is performing any more. They're tired, the filter's off, and the real signal comes through." |
| 3 | Reference | 6 s | `Nyx in the booth, leaning to the microphone with a half-smile. The ON AIR bulb glows.` | "That's the only time I broadcast. Link in bio." |

---

## Madame Sulphur

**S1 🎙 "Signs you're a Mirror Walker"** (scene: The Reading Table)

| # | Start frame | Length | Prompt | Line |
|---|---|---|---|---|
| 1 | Reference | 8 s | `Madame Sulphur leans toward the lens across her tarot table, warm and teasing, and begins to speak.` | "Darling, people tell you things they've never told anyone." |
| 2 | Reading Table still | 6 s | `Close-up: her ringed hand slides one card from the fanned deck and turns it to reveal an ornate hand mirror painted on its face.` | "You don't give opinions. You ask the one question nobody else thought of, and then they see themselves." |
| 3 | Reference | 8 s | `She lowers her voice and holds the lens, almost a whisper.` | "That's a Mirror Walker, the rarest of the eight. Take the free quiz, link in bio." |

**S2 🎙 "Which archetype are you dating?"** (scene: The Parlour Sofa)

| # | Start frame | Length | Prompt | Line |
|---|---|---|---|---|
| 1 | Parlour still | 8 s | `Madame Sulphur reclines on an emerald chaise beside a podcast microphone and speaks into it, amused.` | "If he laughs at everything sacred but somehow understands it better than you do, that's a Trickster. Fun. Exhausting." |
| 2 | Parlour still | 8 s | `She sips from a teacup, then raises one eyebrow at the lens.` | "If she's quietly building a spreadsheet of your whole relationship, that's an Architect. She loves you. That's what the spreadsheet is." |
| 3 | Parlour still | 8 s | `She sets down the cup and leans in toward the microphone, softer.` | "And if they always stand at the edge of the room? An Exile. They just see clearer from there. Send this to them." |

**S3 🎞 "The 8 archetypes at a party"** (scene: The Archetype Wall, no speech)

| # | Start frame | Length | Prompt | On-screen text (add in editor) |
|---|---|---|---|---|
| 1 | Archetype Wall still | 10 s | `Slow lateral tracking shot along a wall of eight framed symbol paintings, each with a candle burning beneath it.` | `The 8 archetypes at a party`, then the first four lines from `scripts.md`, one per beat |
| 2 | Archetype Wall still | 10 s | `The tracking shot continues along the wall, candle flames swaying as if someone just walked past.` | The last four lines from `scripts.md`, one per beat |
| 3 | Reference | 5 s | `Madame Sulphur at the end of the wall, turning to the lens with a knowing smile.` | `Which one are you? Quiz in bio.` |

*Paint the symbols into the scene still beforehand, or leave the frames dark and add the symbols as text.*

**S4 🎙 "The Prophet's curse"** (scene: The Reading Table)

| # | Start frame | Length | Prompt | Line |
|---|---|---|---|---|
| 1 | Reading Table still | 6 s | `Close-up: Madame Sulphur slowly turns over a tarot card showing a sun.` | "You say it, nobody listens," |
| 2 | Reference | 8 s | `She looks up from the card into the lens, gentle and a little sad.` | "and three years later it happens exactly the way you said. You don't feel smug, darling. You feel tired." |
| 3 | Reference | 8 s | `She lays the card flat on the table and rests her hand over it.` | "That's the Prophet. People only understand you looking back. Find your archetype, link in bio." |

**S5 🎙 "Worst match"** (scene: The Parlour Sofa)

| # | Start frame | Length | Prompt | Line |
|---|---|---|---|---|
| 1 | Parlour still | 8 s | `Madame Sulphur on the chaise holds up two tarot cards side by side toward the lens, eyebrows raised.` | "An Architect and a Trickster." |
| 2 | Parlour still | 8 s | `She lays the two cards down crossed over each other on the side table and laughs softly.` | "One builds the system, the other tests whether it can survive being laughed at. It's a disaster, darling." |
| 3 | Parlour still | 8 s | `She leans toward the microphone, warm and conspiratorial.` | "It's also the best love story in the deck. Tell me your pair in the comments and I'll read it." |

**S6 🎙 "The Familiar"** (scene: The Doorway)

| # | Start frame | Length | Prompt | Line |
|---|---|---|---|---|
| 1 | Doorway still | 8 s | `Madame Sulphur stands in a beaded doorway curtain with warm light behind her and beckons gently toward the lens.` | "This one's for the ones who never left." |
| 2 | Doorway still | 8 s | `The beads sway as she steps closer; her expression softens.` | "You were there before it was interesting. You watched without anyone noticing. You cared, and nobody gave you credit." |
| 3 | Reference | 8 s | `Close on her face, looking straight into the lens, kind and certain.` | "That's the Familiar. Your attention wasn't wasted, darling. Find your place in it. Link in bio." |

---

## Checking a finished video

- The face matches the reference image in every shot. If it drifts, regenerate the shot rather than keep it.
- There are no garbled letters or symbols on any surface. If there are, regenerate with plain surfaces and add the text in the editor.
- The hook text is on screen in the first second and a half.
- Every `[PULL: …]` has been replaced with a real detail.
- Each platform's AI label is switched on when you post (see `captions-week-1.md`).
