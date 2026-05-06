/**
 * Psychenomicon — Origins Arc (Chapters VI, VII, VIII)
 *
 * The first three episodes of Cult of Psyche were not live streams.
 * They were myth retellings: Cupid & Psyche, Atalanta, Echo & Narcissus.
 * This seed records those founding transmissions as Psychenomicon chapters —
 * the cosmological ground on which everything after was built.
 *
 * 75% factual record of the myths as the show presented them.
 * 25% symbolic interpretation in the Psychenomicon voice.
 *
 * Run via GitHub Actions:
 *   workflow: "Run DB Script" → script: "seed-psychenomicon-origins.ts"
 */
import { PrismaClient } from "@/generated/prisma";

const p = new PrismaClient();

async function upsertEntity(data: Parameters<typeof p.psychenomiconEntity.create>[0]["data"]) {
  return p.psychenomiconEntity.upsert({
    where: { slug: data.slug as string },
    update: {},
    create: data,
  });
}

async function upsertThread(data: Parameters<typeof p.psychenomiconThread.create>[0]["data"]) {
  return p.psychenomiconThread.upsert({
    where: { slug: data.slug as string },
    update: {},
    create: data,
  });
}

async function upsertChapter(data: Parameters<typeof p.psychenomiconChapter.create>[0]["data"]) {
  return p.psychenomiconChapter.upsert({
    where: { chapterNumber: data.chapterNumber as number },
    update: {},
    create: data,
  });
}

async function linkEntity(
  chapterId: string,
  entityId: string,
  archetypeAt: string,
  significance: string,
) {
  return p.psychenomiconEntityAppearance.upsert({
    where: { chapterId_entityId: { chapterId, entityId } },
    update: {},
    create: { chapterId, entityId, archetypeAt, significance },
  });
}

async function linkThread(chapterId: string, threadId: string) {
  return p.psychenomiconThreadChapter.upsert({
    where: { chapterId_threadId: { chapterId, threadId } },
    update: {},
    create: { chapterId, threadId },
  });
}

async function main() {
  console.log("Seeding Psychenomicon — Origins Arc (Chapters VI–VIII)...\n");

  // ── Mythic Entities (the founding archetypes) ─────────────────────────────

  const soulSelf = await upsertEntity({
    name: "Psyche — The Soul",
    slug: "psyche-the-soul",
    primaryArchetype: "The Descending Soul",
    archetypeHistory: [
      {
        archetype: "The Unrecognized",
        chapterNumber: 6,
        reason: "Born too beautiful for the world that holds her; worshipped but untouched, adored but alone",
      },
      {
        archetype: "The Descending Soul",
        chapterNumber: 6,
        reason: "Submits to divine oracle; enters darkness; accepts the impossible; the trial begins",
      },
    ],
    radarData: {
      influence: 8,
      volatility: 5,
      manipulation: 1,
      control: 3,
      emotionalIntensity: 10,
    },
    archetypeState: {
      "The Descending Soul": 0.55,
      "The Unrecognized": 0.25,
      "The Seeker": 0.2,
    },
    behaviorPatterns: [
      "beauty-as-isolation",
      "submission-to-fate",
      "curiosity-as-destruction",
      "trial-endurance",
      "ascension-through-descent",
    ],
    status: "active",
  });

  const loveForcé = await upsertEntity({
    name: "Eros — The Hidden One",
    slug: "eros-the-hidden-one",
    primaryArchetype: "The God Who Chose",
    archetypeHistory: [
      {
        archetype: "The Instrument",
        chapterNumber: 6,
        reason: "Sent as Aphrodite's weapon — to doom Psyche to monstrous love",
      },
      {
        archetype: "The God Who Chose",
        chapterNumber: 6,
        reason: "Wounds himself on his own arrow; defies the goddess who sent him; hides Psyche in darkness",
      },
    ],
    radarData: {
      influence: 10,
      volatility: 6,
      manipulation: 5,
      control: 8,
      emotionalIntensity: 9,
    },
    archetypeState: {
      "The God Who Chose": 0.6,
      "The Instrument": 0.25,
      "The Hidden One": 0.15,
    },
    behaviorPatterns: [
      "love-as-defiance",
      "concealment-as-protection",
      "vulnerability-through-exposure",
      "control-through-invisibility",
    ],
    status: "active",
  });

  const jealousAuthority = await upsertEntity({
    name: "Aphrodite — The Threatened Throne",
    slug: "aphrodite-the-threatened-throne",
    primaryArchetype: "The Jealous Sovereign",
    archetypeHistory: [
      {
        archetype: "The Jealous Sovereign",
        chapterNumber: 6,
        reason: "Sees mortal beauty divert worship from herself; sends a weapon but loses control of it",
      },
      {
        archetype: "The Task-Giver",
        chapterNumber: 6,
        reason: "Unable to destroy Psyche outright, uses the architecture of impossible trials instead",
      },
    ],
    radarData: {
      influence: 9,
      volatility: 7,
      manipulation: 9,
      control: 7,
      emotionalIntensity: 8,
    },
    archetypeState: {
      "The Jealous Sovereign": 0.5,
      "The Task-Giver": 0.35,
      "The Power-Protector": 0.15,
    },
    behaviorPatterns: [
      "status-threat-response",
      "indirect-punishment",
      "impossible-demand",
      "weaponized-authority",
    ],
    status: "active",
  });

  const atalanta = await upsertEntity({
    name: "Atalanta — The Uncatchable",
    slug: "atalanta-the-uncatchable",
    primaryArchetype: "The Sovereign Refuser",
    archetypeHistory: [
      {
        archetype: "The Sovereign Refuser",
        chapterNumber: 7,
        reason: "Raised apart, she became something the world had no name for: a woman who needed no one",
      },
      {
        archetype: "The Trapped Victor",
        chapterNumber: 7,
        reason: "Wins every race but loses to her own conditions; the golden apples are her blind spot",
      },
    ],
    radarData: {
      influence: 7,
      volatility: 5,
      manipulation: 2,
      control: 9,
      emotionalIntensity: 7,
    },
    archetypeState: {
      "The Trapped Victor": 0.5,
      "The Sovereign Refuser": 0.35,
      "The Betrayed Self": 0.15,
    },
    behaviorPatterns: [
      "autonomy-as-armor",
      "competition-as-control",
      "distraction-as-defeat",
      "beauty-weaponized-against-speed",
    ],
    status: "dormant",
  });

  const echoFigure = await upsertEntity({
    name: "Echo — The Repeating Voice",
    slug: "echo-the-repeating-voice",
    primaryArchetype: "The Voice Without Origin",
    archetypeHistory: [
      {
        archetype: "The Keeper of Distraction",
        chapterNumber: 8,
        reason: "Once a nymph who kept Hera occupied with endless talk while Zeus conducted affairs",
      },
      {
        archetype: "The Voice Without Origin",
        chapterNumber: 8,
        reason: "Cursed to only repeat what others say; loves Narcissus; can only echo his final word",
      },
    ],
    radarData: {
      influence: 3,
      volatility: 4,
      manipulation: 0,
      control: 0,
      emotionalIntensity: 9,
    },
    archetypeState: {
      "The Voice Without Origin": 0.7,
      "The Loyal Sufferer": 0.3,
    },
    behaviorPatterns: [
      "forced-repetition",
      "love-without-agency",
      "presence-through-absence",
      "dissolution-into-voice",
    ],
    status: "dormant",
  });

  const narcissus = await upsertEntity({
    name: "Narcissus — The Mirror That Consumed",
    slug: "narcissus-the-mirror-that-consumed",
    primaryArchetype: "The Self-Devouring",
    archetypeHistory: [
      {
        archetype: "The Unreachable",
        chapterNumber: 8,
        reason: "Too beautiful to be moved by love; everyone desires him; he desires no one in return",
      },
      {
        archetype: "The Self-Devouring",
        chapterNumber: 8,
        reason: "Falls in love with his reflection; cannot possess it; starves at the edge of himself",
      },
    ],
    radarData: {
      influence: 6,
      volatility: 3,
      manipulation: 4,
      control: 6,
      emotionalIntensity: 10,
    },
    archetypeState: {
      "The Self-Devouring": 0.65,
      "The Unreachable": 0.35,
    },
    behaviorPatterns: [
      "self-reflection-as-obsession",
      "desire-for-the-unreachable-self",
      "cruelty-through-indifference",
      "transformation-through-fixation",
    ],
    status: "dormant",
  });

  console.log("✓ Mythic entities created (6)");

  // ── Origin Threads ────────────────────────────────────────────────────────

  const threadOrigin = await upsertThread({
    title: "The Origin Myths",
    slug: "the-origin-myths",
    description:
      "The three myths chosen to open the archive. A pattern beneath a pattern: the Soul, the Race, the Mirror. These are not random choices. They are declarations.",
    status: "active",
  });

  const threadTrials = await upsertThread({
    title: "The Trial Architecture",
    slug: "the-trial-architecture",
    description:
      "How trials are structured by the powerful against the ascending. What Aphrodite designs for Psyche, the world will design for everyone who becomes too visible. The trial system is ancient.",
    status: "active",
  });

  const threadMirror = await upsertThread({
    title: "The Mirror Pathology",
    slug: "the-mirror-pathology",
    description:
      "Narcissus at the pool. Echo in the trees. The mirror that traps, and the voice that can only agree. This pattern will return. It always does.",
    status: "emerging",
  });

  console.log("✓ Origin threads created (3)");

  // ── Chapter VI: Before the Lamp Was Lit ──────────────────────────────────

  const ch6 = await upsertChapter({
    chapterNumber: 6,
    title: "Before the Lamp Was Lit",
    slug: "before-the-lamp-was-lit",
    status: "stable",
    isMajorEvent: true,

    canonText: `PSY-ORG-001 — THE FOUNDING MYTH · EP.001
Source: "The Cupid and Psyche Story That Proves Love Is Impossible"
Duration: 15:53 · Aired: July 11, 2024
Status: Stable · Tags: Origin, Soul, Trial, Love, Darkness

RECORD

The first transmission of the archive was not a live stream.
It was a myth.

Psyche — a mortal princess of impossible beauty — drew worship from those who should have worshipped Aphrodite. Temples fell quiet. Offerings shifted. The goddess of love watched mortals adoring a mortal and felt something colder than anger: the fear of being surpassed.

Aphrodite sent Eros to ruin her. The instruction was clear: strike Psyche with an arrow of lead. Make her fall for something monstrous. Destroy the competition quietly, through love's own mechanics.

Eros descended.

Leaned close.

Grazed himself.

He carried Psyche to a palace that could not be seen. She lived there in total comfort — attended by invisible servants, given everything — with a single condition:

She must never look upon her husband's face.

This lasted until her sisters arrived.

They had been carried to the palace blindfolded. They listened to Psyche's impossible happiness with faces arranged into concern. "What does he look like?" they asked. "What if he is a monster?"

They planted the question and left.

That night, Psyche lit a lamp.

The oil dripped.

Eros woke.

He fled the palace and the world he had built for her. The lamp had done what darkness was designed to prevent: it showed her what she already had. And the showing destroyed it.

Aphrodite, informed, set four tasks:

1. Sort a warehouse of mixed seeds into their kinds by dawn.
   (The ants did it while she wept.)

2. Gather golden fleece from the violent rams of the sun.
   (A river reed told her to wait for noon, take what clings to the brambles after.)

3. Fill a crystal vessel with water from the Styx where it falls into the underworld.
   (An eagle carried it down and back.)

4. Descend to Persephone's realm and return with a box containing divine beauty.
   (A tower told her the route. A coin for Charon. Honey cakes for Cerberus. Don't stop for the drowning man. Don't help the old man with the donkey. Come back the same way you came.)

She completed every task.

Then she opened the box.

Not for vanity.
Because she thought it might help.
Because she wanted to be beautiful enough to be held again.

Inside was not beauty but sleep — divine, death-adjacent sleep that pulled her down without mercy.

Eros found her.
He removed the sleep from her face with the tip of an arrow.
He went to Zeus.
She was made immortal.
They were united.

The archive began with this.

CORE DYNAMIC

The myth the host chose first says: love cannot survive being seen before it is ready. The trial was not Aphrodite's cruelty — the trial was consciousness itself. The moment Psyche chose to know, she began the journey that made her divine. Not despite the fall. Because of it.`,

    interpretationText: `THE CHOICE OF ORIGIN

This was not a random selection.

The first episode of the archive is the story of Psyche — the soul — and the love that could not be seen until she was destroyed by seeing it.

This is the founding declaration of the entire system:

The soul descends before it ascends.
Love hides before it reveals.
The trial is the path, not the obstacle.

ARCHETYPAL STRUCTURE

Psyche (The Descending Soul) — enters beauty, loses it, earns divinity.
Eros (The Hidden God) — sent to destroy, chooses to protect, hidden by darkness, exposed by trust.
Aphrodite (The Threatened Throne) — jealousy institutionalized as authority; uses legitimate power to punish illegitimate threat.
The Sisters (The Poisoners) — not enemies out of hatred, but out of smallness; whispers that sound like love.

THE FOUR TASKS AS SYSTEM

Each of Aphrodite's tasks targets a different capacity:

TASK ONE (Seeds) → Organization without strength. The world laughs at you. Let the small things work.
TASK TWO (Fleece) → Violence without confrontation. Don't enter the storm. Wait. Take what remains.
TASK THREE (Styx) → The impossible demands perspective. An eagle can go where you cannot.
TASK FOUR (Underworld) → Do not be moved by what reaches for you on the descent.

These are not puzzle-solutions. They are a psychology.

THE LAMP AS ARCHETYPE

The lamp is not curiosity.
The lamp is consciousness choosing knowledge over peace.

The oil drop is not clumsiness.
The oil drop is the irreversibility of awareness.

Once you have seen something, you cannot choose to unsee it.
Psyche lit the lamp and made herself divine — but first, she made herself alone.

This pattern — the cost of knowing — runs through every significant moment of the archive. It will return.

HOST SIGNIFICANCE

The host chose this myth first. They named themselves Psyche. They opened the archive with the story of the soul's descent.

This is not a coincidence. It is a covenant.

The show is Psyche's trial. The audience is the lamp.`,

    mythicText: `Before the first transmission reached them,
before the watchers knew they were watchers,
there was a voice that chose.

It chose the oldest story first.

Not the newest.
Not the most convenient.
Not the safest.

The oldest.

In the time before names settled into meaning,
a girl was born so beautiful
that mortals built temples to her
in the spaces between altars.

The gods noticed.

The gods always notice
when one of the small creatures
begins receiving
what belongs to the sky.

A goddess grew cold.

Not with fire —
fire is honest —
but with the slow deliberate frost
of someone who calculates.

She dispatched love itself
to destroy the girl.

But love, arriving at the edge of her sleep,
saw something strange:

a soul
that shone from inside
the way the Cosmic Egg once shone
before the first light broke its shell.

Love wounded itself
rather than wound her.

And so she was hidden.

Carried to a palace of perfect comfort,
attended by invisible hands,
given everything
except the one thing
that mattered most to consciousness:

a face to look upon.

This is where the story is often misunderstood.

The darkness was not cruelty.

The darkness was protection
from a world not yet ready
to believe what it had produced.

But the soul cannot live forever
in what it cannot see.

That is the nature of Psyche.
That is the nature of all souls.

The lamp was lit.

The oil fell.

The story shifted
from shelter to trial —

and the trial was designed
not by the jealous goddess,
not by fate,
not by ancient cruelty —

but by the fact of awareness itself.

To know is to lose the palace.

To know is to begin the descent.

The soul sorted seeds in the dark,
gathered treasure from the violent,
drew water from the impossible,
and walked all the way
to the edge of death
to bring back something
she hoped might make her
beautiful enough to be held again.

She opened the box.

She fell.

And the god she had once looked upon by lamplight
came back
not because she had proven herself worthy —

but because he had always been
still moving
on her behalf,
even when she could not see him.

This is the myth
the archive chose
to say first:

The soul descends.

The descent is the story.

And love —
real love —
does not leave when seen.

It only pretends to
long enough
to let you earn
the reunion.`,

    emergingSignals: [
      "The soul descends before it ascends — the archive opens with the pattern it will repeat",
      "Beauty that rivals authority will always draw trials — this is structural, not personal",
      "The lamp archetype: consciousness choosing knowledge over peace; cannot be undone",
      "The impossible task is not a test of strength — it is a test of what helpers you attract",
      "The host named themselves Psyche — the archive is the trial they chose to enter",
    ],
    archetypesData: [
      {
        name: "Psyche",
        archetype: "The Descending Soul",
        significance:
          "First archetype of the archive — the soul that must be destroyed to become divine",
      },
      {
        name: "Eros",
        archetype: "The God Who Chose",
        significance:
          "Love that defies its own deployment; hides the soul in darkness to protect it from what would destroy it",
      },
      {
        name: "Aphrodite",
        archetype: "The Jealous Sovereign",
        significance:
          "Authority threatened by beauty it cannot own; uses the trial system as punishment architecture",
      },
      {
        name: "The Sisters",
        archetype: "The Poisoners",
        significance:
          "Danger that arrives wearing love's face; the question planted is more destructive than open attack",
      },
    ],
  });

  await Promise.all([
    linkEntity(
      ch6.id,
      soulSelf.id,
      "The Descending Soul",
      "The founding archetype — the soul who must fall to ascend; every trial is initiation",
    ),
    linkEntity(
      ch6.id,
      loveForcé.id,
      "The God Who Chose",
      "Defies his own commission; hides the soul; wounded by his own arrow — love as defiance of authority",
    ),
    linkEntity(
      ch6.id,
      jealousAuthority.id,
      "The Jealous Sovereign",
      "Establishes the trial architecture; punishment through impossible demands on the ascending soul",
    ),
    linkThread(ch6.id, threadOrigin.id),
    linkThread(ch6.id, threadTrials.id),
  ]);

  console.log("✓ Chapter VI seeded — Before the Lamp Was Lit");

  // ── Chapter VII: The Race She Could Not Win ───────────────────────────────

  const ch7 = await upsertChapter({
    chapterNumber: 7,
    title: "The Race She Could Not Win",
    slug: "the-race-she-could-not-win",
    status: "stable",
    isMajorEvent: false,

    canonText: `PSY-ORG-002 — THE SECOND MYTH · EP.002
Source: "Atalanta: The Tragic Love Story That Changed Greece Forever"
Duration: 4:30 · Aired: July 31, 2024
Status: Stable · Tags: Origin, Autonomy, Control, Defeat-Through-Distraction

RECORD

The second myth chosen for the archive is not the most famous.

It is the most instructive.

Atalanta was born into an era that had decided what women should be. Her father, who had wanted a son, left her on a hillside to die. She was raised by bears, trained by Artemis, and grew into something the world had not prepared for:

A woman who needed no one.

Faster than any man.
Stronger than most gods expected.
Committed to a vow of chastity that was not passivity — it was sovereignty.

When her father finally claimed her (now that she was famous), he insisted she marry. She refused. He insisted again. She set her terms:

"Race me. Win, and I am yours. Lose, and I take your life."

No man could win. She ran faster than any suitor could conceive. The bodies accumulated.

Then came Hippomenes — or Melanion, depending on the telling — a young man who loved her not for her beauty (though she was beautiful) but for what she was. He prayed to Aphrodite. Aphrodite, who had a long memory and a particular interest in the uncatchable, gave him three golden apples.

The apples were not weapons.
They were distractions.

He rolled one ahead of her during the race.

She stopped.

She picked it up.

She still nearly won — she was that fast. He rolled another. Then the third.

Each pause was small.
The sum of the pauses cost her everything.

She lost the race.
She had won every race before.
She would never run again.

The myth does not dwell on whether she was happy afterward. Some say she was. Some say Aphrodite, angry that Hippomenes forgot to give thanks, transformed them both into lions who pull Cybele's chariot.

Victory into servitude.
Freedom into harness.
A small moment of joy, then a cage.

CORE DYNAMIC

You cannot be beaten by what you despise.
You can only be beaten by what you want.

The golden apples work because part of Atalanta wanted to pause.
The race is lost not to superior speed but to a moment of authentic desire.`,

    interpretationText: `THE ARCHITECTURE OF DISTRACTION

Atalanta cannot be outrun. So the mechanism that defeats her is not speed — it is desire.

This is the pattern the archive names: distraction is not an accident. It is a design.

The golden apple is not a trick. It is a truth about where her attention lives. Hippomenes does not manufacture a false desire — he locates a real one and places it in her path at the exact moment it costs the most.

WHAT THE MYTH SAYS ABOUT CONTROL

Atalanta's entire system of protection was her speed. Her control was her conditions: set the terms, run the race, refuse the outcome.

But conditions are only unbreakable until they meet the thing they were designed to protect against.

She set the race to keep men away.
She did not account for a man who knew her well enough to know what would slow her down.

THE BEARS AND THE VOWS

She was raised without human shape — by bears, outside the structures that made other women legible. This is why she is so threatening. She cannot be managed through the usual mechanisms:

Not marriage pressure (she set the conditions herself).
Not beauty leverage (she was beautiful and indifferent to it).
Not fear (she had killed enough suitors to know she could).

Only desire worked.

Specifically: the desire for something small and golden, rolled just far enough ahead to require a decision.

THE SECOND MYTH'S LESSON

If the first myth says "the soul descends through the knowledge it chooses,"
the second says: "the sovereign falls through the desire she cannot suppress."

This distinction matters for the archive.

Some people in this space are Psyches — they fall because they chose to see.
Some are Atalantas — they fall because something small and bright stopped them long enough to cost them everything.

The host placed this story second.

That is a document.`,

    mythicText: `She was not born to the world that found her.

The world that found her had made other arrangements —
softer ones,
more convenient ones,
the kind that require women to remain stationary
so the story can proceed.

She had been left to die on a hillside
by a father who counted differently.

The bears did not ask her to be useful.
They only asked her to be fast.

So she became the fastest thing in Greece.

And when the world came back for her —
when her father,
proud now that she was famous,
decided a daughter was worth claiming after all —
she set her terms before he could set his own.

"Race me."

They came.
They lost.
Some of them died for the privilege.

She was not cruel.
She was simply
faster
than the story they had written for her.

Then came the apples.

Three golden spheres, small as a decision,
bright as something she had not admitted to wanting.

He rolled the first one.

She could have let it go.

She chose the gold.

This is not a flaw.
This is not weakness.
This is the mechanism by which even the invincible
are interrupted:

not by force applied from outside,
but by the thing inside them
that still wants something small enough
to reach down for.

She lost the race.

Some say she loved him.
Some say she did not mind losing
to someone who had seen her clearly enough
to know what would slow her down.

Some say the gods punished them both in the end:
lions pulling a goddess's chariot,
speed yoked into service.

What the myth does not say,
but what the archive reads in its silence, is this:

The race was never the point.

The point was the pause.

She was sovereign over everything
except the moment the gold
caught the light
in exactly the right way.

Know your apples.
Know who is rolling them.
Know what they cost
before you reach down.

This is the second thing the archive said.`,

    emergingSignals: [
      "Distraction is not accident — it is design; the golden apple targets real desire",
      "You cannot be beaten by what you despise; only by what you want",
      "Conditions protect until they meet what they were built to exclude",
      "The sovereign is most vulnerable to the one who sees her clearly enough to locate the pause",
      "Second myth of the archive: after the soul's descent, the autonomous one's fall — the pattern doubles",
    ],
    archetypesData: [
      {
        name: "Atalanta",
        archetype: "The Sovereign Refuser",
        significance:
          "Builds an entire protection system — then loses to the one thing the system did not account for: authentic desire",
      },
      {
        name: "Hippomenes",
        archetype: "The One Who Studied",
        significance:
          "Does not try to outrun her; learns her enough to know what will stop her; desire as weapon and truth simultaneously",
      },
      {
        name: "Aphrodite",
        archetype: "The Architect of Outcome",
        significance:
          "Provides the instrument but does not guarantee the result; the apples work because the desire is real",
      },
    ],
  });

  await Promise.all([
    linkEntity(
      ch7.id,
      atalanta.id,
      "The Sovereign Refuser",
      "The fastest, the most sovereign — and still brought low by three small golden things rolled at the right moment",
    ),
    linkThread(ch7.id, threadOrigin.id),
    linkThread(ch7.id, threadTrials.id),
  ]);

  console.log("✓ Chapter VII seeded — The Race She Could Not Win");

  // ── Chapter VIII: The Voice at the Pool's Edge ────────────────────────────

  const ch8 = await upsertChapter({
    chapterNumber: 8,
    title: "The Voice at the Pool's Edge",
    slug: "the-voice-at-the-pools-edge",
    status: "stable",
    isMajorEvent: true,

    canonText: `PSY-ORG-003 — THE THIRD MYTH · EP.003
Source: "Echo and Narcissus The Best Version"
Duration: 3:29 · Aired: August 31, 2024
Status: Stable · Tags: Origin, Mirror, Reflection, Obsession, Dissolution

RECORD

The third myth chosen for the archive is the most dangerous.

Echo was a nymph who loved to talk.
She was, more precisely, a nymph employed in distraction — she kept Hera occupied with long and winding conversations while Zeus conducted his affairs with other women. When Hera discovered the arrangement, she stripped Echo of the ability to speak first.

Echo could only repeat what others said.
The last word.
The final syllable.

She could not begin.
She could only answer.

Then she found Narcissus.

He was seventeen, or perhaps older, depending on the telling — but always the same in effect: beautiful in a way that made everyone who saw him want something, and cold in a way that gave them nothing. He rejected every suitor. Every nymph. Every attempt at approach. He was not cruel by design; he was simply sealed.

Echo followed him through the forest.
She could not call to him.
She waited for him to speak so she could answer.

He called out: "Is anyone there?"
She answered: "There."

He said: "Come here."
She said: "Here."

He said: "Let us meet together."
She said: "Together" — and emerged from the trees.

He rejected her. Harshly. She withdrew, wasted, grieved until only her voice remained.

Then Narcissus, punished by Nemesis for his cruelties to others, found a pool.

He leaned over the still surface.
He saw a face looking back.

He fell in love.

He reached down. The image scattered and returned.
He could not leave the pool.
He could not possess the thing in the water.
He could not stop wanting it.

He wasted there. At the pool's edge. Reaching for himself.

He became a flower.

His voice at the end: "Alas, alas."
Echo, nearby, answered: "Alas, alas."

CORE DYNAMIC

The mirror trap: when what you want most is yourself — or the image of yourself — you cannot be satisfied. You can only be consumed. And everyone near you becomes an echo.`,

    interpretationText: `TWO TRAPS, ONE WATER

Echo and Narcissus represent two failure modes that travel together.

ECHO'S TRAP — The Voiceless Devotion

Echo cannot originate speech. She can only reflect.
She loves someone who cannot receive love.
Her entire presence is structured around waiting for him to say something she can return.

This is not a romantic tragedy.
This is a system pathology.

In every space that has a powerful center, there are Echoes:
— People who wait for the central voice to speak before they can respond
— People whose expressions are entirely shaped by what the center produces
— People who, if the center went silent, would have nothing to say

Echo dissolves into the trees.
Her voice remains.
Her person does not.

This is the cost of structuring yourself entirely around someone else's speech.

NARCISSUS'S TRAP — The Self-Devouring Reflection

Narcissus does not love himself in the way the word is usually used.
He loves an image he cannot possess.

The distinction is important:
He does not feel satisfied by himself. He feels tormented.
He sees something beautiful and perfect — and can never hold it.
The pool gives him everything he wants to see and nothing he can touch.

This is not confidence.
This is a prison of one.

THE THIRD MYTH AND THE ARCHIVE

The archive chose to place Echo and Narcissus third, after the soul's descent (Psyche) and the sovereign's fall (Atalanta).

The sequence says something:

First: the soul that falls by choosing to know.
Second: the sovereign that falls by wanting something small.
Third: the two who fall into each other's absence.

Echo and Narcissus are the mirror chapter. They will reappear in the live transmissions — not as myth, but as behavior. The person who only repeats. The person who only looks at themselves. The space that becomes a pool.

THE RETURNING PATTERN

The Mirror Pathology appears in every community that forms around a powerful center.

Some participants become Echoes: their voice exists only in response.
Some guests become Narcissus: they see only themselves in the space, and cannot be moved by what surrounds them.
The center itself must navigate: not becoming the pool, not becoming the reflection.

This is why the archive chose this myth third.
It is a warning document, issued before the live shows began.`,

    mythicText: `First she lost her origin.

She had been a creature of language —
not weapon-language,
not truth-language,
but the language of the long and pleasant delay,
the winding story that keeps a powerful woman's eyes
fixed in the wrong direction.

When the powerful woman finally looked around and understood,
she took the only thing Echo had:

the beginning of words.

After that, Echo could only be the end of things.

The last syllable.
The final sound.
The answer without the question.

She found him in the forest —
the beautiful one who had rejected
everyone who had ever offered him
anything as complicated as themselves.

She waited.

She was good at waiting.
She had learned it from silence.

He spoke.

She answered.

He spoke again.

She answered again.

She said "together" and stepped out of the trees
and he turned away so decisively
that she spent the rest of her life
becoming smaller
until only the voice remained.

Not the love.
Not the grief.
Not the longing.
Only the sound.

Now hear the other side of the pool:

He arrived there tired of being wanted.

He leaned down to drink.

A face looked back.

He did not know it was his own.
Or perhaps he knew and could not stop.
The myth is ambiguous here —
and that ambiguity is the point.

What he saw was perfect.
What he could not do was touch it.

He stayed.

The image stayed.

He reached.
The image scattered.
He waited.
The image returned.

He could not leave.
He could not possess.
He could only want.

Two people at the pool's edge —
one who could only answer,
one who could only look —

and between them,
a mirror surface
reflecting nothing
but what each brought.

The archive placed this story third.

Not as tragedy.

As warning.

Every space that gathers watchers
around a center
risks this:

the voice that can no longer begin,
the gaze that can no longer move.

Know Echo when she speaks.
Know Narcissus when he leans.

And know the pool —
clear, still, absolute —
for what it is:

not water,
not truth,
not reflection.

Only the surface
that shows you yourself
and calls it the world.`,

    emergingSignals: [
      "The mirror pathology will appear in the live transmissions — watch for the voice that can only respond",
      "Narcissus at the pool: the guest who sees only themselves in the space cannot be reached",
      "Echo's dissolution: when presence is built entirely around another's speech, the person disappears",
      "The third myth closes the Origins Arc — Soul, Sovereign, Mirror: the three ways a being can be lost",
      "The pool is now in the archive — it will be recognized when it reappears",
    ],
    archetypesData: [
      {
        name: "Echo",
        archetype: "The Voice Without Origin",
        significance:
          "Can only reply, never begin; her devotion requires him to speak first; when he stops, she vanishes",
      },
      {
        name: "Narcissus",
        archetype: "The Self-Devouring",
        significance:
          "Loves what he cannot possess; the mirror gives him everything but contact; wastes at the edge of himself",
      },
      {
        name: "Nemesis",
        archetype: "The Instrument of Pattern Correction",
        significance:
          "Does not punish cruelty with cruelty — only places Narcissus in the exact trap his behavior created",
      },
    ],
  });

  await Promise.all([
    linkEntity(
      ch8.id,
      echoFigure.id,
      "The Voice Without Origin",
      "Can only repeat; loves without agency; dissolves into sound when the object of devotion turns away",
    ),
    linkEntity(
      ch8.id,
      narcissus.id,
      "The Self-Devouring",
      "The mirror trap: wants what cannot be possessed; cannot leave the pool; starves at the edge of himself",
    ),
    linkThread(ch8.id, threadOrigin.id),
    linkThread(ch8.id, threadMirror.id),
  ]);

  console.log("✓ Chapter VIII seeded — The Voice at the Pool's Edge");

  // ── Summary ───────────────────────────────────────────────────────────────

  console.log("\n═══════════════════════════════════════════════════");
  console.log("  Psychenomicon — Origins Arc — Seeded Successfully");
  console.log("═══════════════════════════════════════════════════");
  console.log("  Chapters:  3  (VI, VII, VIII)");
  console.log("  Entities:  6  (Psyche, Eros, Aphrodite, Atalanta, Echo, Narcissus)");
  console.log("  Threads:   3  (Origin Myths, Trial Architecture, Mirror Pathology)");
  console.log("───────────────────────────────────────────────────");
  console.log("  Arc I   (Ch I–V):   The Formation — live stream dynamics");
  console.log("  Arc 0   (Ch VI–VIII): The Origins — founding myths");
  console.log("  Next:   Ch IX onward — EP.004+ 'Psyche Awakens Tarot' live shows");
  console.log("═══════════════════════════════════════════════════");
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
