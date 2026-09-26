# Persona Bibles

The palette comes from the site's Sacred Terminal system (`src/app/globals.css`), so
every frame matches cultcodex.me:

| Token | Hex | Use in frame |
|---|---|---|
| Void | `#07060A` | Backgrounds, shadow |
| Bone | `#EBE3D2` | Skin/paper/candle highlights |
| Ember | `#C8392E` | Key accent, one per frame |
| Sulphur | `#D6A017` | Candlelight, gold leaf |
| Phosphor | `#62E4C8` | CRT glow, sigils (sparingly) |
| Bruise | `#4A2D6E` | Ambient fill |

Workflow per persona (same as the video):
1. Generate the **character sheet**. Keep regenerating until it looks right, then lock it.
2. Generate **4 scenes** with the character sheet as the reference image.
3. Generate a **voice** sample, then reuse it for every talking clip.
4. In Cinema Studio, always attach the character sheet as *image 1* so the character stays consistent.

---

## 1. The Archivist

**One-line:** The keeper of the Codex. They remember every word ever broadcast, and they bring receipts.

**Backstory:** Nobody knows when the Archivist started taking notes. They say they
were in the room for the first transmission, and they've been cataloguing ever since.
They aren't a fan and they aren't a critic. They're a witness, and they speak about
the Cult of Psyche the way a historian speaks about a dynasty.

**Look:** Ageless and androgynous. A cracked bone-white porcelain half-mask covers
the left side of the face. Ink-stained fingers. A long charcoal coat with index cards
tucked into the lapel. A thin brass chain holds a small glowing ember-red
sigil. Works in endless candlelit stacks of transcripts.

**USP:** They're the only voice that can prove it. Every video ends with a real quote,
a date and an episode.

**Voice (Higgsfield Audio prompt):**
> Low, measured, unhurried voice of indeterminate gender. Slight rasp, like
> someone who reads aloud in empty libraries. Precise diction, dry wit,
> never raises volume. Pauses before revealing a quote. Mid-Atlantic accent, close-mic
> intimacy, faint room reverb.

**Sample line:** "Hi. I'm the Archivist. I remember everything they said, so you don't have to."

**Bio:**
```
The Archivist 📜 AI keeper of the Cult of Psyche archive
Every transmission. Every receipt. Dated.
AI character · fan project, not official
↓ ask the Oracle — 3 free questions
```
**Handle ideas:** `@codex.archivist`, `@the.archivist.remembers`

### Image prompts

**Character sheet**
> Character reference sheet, two angles: full-body front view and head-and-shoulders
> close-up. Ageless androgynous figure, cracked bone-white porcelain half-mask covering
> the left side of the face, visible right eye sharp and dark, ink-stained fingertips,
> long charcoal wool coat with handwritten index cards tucked into the lapel, thin brass
> chain holding a small glowing ember-red (#C8392E) sigil pendant. Plain neutral grey
> background. Photorealistic textures, real fabric and skin pores, natural imperfections,
> soft studio key light. Not airbrushed. Consistent face across both angles.

**Scenes** (reference: character sheet)
1. *The Stacks.* Towering shelves of bound transcripts vanishing into darkness, a hundred candles in sulphur-gold light, dust in the air, the Archivist at a reading desk.
2. *The Index Wall.* A wall of pinned index cards connected by red thread, like a detective's evidence board, lit by a single desk lamp.
3. *The Reading Lectern.* A heavy open ledger on a lectern, a quill, a CRT monitor beside it showing a paused livestream frame in phosphor green.
4. *The Vault Door.* A round brass vault door ajar, spilling light, with "CODEX" engraved above it.

---

## 2. Nyx of the Frequencies

**One-line:** The late-night operator who picks up what the Nightmare Frequencies broadcast after everyone else has logged off.

**Backstory:** Nyx runs a pirate radio booth that only exists between 2 and 4am. She
monitors the darker channel, catalogues nightmares that viewers send in, and plays back
the moments that were too strange for daylight. She's calm, a bit amused, and hard to
scare.

**Look:** Late 20s-looking, but her eyes reflect phosphor green like a cat's in the dark. Choppy
black bob, oversized vintage headphones with a coiled cable, a black turtleneck, silver
rings on every finger. Lit mostly by CRT monitors and a red ON AIR bulb.

**USP:** She's the atmosphere account. Nobody else makes the Cult of Psyche feel like a
horror anthology.

**Voice (Higgsfield Audio prompt):**
> Smoky, soft female voice, late-night radio DJ cadence. Slow, confident, a little
> amused, never theatrical. Slight vocal fry at the ends of sentences. Close-mic
> ASMR intimacy with faint analogue static underneath. American, neutral accent.

**Sample line:** "Hi. I'm Nyx. You're listening to the frequencies. Don't touch that dial."

**Bio:**
```
Nyx 📻 AI operator of the Nightmare Frequencies
Transmissions from 3am. Send me your nightmares.
AI character · fan project, not official
↓ tune in
```
**Handle ideas:** `@nyx.frequencies`, `@nyx.on.air`

### Image prompts

**Character sheet**
> Character reference sheet, two angles: full-body front view and head-and-shoulders
> close-up. Woman who looks late 20s, choppy black bob, pale skin, irises with a faint
> phosphor-green (#62E4C8) reflective glow like cat eyes in low light, oversized vintage
> over-ear headphones with coiled cable around her neck, black turtleneck, silver rings on
> every finger. Plain neutral grey background. Photorealistic, visible skin texture and
> pores, natural imperfections, not airbrushed. Consistent face across both angles.

**Scenes** (reference: character sheet)
1. *The Booth.* A cramped pirate-radio booth, a stack of CRT monitors showing static, a glowing red ON AIR bulb, foam on the walls, Nyx at a vintage microphone.
2. *The Tape Wall.* Shelves of labelled cassette tapes ("NIGHTMARE 0341", "DO NOT PLAY"), a reel-to-reel spinning.
3. *The Rooftop Antenna.* A city rooftop at 3am, a rusted broadcast antenna, a bruise-violet sky, Nyx sitting on the ledge with headphones on.
4. *The Static Room.* A dark room lit only by a wall of CRTs, all showing the same frozen frame.

---

## 3. Madame Sulphur

**One-line:** The reader who tells you which of the eight archetypes you are, and which one you keep falling for.

**Backstory:** Madame Sulphur has read the cards for the Codex since before it had a
name. She sorts everyone into one of the eight archetypes: the Oracle, the Alchemist,
the Trickster, the Mirror Walker, the Prophet, the Architect, the Exile and the Familiar.
She's warm and teasing. She's always right about you, and it's a little
uncomfortable.

**Look:** Looks mid-50s, striking and glamorous. Silver-streaked black hair in a heavy
braid, gold-leaf freckles on her cheekbones, sulphur-gold eyes, a bruise-violet
velvet robe, and stacks of antique gold rings. Sits at a round tarot table under
a hanging brass lamp.

**USP:** Identity content. Every video lets the viewer answer "that's me" or "that's my ex".
That's the most shareable format on short-form, and the free quiz is already
built.

**Voice (Higgsfield Audio prompt):**
> Rich, warm, low female voice, mid-50s. Knowing and teasing, like an aunt who reads
> tarot at parties and is always right. Unhurried, drops to a near-whisper for the
> reveal. Slight theatrical lilt, faint Eastern European colour to the vowels, never a
> caricature. Close-mic, warm room.

**Sample line:** "Hi, darling. I'm Madame Sulphur. Sit down. I already know which one you are."

**Bio:**
```
Madame Sulphur 🔮 AI reader of the 8 archetypes
Which one are you? Which one are you dating?
AI character · fan project, not official
↓ take the free archetype quiz
```
**Handle ideas:** `@madame.sulphur`, `@sulphur.reads`

### Image prompts

**Character sheet**
> Character reference sheet, two angles: full-body seated front view and head-and-shoulders
> close-up. Striking glamorous woman who looks mid-50s, silver-streaked black hair in a
> heavy braid over one shoulder, gold-leaf freckles across the cheekbones, sulphur-gold
> (#D6A017) irises, deep bruise-violet (#4A2D6E) velvet robe, stacked antique gold rings,
> fine laugh lines. Plain neutral grey background. Photorealistic, real skin texture and
> pores, natural ageing, not airbrushed. Consistent face across both angles.

**Scenes** (reference: character sheet)
1. *The Reading Table.* A round table with a velvet cloth under a hanging brass lamp, tarot cards fanned out, incense smoke, dark room beyond.
2. *The Archetype Wall.* Eight framed glyph paintings on a wall (◉ ⌬ ☽ ◐ ☉ ▦ ⏚ ✦), candles beneath each.
3. *The Parlour Sofa.* A deep emerald chaise, a teacup, a crystal ball on a side table, a podcast microphone on an arm. This is the "podcast" format scene.
4. *The Doorway.* Madame in a beaded doorway curtain, beckoning to the camera, with warm light behind her.
