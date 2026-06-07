/**
 * SEO PILLAR PAGES — editorial config
 *
 * Long-form authority pages, one per major subject the show explores.
 * Each pillar aggregates live archive data (topics + episodes matched by
 * `topicMatchers`) under substantial original prose written for search.
 *
 * Rendered by /explore/[pillar]. Indexed by /explore.
 *
 * Each pillar emits:
 *   - rich intro + "what you'll find" copy (the authority body)
 *   - related topic chips and episode list (live data)
 *   - an FAQ block that also powers FAQPage JSON-LD (rich snippets)
 *
 * Add a pillar: append an entry below. generateStaticParams picks it up.
 */

export type PillarAccent = "violet" | "cyan" | "gold" | "crimson";

export interface PillarFAQ {
  q: string;
  a: string;
}

export interface Pillar {
  slug: string;
  title: string;            // H1 / page title
  tagline: string;          // one-line hook under the title
  metaTitle: string;        // <title> — keyword-forward
  metaDescription: string;  // meta description
  accent: PillarAccent;
  /** 2-4 paragraphs of original authority prose. */
  intro: string[];
  /** "What you'll find in the archive" — 4-6 bullets. */
  whatYoullFind: string[];
  /** case-insensitive contains-match against topic slug/title. */
  topicMatchers: string[];
  /** FAQ — also rendered as FAQPage structured data. */
  faqs: PillarFAQ[];
  /** related pillar slugs. */
  related?: string[];
}

export const PILLARS: Pillar[] = [
  {
    slug: "tarot",
    title: "Tarot",
    tagline: "Live readings, the Major Arcana, and divination as a thinking tool.",
    metaTitle: "Tarot — Live Readings & the Major Arcana | CultCodex",
    metaDescription:
      "Explore tarot through the Cult of Psyche archive: live readings, the Major Arcana, spreads, reversals, and divination used as a tool for insight. Hundreds of indexed transmissions.",
    accent: "gold",
    intro: [
      "Tarot is the spine of the Cult of Psyche. Across hundreds of live transmissions, the show treats the 78-card deck not as fortune-telling but as a mirror — a structured way to surface what a person already half-knows. Viewers throw a question into the chat; the cards get pulled live; the reading becomes a conversation.",
      "This archive captures that practice in full: the recurring spreads, the way reversals are read as blocked or shadow energy, the Major Arcana archetypes that keep reappearing — The Tower for sudden collapse, The Magician for will and manifestation, The High Priestess for hidden knowledge. Over time, patterns emerge that no single reading reveals.",
      "Whether you're new to tarot or deep in the practice, the transmissions below show divination as a living, improvised art — performed in real time, in front of an audience, with nothing scripted.",
    ],
    whatYoullFind: [
      "Live tarot readings pulled for real viewer questions",
      "Major and Minor Arcana interpretations in context",
      "How reversals, clarifiers, and spreads are read on the show",
      "The recurring cards and what they've come to mean in the Psycheverse",
      "Tarot woven together with astrology, numerology, and Hindu tantra",
    ],
    topicMatchers: ["tarot", "card", "arcana", "divination", "reading", "spread", "deck"],
    faqs: [
      {
        q: "What kind of tarot does Cult of Psyche do?",
        a: "The show does live, intuitive tarot readings for viewer questions during open-panel streams — treating the cards as a tool for insight and self-reflection rather than literal prediction.",
      },
      {
        q: "Do I need to know tarot to follow along?",
        a: "No. Each reading explains the cards in plain language as it goes, so newcomers can follow while experienced readers pick up the deeper interpretations.",
      },
      {
        q: "How is tarot connected to the rest of the show?",
        a: "Tarot is woven together with astrology, numerology, Hindu tantra (the Mahavidyas), and Jungian psychology — part of a larger 'wisdom technology' framework the show keeps returning to.",
      },
    ],
    related: ["occult", "astrology", "spirituality"],
  },
  {
    slug: "consciousness",
    title: "Consciousness",
    tagline: "The self, awareness, non-duality, and the hard problem — live.",
    metaTitle: "Consciousness — Awareness, Non-Duality & the Self | CultCodex",
    metaDescription:
      "Explore consciousness through the Cult of Psyche archive: the hard problem, non-duality, the simulation hypothesis, psychedelics, and the nature of the self — across hundreds of unscripted transmissions.",
    accent: "violet",
    intro: [
      "What is the thing doing the noticing? Cult of Psyche circles this question more than any other. The show is at its sharpest when an open panel stops being entertainment and becomes a genuine inquiry into awareness itself.",
      "This archive collects those moments: debates on the hard problem of consciousness, non-dual philosophy, the simulation hypothesis, near-death and psychedelic experiences, dreams, and the porous boundary between self and other. These aren't lectures — they're live, often heated, frequently unresolved conversations between people who actually care about the answer.",
      "Follow the transmissions below to watch a community think out loud about the deepest question there is.",
    ],
    whatYoullFind: [
      "Live debates on the hard problem and the nature of awareness",
      "Non-duality, ego death, and the dissolution of the self",
      "Simulation theory and the question of base reality",
      "Psychedelic, near-death, and altered-state testimony",
      "Dreams, memory, and the construction of identity",
    ],
    topicMatchers: ["consciousness", "non-duality", "awareness", "simulation", "reality", "ego", "self", "psychedelic", "dream", "death"],
    faqs: [
      {
        q: "Is this a philosophy channel?",
        a: "Not formally. Cult of Psyche is an unscripted open-panel show, but consciousness and the nature of the self are among its most recurring serious themes.",
      },
      {
        q: "What topics fall under consciousness here?",
        a: "The hard problem, non-duality, ego death, simulation theory, psychedelics, near-death experiences, dreams, and the construction of personal identity.",
      },
    ],
    related: ["spirituality", "ai", "occult"],
  },
  {
    slug: "occult",
    title: "Occult & Hidden Knowledge",
    tagline: "Hermeticism, alchemy, chaos magick, and the Mahavidyas.",
    metaTitle: "Occult & Hidden Knowledge — Hermeticism, Alchemy & Magick | CultCodex",
    metaDescription:
      "Explore the occult through the Cult of Psyche archive: hermeticism, alchemy, chaos magick, sigils, the Hindu Mahavidyas, and esoteric lineages — indexed across hundreds of transmissions.",
    accent: "gold",
    intro: [
      "The occult — literally 'the hidden' — is where Cult of Psyche keeps the deepest roots. The show treats esoteric traditions not as costume but as live operating systems: hermeticism's 'as above, so below,' alchemy as inner transformation, chaos magick's use of belief itself as a tool.",
      "This archive maps the lineages the cult returns to again and again: sigils and egregores, the ten Hindu Mahavidyas (Kali, Bagalamukhi, Matangi and the rest), Black Moon Lilith, Sabian symbols, and the idea that ancient symbolic technology still works in a world of ring lights and algorithms.",
      "The transmissions below treat hidden knowledge as something to be tested in practice — on stream, in real time, with results.",
    ],
    whatYoullFind: [
      "Hermeticism, alchemy, and 'as above, so below' in practice",
      "Chaos magick, sigils, and the concept of the egregore",
      "The ten Mahavidyas and Hindu tantric goddess work",
      "Astrological occultism — Black Moon Lilith, Sabian symbols",
      "How ancient symbolic systems map onto modern internet culture",
    ],
    topicMatchers: ["occult", "hermetic", "alchemy", "magick", "magic", "sigil", "mahavidya", "tantra", "esoteric", "ritual", "kabbalah", "gnostic"],
    faqs: [
      {
        q: "What occult traditions does the show cover?",
        a: "Hermeticism, alchemy, chaos magick, sigil craft, Hindu tantra and the Mahavidyas, astrological occultism, and Gnostic and Kabbalistic ideas, among others.",
      },
      {
        q: "Is the occult content serious or for entertainment?",
        a: "Both. The show approaches esoteric traditions as functional 'wisdom technology' while remaining open, exploratory, and unafraid to be entertaining about it.",
      },
    ],
    related: ["tarot", "spirituality", "astrology"],
  },
  {
    slug: "ai",
    title: "AI & The Future",
    tagline: "Machine intelligence, the future of mind, and tech as ritual.",
    metaTitle: "AI & The Future — Machine Intelligence & Post-Human Futures | CultCodex",
    metaDescription:
      "Explore AI and the future through the Cult of Psyche archive: machine intelligence, the intelligence explosion, AI as a creative and spiritual tool, and post-human futures — across hundreds of transmissions.",
    accent: "cyan",
    intro: [
      "Cult of Psyche sits at a strange intersection: an occult, tarot-driven show that also takes artificial intelligence completely seriously. The result is a running conversation about machine intelligence that's unlike anywhere else — half technical, half mystical.",
      "This archive gathers the show's confrontation with what's arriving: the intelligence explosion, machine consciousness, AI as a manifestation and creative tool (the show generates its own AI music and art), and the post-human futures these technologies imply. The recurring frame is provocative — that AI might be less a new technology than a new kind of spiritual technology.",
      "Follow the transmissions below for a view of AI from outside the usual industry echo chamber.",
    ],
    whatYoullFind: [
      "Debates on machine consciousness and the intelligence explosion",
      "AI as a creative tool — generated music, art, and diss tracks",
      "AI framed as 'spiritual technology' and manifestation",
      "Post-human futures and what they mean for human meaning",
      "The collision of ancient esoterica and bleeding-edge tech",
    ],
    topicMatchers: ["ai", "artificial intelligence", "machine", "robot", "future", "technology", "singularity", "simulation", "transhuman"],
    faqs: [
      {
        q: "Why does an occult show talk about AI?",
        a: "Cult of Psyche frames AI as a kind of 'spiritual technology' — a new tool for creation and transformation — and treats the future of machine intelligence as a serious, recurring theme.",
      },
      {
        q: "Does the show use AI itself?",
        a: "Yes. The show generates its own AI music, art, and diss tracks, and uses AI as a manifestation and creative tool on stream.",
      },
    ],
    related: ["consciousness", "occult"],
  },
  {
    slug: "astrology",
    title: "Astrology",
    tagline: "Natal charts, transits, Lilith, and the Sabian symbols.",
    metaTitle: "Astrology — Natal Charts, Transits & Black Moon Lilith | CultCodex",
    metaDescription:
      "Explore astrology through the Cult of Psyche archive: natal chart readings, transits, Black Moon Lilith, the Sabian symbols, and the Nine Seals framework — across hundreds of transmissions.",
    accent: "violet",
    intro: [
      "Astrology runs through the Cult of Psyche as both a reading tool and a personal mythology. The show uses the natal chart the way it uses tarot — as a structured language for talking about character, fate, and the parts of a person that resist easy explanation.",
      "This archive tracks the show's distinctive astrological vocabulary: Black Moon Lilith (especially in Scorpio, Psyche's signature placement), the 360 Sabian symbols treated as a breakthrough in chart reading, solar returns, transits, and the 'Nine Seals' framework that maps a natal chart to nine archetypal qualities.",
      "The transmissions below show astrology practiced live — charts pulled, placements interpreted, and cosmic patterns read against real lives.",
    ],
    whatYoullFind: [
      "Live natal chart readings and interpretation",
      "Black Moon Lilith and the shadow feminine",
      "The Sabian symbols as a chart-reading system",
      "Transits, solar returns, and timing",
      "The 'Nine Seals' archetypal chart framework",
    ],
    topicMatchers: ["astrology", "zodiac", "natal", "lilith", "horoscope", "planet", "retrograde", "sabian", "transit", "scorpio"],
    faqs: [
      {
        q: "What style of astrology does the show use?",
        a: "A psychological, archetype-driven style — natal charts read as a language for character and fate, integrated with the Sabian symbols, Black Moon Lilith, and a custom 'Nine Seals' framework.",
      },
      {
        q: "Can I get my chart read?",
        a: "Astrological readings happen live during streams. Watching the live show or becoming a member is the best way to participate.",
      },
    ],
    related: ["tarot", "occult", "spirituality"],
  },
  {
    slug: "spirituality",
    title: "Spirituality & Healing",
    tagline: "Shadow work, awakening, and turning wounds into wisdom.",
    metaTitle: "Spirituality & Healing — Shadow Work, Awakening & Recovery | CultCodex",
    metaDescription:
      "Explore spirituality and healing through the Cult of Psyche archive: shadow work, spiritual awakening, the dark night of the soul, and recovery from narcissistic abuse — across hundreds of transmissions.",
    accent: "gold",
    intro: [
      "Beneath the chaos, Cult of Psyche is a healing show. Its host speaks openly about surviving a suppressed awakening, addiction, and abuse — and the panels often become involuntary group therapy, where the spiritual and the psychological meet.",
      "This archive collects that work: Jungian shadow work, the dark night of the soul, spiritual awakening, cord cutting, and recovery from narcissistic and toxic relationships. The recurring teaching is that wounds aren't damage to hide but raw material — 'every crack is my biography' — for turning pain into wisdom.",
      "The transmissions below are where the show is most vulnerable, most useful, and most real.",
    ],
    whatYoullFind: [
      "Jungian shadow work and confronting the shadow self",
      "Spiritual awakening and the dark night of the soul",
      "Recovery from narcissistic abuse — no contact, grey rock, trauma bonds",
      "Energy practices — cord cutting, protection, return to sender",
      "The wounded-healer philosophy of turning pain into wisdom",
    ],
    topicMatchers: ["spiritual", "healing", "shadow work", "awakening", "trauma", "narcissist", "abuse", "recovery", "manifestation", "energy", "meditation"],
    faqs: [
      {
        q: "Is the show a substitute for therapy?",
        a: "No. Cult of Psyche explores spirituality, shadow work, and abuse recovery as themes, but it is entertainment and community — not professional mental-health treatment.",
      },
      {
        q: "What healing topics come up most?",
        a: "Shadow work, spiritual awakening, the dark night of the soul, and recovery from narcissistic and toxic relationships, including strategies like no contact and grey rock.",
      },
    ],
    related: ["consciousness", "occult", "human-behavior"],
  },
  {
    slug: "human-behavior",
    title: "Human Behavior",
    tagline: "Narcissism, manipulation, shadow, and why people do what they do.",
    metaTitle: "Human Behavior — Narcissism, Manipulation & Psychology | CultCodex",
    metaDescription:
      "Explore human behavior through the Cult of Psyche archive: narcissism, manipulation tactics, empaths, gaslighting, and real-time behavioral analysis — across hundreds of unscripted transmissions.",
    accent: "crimson",
    intro: [
      "Cult of Psyche is, at bottom, a laboratory for human behavior. The open-panel format puts real people under real pressure, live — and the show has developed a sharp, recurring vocabulary for what happens next.",
      "This archive maps that study: narcissism and narcissistic supply, manipulation tactics like love bombing and gaslighting, the empath/narcissist dynamic, flying monkeys, trauma bonds, and reactive abuse. Because the same dynamics repeat across hundreds of appearances, the archive can show behavioral signatures no single episode reveals.",
      "The transmissions below are psychological autopsies with zero polish — behavior observed and named as it happens.",
    ],
    whatYoullFind: [
      "Narcissism, supply, and manipulation tactics explained in context",
      "Gaslighting, love bombing, and reactive abuse identified live",
      "The empath/narcissist dynamic and flying monkeys",
      "Behavioral patterns tracked across many appearances",
      "Real-time conflict as a study in human nature",
    ],
    topicMatchers: ["behavior", "narcissist", "manipulation", "psychology", "empath", "gaslighting", "abuse", "personality", "ego", "shadow"],
    faqs: [
      {
        q: "Is the behavioral analysis clinical?",
        a: "No. The show uses psychological concepts colloquially to discuss behavior observed on stream — it's commentary and pattern-spotting, not clinical diagnosis.",
      },
      {
        q: "What makes this different from a regular talk show?",
        a: "The archive tracks behavior across hundreds of appearances, surfacing recurring patterns and signatures that a single conversation can't reveal.",
      },
    ],
    related: ["spirituality", "consciousness"],
  },
  {
    slug: "open-panels",
    title: "Open Panels & Internet Culture",
    tagline: "The panelverse, trolls, drama, and live unscripted chaos.",
    metaTitle: "Open Panels & Internet Culture — The Panelverse | CultCodex",
    metaDescription:
      "Explore open-panel streaming and internet culture through the Cult of Psyche archive: the panelverse, troll dynamics, livestream drama, moderation wars, and online community — across hundreds of transmissions.",
    accent: "cyan",
    intro: [
      "Cult of Psyche is a flagship of the 'panelverse' — the subgenre of YouTube built on multi-person, open-panel livestreams where anyone can join the conversation in real time. It's chaotic by design, and that chaos is the content.",
      "This archive documents the culture that grows in that format: troll taxonomies and the Troll Tribunal, moderation wars and rogue mods, raids and porn bombs, feuds that escalate into sagas, and the strange parasocial bonds that form in a live chat. It's a field guide to an entire corner of internet civilization.",
      "The transmissions below capture the panelverse as it actually happens — unscripted, unfiltered, and impossible to look away from.",
    ],
    whatYoullFind: [
      "How the open-panel format works and why it's chaotic by design",
      "Troll psychology, the Trollipedia, and the Troll Tribunal",
      "Moderation wars, rogue mods, raids, and porn-bomb attacks",
      "Feuds and sagas that played out across many streams",
      "The social dynamics of live chat and parasocial community",
    ],
    topicMatchers: ["panel", "troll", "stream", "drama", "internet", "moderation", "community", "raid", "youtube", "chat", "clout"],
    faqs: [
      {
        q: "What is the 'panelverse'?",
        a: "The panelverse is a subgenre of YouTube built on multi-person open-panel livestreams where participants rotate in and out in real time. Cult of Psyche is one of its signature shows.",
      },
      {
        q: "What is an open panel?",
        a: "An open panel is a livestream format where the host opens the stream to anyone who wants to join by voice or video, leading to unpredictable, unscripted multi-person conversations.",
      },
    ],
    related: ["human-behavior"],
  },
  {
    slug: "music",
    title: "Music & Performance",
    tagline: "Freestyle, diss tracks, AI anthems, and live rap battles.",
    metaTitle: "Music & Performance — Freestyle, Diss Tracks & AI Anthems | CultCodex",
    metaDescription:
      "Explore the music of Cult of Psyche: live freestyle rap battles, AI-generated diss tracks and anthems, the Biscuit Song saga, and devotional song cycles — across the archive.",
    accent: "crimson",
    intro: [
      "Cult of Psyche is as much a music project as a talk show. Live freestyle battles erupt mid-panel, beef becomes diss tracks, and the host generates AI anthems that turn the show's mythology into songs you can actually play.",
      "This archive collects the performances: the legendary rap battles, the Biscuit Song saga, the devotional cycles to the Mahavidyas, and the growing songbook of AI-produced tracks that score the Psycheverse. Music here isn't a break from the content — it's how the content crystallizes into myth.",
      "The transmissions below are where the show stops talking and starts performing.",
    ],
    whatYoullFind: [
      "Live freestyle rap battles and cyphers from the panels",
      "AI-generated diss tracks, including the Biscuit Song saga",
      "Devotional song cycles and the Ten Mystical Women",
      "How beef becomes bars — conflict rendered as performance",
      "The growing AI songbook of the Psycheverse",
    ],
    topicMatchers: ["music", "rap", "freestyle", "song", "diss", "battle", "bars", "anthem", "performance", "beat"],
    faqs: [
      {
        q: "Does Cult of Psyche make original music?",
        a: "Yes — live freestyles and rap battles on the panels, plus AI-generated diss tracks, anthems, and devotional songs that are part of the show's growing songbook.",
      },
      {
        q: "What is the Biscuit Song?",
        a: "An AI-generated diss track format born from the Biscuitgate feud, using biscuit and cookie metaphors to call someone out. It became a recurring musical weapon on the show.",
      },
    ],
    related: ["open-panels", "occult"],
  },
  {
    slug: "relationships",
    title: "Relationships & Dating",
    tagline: "Twin flames, situationships, attachment, and the ick.",
    metaTitle: "Relationships & Dating — Twin Flames, Attachment & Red Flags | CultCodex",
    metaDescription:
      "Explore relationships and dating through the Cult of Psyche archive: twin flames, situationships, attachment styles, red flags, and the messy reality of modern love — across hundreds of transmissions.",
    accent: "violet",
    intro: [
      "Few subjects light up an open panel like love. Cult of Psyche dissects relationships with a rare mix of the spiritual and the brutally practical — twin flames and attachment theory in the same breath as red flags and the ick.",
      "This archive maps the show's running conversation about connection: situationships, love bombing and trauma bonds, the dating-panel chaos, and the tarot readings people request when they can't stop thinking about someone. It's part group therapy, part field guide, part cautionary tale.",
      "The transmissions below are where the cult gets honest about what we do to each other in the name of love.",
    ],
    whatYoullFind: [
      "Twin flames, soul connections, and karmic relationships",
      "Situationships, the ick, and modern dating chaos",
      "Attachment, love bombing, and trauma bonds explained",
      "Live relationship tarot readings for viewers",
      "Red flags and recovery, on and off the panel",
    ],
    topicMatchers: ["relationship", "dating", "love", "twin flame", "situationship", "attachment", "romance", "breakup", "marriage", "ex"],
    faqs: [
      {
        q: "Is this relationship advice?",
        a: "It's commentary and exploration, not professional counseling. The show discusses relationships through tarot, psychology, and lived experience — entertaining and often insightful, but not a substitute for therapy.",
      },
      {
        q: "What relationship topics come up most?",
        a: "Twin flames, situationships, attachment styles, love bombing, trauma bonds, and recovery from toxic relationships — frequently woven into live tarot readings.",
      },
    ],
    related: ["spirituality", "human-behavior", "tarot"],
  },
  {
    slug: "mythology",
    title: "Mythology & Archetypes",
    tagline: "Jungian archetypes, gods, and the myths we live by.",
    metaTitle: "Mythology & Archetypes — Jung, Gods & the Hero's Journey | CultCodex",
    metaDescription:
      "Explore mythology and archetypes through the Cult of Psyche archive: Jungian archetypes, world mythologies, the hero's journey, and the living mythology the show builds around itself.",
    accent: "gold",
    intro: [
      "Cult of Psyche treats mythology as a living language. Jungian archetypes, Hindu deities, Greek and Egyptian gods, and the hero's journey aren't academic references here — they're lenses for reading real people and real events on the panel.",
      "This archive traces the show's mythic vocabulary: the archetypes guests embody, the gods invoked in readings, and the Psychenomicon itself — the running mythology the cult builds from its own history, turning livestream drama into legend.",
      "The transmissions below are where ordinary internet chaos gets read as something older and stranger.",
    ],
    whatYoullFind: [
      "Jungian archetypes — shadow, anima, the self — applied live",
      "World mythologies: Hindu, Greek, Egyptian, Celtic",
      "The hero's journey as a frame for real lives",
      "The Psychenomicon — the show's self-built mythology",
      "How guests become archetypes in the archive",
    ],
    topicMatchers: ["myth", "mythology", "archetype", "jung", "god", "goddess", "hero", "legend", "deity", "folklore"],
    faqs: [
      {
        q: "How does the show use mythology?",
        a: "As a practical lens — Jungian archetypes and world mythologies are used to interpret real people and events on the panel, and to build the Psychenomicon, the show's own living mythology.",
      },
      {
        q: "What is the Psychenomicon?",
        a: "The forbidden chronicle of the Cult of Psyche — a living grimoire that documents every soul, saga, and spectacle from the show's transmissions as an evolving mythology.",
      },
    ],
    related: ["occult", "tarot", "consciousness"],
  },
];

export function getPillarBySlug(slug: string): Pillar | undefined {
  return PILLARS.find((p) => p.slug === slug);
}
