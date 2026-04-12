import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panelverse Lexicon — CULT CODEX",
  description:
    "A glossary of slang, jargon, and specialized terms from the Cult of Psyche and the wider Panelverse streaming community.",
};

/* ------------------------------------------------------------------ */
/*  Term type                                                          */
/* ------------------------------------------------------------------ */
interface Term {
  word: string;
  aka?: string[];
  definition: string;
  origin?: string;
  usage?: string; // example quote
  category: Category;
}

type Category =
  | "panelverse"
  | "streaming"
  | "community"
  | "tarot"
  | "psycheverse"
  | "slang"
  | "music"
  | "moderation";

/*
 * Color-coded category system (matches site-wide nav grouping):
 *   Gold    — Psycheverse & Panelverse (show-specific terms)
 *   Cyan    — Streaming & Moderation (platform & technical)
 *   Violet  — Tarot & Mystic (spiritual & esoteric)
 *   Crimson — Community & Slang (social dynamics)
 *   Pink    — Music & Performance (creative expression)
 */
const CATEGORY_META: Record<
  Category,
  { label: string; color: string; dotColor: string; borderColor: string; bgHover: string; description: string }
> = {
  psycheverse: {
    label: "Psycheverse",
    color: "text-accent-gold",
    dotColor: "bg-accent-gold",
    borderColor: "border-accent-gold/30",
    bgHover: "hover:bg-accent-gold-dim",
    description: "Terms coined by or unique to the Cult of Psyche community",
  },
  panelverse: {
    label: "Panelverse",
    color: "text-accent-gold",
    dotColor: "bg-accent-gold",
    borderColor: "border-accent-gold/30",
    bgHover: "hover:bg-accent-gold-dim",
    description: "Terms specific to the YouTube panel livestream ecosystem",
  },
  streaming: {
    label: "Streaming",
    color: "text-accent-cyan",
    dotColor: "bg-accent-cyan",
    borderColor: "border-accent-cyan/30",
    bgHover: "hover:bg-accent-cyan-dim",
    description: "General livestreaming and content creator terminology",
  },
  moderation: {
    label: "Moderation",
    color: "text-accent-cyan",
    dotColor: "bg-accent-cyan",
    borderColor: "border-accent-cyan/30",
    bgHover: "hover:bg-accent-cyan-dim",
    description: "Terms related to stream moderation and chat management",
  },
  tarot: {
    label: "Tarot & Mystic",
    color: "text-accent-violet",
    dotColor: "bg-accent-violet",
    borderColor: "border-accent-violet/30",
    bgHover: "hover:bg-accent-violet-dim",
    description: "Tarot, divination, and spiritual terminology used on the show",
  },
  community: {
    label: "Community",
    color: "text-red-400",
    dotColor: "bg-red-400",
    borderColor: "border-red-400/30",
    bgHover: "hover:bg-red-400/5",
    description: "Terms describing community dynamics and social interactions",
  },
  slang: {
    label: "Slang",
    color: "text-red-400",
    dotColor: "bg-red-400",
    borderColor: "border-red-400/30",
    bgHover: "hover:bg-red-400/5",
    description: "Internet and panel culture slang terms",
  },
  music: {
    label: "Music & Performance",
    color: "text-pink-400",
    dotColor: "bg-pink-400",
    borderColor: "border-pink-400/30",
    bgHover: "hover:bg-pink-400/5",
    description: "Terms related to freestyle rap, music, and live performances",
  },
};

/* ------------------------------------------------------------------ */
/*  Lexicon entries                                                     */
/* ------------------------------------------------------------------ */
const LEXICON: Term[] = [
  // ── PANELVERSE ──────────────────────────────────────────────────
  {
    word: "Panelverse",
    definition:
      "A subgenre of YouTube where content consists primarily of multi-person livestreams centered around open discussions. A melting pot where communities converge to debate, entertain, and interact in real time across multiple channels simultaneously.",
    origin: "Coined by the YouTube panel streaming community",
    category: "panelverse",
  },
  {
    word: "Open Panel",
    definition:
      "A livestream format where the host opens the stream to anyone who wants to join via voice or video. Participants rotate in and out freely, leading to unpredictable and often chaotic conversations. The signature format of the Cult of Psyche.",
    usage:
      "\"It's the open panel circus — roll up and see. Half philosopher, half…\"",
    category: "panelverse",
  },
  {
    word: "Panel Circus",
    aka: ["Open Panel Circus"],
    definition:
      "Psyche's affectionate term for the chaotic, unpredictable nature of open panel streams. Embraces the beautiful disorder of unscripted multi-person conversations.",
    usage: "\"I'm not built to be a circus. I'm built to turn that into gold.\"",
    origin: "Cult of Psyche — recurring show theme",
    category: "panelverse",
  },
  {
    word: "Multistreaming",
    definition:
      "Broadcasting the same livestream across multiple panelists' channels simultaneously to reach a wider audience. A core practice in the panelverse.",
    category: "panelverse",
  },

  // ── STREAMING ───────────────────────────────────────────────────
  {
    word: "Raid",
    aka: ["Raiding"],
    definition:
      "Sending your viewers to another streamer's channel at the end of your broadcast. A sign of support and community building. Psyche regularly raids Elisa Jordana and other community streamers.",
    category: "streaming",
  },
  {
    word: "Super Chat",
    aka: ["Superchat", "SC"],
    definition:
      "A paid message on YouTube Live that gets highlighted in chat. Used by viewers to get attention, make requests, or support the streamer financially. On the Cult of Psyche, super chats often come with tarot reading requests or spicy commentary.",
    usage:
      "\"You can tell me to F off — you can do that same thing in Super Chat, though, too.\"",
    category: "streaming",
  },
  {
    word: "Dono",
    aka: ["Donation"],
    definition:
      "Short for donation — money sent to a streamer during a live broadcast. In Psyche's community, donos sometimes grant panel access or priority for tarot readings.",
    usage:
      "\"Every dono flickers like a curse coin in the chat.\"",
    category: "streaming",
  },
  {
    word: "Membership",
    aka: ["Member"],
    definition:
      "A paid monthly subscription to a YouTube channel that grants perks like custom badges, emojis, and in the Cult of Psyche, panel access and visibility in chat.",
    usage:
      "\"My show, my rules, my choice… if you want to be on the panel, you're gonna be a member or you've donated something.\"",
    category: "streaming",
  },
  {
    word: "IRL Stream",
    aka: ["IRL"],
    definition:
      "\"In Real Life\" stream — broadcasting from a phone or camera while out in public rather than at a desk. Psyche has done IRL streams from locations like Redondo Beach Pier.",
    category: "streaming",
  },
  {
    word: "Lurk",
    aka: ["Lurking", "Lurker"],
    definition:
      "Watching a stream or being present in a chat/Discord without actively participating or speaking. Can be neutral (shy viewer) or suspicious (perceived spying).",
    usage:
      "\"I'm not lurking in her Discord. I just got noticed. I was on my show.\"",
    category: "streaming",
  },
  {
    word: "Clout",
    aka: ["Clout Chasing"],
    definition:
      "Influence or fame within the streaming ecosystem. 'Clout chasing' means pursuing association with popular streamers purely to gain visibility and followers.",
    category: "streaming",
  },
  {
    word: "Content",
    definition:
      "In panelverse context, this often refers to drama, confrontations, or entertaining moments rather than traditional video content. 'That's content!' is said when something chaotic or memorable happens live.",
    category: "streaming",
  },

  // ── MODERATION ──────────────────────────────────────────────────
  {
    word: "Mod",
    aka: ["Moderator"],
    definition:
      "A trusted community member given permissions to manage chat — hiding messages, timing out users, and maintaining order. In the panelverse, mods are powerful figures who can shape the stream's atmosphere. Psyche has had complex relationships with mods throughout the show's history.",
    category: "moderation",
  },
  {
    word: "Rogue Mod",
    definition:
      "A moderator who abuses their permissions — hiding innocent users' messages, secretly banning people, or acting against the streamer's wishes. A recurring source of drama in panelverse streams.",
    category: "moderation",
  },
  {
    word: "Gonged",
    definition:
      "Removed from the panel by the host, usually abruptly. Derived from 'The Gong Show' — when you get gonged, you're cut off. In the Cult of Psyche, getting gonged is a dramatic moment where Psyche drops a panelist for crossing a line.",
    usage: "\"Well, you know what else hurts? Being kicked off my panel. Bye.\"",
    origin: "Cult of Psyche — named after the game show 'The Gong Show'",
    category: "moderation",
  },
  {
    word: "Kicked",
    definition:
      "Forcibly removed from a panel or voice chat. Less permanent than a ban — you might get invited back next time.",
    category: "moderation",
  },
  {
    word: "Banned",
    definition:
      "Permanently prohibited from participating in a channel or panel. In the Cult of Psyche, bans are sometimes reversed — there are entire episodes about unbanning people.",
    usage: "\"Sig's banned. He's banned forever. He's not coming back on.\"",
    category: "moderation",
  },
  {
    word: "Muted",
    definition:
      "Having your microphone turned off by the host or a mod, usually to stop someone from talking over others or causing disruption.",
    category: "moderation",
  },
  {
    word: "Nightbot",
    definition:
      "An automated chat bot used for moderation, timed messages, and chat commands. In the panelverse, Nightbot handles automated responses and can be 'hacked' or manipulated by savvy users.",
    category: "moderation",
  },
  {
    word: "Porn Bomb",
    aka: ["Porn Bombed", "Porn Bombing"],
    definition:
      "A trolling attack where someone floods a stream's screen share, chat, or panel with explicit imagery to disrupt the broadcast. A persistent problem in open panel streams that has led to strikes and channel suspensions.",
    usage:
      "\"I've been porn bombed over a hundred times. I've been bombed with other things and that kind of stuff.\"",
    origin: "Panelverse trolling tactic",
    category: "moderation",
  },

  // ── COMMUNITY ───────────────────────────────────────────────────
  {
    word: "Troll",
    aka: ["Trolling"],
    definition:
      "Someone who intentionally disrupts streams for entertainment or attention. In the panelverse, trolling exists on a spectrum from playful banter to genuine harassment. Psyche has a nuanced view, noting that 'some of the so-called trolls actually care.'",
    usage:
      "\"Some of the so-called trolls actually care about that man. He might be frustrated, but I'm sure some of them care.\"",
    category: "community",
  },
  {
    word: "Sock Puppet",
    aka: ["Sock", "Sock Account"],
    definition:
      "A fake or secondary online account created to hide one's identity while participating in streams or chat. Used to circumvent bans, create the illusion of support, or stir drama anonymously. Psyche dedicated a chapter of his 'Trollipedia' to this tactic.",
    usage:
      "\"There's a whole chapter on the sock puppet troll in the Trollipedia.\"",
    category: "community",
  },
  {
    word: "Doxxing",
    aka: ["Doxed", "Dox"],
    definition:
      "Publicly revealing someone's private personal information (real name, address, phone number) without consent. One of the most serious violations in the streaming community and grounds for immediate bans.",
    category: "community",
  },
  {
    word: "Receipts",
    definition:
      "Screenshots, recordings, or other evidence used to prove claims about someone's behavior. 'Pulling receipts' means gathering proof before making accusations.",
    usage: "\"Panel got receipts. We ain't finished yet.\"",
    category: "community",
  },
  {
    word: "Beef",
    definition:
      "An ongoing conflict or feud between two or more community members. Can simmer for weeks or months across multiple streams. 'Squashing beef' means resolving the conflict.",
    category: "community",
  },
  {
    word: "Tea",
    aka: ["Spill the Tea"],
    definition:
      "Gossip, drama, or insider information. 'Spilling the tea' means sharing juicy details about community events or interpersonal conflicts.",
    category: "community",
  },
  {
    word: "Exposed",
    definition:
      "Having one's contradictions, lies, or secret behavior revealed publicly, usually with receipts. A dramatic moment in panelverse streams.",
    usage:
      "\"He was embarrassed. He didn't want everybody to know what he showed. And we really exposed him.\"",
    category: "community",
  },
  {
    word: "Clique",
    definition:
      "An exclusive group within the broader community that gatekeeps social access and can erode others' confidence. Psyche addressed this dynamic directly in 'The Clique Effect is Destroying Your Confidence.'",
    category: "community",
  },
  {
    word: "Salty",
    definition:
      "Being bitter, upset, or resentful, usually about something that happened on stream. Often used to describe someone who lost a debate or got called out.",
    category: "community",
  },
  {
    word: "Pressed",
    definition:
      "Being visibly upset or stressed about something, especially when trying to hide it. 'Why are you so pressed?' is a common retort.",
    category: "community",
  },
  {
    word: "Cringe",
    definition:
      "Something embarrassingly awkward or uncomfortable to watch. Panel moments that make viewers physically recoil.",
    category: "community",
  },
  {
    word: "NPC",
    definition:
      "\"Non-Player Character\" — someone who seems to act on autopilot, repeating popular opinions without original thought. Used to dismiss someone as unthinking or scripted.",
    category: "community",
  },
  {
    word: "Pick Me",
    definition:
      "Someone who performs agreement or submission to gain favor from others, especially the host or dominant panelists. Seen as inauthentic attention-seeking behavior.",
    category: "community",
  },
  {
    word: "White Knight",
    definition:
      "Someone who rushes to defend another person (usually a woman) in hopes of gaining their favor, often without being asked. Can be genuine or performative.",
    category: "community",
  },

  // ── PSYCHEVERSE ─────────────────────────────────────────────────
  {
    word: "Psycheverse",
    definition:
      "The expanded universe of Cult of Psyche — encompassing the show, its community, lore, music, mythology, and the interconnected web of relationships and stories built over 1,300+ episodes.",
    origin: "Cult of Psyche",
    category: "psycheverse",
  },
  {
    word: "Psyche Awakens",
    definition:
      "The full show title and Psyche's broader creative identity. Represents the idea of consciousness expanding through raw, unfiltered conversation and spiritual exploration.",
    usage:
      "\"Welcome to Psyche Awakens, a show in the panelverse where tarot, truth, and raw conversation meet.\"",
    category: "psycheverse",
  },
  {
    word: "Cult Codex",
    aka: ["CultCodex", "The Codex"],
    definition:
      "The comprehensive digital archive cataloging every episode, guest, quote, and piece of lore from the Cult of Psyche. A 'wisdom technology' for navigating the show's vast history.",
    usage:
      "\"This system, this codex is what I call wisdom technology. It's not about manipulation. It's about transformation.\"",
    category: "psycheverse",
  },
  {
    word: "Ziddy",
    aka: ["Ziddies"],
    definition:
      "A term of endearment for loyal community members and viewers. Derived from slang meaning a mix of mildly elevated and highly attractive — someone who is more than a daddy, more than a zaddy.",
    usage:
      "\"Let's raise a glass to another wild season in the Cult of Psyche — cheers, ziddies!\"",
    origin: "Cult of Psyche community",
    category: "psycheverse",
  },
  {
    word: "Cat Daddy",
    definition:
      "Psyche's self-description as a devoted cat owner. His cats (Trix, Lenore/Pie) are co-stars of the show and frequently interrupt readings and panels.",
    usage: "\"Meow meow, the cards tell me…\"",
    category: "psycheverse",
  },
  {
    word: "Trollipedia",
    definition:
      "Psyche's conceptual encyclopedia of troll types, tactics, and psychology. Includes chapters on sock puppets, porn bombers, and other species of disruptor encountered across 1,300+ episodes.",
    usage:
      "\"There's a whole chapter on the sock puppet troll in the Trollipedia.\"",
    category: "psycheverse",
  },
  {
    word: "Haters Club",
    aka: ["Psyche Haters Club"],
    definition:
      "An ironic term for the collective of people who consistently criticize or oppose Psyche. Reclaimed and celebrated in the original song 'Psyche Haters Club.'",
    usage:
      "\"Welcome to the Psyche Haters Club where the jealous gather up begging for attention. Thirsty and stuck.\"",
    category: "psycheverse",
  },
  {
    word: "Stormborn",
    definition:
      "A mythic identity associated with Psyche — someone forged in chaos who can navigate storms and transform adversity into art. Appears in the show's lore and poetry.",
    usage:
      "\"You are the stormborn architect, a mythmaker who exposes illusions, gathers the outcasts, and leads them into a new world.\"",
    category: "psycheverse",
  },
  {
    word: "Neon Priestess",
    definition:
      "A mythic archetype from Psyche's original music and poetry. Represents a figure of power, illumination, and mystery. The subject of a music video dedicated to Alexandra Mayers.",
    category: "psycheverse",
  },
  {
    word: "Mahavidyas",
    definition:
      "The ten Hindu tantric goddesses that Psyche studies and references extensively in his spiritual content. Each represents a different aspect of divine feminine power and cosmic knowledge.",
    category: "psycheverse",
  },
  {
    word: "Angel Shot",
    definition:
      "A safety protocol at bars where ordering an 'angel shot' signals to staff that you need help. Psyche references this as a personal safety practice.",
    usage:
      "\"I do not go to bars, clubs, or anything like that unless they have an angel shot rule.\"",
    category: "psycheverse",
  },

  // ── TAROT & MYSTIC ──────────────────────────────────────────────
  {
    word: "Pull",
    aka: ["Card Pull"],
    definition:
      "Drawing a tarot card from the deck for a reading. 'Let me pull for you' means Psyche is about to do a reading for someone.",
    category: "tarot",
  },
  {
    word: "Spread",
    definition:
      "The layout pattern in which tarot cards are placed during a reading. Different spreads serve different purposes — past/present/future, Celtic Cross, etc.",
    usage:
      "\"When the cat walks through the tarot spread, that's when the real magic happens.\"",
    category: "tarot",
  },
  {
    word: "Deck",
    definition:
      "A set of tarot cards. Psyche uses multiple decks and has discussed creating a custom Cult of Psyche tarot deck featuring community members.",
    usage:
      "\"I think I want to do a run of a hundred decks. A lot of you guys are going to be in it.\"",
    category: "tarot",
  },
  {
    word: "Manifestation",
    definition:
      "The practice of bringing desires into reality through focused intention, visualization, and spiritual alignment. A core concept in Psyche's philosophy and readings.",
    usage:
      "\"I do use the AI as a manifestation tool — to solidify whatever vision I have.\"",
    category: "tarot",
  },
  {
    word: "Energy",
    definition:
      "In the Psycheverse, 'energy' refers to the spiritual or emotional quality someone projects. 'Your energy is off' means something feels wrong. 'Good energy' is the highest compliment.",
    usage: "\"Your vibe attracts your tribe. It says a lot about you.\"",
    category: "tarot",
  },
  {
    word: "Third Eye",
    definition:
      "The spiritual concept of an inner eye that provides perception beyond ordinary sight. Referenced in readings and discussions about intuition and psychic abilities.",
    usage: "\"We try and see with our third eye what kind of picture the guy is holding up.\"",
    category: "tarot",
  },
  {
    word: "As Above, So Below",
    definition:
      "A Hermetic axiom meaning that the microcosm reflects the macrocosm — what happens in the spiritual realm mirrors the physical. One of Psyche's foundational philosophical principles.",
    category: "tarot",
  },
  {
    word: "Awakening",
    aka: ["Spiritual Awakening"],
    definition:
      "A profound shift in consciousness and self-awareness. A central theme of the show — Psyche himself describes suppressing his own awakening with medication.",
    usage: "\"I do not ask for worship. I ask for awakening.\"",
    category: "tarot",
  },

  // ── MUSIC & PERFORMANCE ─────────────────────────────────────────
  {
    word: "Bars",
    definition:
      "Lines in a rap verse. 'Spitting bars' means delivering rap lyrics, especially improvised ones. Panel rap battles are a recurring feature of the show.",
    usage:
      "\"Two shadows, same pulse, one cage with velvet bars. Freedom costs less when you don't know who you are.\"",
    category: "music",
  },
  {
    word: "Freestyle",
    definition:
      "Improvised rap performed live without preparation. Panel freestyle battles are legendary moments in Cult of Psyche history, sometimes escalating from playful to intense.",
    category: "music",
  },
  {
    word: "Rap Battle",
    definition:
      "A competitive exchange of freestyle rap verses between two or more panelists. A beloved tradition in the community that has produced some of the show's most memorable moments.",
    category: "music",
  },
  {
    word: "Roast",
    aka: ["Roasted"],
    definition:
      "Aggressively making fun of someone, usually in a humorous way. Panel roast sessions can be affectionate or genuinely cutting. 'Getting roasted' means being the target of collective mockery.",
    category: "music",
  },

  // ── SLANG ───────────────────────────────────────────────────────
  {
    word: "Based",
    definition:
      "Being unapologetically yourself regardless of others' opinions. In the panelverse, calling someone 'based' is a compliment meaning they speak truth without caring about backlash.",
    category: "slang",
  },
  {
    word: "Cope",
    aka: ["Coping", "Copium"],
    definition:
      "Rationalizing or making excuses for a loss or embarrassment. 'That's pure cope' means someone is in denial about reality.",
    category: "slang",
  },
  {
    word: "Vibe",
    aka: ["Vibes"],
    definition:
      "The overall feeling or atmosphere of a stream, person, or situation. 'The vibes are immaculate' means everything feels great. 'The vibe is off' means something's wrong.",
    usage:
      "\"Panel full of chaos, but the vibes transcending.\"",
    category: "slang",
  },
  {
    word: "Simp",
    aka: ["Simping"],
    definition:
      "Doing too much to win someone's affection or attention, often at the expense of dignity. In the panelverse, simping can mean excessively donating or white-knighting for a streamer.",
    category: "slang",
  },
  {
    word: "Karen",
    definition:
      "Someone who is entitled, demands to speak to the manager, and creates drama over minor issues. Used in the panelverse to describe overbearing panel guests who try to control the show.",
    category: "slang",
  },
  {
    word: "Normie",
    definition:
      "Someone unfamiliar with panelverse culture, internet subcultures, or the specific dynamics of open panel streaming. Not necessarily negative — just uninitiated.",
    category: "slang",
  },
  {
    word: "Thirsty",
    definition:
      "Desperately seeking attention, validation, or romantic interest. In the panelverse, being thirsty means doing whatever it takes to stay on panel or get noticed.",
    usage:
      "\"Welcome to the Psyche Haters Club where the jealous gather up begging for attention. Thirsty and stuck.\"",
    category: "slang",
  },

  // ── NEW ENTRIES (mined from transcripts) ────────────────────────

  // ── PSYCHEVERSE ─────────────────────────────────────────────────
  {
    word: "Transmission",
    definition:
      "The Cult of Psyche term for an episode or livestream broadcast. Frames each stream as a signal beamed out from the Psycheverse rather than mere 'content.' The Codex catalogs over 1,300 transmissions.",
    usage: "\"The portal is open, no place to hide. There's no other show that can shake you.\"",
    origin: "Cult of Psyche",
    category: "psycheverse",
  },
  {
    word: "The Void",
    definition:
      "The liminal space between streams, between thoughts, between identities. In the Psycheverse, the void is not emptiness but fertile darkness — where new ideas, characters, and lore are born. Psyche has described creating things 'from the void.'",
    usage: "\"I created my daughters from the void in the light.\"",
    category: "psycheverse",
  },
  {
    word: "Spiritual Technology",
    aka: ["Wisdom Technology"],
    definition:
      "Psyche's framework for understanding tarot, ritual, mythology, and even AI as functional tools for transformation rather than mere superstition. The Codex itself is described as 'wisdom technology.'",
    usage: "\"This system, this codex is what I call wisdom technology. It's not about manipulation. It's about transformation.\"",
    origin: "Cult of Psyche — Psyche's philosophical framework",
    category: "psycheverse",
  },
  {
    word: "The Crypt",
    definition:
      "A metaphor for the darkest psychological spaces a person has survived — addiction, abuse, spiritual crisis. To 'survive the crypt' means to have walked through hell and returned with hard-won wisdom.",
    usage: "\"He survived the crypt. The narcissist charm. The psychopath's grin. The false alarm.\"",
    category: "psycheverse",
  },
  {
    word: "Traveling Sorcerer",
    definition:
      "Psyche's metaphor for the modern internet user who moves between platforms and communities like a wandering magician — carrying spells (skills), encountering monsters (trolls), and seeking treasure (connection).",
    usage: "\"The internet as a fairy tale — why you're a 'traveling sorcerer.'\"",
    origin: "Cult of Psyche — episode title and recurring metaphor",
    category: "psycheverse",
  },
  {
    word: "Smear Architecture",
    definition:
      "Psyche's term for the deliberate, structural campaign of lies and distortions built against someone online. Not just gossip — an architecture, engineered to destroy reputation systematically.",
    origin: "Cult of Psyche — episode 'Smear Architecture 2.0'",
    category: "psycheverse",
  },
  {
    word: "The 9 Seals",
    aka: ["9 Seals of Psyche"],
    definition:
      "An astrological framework Psyche developed mapping nine key aspects of his natal chart to nine archetypal qualities. Each 'seal' represents a facet of his cosmic identity.",
    origin: "Cult of Psyche — 'The 9 Seals of Psyche: Astrological Analysis'",
    category: "psycheverse",
  },
  {
    word: "Midnight Madness",
    definition:
      "Late-night streams that start after midnight, known for their unhinged energy, raw confessions, and the kind of conversations that only happen when the normal world is asleep. A recurring series format.",
    origin: "Cult of Psyche — recurring stream series",
    category: "psycheverse",
  },
  {
    word: "Wacky Wednesday",
    aka: ["Thirsty Tuesday", "Freaky Friday"],
    definition:
      "Themed weekday streams on the Cult of Psyche. Each day has its own personality: Thirsty Tuesday (chaotic energy), Wacky Wednesday (anything goes), Freaky Friday (spooky/wild vibes). All feature open panels, tarot, and cats.",
    origin: "Cult of Psyche — recurring stream schedule",
    category: "psycheverse",
  },
  {
    word: "Psyche's Angels",
    definition:
      "The channel membership tier on the Cult of Psyche. Members get custom badges, panel access priority, and visibility in chat. A riff on 'Charlie's Angels' — loyal supporters with inner-circle status.",
    origin: "Cult of Psyche YouTube membership",
    category: "psycheverse",
  },
  {
    word: "The Psychenomicon",
    definition:
      "The forbidden chronicle of the Cult of Psyche — a living grimoire documenting every soul, saga, and spectacle from over 1,300 transmissions. Part mythology, part encyclopedia, part love letter to the community.",
    origin: "Cult Codex — subscriber-exclusive content",
    category: "psycheverse",
  },
  {
    word: "Digital Resurrection",
    definition:
      "The act of reviving a canceled show, banned account, or forgotten community figure through sheer willpower and audience support. Psyche has done this multiple times across platform strikes and channel suspensions.",
    usage: "\"The cult of two becomes the many. Digital resurrection. Mystic alchemy.\"",
    category: "psycheverse",
  },
  // ── PANELVERSE ──────────────────────────────────────────────────
  {
    word: "Panel God",
    definition:
      "A streamer who has mastered the art of running open panels — managing chaos, moderating egos, and turning raw conversation into entertainment. Used both sincerely and sarcastically.",
    category: "panelverse",
  },
  {
    word: "Crossover Episode",
    definition:
      "When communities from different panel channels collide in a single stream — either through raids, guest appearances, or deliberate collaborations. Can produce legendary content or spectacular drama.",
    category: "panelverse",
  },
  {
    word: "Lore Drop",
    definition:
      "When a panelist accidentally or intentionally reveals significant backstory, personal history, or community secrets during a stream. The chat erupts. Receipts are screenshotted. The timeline shifts.",
    category: "panelverse",
  },
  {
    word: "Arc",
    aka: ["Character Arc", "Redemption Arc", "Villain Arc"],
    definition:
      "A narrative framework applied to real community members. Someone might be on their 'redemption arc' (reforming after drama), 'villain arc' (going rogue), or 'fumble arc' (making increasingly bad decisions). The panelverse treats life like a serialized show.",
    category: "panelverse",
  },
  {
    word: "Era",
    definition:
      "A defined period in a streamer's or community member's journey, marked by a shift in behavior, aesthetic, or allegiance. 'That was her toxic era' or 'He's in his healing era.' Borrowed from music fandom culture.",
    category: "panelverse",
  },
  {
    word: "The Algorithm",
    definition:
      "YouTube's recommendation system, spoken of like a capricious deity that giveth and taketh away. Streamers appease, curse, and strategize around the algorithm as if performing rituals to an unknowable god.",
    usage: "\"Under the algorithm truth.\"",
    category: "panelverse",
  },

  // ── STREAMING ───────────────────────────────────────────────────
  {
    word: "Shadowban",
    aka: ["Shadow Ban", "Shadowbanned"],
    definition:
      "When a platform silently reduces someone's visibility without notifying them — their content stops appearing in recommendations and search. The streamer's worst nightmare: shouting into a void that used to echo back.",
    category: "streaming",
  },
  {
    word: "Strike",
    definition:
      "A formal penalty from YouTube for violating community guidelines. Three strikes and the channel is terminated. Psyche has weathered multiple strikes, often from porn bombing attacks or false reports.",
    category: "streaming",
  },
  {
    word: "Demonetized",
    aka: ["Demonetization"],
    definition:
      "When YouTube removes a video's ability to earn ad revenue, usually for 'sensitive content.' In the panelverse, getting demonetized is almost a badge of honor — it means the conversation got too real.",
    category: "streaming",
  },
  {
    word: "Stream Snipe",
    aka: ["Stream Sniping"],
    definition:
      "Joining someone's panel or game with advance knowledge from watching their stream, giving an unfair advantage or enabling targeted trolling. The digital equivalent of reading someone's cards.",
    category: "streaming",
  },
  {
    word: "Whale",
    definition:
      "A viewer who donates extremely large amounts of money to a streamer. In the panelverse, whales can shift the entire dynamic of a stream — their super chats get read, their requests get fulfilled, their presence is acknowledged.",
    category: "streaming",
  },

  // ── MODERATION ──────────────────────────────────────────────────
  {
    word: "Troll Tribunal",
    definition:
      "A recurring Cult of Psyche series format where trolls are put 'on trial' — their behavior is examined, debated, and judged by the panel. Part comedy court, part group therapy, part content creation engine.",
    origin: "Cult of Psyche — recurring series",
    category: "moderation",
  },
  {
    word: "Caught in 4K",
    definition:
      "Undeniable evidence of someone's behavior, captured in high definition. When someone is 'caught in 4K,' there's no denying what they did — the receipts are crystal clear.",
    category: "moderation",
  },

  // ── TAROT & MYSTIC ──────────────────────────────────────────────
  {
    word: "Shadow Work",
    definition:
      "The Jungian practice of confronting repressed parts of yourself — the things you hide, deny, or project onto others. A central theme in Psyche's readings and philosophy. The panels themselves often become involuntary shadow work sessions.",
    category: "tarot",
  },
  {
    word: "Twin Flame",
    definition:
      "A spiritual concept describing an intense soul connection — your mirror, your other half. In the panelverse, the term is both sacred and memed: genuine seekers ask about twin flames in readings, while skeptics roast the concept mercilessly.",
    category: "tarot",
  },
  {
    word: "Divine Feminine",
    aka: ["Divine Masculine"],
    definition:
      "Archetypal energies representing receptive/intuitive power (feminine) and active/protective power (masculine). Psyche explores these through tarot, Hindu goddesses (the Mahavidyas), and Jungian anima/animus theory.",
    usage: "\"Coming in union with your inner self — the divine masculine and divine feminine coming in union with yourself.\"",
    category: "tarot",
  },
  {
    word: "Karmic",
    aka: ["Karmic Cycle", "Karmic Lesson"],
    definition:
      "Relating to the cosmic law of cause and effect. In the Psycheverse, 'karmic' describes relationships, debts, or patterns that repeat until the lesson is learned. A karmic relationship is one you were fated to have — and fated to outgrow.",
    usage: "\"Whatever you do to people, you have to experience how they feel yourself.\"",
    category: "tarot",
  },
  {
    word: "Portal",
    definition:
      "A moment of spiritual opening — a full moon, a solstice, an 11/11 date, or simply a stream where the energy shifts and something beyond normal conversation occurs. Psyche's show is itself described as a portal.",
    usage: "\"The portal is open, no place to hide.\"",
    category: "tarot",
  },
  {
    word: "Cord Cutting",
    definition:
      "A spiritual practice of energetically severing unhealthy attachments to people, habits, or situations. Referenced in readings when someone needs to break free from a toxic connection that lingers in the psyche.",
    category: "tarot",
  },
  {
    word: "Mercury Retrograde",
    aka: ["Retrograde"],
    definition:
      "When the planet Mercury appears to move backward in the sky, traditionally blamed for communication breakdowns, tech failures, and exes texting. In the Psycheverse, retrograde is invoked to explain why the panel is extra chaotic.",
    category: "tarot",
  },
  {
    word: "Dark Night of the Soul",
    definition:
      "A period of profound spiritual crisis and despair that precedes transformation. Borrowed from St. John of the Cross, used extensively in readings. Psyche's own story embodies this — suppressing an awakening with medication, surviving, and emerging.",
    usage: "\"After every dark night, there's a rainbow. You can't go any lower. Then it's all uphill from there.\"",
    category: "tarot",
  },

  // ── COMMUNITY ───────────────────────────────────────────────────
  {
    word: "Trauma Bond",
    aka: ["Trauma Bonding"],
    definition:
      "An attachment formed through shared intense, often negative experiences. In the Psycheverse, this describes both toxic relationships discussed in readings and the deep connection forged between panelists who've weathered chaos together.",
    usage: "\"Continued communication prolongs the trauma bonding. It gives the abuser opportunities to manipulate.\"",
    category: "community",
  },
  {
    word: "Narcissist",
    aka: ["Narc"],
    definition:
      "One of the most-discussed personality types in the Psycheverse. Used clinically (NPD) and colloquially to describe manipulative, self-centered behavior. Psyche has dedicated entire episodes to narcissistic abuse patterns, supply, and recovery.",
    usage: "\"This is basically epidemic narcissism. They think they're gods and everyone else is an animal.\"",
    category: "community",
  },
  {
    word: "Empath",
    definition:
      "Someone who absorbs the emotions and energy of others — the perceived opposite of a narcissist. In the Psycheverse, empaths are both celebrated and cautioned: their sensitivity is a gift that can be exploited.",
    usage: "\"Someone or something keeps knocking on your psychic door. The dead adore your empathy.\"",
    category: "community",
  },
  {
    word: "Flying Monkey",
    definition:
      "A person manipulated by a narcissist into doing their bidding — harassing, spying on, or smearing the narcissist's target. Named after the Wicked Witch's servants in The Wizard of Oz. Discussed in abuse recovery segments.",
    category: "community",
  },
  {
    word: "Grey Rock",
    aka: ["Gray Rock", "Grey Rocking"],
    definition:
      "A defense strategy against narcissists: becoming as boring and unreactive as a grey rock so they lose interest. Give them nothing to feed on. Discussed in Psyche's segments on surviving toxic relationships.",
    category: "community",
  },
  {
    word: "No Contact",
    aka: ["NC"],
    definition:
      "The strategy of completely ceasing all communication with a toxic person. Described as 'the number one strategy recommended for dealing with psychopaths and narcissists.' A frequent topic in readings and advice segments.",
    usage: "\"No contact. Zero. Nothing. That's how you get your power back.\"",
    category: "community",
  },
  {
    word: "Love Bombing",
    definition:
      "An manipulation tactic where someone overwhelms you with affection, attention, and gifts early in a relationship to create dependency. Once you're hooked, the affection is withdrawn. Discussed extensively in abuse awareness episodes.",
    category: "community",
  },
  {
    word: "Parasocial",
    definition:
      "A one-sided emotional relationship where a viewer feels intimately connected to a streamer who doesn't know them. In the panelverse, the line between parasocial and genuine connection is perpetually blurry — especially when chat talks back.",
    category: "community",
  },
  {
    word: "Gaslighting",
    definition:
      "Manipulating someone into questioning their own reality, memories, or sanity. A term from the 1944 film 'Gaslight,' now a core concept in the Psycheverse's vocabulary for describing abusive dynamics on and off stream.",
    category: "community",
  },

  // ── SLANG ───────────────────────────────────────────────────────
  {
    word: "Ratio",
    definition:
      "When a reply gets more engagement than the original post or statement, indicating the community disagrees with the original. In live panels, getting 'ratioed' means the chat is siding against you. A public execution by democracy.",
    category: "slang",
  },
  {
    word: "Cooked",
    definition:
      "Utterly destroyed in an argument, debate, or roast. When someone is 'cooked,' there's no coming back — the panel has collectively decided they've lost. Can also mean someone has gone too far and ruined their reputation.",
    category: "slang",
  },
  {
    word: "Unhinged",
    definition:
      "Behaving in a wildly unpredictable, chaotic, or boundary-less way. In the Psycheverse, 'unhinged' is used affectionately as often as critically — some of the best content comes from unhinged energy.",
    category: "slang",
  },
  {
    word: "Delulu",
    aka: ["Delusional"],
    definition:
      "Short for delusional — believing something that's clearly not true, especially about relationships or one's own importance. 'Delulu is the solulu' (delusion is the solution) is the ironic motto of those who refuse to accept reality.",
    category: "slang",
  },
  {
    word: "Rent Free",
    definition:
      "When someone or something occupies your thoughts constantly without paying for the privilege. 'Living rent free in your head' means you can't stop thinking about them — an admission of obsession disguised as an accusation.",
    category: "slang",
  },
  {
    word: "Ate That",
    aka: ["Ate", "Slayed"],
    definition:
      "Performed something excellently. 'She ate that freestyle' means she killed it. 'Ate and left no crumbs' means the performance was so complete there's nothing left to critique. High praise in panel culture.",
    category: "slang",
  },
  {
    word: "Ick",
    aka: ["The Ick"],
    definition:
      "A sudden, visceral feeling of repulsion toward someone you were previously attracted to, triggered by something small and specific. 'He gave me the ick when he clapped when the plane landed.' Discussed frequently in dating panels.",
    category: "slang",
  },
  {
    word: "Main Character",
    aka: ["Main Character Energy", "MC Energy"],
    definition:
      "Behaving as though the world revolves around you and everyone else is a supporting character in your story. Can be empowering ('main character energy') or delusional ('they think they're the main character').",
    category: "slang",
  },
  {
    word: "Chaos Magick",
    definition:
      "A postmodern occult practice that treats belief itself as a tool — use whatever symbols, rituals, or systems work for you, discard the rest. Psyche's approach to spirituality borrows heavily from this tradition: tarot, Hindu deities, Jungian psychology, and AI all in one cauldron.",
    category: "tarot",
  },
  {
    word: "Energy Vampire",
    aka: ["3D Energy Vampire"],
    definition:
      "A person who drains your emotional and spiritual energy through constant negativity, neediness, or drama. In the Psycheverse, energy vampires are a recognized species — discussed in readings and identified in real-time on panels.",
    category: "community",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function LexiconPage() {
  // Group by category
  const grouped = new Map<Category, Term[]>();
  for (const term of LEXICON) {
    if (!grouped.has(term.category)) grouped.set(term.category, []);
    grouped.get(term.category)!.push(term);
  }

  // Sort terms within each category
  for (const terms of grouped.values()) {
    terms.sort((a, b) => a.word.localeCompare(b.word));
  }

  // Build full alphabetical index
  const allTermsSorted = [...LEXICON].sort((a, b) =>
    a.word.localeCompare(b.word)
  );
  const letterIndex = new Map<string, Term[]>();
  for (const term of allTermsSorted) {
    const letter = term.word[0].toUpperCase();
    if (!letterIndex.has(letter)) letterIndex.set(letter, []);
    letterIndex.get(letter)!.push(term);
  }
  const letters = [...letterIndex.keys()].sort();

  // Category render order
  const order: Category[] = [
    "psycheverse",
    "panelverse",
    "tarot",
    "streaming",
    "moderation",
    "community",
    "music",
    "slang",
  ];

  // Group categories by color family for the legend
  const colorGroups = [
    { color: "text-accent-gold", dot: "bg-accent-gold", label: "Show & Panel", categories: ["psycheverse", "panelverse"] },
    { color: "text-accent-cyan", dot: "bg-accent-cyan", label: "Platform & Moderation", categories: ["streaming", "moderation"] },
    { color: "text-accent-violet", dot: "bg-accent-violet", label: "Spiritual & Mystic", categories: ["tarot"] },
    { color: "text-red-400", dot: "bg-red-400", label: "Social & Slang", categories: ["community", "slang"] },
    { color: "text-pink-400", dot: "bg-pink-400", label: "Music & Performance", categories: ["music"] },
  ];

  return (
    <>
      <PageHero
        title="PANELVERSE LEXICON"
        subtitle={`${LEXICON.length} terms from the Cult of Psyche and the wider Panelverse`}
        backgroundImage="/wiki-page-header.jpg"
      />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 space-y-8">

        {/* Color legend */}
        <div className="rounded-lg border border-border bg-surface p-4">
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-text-muted mb-3">Color Key</h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {colorGroups.map((g) => (
              <span key={g.label} className="flex items-center gap-2 text-xs">
                <span className={`w-2.5 h-2.5 rounded-full ${g.dot} shrink-0`} />
                <span className={`font-medium ${g.color}`}>{g.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Alphabet jump bar */}
        <nav className="flex flex-wrap gap-1 font-mono text-xs" aria-label="Jump to letter">
          {letters.map((letter) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="w-7 h-7 flex items-center justify-center rounded border border-white/10 text-text-muted hover:text-accent-gold hover:border-accent-gold/40 transition-colors"
            >
              {letter}
            </a>
          ))}
          <span className="border-l border-border mx-2" />
          {order.map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <a
                key={cat}
                href={`#cat-${cat}`}
                className={`px-2 h-7 flex items-center rounded border border-white/10 hover:border-white/30 transition ${meta.color}`}
                title={meta.label}
              >
                {meta.label}
              </a>
            );
          })}
        </nav>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  ALPHABETICAL INDEX                                        */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <SectionCard title="A–Z Index">
          <p className="text-xs text-text-muted mb-5">
            Every term alphabetically. Color indicates category.
          </p>
          <div className="space-y-6">
            {letters.map((letter) => {
              const terms = letterIndex.get(letter)!;
              return (
                <div key={letter} id={`letter-${letter}`}>
                  <h3 className="font-display text-lg font-bold text-accent-gold border-b border-accent-gold/20 pb-1 mb-3">
                    {letter}
                  </h3>
                  <dl className="space-y-4">
                    {terms.map((term) => {
                      const meta = CATEGORY_META[term.category];
                      return (
                        <div
                          key={term.word}
                          className={`border-l-2 ${meta.borderColor} pl-4 transition-colors`}
                        >
                          <dt className="flex items-start gap-2">
                            <span className={`w-2 h-2 rounded-full ${meta.dotColor} mt-1.5 shrink-0`} />
                            <span>
                              <span className={`font-bold text-sm ${meta.color}`}>{term.word}</span>
                              {term.aka && term.aka.length > 0 && (
                                <span className="text-text-muted font-normal text-xs ml-2">
                                  aka {term.aka.join(", ")}
                                </span>
                              )}
                              <span className={`ml-2 text-[10px] font-mono uppercase tracking-wider ${meta.color} opacity-60`}>
                                {meta.label}
                              </span>
                            </span>
                          </dt>
                          <dd className="text-sm text-text-primary leading-relaxed mt-1 ml-4">
                            {term.definition}
                          </dd>
                          {term.usage && (
                            <dd className="text-xs text-text-muted mt-1 ml-4 italic font-serif border-l border-white/10 pl-3">
                              {term.usage}
                            </dd>
                          )}
                          {term.origin && (
                            <dd className="text-[10px] text-text-muted mt-1 ml-4 font-mono opacity-60">
                              Origin: {term.origin}
                            </dd>
                          )}
                        </div>
                      );
                    })}
                  </dl>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* ═══════════════════════════════════════════════════════════ */}
        {/*  BY CATEGORY                                               */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <div className="pt-4">
          <h2 className="font-display text-xl font-bold text-text-primary mb-6 text-center">
            Browse by Category
          </h2>
        </div>

        {order.map((cat) => {
          const meta = CATEGORY_META[cat];
          const terms = grouped.get(cat);
          if (!terms?.length) return null;

          return (
            <div id={`cat-${cat}`}>
            <SectionCard key={cat} title={meta.label}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-3 h-3 rounded-full ${meta.dotColor}`} />
                <p className="text-xs text-text-muted italic">
                  {meta.description}
                </p>
                <span className={`ml-auto text-xs font-mono ${meta.color} opacity-60`}>
                  {terms.length} terms
                </span>
              </div>
              <dl className="space-y-4">
                {terms.map((term) => (
                  <div
                    key={term.word}
                    className={`border-l-2 ${meta.borderColor} pl-4 transition-colors`}
                  >
                    <dt className="font-bold text-sm">
                      <span className={meta.color}>{term.word}</span>
                      {term.aka && term.aka.length > 0 && (
                        <span className="text-text-muted font-normal text-xs ml-2">
                          aka {term.aka.join(", ")}
                        </span>
                      )}
                    </dt>
                    <dd className="text-sm text-text-primary leading-relaxed mt-1">
                      {term.definition}
                    </dd>
                    {term.usage && (
                      <dd className="text-xs text-text-muted mt-1 italic font-serif border-l border-white/10 pl-3">
                        {term.usage}
                      </dd>
                    )}
                    {term.origin && (
                      <dd className="text-[10px] text-text-muted mt-1 font-mono opacity-60">
                        Origin: {term.origin}
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
            </SectionCard>
            </div>
          );
        })}

        <SectionCard title="About This Lexicon">
          <div className="text-sm text-text-muted leading-relaxed space-y-3">
            <p>
              This lexicon was compiled from analysis of 3,374 quotes, 1,327
              episode summaries, and 497 community member profiles in the Cult
              Codex archive. Definitions are derived from contextual usage within
              the show, supplemented by community knowledge and Urban Dictionary
              where applicable.
            </p>
            <div className="rounded border border-border bg-void p-3 space-y-2">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Reading the colors</h3>
              <div className="grid gap-1.5 text-xs">
                {colorGroups.map((g) => (
                  <div key={g.label} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${g.dot} shrink-0`} />
                    <span className={`font-medium ${g.color} w-40`}>{g.label}</span>
                    <span className="text-text-muted">
                      {g.categories.map((c) => CATEGORY_META[c as Category].label).join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p>
              The Panelverse is a living, evolving ecosystem. New terms emerge as
              the community grows. If you know a term that should be here,
              suggest a correction.
            </p>
          </div>
        </SectionCard>
      </main>
    </>
  );
}
