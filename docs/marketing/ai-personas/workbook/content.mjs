// Content for "The 30-Day Initiation" workbook, hosted by Madame Sulphur.
// Edit the words here, then rebuild: node docs/marketing/ai-personas/workbook/build.mjs
//
// Every practice is reflective (observation, writing, conversation). No fasting,
// sleep changes or health claims. Keep it that way.

export const SITE = "cultcodex.me";
export const UTM = "?utm_source=workbook&utm_medium=pdf&utm_campaign=initiation30";

export const GATES = [
  {
    numeral: "I",
    name: "The Threshold",
    days: "Days 1–7",
    theme: "Attention",
    glyph: "✦",
    intro:
      "Before anything changes, darling, you have to see what's already there. This week you only watch. The Familiar and the Exile are your guides. They're the ones who notice everything because nobody is watching them.",
  },
  {
    numeral: "II",
    name: "The Mirror",
    days: "Days 8–14",
    theme: "Self-knowledge",
    glyph: "◐",
    intro:
      "Now we turn the watching around. This week belongs to the Mirror Walker and the Oracle. You'll ask the questions you usually avoid and look for the patterns you keep repeating. It will be uncomfortable. That's how you know it's working.",
  },
  {
    numeral: "III",
    name: "The Crucible",
    days: "Days 15–21",
    theme: "Transformation",
    glyph: "⌬",
    intro:
      "Everything you gathered is material, and this week you heat it. The Alchemist turns the mess into meaning, and the Trickster checks whether that meaning can take a joke. Break something small. See what you learn.",
  },
  {
    numeral: "IV",
    name: "The Signal",
    days: "Days 22–28",
    theme: "Voice",
    glyph: "☉",
    intro:
      "A signal nobody receives is only noise, darling. This week you say things out loud: predictions, letters, new words. The Prophet speaks first and the Architect builds something that lasts. You'll do both.",
  },
  {
    numeral: "V",
    name: "The Seal",
    days: "Days 29–30",
    theme: "Return",
    glyph: "◉",
    intro:
      "You go back to the threshold as someone slightly different. Two days, one look back, one promise.",
  },
];

// gate: index into GATES. codex: optional archive task { text, path }.
export const DAYS = [
  // ── Gate I — The Threshold ─────────────────────────────────────────
  {
    gate: 0,
    title: "The Threshold",
    rule: "Begin by noticing that you've begun.",
    note: "Most people never find out which one they are. You will before lunch.",
    rite: "Take the archetype quiz. Then write one honest sentence about why you picked up this workbook, and one sentence about what you'd be a little embarrassed to admit you want from it.",
    codex: { text: "Take the free archetype quiz and write your result below.", path: "/archetype-quiz" },
    prompts: ["My archetype, according to the quiz:", "Why I picked this up:", "What I'd be embarrassed to admit I want:"],
  },
  {
    gate: 0,
    title: "The Witness",
    rule: "Watch before you speak.",
    note: "Sit somewhere with people in it, darling, and be furniture for ten minutes.",
    rite: "Spend ten minutes somewhere public, or at a window. Write down five things people do without knowing they're doing them: a habit, a tic, a small kindness, a small cruelty.",
    prompts: ["Five things I saw that they didn't know they did:"],
  },
  {
    gate: 0,
    title: "The Record",
    rule: "What isn't written down gets remembered wrong.",
    note: "Your memory is a storyteller, not a stenographer. Let's catch it editing.",
    rite: "From memory, write down something specific that happened about a year ago. Then check it against a real record: messages, photos, a calendar. Note what your memory changed.",
    codex: { text: "Search a line you remember from a stream. Was it said the way you remember?", path: "/search" },
    prompts: ["What I remembered:", "What the record says:", "What my memory changed, and why it might have:"],
  },
  {
    gate: 0,
    title: "The Running Joke",
    rule: "Repetition is how a group talks about itself.",
    note: "Every family, friend group and office has its private scripture. Find yours.",
    rite: "List the running jokes and repeated phrases in one group you belong to. For each one, write where it started and what it's really saying underneath the laugh.",
    prompts: ["The joke or phrase → where it started → what it really means:"],
  },
  {
    gate: 0,
    title: "The Margin",
    rule: "The edge has the best view.",
    note: "The Exile isn't bitter about the edge, darling. She's grateful for the view.",
    rite: "Remember a time you stood on the outside of a group. Write what you could see from there that the people inside couldn't.",
    prompts: ["When I was on the outside:", "What I could see from there:"],
  },
  {
    gate: 0,
    title: "The Familiar's Hour",
    rule: "Attention is a form of care.",
    note: "You've been watching something for years and nobody has thanked you. I'm thanking you.",
    rite: "Name something you've paid close attention to for a long time without credit: a show, a craft, a person, a place. Write down what you know about it that almost nobody else does.",
    prompts: ["What I've watched for years:", "What I know that almost nobody else does:"],
  },
  {
    gate: 0,
    review: true,
    title: "Gate I Review",
    rule: "Close the door behind you.",
    note: "Read it all back. Something in there surprised you, even if you haven't noticed yet.",
    rite: "Re-read Days 1 to 6. Copy out the one sentence that surprised you most, then write what you want to carry into Gate II.",
    prompts: ["The sentence that surprised me:", "What I'm carrying into the Mirror:"],
  },

  // ── Gate II — The Mirror ───────────────────────────────────────────
  {
    gate: 1,
    title: "The Mirror",
    rule: "Other people can see the parts you can't.",
    note: "Ask one person one question and don't defend yourself. That's the whole rite. It's harder than it sounds.",
    rite: "Ask someone you trust: \"What's something I do that I probably don't notice?\" Write their answer down word for word. Don't explain or justify anything, on the page or to them.",
    prompts: ["Who I asked:", "What they said, word for word:", "What I felt when I heard it:"],
  },
  {
    gate: 1,
    title: "The Price of the Gift",
    rule: "Every gift has a price.",
    note: "Turn to the Field Guide at the back and find your archetype. Read the shadow line twice.",
    rite: "Using your archetype from Day 1, write about one time recently when its gift turned against you. Then try the practice listed for it in the Field Guide.",
    prompts: ["My archetype's gift:", "When it turned against me:", "What happened when I tried the practice:"],
  },
  {
    gate: 1,
    title: "The Oracle's Question",
    rule: "A good question is worth more than an answer.",
    note: "Write ten questions quickly. The one you almost don't write is the real one.",
    rite: "Write ten questions about your own life without stopping. Circle the one you're avoiding.",
    codex: { text: "Ask the Oracle one question about the archive you've always wondered about. 3 free each month.", path: "/oracle" },
    prompts: ["Ten questions (circle the one you're avoiding):"],
    numbered: 10,
  },
  {
    gate: 1,
    title: "The Pattern",
    rule: "The same gesture shows up in different eras.",
    note: "If it's happened three times, darling, it's not bad luck. It's a pattern.",
    rite: "Find something that has happened in your life at least three times: a kind of argument, a way things end, a role you keep ending up in. Write each time, then what they have in common.",
    prompts: ["First time:", "Second time:", "Third time:", "What they have in common:"],
  },
  {
    gate: 1,
    title: "The Old Story",
    rule: "The story you tell about yourself is a spell.",
    note: "You've said it so often you think it's the truth. Let's hear it from a stranger.",
    rite: "Write the three-sentence story you usually tell people about who you are. Then rewrite it as a stranger would, using only facts they could check.",
    prompts: ["The story I usually tell:", "The same story, from a stranger with only the facts:"],
  },
  {
    gate: 1,
    title: "The Masks",
    rule: "Everyone performs, so know which role you're playing.",
    note: "There's no shame in masks. The shame is forgetting you're wearing one.",
    rite: "List the versions of you: at work, with family, online, alone. For each one, write what it hides. Then mark the one that feels closest to true.",
    prompts: ["The mask → what it hides:", "The one closest to true, and why:"],
  },
  {
    gate: 1,
    review: true,
    title: "Gate II Review",
    rule: "Look once more, then look away.",
    note: "Halfway, darling. Most people stop before now. You didn't.",
    rite: "Re-read Days 8 to 13. Write the one thing you learned about yourself that you'd rather not have. Then write one thing you're quietly proud of.",
    prompts: ["What I'd rather not have learned:", "What I'm quietly proud of:"],
  },

  // ── Gate III — The Crucible ────────────────────────────────────────
  {
    gate: 2,
    title: "The Crucible",
    rule: "Everything is material.",
    note: "Bring me your pettiest irritation from this week. We're going to take it apart.",
    rite: "Take one irritation from this week and break it into its ingredients: what it touches in you, what it's afraid of, and what it actually wants.",
    prompts: ["The irritation:", "What it touches:", "What it's afraid of:", "What it actually wants:"],
  },
  {
    gate: 2,
    title: "The Transmutation",
    rule: "Turn one sentence into a thesis.",
    note: "The Alchemist can build a cathedral out of one overheard line. So can you.",
    rite: "Pick one sentence you've heard or read: a quote, a lyric, something a friend said. Write half a page arguing something that grows out of it.",
    codex: { text: "Browse the quote archive for a line that snags on you.", path: "/quotes" },
    prompts: ["The sentence:", "The argument that grows from it:"],
  },
  {
    gate: 2,
    title: "The Trickster's Test",
    rule: "If it can't survive a laugh, it wasn't holding weight.",
    note: "Mock yourself lovingly, darling. What's left standing is yours.",
    rite: "Pick one belief you take very seriously. Write the funniest honest critique of it you can. Then decide: did it survive?",
    prompts: ["The belief:", "The funniest honest critique:", "Did it survive? What's left?"],
  },
  {
    gate: 2,
    title: "The Small Disruption",
    rule: "Break one habit on purpose.",
    note: "Something small. A different road, a different chair. Watch what wakes up.",
    rite: "Change one small routine today: your route, the order of your morning, where you sit. Write down what you noticed because of it.",
    prompts: ["What I changed:", "What I noticed that I never would have:"],
  },
  {
    gate: 2,
    title: "The Symbol",
    rule: "Choose your sign.",
    note: "Every archetype has a glyph. You're allowed one of your own.",
    rite: "Sketch a personal glyph in the box: simple enough to draw in five seconds. Underneath, write the three things it stands for.",
    codex: { text: "Browse the Symbol Encyclopedia for inspiration.", path: "/symbols" },
    prompts: ["It stands for:"],
    sketch: true,
  },
  {
    gate: 2,
    title: "The Draw",
    rule: "Chance becomes a mirror if you let it.",
    note: "The card doesn't know your future, darling. It knows which question you're asking.",
    rite: "Hold a question you've been carrying. Draw a card from the Codex deck or any deck, or open a book to a random page. Treat what you get as a writing prompt, not a prophecy. How does it answer you?",
    codex: { text: "Draw from the Codex deck.", path: "/draw" },
    prompts: ["My question:", "What I drew:", "How it answers me:"],
  },
  {
    gate: 2,
    review: true,
    title: "Gate III Review",
    rule: "Let it cool before you touch it.",
    note: "Whatever you made this week is still hot. Look at it, don't grab it.",
    rite: "Re-read Days 15 to 20. Write down what you transformed this week, even if it's small, and what you broke that needed breaking.",
    prompts: ["What I transformed:", "What I broke that needed breaking:"],
  },

  // ── Gate IV — The Signal ───────────────────────────────────────────
  {
    gate: 3,
    title: "The Prophecy",
    rule: "Say it before it's proven.",
    note: "Prophets are only ever understood in hindsight. So let's make some hindsight.",
    rite: "Write three predictions about your own life a year from now. Date them, then fold down the corner of this page. Open it again in a year.",
    prompts: ["Today's date:", "Prediction one:", "Prediction two:", "Prediction three:"],
  },
  {
    gate: 3,
    title: "The Architect's Frame",
    rule: "Building structure is a way of caring.",
    note: "One messy corner of your life, darling. Just one. Build it a frame.",
    rite: "Pick one messy area: a drawer, an inbox, a weekly chore. Design a simple system for it, sketch it, and put it in place today.",
    prompts: ["The mess:", "The system:"],
    sketch: true,
  },
  {
    gate: 3,
    title: "The Unsent Letter",
    rule: "Say the true thing, even if only to paper.",
    note: "You never have to send it. That's why you can finally write it.",
    rite: "Write a letter to someone that you will never send. Then underline one sentence from it that you could actually say to them.",
    prompts: ["Dear ___________,"],
  },
  {
    gate: 3,
    title: "The Transmission",
    rule: "A signal needs someone to receive it.",
    note: "Say one thing out loud to one person. Watch their face.",
    rite: "Share one thing you learned this month with one person, out loud, in your own words. Write down what happened.",
    codex: { text: "Optional: post what you learned in the Salon.", path: "/salon" },
    prompts: ["What I shared:", "Who I told:", "What happened:"],
  },
  {
    gate: 3,
    title: "The Lexicon",
    rule: "Name a thing and it becomes real.",
    note: "There are feelings nobody has named yet. Claim three.",
    rite: "Invent three words for feelings or situations that don't have a word yet. Define each one like a dictionary would, and use it in a sentence.",
    codex: { text: "See how the archive names its own inventions.", path: "/lexicon" },
    prompts: ["Word one: definition, and a sentence:", "Word two:", "Word three:"],
  },
  {
    gate: 3,
    title: "The Eras",
    rule: "Your life has chapters. Name them.",
    note: "An era ends before you notice, darling. Name yours while you can still see them.",
    rite: "Divide your life so far into eras. Give each one a title, a symbol and the moment it ended. Then name the era you're in now.",
    codex: { text: "See how the archive divides its own history.", path: "/eras" },
    prompts: ["Era → title → symbol → how it ended:", "The era I'm in now:"],
  },
  {
    gate: 3,
    review: true,
    title: "Gate IV Review",
    rule: "Listen for the echo.",
    note: "You've been broadcasting all week. Now listen for what came back.",
    rite: "Re-read Days 22 to 27. Write down what came back to you this week: replies, reactions, a change in how you feel.",
    prompts: ["What came back:", "What I'll keep saying:"],
  },

  // ── The Seal ───────────────────────────────────────────────────────
  {
    gate: 4,
    title: "The Return",
    rule: "Go back to the threshold.",
    note: "Answer Day 1 again without looking. Then compare. That gap is what this month was.",
    rite: "Without looking at Day 1, answer its questions again. Then compare the two. Retake the quiz too: are you still the same archetype?",
    codex: { text: "Retake the archetype quiz.", path: "/archetype-quiz" },
    prompts: ["My archetype now:", "Why I'm still here:", "What I want now:", "What changed between Day 1 and today:"],
  },
  {
    gate: 4,
    title: "The Seal",
    rule: "An initiation is a promise, not a finish line.",
    note: "You did it, darling. Now promise me three things and sign the seal.",
    rite: "Write your vow: three practices from this month that you'll keep doing. Then sign and date the Seal of Initiation on the next page.",
    prompts: ["I will keep:", "I will keep:", "I will keep:"],
  },
];

// Field guide. Gift lines come from src/lib/archetypes.ts so they match the quiz.
export const FIELD_GUIDE = [
  { glyph: "◉", name: "The Oracle", gift: "You notice the connections others miss. Where they hear noise, you hear signal.", shadow: "You see patterns that aren't there, and you live in what things mean instead of what they are.", practice: "Check one pattern you believe in against the actual record." },
  { glyph: "⌬", name: "The Alchemist", gift: "You turn raw chaos into meaning. Every encounter is material.", shadow: "People can start to feel like ingredients to you.", practice: "Make one thing purely for pleasure. Extract nothing from it." },
  { glyph: "☽", name: "The Trickster", gift: "Disruption is your ritual. What you shake loose teaches people something.", shadow: "You hide behind the laugh, and you can't stop once you've started.", practice: "Be completely sincere once, on purpose, and don't undercut it." },
  { glyph: "◐", name: "The Mirror Walker", gift: "You show other people to themselves just by being there.", shadow: "You disappear into everyone else and forget your own opinion.", practice: "State one opinion today without softening it." },
  { glyph: "☉", name: "The Prophet", gift: "You say what's coming before it arrives.", shadow: "Being right too early turns into bitterness about not being heard.", practice: "Write the prediction down, date it, and let it go." },
  { glyph: "▦", name: "The Architect", gift: "You build the systems meaning flows through. Structure is how you care.", shadow: "Control, and quiet resentment about work nobody sees.", practice: "Leave one thing unorganised on purpose." },
  { glyph: "⏚", name: "The Exile", gift: "You've always stood at the edge of the circle, and you see clearest from there.", shadow: "The distance turns into your whole identity.", practice: "Step one foot into a circle you usually watch from outside." },
  { glyph: "✦", name: "The Familiar", gift: "You're the witness who stays. You were paying attention when nobody else was.", shadow: "You make yourself invisible and never let anyone give you credit.", practice: "Let someone thank you. Don't deflect it." },
];

// Bonus: journaling spreads. Answer each position in writing.
export const SPREADS = [
  {
    name: "The Threshold Spread",
    use: "When you're about to begin something.",
    positions: ["What I'm leaving behind", "What I'm carrying across", "What waits on the other side"],
  },
  {
    name: "The Mirror Spread",
    use: "When someone has got under your skin.",
    positions: ["What they did", "What it showed me about me", "What I'd do if I weren't afraid"],
  },
  {
    name: "The Signal Spread",
    use: "When you can't decide whether to speak.",
    positions: ["What I want to say", "Who needs to hear it", "What it costs to stay silent"],
  },
];
