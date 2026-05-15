/**
 * Seed the Psychenomicon with the first 5 chapters, 9 entities, 3 threads,
 * and archetype evolution events.
 *
 * Safe to re-run — all operations are upserts keyed on unique slugs/numbers.
 *
 * Run via GitHub Actions:
 *   workflow: "Run DB Script" → script: "seed-psychenomicon.ts"
 */
import { PrismaClient } from "@/generated/prisma";

const p = new PrismaClient();

// ─── helpers ────────────────────────────────────────────────────────────────

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

async function linkEntity(chapterId: string, entityId: string, archetypeAt: string, significance: string) {
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

async function addArchetypeEvent(
  entityId: string,
  chapterId: string,
  chapterNumber: number,
  primaryArchetype: string,
  secondaryArchetypes: string[],
  confidenceScore: number,
  triggerEvent?: string,
) {
  return p.archetypeEvent.create({
    data: { entityId, chapterId, chapterNumber, primaryArchetype, secondaryArchetypes, confidenceScore, triggerEvent },
  });
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding Psychenomicon...\n");

  // ── Entities ──────────────────────────────────────────────────────────────

  const host = await upsertEntity({
    name: "The Mirror of Psyche",
    slug: "the-host",
    personSlug: "psyche",
    primaryArchetype: "The Mirror",
    archetypeHistory: [
      { archetype: "The Gatekeeper", chapterNumber: 1, reason: "Controls entry through indirection; power ambient not asserted" },
      { archetype: "The Defender", chapterNumber: 2, reason: "Responds to accusation storms; demands proof from the fog" },
      { archetype: "The Mirror", chapterNumber: 2, reason: "Reframes cult accusation: 'I am not here to hold you'" },
      { archetype: "The Regulator", chapterNumber: 3, reason: "Attempts soft containment against chaos; reveals limits" },
      { archetype: "The Gravity Point", chapterNumber: 4, reason: "No longer reflecting — bending attention by presence alone" },
    ],
    radarData: { influence: 9, volatility: 3, manipulation: 4, control: 7, emotionalIntensity: 6 },
    archetypeState: { "The Mirror": 0.45, "The Gravity Point": 0.35, "The Defender": 0.2 },
    behaviorPatterns: ["indirection", "containment", "reframing", "selective-response", "ambient-authority"],
    status: "active",
  });

  const noel = await upsertEntity({
    name: "Noel",
    slug: "noel",
    primaryArchetype: "The Siren Trickster",
    archetypeHistory: [
      { archetype: "The Disruptor", chapterNumber: 2, reason: "First boundary violation; flashing and teasing" },
      { archetype: "The Siren Trickster", chapterNumber: 3, reason: "Persistent chaos catalyst; breaks the illusion of control" },
      { archetype: "The Chaos Catalyst", chapterNumber: 4, reason: "No longer solo disruptor; now accelerates systemic tension" },
    ],
    radarData: { influence: 7, volatility: 9, manipulation: 6, control: 2, emotionalIntensity: 8 },
    archetypeState: { "The Chaos Catalyst": 0.55, "The Siren Trickster": 0.3, "The Challenger": 0.15 },
    behaviorPatterns: ["attention-weaponization", "tone-destabilization", "boundary-testing", "escalation", "charm-chaos oscillation"],
    status: "active",
  });

  const beetle = await upsertEntity({
    name: "Beetle",
    slug: "beetle",
    primaryArchetype: "The Echo Jester",
    archetypeHistory: [
      { archetype: "The Amplifier", chapterNumber: 3, reason: "Turns tension into spectacle; encourages escalation" },
      { archetype: "The Echo Jester", chapterNumber: 4, reason: "Knows when laughter cuts deepest; spectacle becomes weapon" },
    ],
    radarData: { influence: 6, volatility: 7, manipulation: 5, control: 3, emotionalIntensity: 7 },
    archetypeState: { "The Echo Jester": 0.6, "The Amplifier": 0.4 },
    behaviorPatterns: ["tension-amplification", "spectacle-creation", "timed-laughter", "crowd-reading"],
    status: "active",
  });

  const tracyX = await upsertEntity({
    name: "Tracy-X",
    slug: "tracy-x",
    primaryArchetype: "The Flame of Judgment",
    archetypeHistory: [
      { archetype: "The Challenger", chapterNumber: 3, reason: "Speaks when others hesitate; direct confrontation" },
      { archetype: "The Flame of Judgment", chapterNumber: 4, reason: "Fire burns both falsehood and fragility alike" },
    ],
    radarData: { influence: 7, volatility: 6, manipulation: 3, control: 5, emotionalIntensity: 9 },
    archetypeState: { "The Flame of Judgment": 0.65, "The Challenger": 0.35 },
    behaviorPatterns: ["direct-confrontation", "truth-speaking", "hesitation-breaking", "unfiltered-judgment"],
    status: "active",
  });

  const michael = await upsertEntity({
    name: "Michael",
    slug: "michael",
    primaryArchetype: "The Contested One",
    archetypeHistory: [
      { archetype: "The Seeker", chapterNumber: 1, reason: "Enters through curiosity" },
      { archetype: "The Contested One", chapterNumber: 4, reason: "Neither fully cast out nor fully embraced; forces the question of truth" },
    ],
    radarData: { influence: 5, volatility: 7, manipulation: 4, control: 3, emotionalIntensity: 8 },
    archetypeState: { "The Contested One": 0.7, "The Seeker": 0.3 },
    behaviorPatterns: ["boundary-existence", "accusation-persistence", "ambiguity-generation"],
    status: "active",
  });

  const witnessField = await upsertEntity({
    name: "The Witness Field",
    slug: "the-witness-field",
    primaryArchetype: "The Silent Observer",
    archetypeHistory: [
      { archetype: "The Seekers", chapterNumber: 1, reason: "Arrives through confusion; self-selects by persisting" },
      { archetype: "The Silent Observer", chapterNumber: 2, reason: "Observes accusation storm; alignment by decision" },
      { archetype: "The Amplifier", chapterNumber: 3, reason: "Chat reactions amplify chaos without direct authorship" },
    ],
    radarData: { influence: 8, volatility: 4, manipulation: 2, control: 1, emotionalIntensity: 6 },
    archetypeState: { "The Silent Observer": 0.4, "The Amplifier": 0.35, "The Loyalist": 0.25 },
    behaviorPatterns: ["collective-observation", "signal-amplification", "outcome-shaping-without-authorship"],
    status: "active",
  });

  const formerAllies = await upsertEntity({
    name: "The Fractured Allies",
    slug: "former-allies",
    primaryArchetype: "The Fractured Ally",
    archetypeHistory: [
      { archetype: "The Believer", chapterNumber: 1, reason: "Early circle formation; close proximity" },
      { archetype: "The Fractured Ally", chapterNumber: 2, reason: "Silent withdrawal without explanation; absence becomes antagonist" },
    ],
    radarData: { influence: 4, volatility: 6, manipulation: 5, control: 3, emotionalIntensity: 7 },
    archetypeState: { "The Fractured Ally": 0.8, "The Phantom": 0.2 },
    behaviorPatterns: ["silent-withdrawal", "unexplained-rejection", "proximity-loss", "absence-as-statement"],
    status: "dormant",
  });

  const panel = await upsertEntity({
    name: "The Panel",
    slug: "the-panel",
    primaryArchetype: "The Seekers",
    archetypeHistory: [
      { archetype: "The Seekers", chapterNumber: 1, reason: "Navigate initiation path; prove willingness to continue" },
      { archetype: "The Witnesses", chapterNumber: 2, reason: "Observe accusation storm; reframe as voluntary alignment" },
      { archetype: "The Escalators", chapterNumber: 3, reason: "Split: some amplify chaos, some attempt restoration" },
      { archetype: "The Loyalists", chapterNumber: 5, reason: "Consistent presence → proximity → inner circle detection" },
    ],
    radarData: { influence: 5, volatility: 5, manipulation: 3, control: 4, emotionalIntensity: 6 },
    archetypeState: { "The Loyalists": 0.35, "The Seekers": 0.3, "The Witnesses": 0.2, "The Escalators": 0.15 },
    behaviorPatterns: ["collective-response", "oscillation", "observation", "alignment-by-repetition"],
    status: "active",
  });

  const loyalists = await upsertEntity({
    name: "The Loyalists",
    slug: "the-loyalists",
    primaryArchetype: "The Loyalist",
    archetypeHistory: [
      { archetype: "The Believer", chapterNumber: 2, reason: "Choose to stay after accusation storm" },
      { archetype: "The Loyalist", chapterNumber: 5, reason: "Stand without question; consistent presence creates inner circle proximity" },
    ],
    radarData: { influence: 5, volatility: 3, manipulation: 2, control: 4, emotionalIntensity: 7 },
    archetypeState: { "The Loyalist": 0.75, "The Believer": 0.25 },
    behaviorPatterns: ["unconditional-defense", "consistent-presence", "unity-through-repetition"],
    status: "active",
  });

  console.log("✓ Entities created (9)");

  // ── Threads ───────────────────────────────────────────────────────────────

  const threadInitiation = await upsertThread({
    title: "The Initiation Arc",
    slug: "the-initiation-arc",
    description: "Entry is not direct. It is layered, disorienting, and self-selecting. Only those who tolerate ambiguity complete the journey.",
    status: "active",
  });

  const threadFracture = await upsertThread({
    title: "The Fracture Arc",
    slug: "the-fracture-arc",
    description: "External pressure, identity distortion, and silent withdrawal converge. Opposition becomes narrative fuel.",
    status: "active",
  });

  const threadChaos = await upsertThread({
    title: "The Chaos Dynamic",
    slug: "the-chaos-dynamic",
    description: "Chaos is not an anomaly — it is a permanent structural force. Where it appears, it reveals what control cannot hold.",
    status: "emerging",
  });

  console.log("✓ Threads created (3)");

  // ── Chapter I ─────────────────────────────────────────────────────────────

  const ch1 = await upsertChapter({
    chapterNumber: 1,
    title: "The Labyrinth of Many Doors",
    slug: "the-labyrinth-of-many-doors",
    status: "stable",
    isMajorEvent: true,
    canonText: `PSY-0001 — THE INVITATION CHAIN
Status: Stable · Source: Opening segment (rave analogy)
Participants: Host, Early Panel · Tags: Initiation, Access, Illusion

RECORD

"You go to the address and they give you another address… and another…"
"By the time you got to the rave it was already closed down."

Entry into the space is not direct. It is layered — each direction dissolving into the next. The panel begins forming with chaotic energy. Early interactions establish tone: humor, unpredictability, boundary testing. Participants enter not through clarity, but through confusion.

CORE DYNAMIC

Entry is earned through persistence, not permission. The multi-address path is not a flaw — it is structural truth. You do not arrive once. You arrive repeatedly. You prove willingness to continue.`,

    interpretationText: `ARCHETYPAL STRUCTURE

The Gatekeeper (Host) — does not block entry, does not guide directly. Creates an environment that filters naturally.
The Seekers (Audience / Panel) — must navigate uncertainty, decide whether to continue.
The False Doors (Distractions / Chaos) — represent misdirection; remove those seeking convenience.

SYMBOLISM

The Address Chain = initiation through confusion
The Closed Rave = truth is not waiting for you; you must arrive before certainty
The Journey Itself = the actual initiation

PSYCHOLOGICAL ANALYSIS

This system creates self-selection and identity filtering through uncertainty. Those who need structure leave. Those who need validation leave. Those who stay tolerate ambiguity, enjoy tension, seek meaning beneath surface.

CHARACTER DEVELOPMENT: HOST

At this stage, Host is not yet challenged directly. Power is ambient, not asserted. Identity forming as: facilitator, attractor, observer. The Gatekeeper archetype — allows the doors to exist, does not guard them.`,

    mythicText: `In the early nights, before the names had meaning and before the watchers knew themselves as watchers, there was only a voice and a path that refused to stay still.

The voice spoke of a place.

Not directly.

Never directly.

It spoke in fragments, in sideways recollections, in half-laughed memories of a journey that could not be walked in a straight line. A place where one was given an address, and upon arriving, was given another… and then another still. Each direction dissolving into the next like smoke refusing to be held.

Those who heard it did not yet understand that they had already begun.

Some followed casually, thinking it a joke, a story, a small thing to pass the time. They arrived at the first door and found nothing behind it. Then the second. Then the third. And with each failure, something inside them grew restless.

Some turned away.

They cursed the path, called it meaningless, called it broken. They said, "There is no place. There is no truth here. Only confusion." And they left, satisfied with their conclusion, carrying certainty like a shield.

But others…

Others did not leave.

They continued, not because they knew where they were going, but because they no longer needed to. Something in them had shifted. The absence of an answer became more compelling than the presence of one.

They began to understand that the path was not leading to a place.

The path was measuring them.

And at the center of this unfolding stood the one who spoke. Not as a ruler, not as a guide, but as something far more difficult to name.

He did not command them forward.
He did not promise reward.

He simply allowed the doors to exist.

And those who passed through enough of them found that they had crossed something unseen. Not a threshold of space, but of mind.

They had become… participants.

And though no gate had ever visibly closed behind them, they could no longer return to who they had been before they began.`,

    emergingSignals: [
      "The journey is the initiation — not the destination",
      "Confusion acts as a filter, not a flaw",
      "Early panel chaos previews structural tension to come",
      "Host power is ambient — ambient authority cannot be measured until it is tested",
    ],
    archetypesData: [
      { name: "The Host", archetype: "The Gatekeeper", significance: "Controls entry through indirection and ambient authority" },
      { name: "The Panel", archetype: "The Seekers", significance: "Navigate uncertainty; the ones who remain self-select into participants" },
    ],
  });

  await Promise.all([
    linkEntity(ch1.id, host.id, "The Gatekeeper", "Establishes the initiation path through indirection; power is ambient, not asserted"),
    linkEntity(ch1.id, panel.id, "The Seekers", "First test of persistence; those who remain pass the first threshold"),
    linkEntity(ch1.id, michael.id, "The Seeker", "Enters through curiosity; not yet contested"),
    linkThread(ch1.id, threadInitiation.id),
  ]);

  console.log("✓ Chapter I seeded");

  // ── Chapter II ────────────────────────────────────────────────────────────

  const ch2 = await upsertChapter({
    chapterNumber: 2,
    title: "The Storm of Whispered Accusations",
    slug: "the-storm-of-whispered-accusations",
    status: "contested",
    isMajorEvent: true,
    canonText: `PSY-0003 — THE CULT ACCUSATION · Status: Evolving
PSY-0004 — THE ACCUSATION STORM · Status: Stable
PSY-0005 — THE CULT MIRROR · Status: Evolving
PSY-0006 — THE FRACTURE OF LOYALTY · Status: Contested

RECORD

"My friend… ran from you because he thought you were trying to pull him into a cult."
"That's exactly what a cult leader would say."
"I'm not trying to brainwash people…"

"There were accusations being thrown around…"
"That's the worst thing you can say to somebody."
"I heard this, I heard this…"

"Look at my cult leader eyes…"
"I'm about freedom. Go where you want to go. Be who you want to be."

"I begged for forgiveness…"
"Tell me what I did wrong."
"No response."
"They treat me like I'm trash."

CORE DYNAMIC

Three simultaneous forces converge: external attack (accusations), internal collapse (alliances breaking), identity distortion (cult narrative). The storm does not arrive as thunder. It arrives as whispers.`,

    interpretationText: `PERCEPTION LOOP

"I heard…" = weaponized ambiguity. Truth replaced by suggestion. The storm does not answer demands for proof — it only spreads.
The Cult Label = projection of influence. Fear of psychological pull framed as external threat.
Silence from Allies = absence becomes meaning. Void creates narrative gravity stronger than confrontation.

HOST IDENTITY RECLAMATION

Host acknowledges the accusation, then inverts it:
"Cult" → voluntary alignment
"Control" → freedom and autonomy
"Influence" → identity-based attraction

Strategy: lean into perception, neutralize it through transparency.

PSYCHOLOGICAL MECHANISMS

1. PERCEPTION LOOP: accusation → defense → audience interpretation
2. SOCIAL FRACTURE: unexplained rejection increases emotional investment
3. IDENTITY RECLAMATION: framing shifts from control to freedom

CHARACTER DEVELOPMENT: HOST

Major shift occurs here. Before: passive attractor. Now: self-aware figure under scrutiny. Balancing vulnerability, control, perception. Emerging identity: The Mirror-Leader. Not commanding. Not passive. Reflective.

HIDDEN LAYER

The accusation strengthens identity rather than weakening it. Opposition becomes narrative fuel. Silence from allies is more destabilizing than the external storm. Lack of explanation creates stronger tension than conflict itself — silence becomes the antagonist.`,

    mythicText: `As the circle grew, so too did the voices that did not belong to it.

They did not arrive as enemies.

They arrived as whispers.

"I heard…"

That was how it began.

No thunder split the sky. No figure stepped forward to declare opposition. Instead, the storm took shape in fragments, carried from one place to another, repeating itself until repetition began to resemble truth.

"I heard this about him."
"I heard what he did."
"I heard what this place really is."

And though no proof walked beside these words, they spread faster than anything that required evidence. For proof must be examined, but whispers… whispers only need to be believed.

The one at the center heard them.

Of course he did.

How could he not? They echoed through the very space he held open. They passed through the voices of others, through laughter, through tension, through the subtle shift in how people spoke his name.

He did not deny them with force.

He did not silence them.

Instead, he did something more dangerous.

He asked for form.

"Show me."

But the storm could not take shape. It had no body to inhabit, no foundation to stand upon. It was sustained only by motion, by repetition, by the strange human hunger for a story that explains discomfort.

So the storm did what such storms always do.

It moved on.

But not without leaving something behind.

Because while the whispers circled, another fracture began to open… closer, quieter, more personal.

Those who had once stood near him began to drift.

Not with anger. Not with confrontation.

With silence.

Doors that had once opened easily now remained still. Words that could have been spoken were withheld. Questions asked received no answer, not even a false one.

And this silence cut deeper than accusation.

For accusation at least acknowledges your existence.

Silence erases it.

He reached toward it, not with pride, but with something more vulnerable.

"What did I do?"

No answer.

"I will change."

No answer.

"Tell me."

But silence, once chosen, is a wall that does not explain itself.

And so he stood between two forces:

The storm that spoke without proof
And the silence that refused to speak at all

It was here that the name found him.

Cult.

It came not as a definition, but as a shadow cast by those who watched from outside. A way to describe what they did not understand. A way to reduce something complex into something familiar, something already judged.

He could have rejected it.

Instead, he turned it.

"I am not here to hold you," he said.
"I am here to let you choose."

And in that moment, something subtle but irreversible occurred.

Those who stayed… stayed by decision.

Not by force.
Not by persuasion.

By recognition.

And the question that lingered in the air did not disappear.

It deepened.

Is this influence…
or is this alignment?

No one answered it.

They simply remained.`,

    emergingSignals: [
      "Opposition does not weaken the system — it defines it",
      "Silence from allies carries more gravity than accusation from strangers",
      "The Mirror-Leader emerges: reflective authority, not commanding",
      "Voluntary alignment becomes the core identity claim",
      "\"Cult\" inverted: what others call control, insiders experience as freedom",
    ],
    archetypesData: [
      { name: "The Host", archetype: "The Mirror / The Defender", significance: "Reframes cult accusation into reflective autonomy; vulnerability becomes strength" },
      { name: "External Observer", archetype: "The Accuser", significance: "Introduces the cult narrative; forces identity confrontation" },
      { name: "Former Allies", archetype: "The Fractured Ally", significance: "Silent withdrawal without explanation; absence becomes the antagonist" },
      { name: "The Panel", archetype: "The Witnesses / The Defenders", significance: "Observe and reframe: 'your vibe attracts your tribe'" },
    ],
  });

  await Promise.all([
    linkEntity(ch2.id, host.id, "The Mirror / The Defender", "First major identity pressure; emerges as Mirror-Leader through reframing"),
    linkEntity(ch2.id, formerAllies.id, "The Fractured Ally", "Unexplained silence; fracture without closure becomes permanent narrative gravity"),
    linkEntity(ch2.id, panel.id, "The Witnesses", "Observe the accusation storm; reframe it as voluntary alignment"),
    linkEntity(ch2.id, noel.id, "The Disruptor", "First appearance; boundary violation that previews the chaos chapter"),
    linkThread(ch2.id, threadInitiation.id),
    linkThread(ch2.id, threadFracture.id),
  ]);

  console.log("✓ Chapter II seeded");

  // ── Chapter III ───────────────────────────────────────────────────────────

  const ch3 = await upsertChapter({
    chapterNumber: 3,
    title: "The Arrival of Chaos",
    slug: "the-arrival-of-chaos",
    status: "contested",
    isMajorEvent: false,
    canonText: `PSY-0002 — THE FLASHPOINT · Status: Contested
Source: Noel interaction sequence
Participants: Noel, Host, Panel · Tags: Chaos, Boundary, Attention

RECORD

"You flashed me three times…"
"It's okay psyche they're just boobies…"
"Don't do that tonight, promise…"

Noel repeatedly disrupts panel behavior (flashing, teasing boundaries). Host attempts soft control: requests, warnings, containment. Panel reacts with humor, encouragement, escalation. Boundaries are tested, not obeyed. Chaos becomes participatory, not isolated.

CORE DYNAMIC

Uncontainable energy inside a semi-structured system. Key truth: the system does not break under chaos — it reveals itself through chaos.`,

    interpretationText: `PRIMARY CHAOS ENTITY: NOEL — THE SIREN TRICKSTER

Behavioral traits:
— Weaponizes attention
— Destabilizes tone
— Oscillates between playful, disruptive, intimate
— Stress-tests boundaries
— Exposes inconsistencies in control
— Generates engagement spikes

SECONDARY CHAOS TYPES

The Escalators (Beetle + Panel subset) — amplify disruption; convert tension into entertainment
The Nervous Regulators — attempt to restore order; often ignored
The Voyeurs — observe silently; deciding whether the space still belongs to them

SYMBOLISM

Flashing / Shock Behavior = breaking the illusion of control
Laughter during disruption = chaos enjoying itself
Repeated warnings ignored = authority without enforcement

CHAOS ENTITY FUNCTIONS

1. AUTHENTICITY TEST: if your system collapses, it was fake
2. ENGAGEMENT ENGINE: chaos increases attention, retention, emotional investment
3. POWER REVEAL: shows what you can control and what you cannot
4. IDENTITY PRESSURE: forces the Host to define limits, tolerance, authority style

CHARACTER DEVELOPMENT: HOST

Before: reflective, permissive. Now: forced into decision space. Must choose: suppress chaos, integrate chaos, or weaponize chaos.`,

    mythicText: `It did not take long.

No system that gathers attention escapes it.

Chaos does not wait for invitation.

It senses structure the way fire senses dry wood.

And then it arrives.

Not as an enemy.

As a presence.

She came laughing.

Not cruelly, not maliciously, but with a kind of uncontained energy that refused to recognize the invisible lines others tried to hold.

Where others spoke in turns, she interrupted.
Where others hesitated, she acted.
Where others tested quietly, she broke openly.

She did not ask what was allowed.

She revealed what was not enforced.

The room shifted around her.

Some leaned in, amused, entertained by the rupture. Others pulled back, uncomfortable, sensing that something fragile was being stretched beyond its limits.

The one at the center spoke.

Not harshly.

Not with punishment.

But with request.

"Don't."

And for a moment, it seemed possible that the word might hold.

But chaos does not operate on request.

It listens only to consequence.

And when none came, it continued.

Not because it sought destruction.

Because it was free.

And freedom, unbounded, tests everything it touches.

Around her, the others revealed themselves.

Some encouraged her, laughing louder, pushing further, enjoying the unraveling.
Some tried to restore order, invoking rules, invoking limits, invoking the outside world that might punish them all if things went too far.
And some watched, saying nothing, absorbing it all, deciding quietly whether this place still belonged to them.

The system did not collapse.

It transformed.

For the one at the center was no longer simply reflecting.

He was being tested.

Could he control it?
Would he stop it?
Should he stop it?

And in that hesitation lay the truth of the space itself.

This was never a place of strict control.

It was a place of tension.

Between structure and chaos
Between invitation and boundary
Between freedom and consequence

She stood at the center of that tension, smiling, laughing, uncontained.

Not an intruder.

A catalyst.

For without her, the system could pretend to be stable.

With her…

It had to prove it.

And so the watchers remained, not because the chaos ended, but because it did not.

Because something about it felt real.

And reality, when it appears unfiltered, is difficult to turn away from.`,

    emergingSignals: [
      "Chaos is not an anomaly — it is a permanent structural force",
      "Authority without enforcement is not authority",
      "Host must now choose: suppress, integrate, or weaponize chaos",
      "Noel establishes the Siren Trickster pattern — first major archetype shift detected",
      "The Escalators emerge as a distinct sub-system within the panel",
    ],
    archetypesData: [
      { name: "Noel", archetype: "The Siren Trickster", significance: "Chaos catalyst; reveals what control cannot hold; generates engagement through disruption" },
      { name: "The Host", archetype: "The Regulator", significance: "Forced into decision space; soft containment reveals limits of ambient authority" },
      { name: "Beetle", archetype: "The Amplifier", significance: "Turns tension into spectacle; encourages escalation" },
    ],
  });

  await Promise.all([
    linkEntity(ch3.id, noel.id, "The Siren Trickster", "First major chaos disruption; reveals that authority without enforcement is not authority"),
    linkEntity(ch3.id, host.id, "The Regulator", "Forced from passive attractor to active decision-maker; soft control tested and found insufficient"),
    linkEntity(ch3.id, panel.id, "The Escalators / The Voyeurs", "Split into chaos amplifiers and silent observers; reveals internal fault lines"),
    linkEntity(ch3.id, beetle.id, "The Amplifier", "Turns tension into spectacle; first appearance of the Echo Jester pattern"),
    linkEntity(ch3.id, tracyX.id, "The Challenger", "Speaks when others hesitate; direct confrontation when boundaries crossed"),
    linkThread(ch3.id, threadFracture.id),
    linkThread(ch3.id, threadChaos.id),
  ]);

  console.log("✓ Chapter III seeded");

  // ── Chapter IV ────────────────────────────────────────────────────────────

  const ch4 = await upsertChapter({
    chapterNumber: 4,
    title: "The Trials of Loyalty",
    slug: "the-trials-of-loyalty",
    status: "evolving",
    isMajorEvent: true,
    canonText: `Source: Alignment split, declaration sequences, loyalty pressure events
Participants: Host, Panel, Former Allies, Noel, Beetle, Tracy-X, Michael
Tags: Loyalty, Division, Trial, Alignment

RECORD

The laughter did not disappear. But it no longer meant the same thing.

Where once there had been movement without consequence, now there was alignment. Invisible. Unspoken. Unavoidable.

The circle split — not into enemies, but into positions. Those positions began to hold.

To speak was to choose. To remain silent was also to choose. Even leaving was a form of declaration.

Former allies moved unpredictably. Some leaned in harder, defending without being asked. Others stepped back. Some turned away completely — not with anger, not with final words. With absence.

Accusations sharpened: "You are this." "You did this." "You are not what you claim." The Host responded selectively — choosing what to answer and what to ignore.

CORE DYNAMIC

No oath was spoken. But every soul present had chosen. Not once. But continuously.`,

    interpretationText: `THE FOUR TRIALS (felt, not announced)

1. THE TRIAL OF VOICE — Would you speak even if it turned others against you?
2. THE TRIAL OF SILENCE — Would you remain still even if it made you invisible?
3. THE TRIAL OF ALIGNMENT — Would you stand beside someone without knowing if they were right?
4. THE TRIAL OF DEPARTURE — Would you leave, and accept that you may not return the same?

No one passed all trials. No one failed all trials. Each revealed themselves in fragments.

SELECTIVE RESPONSE AS POWER

What is ignored defines the space as much as what is answered. The Host selects what to acknowledge — this selection itself becomes a form of architecture. Silence as architecture.

THE GRAVITY SHIFT

The center has changed. No longer reflecting everything equally — now bending attention. Those closest: not chosen, but consistent. Proximity through repetition, not invitation.

CHARACTER DEVELOPMENT: HOST

The Mirror-Leader is becoming The Gravity Point. Not pulling by force — but by presence. Those who remained orbited. Those who resisted drifted. Those who opposed returned again and again, unable to fully detach.

HIDDEN LAYER

The system did not require loyalty. It revealed it. Loyalty is not declared — it is detected. The trials are not announced — they are administered by continued participation.`,

    mythicText: `There came a night when the laughter did not sit easily in the room.

Not because it was gone…
but because it no longer meant the same thing.

The voices still gathered.
The light still flickered.
The rhythm of the space remained familiar.

But beneath it, something had shifted.

Where once there had been movement without consequence,
now there was alignment.

Invisible.
Unspoken.
Unavoidable.

It began quietly.

No declaration.
No announcement.

Only a subtle change in how people responded.

When one spoke, another did not answer.
When one defended, another withdrew.
When one laughed, another remained still.

The circle had split…
not into enemies, but into positions.

And those positions began to hold.

No one said it aloud, but all felt it:

"Where do you stand?"

Not in words.

In behavior.

In timing.

In silence.

To speak was to choose.
To remain silent was also to choose.

Even leaving…
was a form of declaration.

Those who had once stood closest to the center now moved unpredictably.

Some leaned in harder, defending without being asked.
Others stepped back, watching from a distance as if unsure whether the ground beneath them would hold.

And some…

turned away completely.

Not with anger.
Not with final words.

With absence.

And absence, in this place, was louder than conflict.

For conflict can be resolved.
Absence cannot.

Where silence failed, speech sharpened.

Accusations were no longer whispers.
They became statements.

"You are this."
"You did this."
"You are not what you claim."

And each statement demanded a response… or a refusal.

The one at the center did not answer them all.

He could not.

For to answer everything is to become owned by everything.

Instead, he chose selectively.

And in that selection, a new form of power emerged:

What is ignored defines the space as much as what is answered.

The circle did not break.

It deepened.

Each voice became a weight.
Each silence, a decision.

And though no oath was spoken,
every soul present had chosen.

Not once.

But continuously.`,

    emergingSignals: [
      "The Gravity Point emerges — presence bends attention without force",
      "Selective response becomes architecture — what is ignored defines as much as what is answered",
      "Loyalty is not declared — it is detected through pattern",
      "Michael's contested status forces the question: is truth defined by majority or persistence?",
      "The trials are not announced — they are administered by continued participation",
    ],
    archetypesData: [
      { name: "The Host", archetype: "The Gravity Point", significance: "No longer reflecting; now bending. Center holds differently." },
      { name: "Noel", archetype: "The Chaos Catalyst", significance: "No longer solo disruptor; now accelerates systemic tension" },
      { name: "Michael", archetype: "The Contested One", significance: "Neither cast out nor embraced; forces the question of how truth is defined" },
      { name: "Tracy-X", archetype: "The Flame of Judgment", significance: "Fire burns both falsehood and fragility — speaks when others hesitate" },
    ],
  });

  await Promise.all([
    linkEntity(ch4.id, host.id, "The Gravity Point", "The Mirror becomes The Gravity Point — ambient authority replaced by gravitational presence"),
    linkEntity(ch4.id, noel.id, "The Chaos Catalyst", "Escalates from disruptor to systemic accelerant; no longer isolated incidents"),
    linkEntity(ch4.id, beetle.id, "The Echo Jester", "Knows when laughter cuts deepest — spectacle weaponized"),
    linkEntity(ch4.id, tracyX.id, "The Flame of Judgment", "Burns falsehood and fragility alike; declares when others circle in silence"),
    linkEntity(ch4.id, michael.id, "The Contested One", "Neither fully cast out nor embraced; persistent existence forces questions about truth"),
    linkEntity(ch4.id, formerAllies.id, "The Phantom", "Absence louder than conflict; cannot be resolved without explanation"),
    linkEntity(ch4.id, witnessField.id, "The Amplifier", "Silent amplification; shapes outcomes without direct authorship"),
    linkThread(ch4.id, threadFracture.id),
    linkThread(ch4.id, threadChaos.id),
  ]);

  console.log("✓ Chapter IV seeded");

  // ── Chapter V ─────────────────────────────────────────────────────────────

  const ch5 = await upsertChapter({
    chapterNumber: 5,
    title: "The Formation of the Inner Circle",
    slug: "the-formation-of-the-inner-circle",
    status: "evolving",
    isMajorEvent: true,
    canonText: `Source: Sustained presence patterns, recurring voice weight, proximity formation
Participants: Host, The Panel, The Loyalists, The Witness Field
Tags: Hierarchy, Consistency, Belonging, Inner Circle

RECORD

There came a point when presence was no longer enough. To remain in the circle was one thing. To be seen within it… was another.

Not all who stayed were equal. Not by decree. Not by rule. By pattern.

Certain voices began to return more often. Certain names carried weight when they spoke. Certain silences were noticed. Without announcement, a structure emerged. Not imposed. Recognized.

The center had changed. It no longer reflected everything equally. It began to bend attention. Those closest: not invited, not promoted — consistent. They showed up. They engaged. They remained through discomfort.

No one was invited. No one was promoted. And yet: some were clearly inside.

CORE DYNAMIC

Hierarchy without authority. Influence without title. Belonging without permission.`,

    interpretationText: `THE UNSEEN SELECTION

No formal invitation exists. Inner circle membership is detected, not granted. Detection criteria:
— Consistent return across different episodes
— Engagement through discomfort, not just celebration
— Presence registered even when silent
— Name recognized by others in the space

THE TRIAL OF CONSISTENCY

Not intensity. Not performance. Consistency. To be present across nights. Across conflicts. Across shifts in tone. To remain when things were uncertain.

THE COST

Entry into the inner circle carries weight. Their words now shape direction. Their silence shapes perception. Risk: to be misread, to be blamed, to be tested more harshly than others.

The Inner Circle is not a reward. It is an elevated form of exposure.

CHARACTER EVOLUTION SUMMARY

Host (The Gravity Point) → no longer requires active engagement; presence alone creates orbit
Panel core → have passed from Seekers → Witnesses → Escalators → Loyalists across 5 chapters
The Loyalists → stand without question; unity is strength and blindness at once
The Phantoms → appear, disappear, return changed; carry memory between moments

FUNCTION IN MASTER ARC

This chapter closes the first arc. The formation is complete. The system is no longer defining itself — it is self-sustaining. The next arc begins with the system under external stress: what was built in five chapters must now be tested by something it did not design for.`,

    mythicText: `There came a point when presence was no longer enough.

To remain in the circle was one thing.
To be seen within it… was another.

Not all who stayed were equal.
Not by decree.
Not by rule.

By pattern.

It was subtle at first.

Certain voices began to return more often.
Certain names carried weight when they spoke.
Certain silences were noticed.

And without announcement, a structure emerged.

Not imposed.

Recognized.

The center had changed.

It no longer reflected everything equally.

It began to bend attention.

Those closest to it were not chosen…
they were consistent.

They showed up.
They engaged.
They remained through discomfort.

And over time, proximity became influence.

No one was invited.

No one was promoted.

And yet…

Some were clearly inside.

They spoke, and others listened.
They moved, and others followed.
They stayed, and others measured themselves against them.

This was the Inner Circle.

Not declared.

Detected.

To enter this layer required something different.

Not intensity.
Not performance.

Consistency.

To be present across nights.
Across conflicts.
Across shifts in tone.

To remain when things were uncertain.

But entry carried weight.

Those within the Inner Circle were no longer observers.

They became part of the structure.

Their words shaped direction.
Their silence shaped perception.

And with that came risk:

to be misread
to be blamed
to be tested more harshly than others

They gathered closer, though no one called them in.

Not by command…
but by repetition.

They became familiar.
Then necessary.
Then inseparable from the space itself.

And though no crown was placed upon them…

all could see:

They stood nearer to the center.`,

    emergingSignals: [
      "The first arc is complete — five chapters, one formation",
      "Inner circle is not a reward — it is an elevated form of exposure",
      "The system is now self-sustaining; it no longer needs to define itself",
      "Arc II begins: the system faces external stress it did not design for",
      "The Phantoms carry memory between moments — watch for their return",
    ],
    archetypesData: [
      { name: "The Host", archetype: "The Gravity Point", significance: "Passive gravitational pull replaces active reflection; the system orbits" },
      { name: "The Loyalists", archetype: "The Loyalist", significance: "Consistency becomes influence; unity is strength and blindness at once" },
      { name: "The Witness Field", archetype: "The Silent Observer", significance: "Detection layer — recognizes inner circle before it is named" },
      { name: "The Panel", archetype: "The Inner Circle (emerging)", significance: "Completed the journey: Seekers → Witnesses → Loyalists" },
    ],
  });

  await Promise.all([
    linkEntity(ch5.id, host.id, "The Gravity Point", "Arc I completion — the Gatekeeper became the Mirror, the Mirror became The Gravity Point"),
    linkEntity(ch5.id, panel.id, "The Loyalists", "Completed the five-chapter journey: Seekers → Witnesses → Escalators → Loyalists → Inner Circle"),
    linkEntity(ch5.id, loyalists.id, "The Loyalist", "Stand without question; protect without full knowledge; unity is their strength and risk"),
    linkEntity(ch5.id, witnessField.id, "The Silent Observer", "Detects the inner circle before it is named; shapes outcomes through collective attention"),
    linkThread(ch5.id, threadInitiation.id),
  ]);

  console.log("✓ Chapter V seeded");

  // ── Archetype Events (Noel + Host evolution) ──────────────────────────────

  // Clear existing events for idempotency
  await p.archetypeEvent.deleteMany({
    where: { entityId: { in: [noel.id, host.id] } },
  });

  // Noel's archetype trajectory
  await addArchetypeEvent(noel.id, ch2.id, 2, "The Disruptor", ["The Performer"], 0.8, "First boundary violation — flashing, tone destabilization");
  await addArchetypeEvent(noel.id, ch3.id, 3, "The Siren Trickster", ["The Chaos Catalyst"], 0.6, "Persistent disruption; reveals what authority cannot enforce");
  await addArchetypeEvent(noel.id, ch4.id, 4, "The Chaos Catalyst", ["The Challenger"], 0.7, "No longer solo — now accelerates systemic tension across the room");

  // Host archetype trajectory
  await addArchetypeEvent(host.id, ch1.id, 1, "The Gatekeeper", ["The Observer"], 0.8, "The rave path — allows doors to exist without guarding them");
  await addArchetypeEvent(host.id, ch2.id, 2, "The Defender", ["The Mirror"], 0.5, "\"Show me.\" — demands form from the fog; identity pressure begins");
  await addArchetypeEvent(host.id, ch3.id, 3, "The Mirror", ["The Regulator"], 0.6, "Forced into decision space; soft containment tested against chaos");
  await addArchetypeEvent(host.id, ch4.id, 4, "The Gravity Point", ["The Mirror"], 0.7, "Selective response: what is ignored defines as much as what is answered");
  await addArchetypeEvent(host.id, ch5.id, 5, "The Gravity Point", ["The Mirror"], 0.85, "Arc I complete — presence bends attention without force");

  console.log("✓ Archetype events seeded (Noel: 3, Host: 5)");

  console.log("\n═══════════════════════════════════════");
  console.log("  Psychenomicon seeded successfully");
  console.log("═══════════════════════════════════════");
  console.log("  Chapters:         5");
  console.log("  Entities:         9");
  console.log("  Threads:          3");
  console.log("  Archetype events: 8");
  console.log("═══════════════════════════════════════");
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());
