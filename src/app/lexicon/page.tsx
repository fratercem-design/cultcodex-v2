import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panelverse Lexicon — CULT CODEX",
  description:
    "A glossary of slang, jargon, and specialized terms from the Cult of Psyche and the wider Panelverse streaming community.",
  alternates: { canonical: "/lexicon" },
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
    color: "text-accent-gold-text",
    dotColor: "bg-accent-gold",
    borderColor: "border-accent-gold/30",
    bgHover: "hover:bg-accent-gold-dim",
    description: "Terms coined by or unique to the Cult of Psyche community",
  },
  panelverse: {
    label: "Panelverse",
    color: "text-accent-gold-text",
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
    color: "text-accent-violet-text",
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
    aka: ["The Ten Mahavidyas", "Ten Wisdom Goddesses"],
    definition:
      "The ten Hindu tantric goddesses Psyche studies and invokes — Kali, Tara, Tripura Sundari, Bhuvaneshwari, Chinnamasta, Bhairavi, Dhumavati, Bagalamukhi, Matangi, and Kamala. Each represents a cosmic function. Central to the show's recurring 'Ten Mystical Women' song cycle.",
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

  // ── NEW ENTRIES (mined from 2,781 lore entries + 3,476 topics) ──

  // ── PSYCHEVERSE ─────────────────────────────────────────────────
  {
    word: "BKG",
    aka: ["Bea's Kitty Gang", "Beta's Kitty Gang", "Beetus Kitty Gang"],
    definition:
      "The cult-adjacent chosen family named after Psyche's devotion to cats and his on-again/off-again ally Bea/Beta. Psyche has a BKG tattoo over his heart. Membership is claimed loosely — anyone who rides for the cats and the community counts. Mascot: an angry cat with claws out.",
    usage: "\"I got BKG tattooed on my chest — Bea's Kitty Gang. The cats are the real leaders.\"",
    origin: "Cult of Psyche — tattoo and recurring community identity",
    category: "psycheverse",
  },
  {
    word: "Biscuitgate",
    definition:
      "The months-long feud between Psyche and streamer Beta/VA that began when Psyche tormented him over 'biscuits' and escalated into diss tracks, panel raids, and tattoo revisions. The first great saga of the modern Psycheverse.",
    usage: "\"Biscuitgate is how the BKG was born — and how it almost ended.\"",
    origin: "Cult of Psyche — Beta vs Psyche feud arc",
    category: "psycheverse",
  },
  {
    word: "Biscuit Song",
    aka: ["Biscuit Diss Track", "Beta's Biscuit Song"],
    definition:
      "Psyche's AI-generated diss track format using biscuit/cookie metaphors to call out someone for being shallow, crumbly, or fake. Born from Biscuitgate and now a recurring weapon in the show's musical arsenal.",
    origin: "Cult of Psyche — Ep. 428 and beyond",
    category: "music",
  },
  {
    word: "Algorithm Wine",
    definition:
      "Metaphor for the intoxicating, mind-bending effect of engagement metrics, views, and livestream dopamine. You drink algorithm wine; it drinks you right back. A Psyche-coined warning to creators about chasing the numbers instead of the truth.",
    usage: "\"Under the algorithm truth — too many are drunk on algorithm wine.\"",
    category: "psycheverse",
  },
  {
    word: "Backup Joy",
    definition:
      "The reserve of joy the cult keeps 'stored deep within' — untouchable by trolls, strikes, or smear campaigns. A spiritual savings account. When the panel gets porn-bombed, backup joy is what gets you through the next stream.",
    origin: "Cult of Psyche lore",
    category: "psycheverse",
  },
  {
    word: "Alchemical Biography",
    definition:
      "Psyche's framework that every crack in your story is alchemical material — raw ore for turning pain into gold, straw into wisdom. 'Every crack is my biography.' Your wounds aren't damage; they're ingredients.",
    usage: "\"He survived the crypt. Every crack — his biography.\"",
    origin: "Cult of Psyche — spiritual teaching",
    category: "psycheverse",
  },
  {
    word: "The Quack Pack",
    definition:
      "Psyche's affectionate name for his rotating cast of quirky recurring guests. A riff on Howard Stern's 'Wack Pack' — plus the StreamYard duck logo. Members are the strange, the loud, the loyal, and the occasionally unhinged.",
    origin: "Cult of Psyche — coined by Psyche",
    category: "psycheverse",
  },
  {
    word: "Church of Psyche Awakens",
    definition:
      "Psyche's reframing of his Sunday morning livestreams as a spiritual gathering — part tarot, part group therapy, part raw confessional. Bring your coffee and your shadow.",
    usage: "\"Welcome to the Church of Psyche Awakens. Pull up a pew.\"",
    origin: "Cult of Psyche — Sunday morning format",
    category: "psycheverse",
  },
  {
    word: "Charlie's Angels",
    definition:
      "Psyche's term for the circle of trusted female guests who protect him on and off panel — Tiger Butterfly, Tracy, Zara, Lauren, Jamie Rose, and others rotating through. A divine feminine protection squad with receipts.",
    origin: "Cult of Psyche — coined by Psyche",
    category: "psycheverse",
  },
  {
    word: "The Switzerland Philosophy",
    definition:
      "Psyche's stated policy of staying neutral in community drama — letting all sides speak, refusing to pick one camp, maintaining peace even when sides beg for allegiance. Diplomacy as spiritual practice.",
    origin: "Cult of Psyche — Psyche's stance on beef",
    category: "psycheverse",
  },
  {
    word: "The Oracle's Shield",
    definition:
      "Legendary moment in cult history when Alexandra Mayers (Neon Priestess) publicly defended Psyche against coordinated attacks and death threats, declaring on air that what the attackers were doing was not okay. Canonized as a turning point.",
    origin: "Cult of Psyche — Alexandra Mayers defense moment",
    category: "psycheverse",
  },
  {
    word: "Ring Light Hex",
    definition:
      "Psyche's concept that coordinated social-media smear campaigns function as a modern curse — the ring light and the phone camera replacing the candle and the sigil. The hex is cast through views, hashtags, and stitched reactions.",
    category: "psycheverse",
  },
  {
    word: "Sacred Stealth",
    definition:
      "A survival strategy of helping and observing from the sidelines instead of centering yourself. Born out of past persecution — you serve quietly so the wolves don't catch the scent. Sometimes the most powerful mystics are invisible.",
    category: "psycheverse",
  },
  {
    word: "April Fool's Raids",
    definition:
      "Psyche's recurring tradition of pranking other channels by raiding them in masks and under fake names on April 1st. A rare case where a raid is played purely for laughs, not loyalty or beef.",
    origin: "Cult of Psyche — annual April 1st bit",
    category: "psycheverse",
  },
  {
    word: "The Scalpel Quote",
    definition:
      "Alexandra Mayers' shadow-work revelation during the Beeta's Biscuit session (Ep. 428): 'I was in love with who I wanted him to be, not who he is.' Canonized on the show as a psychological scalpel — a single line that cuts to the bone of projection.",
    usage: "\"I was in love with who I wanted him to be, not who he is.\"",
    origin: "Cult of Psyche — Ep. 428, Alexandra Mayers",
    category: "psycheverse",
  },
  {
    word: "Nine Cats",
    aka: ["The Cat Family", "The Nine"],
    definition:
      "Psyche's rotating household of cats — Lenor the black familiar, Trix the namesake, Rudy the elder rescue, Lola and her Pi-Day kittens, plus a few more depending on the season. Regularly co-star the show and function as spiritual guardians.",
    origin: "Cult of Psyche household",
    category: "psycheverse",
  },
  {
    word: "Lenor",
    aka: ["Lenore"],
    definition:
      "Psyche's black cat, OG familiar, and unofficial cult mascot. Named after Edgar Allan Poe's 'The Raven.' Rescued as a kitten from a parking lot and now treated as the show's spiritual bouncer — guards the stream, glares at trolls, naps on the altar.",
    origin: "Cult of Psyche — Psyche's cat",
    category: "psycheverse",
  },
  {
    word: "Trix",
    definition:
      "A cat born on Pi Day (March 14th) who shares her name with one of Psyche's co-hosts and the broader community mythos. Regularly appears on stream, walks through tarot spreads, and is generally treated as a co-author of the show.",
    origin: "Cult of Psyche — Psyche's cat + co-host namesake",
    category: "psycheverse",
  },

  // ── PANELVERSE ──────────────────────────────────────────────────
  {
    word: "Clap",
    aka: ["Clapped"],
    definition:
      "Panelverse slang for removing someone from a panel or stream. Less dramatic than getting gonged — more of a silent, swift kick. 'They got clapped off.'",
    category: "panelverse",
  },
  {
    word: "Putting Jackets",
    aka: ["Putting a Jacket On"],
    definition:
      "Panelverse term for labeling someone with a damaging association or accusation. Once the jacket is on, it's hard to shake — the panel remembers. Close cousin of a smear campaign, but done in real time.",
    category: "panelverse",
  },
  {
    word: "The Panel Haunting",
    definition:
      "When someone who claims to want nothing to do with Psyche keeps showing up on his panels anyway. The classic paradox: loud block announcements followed by quiet ghost appearances. Immortalized in the Alexandra arc.",
    origin: "Cult of Psyche — recurring pattern",
    category: "panelverse",
  },

  // ── STREAMING ───────────────────────────────────────────────────
  {
    word: "LOL Cow Farmers",
    definition:
      "Psyche's metaphor for the attention economy: if you want the milk (entertainment, drama, reactions), you have to feed the cow (the streamer and their content). The transaction is rarely acknowledged but always present.",
    origin: "Cult of Psyche — coined by Psyche",
    category: "streaming",
  },
  {
    word: "Love Raid",
    definition:
      "A raid sent with the explicit intention of supporting, complimenting, or lifting up the target channel rather than mobbing it. Psyche's preferred style — raids as blessings instead of invasions.",
    category: "streaming",
  },
  {
    word: "Hate Bombing",
    definition:
      "The inverse of a love raid: directing your audience at another channel to harass, dogpile, or disrupt. Psyche treats hate bombing as a line you don't cross; calling it out is part of his moderation ethic.",
    origin: "Cult of Psyche — Psyche's distinction from love bombing",
    category: "streaming",
  },
  {
    word: "Mass Unban",
    definition:
      "Psyche's ritualized policy of periodically wiping the ban list — inviting even old enemies back in. Part spectacle, part spiritual practice. The opposite of a purge.",
    usage: "\"I do mass unbans. I don't really keep anyone blocked.\"",
    origin: "Cult of Psyche — recurring practice",
    category: "streaming",
  },

  // ── MODERATION ──────────────────────────────────────────────────
  {
    word: "No-Ban Policy",
    definition:
      "Psyche's default operating mode: almost no one stays permanently banned. The channel is framed as a place of forgiveness — you can always come back, if the cards say you should.",
    origin: "Cult of Psyche — stated channel policy",
    category: "moderation",
  },
  {
    word: "21 and Over Rule",
    definition:
      "Community guideline that panel participants must be 21+ given the frequently adult nature of weekend streams. A rare example of formal gatekeeping in the otherwise open panel format.",
    origin: "Cult of Psyche — weekend panel rule",
    category: "moderation",
  },
  {
    word: "Reactive Abuse",
    definition:
      "A trolling tactic where agitators poke at someone repeatedly until they snap — then use the outburst as evidence that the target 'lost it first.' The panel has receipts on this one; Psyche calls it out often.",
    category: "moderation",
  },
  {
    word: "Screenshot Evidence Culture",
    definition:
      "The panelverse convention of documenting every mod action, chat deletion, and backstage DM with screenshots — so that when the story flips, the receipts hit harder than the accusation.",
    category: "moderation",
  },

  // ── TAROT & MYSTIC ──────────────────────────────────────────────
  {
    word: "Bagalamukhi",
    definition:
      "Hindu tantric goddess, one of the ten Mahavidyas, who silences enemies and reverses slander — often depicted grabbing a demon by the tongue. Associated with yellow and with 'stopping the chaos.' A recurring protector figure in Psyche's pantheon.",
    origin: "Hindu tantra; canonical reference in Cult of Psyche",
    category: "tarot",
  },
  {
    word: "Matangi",
    definition:
      "Hindu tantric goddess of speech, music, and the outcast — patron of artists, truth-tellers, and marginalized voices. One of the ten Mahavidyas. Psyche has written devotional songs to her; she's woven into the show's mythology.",
    origin: "Hindu tantra; canonical reference in Cult of Psyche",
    category: "tarot",
  },
  {
    word: "Baital Pachisi",
    aka: ["Baital Pachchisi", "Vetala Panchavimshati"],
    definition:
      "Ancient Indian cycle of 25 tales in which a vetala (a vampiric sprite) tells King Vikram riddle-stories — if the king answers, the sprite escapes; if he stays silent, his head splits in seven. A recurring storytelling framework on the show.",
    origin: "Classical Indian folklore — recurring on the show",
    category: "tarot",
  },
  {
    word: "Mahammaya",
    definition:
      "The great cosmic goddess of illusion in Hindu cosmology — simultaneously the cause of bondage and the means of liberation. The eternal divine feminine pervading creation itself. Psyche invokes her as the meta-principle behind Maya.",
    category: "tarot",
  },
  {
    word: "Lilith in Scorpio",
    definition:
      "Psyche's signature astrological placement — Black Moon Lilith in Scorpio. Represents the shadow feminine, the refusal to submit, and the power to turn taboo into truth. The lens through which much of the show's mythology is read.",
    origin: "Cult of Psyche — Psyche's natal chart",
    category: "tarot",
  },
  {
    word: "Black Moon Lilith",
    definition:
      "The astrological point marking the part of the self that refuses to be domesticated — raw edge, shamed hungers, suppressed truths. In the Psycheverse, Lilith's position in your chart tells you where you're misunderstood and where your power lives.",
    category: "tarot",
  },
  {
    word: "Life Path Nine",
    definition:
      "Psyche's numerological signature (born 1/7/1981). Life Path 9 represents endings, completion, and the archetype of the wounded healer — one who carries collective pain and transmutes it into art.",
    origin: "Cult of Psyche — Psyche's numerology",
    category: "tarot",
  },
  {
    word: "Amor Fati",
    definition:
      "Latin for 'love of fate.' A philosophical stance of fully embracing every part of your life — the beautiful, the ugly, the controversial — as necessary material for who you're becoming. A recurring Psyche teaching.",
    category: "tarot",
  },
  {
    word: "Maya",
    definition:
      "The veil of illusion in Hindu and Buddhist cosmology — not 'fake,' but the interface through which the formless takes form. On the show, Maya is framed as a feature of reality, not a bug: the necessary distortion that lets the infinite become visible.",
    category: "tarot",
  },
  {
    word: "Awen",
    definition:
      "Celtic concept of poetic inspiration — a flowing divine breath that lights up bards, mystics, and seers. Psyche connects it to the Egyptian Aten, framing both as solar rays of creative revelation.",
    category: "tarot",
  },
  {
    word: "Sabian Symbols",
    definition:
      "A 360-symbol astrological system Psyche treats as a core breakthrough in chart reading — each degree of the zodiac carries a specific image that reveals the deeper mission of that placement. Essential to the Nine Seals framework.",
    origin: "Astrological system; central to Psyche's methodology",
    category: "tarot",
  },
  {
    word: "Return to Sender",
    definition:
      "A protective energy practice: when something nasty is thrown at you, you send it back to its source 'with love' — multiplied, not weaponized. Psyche credits this ritual with breaking trolling attacks in real time.",
    origin: "Spiritual practice; recurring on the show",
    category: "tarot",
  },
  {
    word: "Sadhana",
    definition:
      "In tantra, the path of committed spiritual practice aimed at transformation — not a transaction with deity, but an alignment. Referenced when Psyche distinguishes ritual-as-prayer from ritual-as-discipline.",
    category: "tarot",
  },
  // ── COMMUNITY ───────────────────────────────────────────────────
  {
    word: "Chat Friends Forever",
    aka: ["CFF"],
    definition:
      "Digital friendships that survive platform changes, channel terminations, and cross-community drama. The real ones. A Psyche-community concept acknowledging that some bonds form in chat and outlive everything around them.",
    category: "community",
  },
  {
    word: "Pure Soul People",
    definition:
      "Psyche's term for people with no hate in their hearts — genuine, kind, incapable of cruelty even when cornered. Miguel is the usual example. A small, precious category in a chaotic ecosystem.",
    origin: "Cult of Psyche — coined by Psyche",
    category: "community",
  },
  {
    word: "Black Fishing",
    definition:
      "The practice of artificially darkening one's skin (tanning, filters, melanin injections) to appear another race — often for social or financial gain. Discussed critically on the show alongside broader conversations about identity and appropriation.",
    category: "community",
  },

  // ── SLANG ───────────────────────────────────────────────────────
  {
    word: "Auggling",
    definition:
      "Panelverse slang for creepily ogling someone on camera — the kind of staring that becomes a form of harassment. Coined on the show as a tongue-in-cheek 'crime' with a real underlying complaint.",
    category: "slang",
  },

  // ── NEW ENTRIES (mined from transcripts — batch 3) ──────────────

  // ── PSYCHEVERSE ─────────────────────────────────────────────────
  {
    word: "Warrior Poet",
    definition:
      "Psyche's dual identity: the fighter who wages war through art. Not violence but verse. Not armies but lyrics, rituals, and live readings that cut deeper than any fist. A recurring self-description in the show's mythology.",
    origin: "Cult of Psyche — Psyche's self-archetype",
    category: "psycheverse",
  },
  {
    word: "Hermit Mode",
    definition:
      "Psyche's periods of deliberate withdrawal from streaming — going quiet, private, unreachable. Not defeat; preparation. Like The Hermit card: stepping back to recharge before the next transmission.",
    origin: "Cult of Psyche",
    category: "psycheverse",
  },
  {
    word: "The Summoning",
    definition:
      "Calling someone onto the panel by speaking their name — or posting their drama. In the Psycheverse, naming someone on air acts like an invocation: they almost always show up eventually. Psyche wields this knowingly.",
    origin: "Cult of Psyche — recurring dynamic",
    category: "psycheverse",
  },
  {
    word: "Cult Classic Episode",
    aka: ["Cult Classic"],
    definition:
      "An episode so pivotal, so unhinged, or so emotionally resonant that it gets referenced in chat and on panel for years after. The Biscuitgate episodes, Troll Tribunal specials, and surprise comeback streams are all Cult Classics.",
    origin: "Cult of Psyche community",
    category: "psycheverse",
  },
  {
    word: "Panel Archaeology",
    definition:
      "Digging through years of archived episodes to surface forgotten lore, callbacks, and predictions. The Cult Codex was built for Panel Archaeology — turning 1,300+ transmissions into a searchable archive of the show's memory.",
    origin: "Cult of Psyche — community practice",
    category: "psycheverse",
  },
  {
    word: "The Benediction",
    definition:
      "Psyche's ritual closing of a stream — a parting blessing, challenge, or philosophical statement that lands after the conversation winds down. Not just 'goodnight': a transmission ends with intention.",
    origin: "Cult of Psyche — stream closing ritual",
    category: "psycheverse",
  },
  {
    word: "Initiate",
    aka: ["Initiate+"],
    definition:
      "The premium membership tier of Psyche Awakens, offering full Psychenomicon access, archive deep dives, and exclusive community content. An 'initiate' in occult tradition is one beginning the path — here you're beginning the path through the full archive.",
    origin: "Cult Codex — membership tier",
    category: "psycheverse",
  },
  {
    word: "Community Fracture",
    definition:
      "When the audience splits along fault lines — over a guest, a decision, or a drama event. The panel becomes a mirror of the split. Psyche navigates fractures with the Switzerland Philosophy while chat wages civil war in real time.",
    origin: "Cult of Psyche — recurring dynamic",
    category: "psycheverse",
  },
  {
    word: "The Return",
    definition:
      "When a major community figure comes back after a long absence — ban, personal crisis, platform death, or voluntary exile. Returns often reshape the panel dynamic entirely. Psyche has documented dozens of notable Returns.",
    category: "psycheverse",
  },
  {
    word: "Warlord Mode",
    definition:
      "Psyche in full battle configuration — no diplomacy, no Switzerland, no mercy. Warlord Mode activates when a sustained smear campaign or coordinated attack crosses the line. Rare but legendary. The panel clears space.",
    origin: "Cult of Psyche",
    category: "psycheverse",
  },
  {
    word: "Lore Keeper",
    aka: ["The Lore Keepers"],
    definition:
      "Community members who obsessively track show history — noting episode callbacks, character arcs, and forgotten prophecies. The Codex's spiritual predecessors. Without Lore Keepers, the panelverse has no memory.",
    origin: "Cult of Psyche community",
    category: "psycheverse",
  },
  {
    word: "Psycheverse Canon",
    definition:
      "The officially recognized events, characters, and lore of the Cult of Psyche universe. If Psyche acknowledges it on air, it's canon. Fan theories and rumor stay outside the canon wall until confirmed.",
    origin: "Cult of Psyche — community term",
    category: "psycheverse",
  },
  {
    word: "Soft Launch",
    definition:
      "Quietly returning to streaming after a break, drama, or ban — without fanfare or announcement. The opposite of Hard Launch. Psyche sometimes soft-launches new formats or guests before officially naming them.",
    category: "psycheverse",
  },
  {
    word: "Hard Launch",
    definition:
      "A big, announced return to streaming after an absence — or an aggressive debut of a new format, guest, or series. Maximally visible. The moment the hype is real and everyone knows it's happening.",
    category: "psycheverse",
  },

  // ── PANELVERSE ──────────────────────────────────────────────────
  {
    word: "Pull Up",
    aka: ["Pull Up On Stream"],
    definition:
      "The invitation to join a panel — 'you wanna pull up?' Pulling up means accepting the invitation and appearing on camera. Can be a welcome gesture or a trap, depending on who's asking.",
    category: "panelverse",
  },
  {
    word: "Hot Seat",
    definition:
      "The position of being the central subject of a panel debate or roast. When you're in the hot seat, the conversation revolves around you and your choices. A mix of honor and ordeal.",
    category: "panelverse",
  },
  {
    word: "Panel Purgatory",
    definition:
      "The waiting room limbo between being invited and being admitted to a panel. You're visible in the queue, the host knows you're there, but nothing's happening yet. Can last minutes or entire streams.",
    category: "panelverse",
  },
  {
    word: "Guest Arc",
    definition:
      "A recurring guest's evolving storyline across multiple episodes — their redemption, their villain turn, their fade-out. The panelverse treats regular guests like characters in a serialized drama.",
    category: "panelverse",
  },
  {
    word: "Reaction Panel",
    definition:
      "A panel convened specifically to watch and react to another creator's content in real time. The reactions become the content. A staple of panelverse culture — especially when the content being reacted to is controversial.",
    category: "panelverse",
  },
  {
    word: "Platform Hop",
    definition:
      "Moving your show from one streaming platform to another — YouTube to Kick, Twitch to YouTube, etc. Usually triggered by strikes, shadow bans, or financial incentives. Psyche's community has followed him across platforms.",
    category: "panelverse",
  },
  {
    word: "House Rules",
    definition:
      "Each streamer's unique policies for their panel — no slurs, 21+ only, no specific topics, no recording. What flies on one panel gets you gonged on another. Learning the house rules is how you survive.",
    category: "panelverse",
  },
  {
    word: "Dead Air",
    definition:
      "Uncomfortable, unbroken silence during a live stream. Death to streamers. In the panelverse, dead air usually means the host is pulling up a clip, reading a super chat, or processing something too real to rush past.",
    category: "panelverse",
  },
  {
    word: "The Reveal",
    definition:
      "The moment a panelist's true identity, agenda, or relationship to another community member becomes clear. Can shift the entire dynamic of a stream. Often arrives via receipts, surprise guests, or a carefully timed confession.",
    category: "panelverse",
  },
  {
    word: "Panel Resurrection",
    aka: ["Panel Redemption Arc"],
    definition:
      "Returning to a panel after being gonged, banned, or dramatically exiled. Sometimes earned through growth; sometimes just because enough time has passed and Psyche pressed the mass unban button.",
    category: "panelverse",
  },
  {
    word: "OG Panelist",
    aka: ["OG"],
    definition:
      "An original, veteran panel guest who has been appearing since the early days of the show. OG status carries weight — they remember the old drama, the old format, the old cat count. Their callbacks hit differently.",
    category: "panelverse",
  },

  // ── STREAMING ───────────────────────────────────────────────────
  {
    word: "VOD",
    aka: ["Video on Demand"],
    definition:
      "A recorded stream made available to watch after the live broadcast ends. 'The VOD is up' means the episode is archived. For the Cult of Psyche, VODs feed the Codex — every transmission becomes archival material.",
    category: "streaming",
  },
  {
    word: "Live Count",
    aka: ["Concurrent Viewers", "CCV"],
    definition:
      "The number of viewers watching simultaneously. Obsessively watched by creators and fans alike. When the count drops after a controversial moment, the panel notices immediately.",
    category: "streaming",
  },
  {
    word: "Clip It",
    definition:
      "The call to clip a particularly memorable stream moment — 'someone clip that.' Clips are how panelverse highlights spread: to Twitter, to TikTok, to Discord. The clip is the missile; the stream is the launcher.",
    category: "streaming",
  },
  {
    word: "Sub Count",
    aka: ["Subscriber Count", "Subscriber Milestone"],
    definition:
      "The subscriber number milestone, celebrated or mourned live. Hitting a round number like 10K or 100K is a landmark stream event. Losing subs after controversy is painfully visible in real time.",
    category: "streaming",
  },
  {
    word: "Title Bait",
    aka: ["Clickbait"],
    definition:
      "An episode title engineered to pull in viewers — shocking, ambiguous, or outrage-adjacent. In the panelverse, title bait is an art form. The title gets the click; the content (hopefully) earns the subscriber.",
    category: "streaming",
  },
  {
    word: "Going Dark",
    definition:
      "Temporarily stopping all streaming activity — no uploads, no lives, no social media. Sometimes announced; often not. When Psyche goes dark, the community watches the empty schedule and waits.",
    category: "streaming",
  },
  {
    word: "Watch Party",
    definition:
      "Watching a recorded piece of content (a movie, another stream's VOD, a documentary) together live on stream. The reactions are the entertainment. Psyche has done watch parties of community videos, old episodes, and chaos compilations.",
    category: "streaming",
  },
  {
    word: "Gifted Sub",
    aka: ["Gift Sub"],
    definition:
      "A membership subscription given to a random viewer by a third party — community generosity made algorithmic. Gifted sub moments generate sudden bursts of chat energy and loyalty.",
    category: "streaming",
  },
  {
    word: "Simulcast",
    definition:
      "Streaming the same broadcast live across multiple platforms simultaneously — YouTube, Kick, Twitch, and more at once. Maximizes reach; also multiplies the moderation burden.",
    category: "streaming",
  },
  {
    word: "Pinned Comment",
    definition:
      "A creator-highlighted comment fixed at the top of a video. Used for rules, links, context, or community callouts. On a live stream, the pinned message sets the tone before a single word is spoken.",
    category: "streaming",
  },

  // ── MODERATION ──────────────────────────────────────────────────
  {
    word: "Chat Speed",
    definition:
      "How fast messages scroll in the live chat — a real-time emotional barometer. Slow chat means the audience is cold; fast chat means energy is spiking. After a gonging, chat goes into overdrive.",
    category: "moderation",
  },
  {
    word: "Timeout",
    aka: ["Timed Out"],
    definition:
      "A temporary chat suspension — usually 60 seconds to 24 hours — that prevents a user from posting. A softer warning than a ban. First-time trolls get timeouts; repeat offenders get the hard ban.",
    category: "moderation",
  },
  {
    word: "Slow Mode",
    definition:
      "A YouTube Live setting that limits how often users can send chat messages — e.g., one message every 30 seconds. Activated when chat is moving too fast to moderate, or when a flood attack is underway.",
    category: "moderation",
  },
  {
    word: "Member-Only Mode",
    aka: ["Members Only"],
    definition:
      "Restricting live chat participation to paying channel members only. Psyche activates this when troll pressure peaks, preserving the panel's signal-to-noise ratio without banning individuals.",
    category: "moderation",
  },
  {
    word: "False Report",
    definition:
      "Weaponizing YouTube's content reporting system against a streamer — mass-flagging streams or videos for violations they didn't commit. A coordinated false report campaign can trigger automated strikes with no human review.",
    category: "moderation",
  },
  {
    word: "Back-Seat Moderating",
    definition:
      "Chat users instructing mods on what to do — 'ban them,' 'mute that guy,' 'why isn't he kicked yet.' A constant presence in large streams. Mods tolerate it. Sometimes it's right; often it's a mob.",
    category: "moderation",
  },
  {
    word: "Hard Ban",
    definition:
      "A permanent, irrevocable ban — not just a timeout. Reserved for the most egregious violations: doxxing, threats, serial trolling. The opposite of the No-Ban Policy. When Psyche says hard ban, they mean it.",
    category: "moderation",
  },
  {
    word: "Mod Handoff",
    definition:
      "The transfer of moderation responsibilities from one trusted person to another. A Mod Handoff done wrong can destabilize a channel — new mods inherit old vendettas and unwritten rules.",
    category: "moderation",
  },

  // ── COMMUNITY ───────────────────────────────────────────────────
  {
    word: "Cult Core",
    definition:
      "The innermost circle of Psyche's community — the devotees who've been there longest, show up most consistently, and carry the show's memory. Distinct from casual viewers and occasional panelists. The Cult Core never needs to announce itself.",
    origin: "Cult of Psyche community",
    category: "community",
  },
  {
    word: "Fourth Wall Break",
    definition:
      "When Psyche or a guest directly addresses the meta — acknowledging the show as a show, the audience as an audience, or the constructed nature of panelverse drama. Rare and significant. The moment the theater recognizes itself.",
    category: "community",
  },
  {
    word: "Villain Origin Story",
    definition:
      "The backstory explaining how someone became antagonistic to the community. In the Psycheverse, everyone has one — the betrayal, the snub, the lost love that turned a former ally into an opponent. Understanding the origin doesn't excuse the villainy; it contextualizes it.",
    category: "community",
  },
  {
    word: "Lore Collector",
    definition:
      "A fan who obsessively tracks show history — episode callbacks, character arcs, forgotten prophecies, hidden connections. They surface old clips at exactly the right moment. The Codex made Lore Collecting accessible; Lore Collectors made the Codex necessary.",
    category: "community",
  },
  {
    word: "Community Verdict",
    definition:
      "The collective judgment of chat and the broader audience on a controversial moment, person, or decision. Expressed through polls, chat ratio, super chats, and the volume of stitched response videos. In the panelverse, community verdict is faster and harsher than any court.",
    category: "community",
  },
  {
    word: "Spiritual Bypassing",
    definition:
      "Using spiritual or metaphysical language to avoid dealing with real, practical problems — or to excuse poor behavior. Calling chaos 'divine timing,' calling accountability 'low vibration.' Psyche identifies and calls it out explicitly in readings.",
    category: "community",
  },
  {
    word: "Gossip Spiral",
    definition:
      "Drama that feeds on itself — each retelling more distorted than the last. One screenshot becomes a narrative; the narrative becomes a story; the story becomes a crusade. In the panelverse, gossip spirals can outlast the original incident by months.",
    category: "community",
  },
  {
    word: "Narc Supply",
    aka: ["Narcissistic Supply"],
    definition:
      "The attention, emotional reactions, and admiration that narcissistic personalities require to function. Without supply, they escalate. In the panelverse: don't react, don't feed, don't give them the content they're there to extract.",
    category: "community",
  },
  {
    word: "Hoovering",
    definition:
      "A manipulation tactic where an abusive person sucks you back into the relationship after you've escaped — love bombing, guilt tripping, false promises of change. Named after the vacuum cleaner brand. Discussed frequently in Psyche's abuse recovery segments.",
    category: "community",
  },
  {
    word: "Future Faking",
    definition:
      "Making elaborate promises about the future to maintain control in the present — 'I'll change,' 'we'll move,' 'I'll get help.' The promises never materialize; the manipulation buys time. A recurring topic in dating and relationship panels.",
    category: "community",
  },
  {
    word: "Covert Narcissism",
    aka: ["Covert Narc", "Vulnerable Narcissism"],
    definition:
      "The quiet, self-pitying subtype of narcissistic personality — not grandiose but martyred; not overtly cruel but subtly suffocating. Harder to identify because the victimhood is the manipulation. Discussed in Psyche's deeper psychology episodes.",
    category: "community",
  },
  {
    word: "Discard Phase",
    definition:
      "When a narcissist stops finding you useful and drops you abruptly — often for a new source of supply. The discard can be brutal in its suddenness after the idealization phase felt so total. A trauma milestone many in the community share.",
    category: "community",
  },
  {
    word: "Intermittent Reinforcement",
    definition:
      "An unpredictable reward cycle — kindness and cruelty alternating without pattern — that creates addictive attachment more powerful than consistent love. The slot machine theory of toxic relationships. Psyche explains this dynamic in abuse panels.",
    category: "community",
  },
  {
    word: "Parasocial Collapse",
    definition:
      "When a viewer's parasocial bond with a streamer is shattered — by a controversial decision, a human failure, or just finally meeting them in the wild and realizing they're a person. Painful and necessary. Growth starts here.",
    category: "community",
  },
  {
    word: "Splitting",
    definition:
      "The cognitive distortion of seeing people as entirely good or entirely bad — no nuance, no middle ground. Someone goes from hero to villain overnight. Common in both personality disorders and panelverse drama: the same person who was worshipped last week gets canceled this week.",
    category: "community",
  },
  {
    word: "Accountability Gap",
    definition:
      "The space between someone causing harm and acknowledging it. In the Psycheverse, the accountability gap is where most drama lives — receipts exist, everyone saw what happened, but the person responsible won't say the words.",
    category: "community",
  },

  // ── TAROT & MYSTIC ──────────────────────────────────────────────
  {
    word: "Celtic Cross",
    definition:
      "The classic ten-card tarot spread for deep, multidimensional readings — covering the querent's situation, obstacles, subconscious, past, future, hopes, and outcome. Psyche deploys it for complex, layered questions when a three-card pull isn't enough.",
    category: "tarot",
  },
  {
    word: "Significator",
    definition:
      "A tarot card chosen or assigned to represent the querent (the person being read for) before the reading begins. Often a Court Card or Major Arcana that mirrors the querent's energy or question.",
    category: "tarot",
  },
  {
    word: "Clarifier",
    aka: ["Clarifying Card"],
    definition:
      "An extra card pulled to shed light on an ambiguous or unclear card in the spread. 'Let me pull a clarifier on this' — a second opinion from the deck when the first card is speaking in riddles.",
    category: "tarot",
  },
  {
    word: "Reversal",
    aka: ["Reversed Card", "Rx"],
    definition:
      "A tarot card drawn upside down. Some readers treat reversals as blocked, internalized, or shadow expressions of the card's energy. Psyche uses reversals as depth indicators — not opposites, but interiors.",
    category: "tarot",
  },
  {
    word: "Major Arcana",
    definition:
      "The 22 archetypal trump cards in a tarot deck — The Fool through The World. They represent cosmic forces, life themes, and soul-level events. When Major Arcana dominate a spread, the universe is speaking at full volume.",
    category: "tarot",
  },
  {
    word: "Minor Arcana",
    definition:
      "The 56 suit cards in a tarot deck — Wands, Cups, Swords, Pentacles. They cover daily life, practical situations, and the texture of human experience. If Major Arcana are the chapters, Minor Arcana are the paragraphs.",
    category: "tarot",
  },
  {
    word: "Court Card",
    aka: ["Court Cards"],
    definition:
      "The Page, Knight, Queen, and King of each suit in the Minor Arcana. Often represent people in the querent's life — or aspects of the querent themselves. The most human cards in the deck: complex, contextual, elusive.",
    category: "tarot",
  },
  {
    word: "The Tower",
    definition:
      "Tarot card of sudden upheaval, collapse, and revelation — the tower struck by lightning, the false structure falling. One of the most feared cards in a reading. In the Psycheverse, The Tower appears during drama crescendos, platform strikes, and community fractures. It always means something must fall before something better can be built.",
    category: "tarot",
  },
  {
    word: "The High Priestess",
    definition:
      "Tarot card of intuition, hidden knowledge, and the veil between seen and unseen. She sits between two pillars, scrolls on her lap, moon at her feet. In readings, she signals that what's not being said matters more than what is.",
    category: "tarot",
  },
  {
    word: "The Lovers",
    definition:
      "Tarot card of choice, alignment, and union — often misread as purely romantic. It's more precisely about values: which path truly aligns with who you are? In the Psycheverse, The Lovers appears in readings about decisions, not just relationships.",
    category: "tarot",
  },
  {
    word: "The Hermit",
    definition:
      "Tarot card of solitude, inner wisdom, and the guiding lantern in darkness. The Hermit retreats not from life but from noise — to return with something earned in silence. Referenced in Psyche's Hermit Mode philosophy.",
    category: "tarot",
  },
  {
    word: "The Hanged Man",
    definition:
      "Tarot card of voluntary suspension, sacrifice, and radical perspective shift. He hangs by his own choice — not trapped, surrendering. The view from upside down reveals what standing upright never could. A card Psyche returns to when discussing the cost of truth-telling.",
    category: "tarot",
  },
  {
    word: "Numerology",
    definition:
      "The study of numbers as a spiritual language — assigning meaning to birth dates, names converted to digits, recurring number patterns. Psyche's Life Path 9 (1/7/1981) frames his mission through this lens. Combined with tarot and astrology in full readings.",
    category: "tarot",
  },
  {
    word: "Synastry",
    definition:
      "Comparing two people's birth charts to analyze the energetic dynamics of their relationship — compatibility, friction points, karmic ties. A full synastry reading overlays one chart atop another to find where they mesh and where they collide.",
    category: "tarot",
  },
  {
    word: "Rising Sign",
    aka: ["Ascendant", "ASC"],
    definition:
      "The zodiac sign on the eastern horizon at the moment of birth — the social face presented to the world. Your rising sign colors your appearance, first impressions, and how others read you before they really know you.",
    category: "tarot",
  },
  {
    word: "North Node",
    aka: ["True Node"],
    definition:
      "The astrological point indicating your soul's growth direction in this lifetime — where you're meant to stretch, what you're meant to develop. It's uncomfortable because it points toward the unfamiliar. South Node is where you've been; North Node is where you're going.",
    category: "tarot",
  },
  {
    word: "Void of Course Moon",
    aka: ["VOC Moon"],
    definition:
      "The period when the Moon makes no major planetary aspects before changing signs. Traditionally: don't start new projects, sign contracts, or make major decisions during a VOC Moon. Psyche notes it for viewers as a 'pause and reflect' window.",
    category: "tarot",
  },
  {
    word: "Akashic Records",
    definition:
      "The esoteric concept of a cosmic library recording every soul's journey across all lifetimes — every thought, word, and deed stored in an etheric field. Invoked in readings about past lives, recurring patterns, and why certain meetings feel fated.",
    category: "tarot",
  },
  {
    word: "Spirit Guide",
    aka: ["Spirit Guides"],
    definition:
      "A non-physical entity — ancestor, angel, or evolved being — that assists a person's spiritual development. Referenced in Psyche's readings when cards suggest outside guidance is present but not yet heeded.",
    category: "tarot",
  },
  {
    word: "Ancestral Healing",
    definition:
      "The practice of working through inherited trauma, patterns, and unfinished energetic business passed down through family lineages. 'Your great-grandmother's wound lives in your body.' A recurring framework in Psyche's deeper therapeutic reading style.",
    category: "tarot",
  },
  {
    word: "Waking Dream",
    definition:
      "A visionary state between sleep and full wakefulness where symbols, archetypes, and messages surface from the subconscious. Psyche references waking dreams as a source of creative and prophetic insight — the liminal space where the Oracle speaks.",
    category: "tarot",
  },
  {
    word: "Past Life Reading",
    definition:
      "A tarot or intuitive session focused on prior incarnations — what soul patterns you're carrying forward, which karmic debts are still outstanding, who in your current life you've met before. A specialty format in the Psycheverse's spiritual toolkit.",
    category: "tarot",
  },

  // ── MUSIC & PERFORMANCE ─────────────────────────────────────────
  {
    word: "Diss Track",
    definition:
      "A song written specifically to attack another person, group, or community. In the Cult of Psyche, diss tracks have been weaponized, memed, and forgiven — the Biscuit Song lineage being the canonical example. Sometimes they're more healing than the beef they respond to.",
    category: "music",
  },
  {
    word: "Hook",
    definition:
      "The catchy, repeated section of a song — the part everyone remembers, that lives in your head rent-free for days. In panel performances, the hook is the moment that elevates improvised rap from wordplay to music.",
    category: "music",
  },
  {
    word: "Battle Ready",
    definition:
      "Being prepared for a verbal or musical confrontation — warmed up, lyrically loaded, emotionally focused. On the Cult of Psyche, being battle ready means you've got bars pre-loaded and you're watching for the opening.",
    category: "music",
  },
  {
    word: "Ad Lib",
    definition:
      "Improvised vocal additions over a track or during a freestyle — the 'yeah,' 'uh,' 'c'mon' layered under the main flow. In panel performances, ad libs signal how deep in the zone the performer is.",
    category: "music",
  },
  {
    word: "Punch Line",
    definition:
      "The devastating final line in a rap verse — the one that lands like a closing argument. A good punch line ends the exchange. In panel rap battles, landing the punch line is the moment the room goes quiet before it erupts.",
    category: "music",
  },
  {
    word: "Spit",
    aka: ["Spitting Bars"],
    definition:
      "To rap — specifically to deliver bars with skill and presence. 'He can really spit' is high praise. On panels, spitting can shift the entire energy of a conversation: suddenly it's not debate, it's performance.",
    category: "music",
  },

  // ── SLANG ───────────────────────────────────────────────────────
  {
    word: "No Cap",
    definition:
      "No lie; genuinely. Used to emphasize that what you're saying is the truth. In panel debates, 'no cap' signals sincerity cutting through the usual posturing. 'No cap, that reading hit different.'",
    category: "slang",
  },
  {
    word: "Cap",
    aka: ["Capping"],
    definition:
      "A lie. To 'cap' is to say something untrue. 'That's cap' is calling someone out mid-statement. Essential vocabulary when receipts are circulating and someone's story is shifting.",
    category: "slang",
  },
  {
    word: "Mid",
    definition:
      "Mediocre — neither good nor bad, but in the worst possible way. 'That panel was mid' is a more devastating critique than outright dislike. In the panelverse, mid is what you don't want to be. Controversial and unhinged at least generates content.",
    category: "slang",
  },
  {
    word: "Sus",
    aka: ["Suspicious"],
    definition:
      "Short for suspicious — something feels off. Originated in the game Among Us but now covers any situation where motives seem hidden or behavior seems calculated. 'Why is he so sus about who sent that super chat?'",
    category: "slang",
  },
  {
    word: "W / L",
    aka: ["W", "L", "Taking an L"],
    definition:
      "Shorthand for Win and Loss. Panel moments get scored: 'that was a W for Psyche,' 'he took an L on that one.' Taking an L gracefully is respected. Refusing to acknowledge an L is content.",
    category: "slang",
  },
  {
    word: "Yapping",
    definition:
      "Talking excessively without saying anything meaningful — pure volume with no substance. 'He's yapping' is the death knell for a panelist's credibility. Psyche values economy of speech; yapping is the enemy of real conversation.",
    category: "slang",
  },
  {
    word: "Rizz",
    aka: ["Rizzler"],
    definition:
      "Natural social charisma — the ability to attract and hold attention effortlessly. In the panelverse, rizz isn't just romantic; it's the quality that keeps a panel listening when you speak. 'They've got rizz' means they've got presence.",
    category: "slang",
  },
  {
    word: "Situationship",
    definition:
      "A romantic or emotional arrangement that resists definition — more than friends, less than committed, maximum ambiguity. A persistent topic in Psyche's dating panels: 'they're in a situationship, they just don't know it yet.'",
    category: "slang",
  },
  {
    word: "Touching Grass",
    aka: ["Touch Grass"],
    definition:
      "Going outside and engaging with the physical world — taking a break from the online ecosystem. 'You need to touch grass' is advice given when someone is too deep in the panelverse to maintain perspective. Not necessarily an insult; sometimes it's care.",
    category: "slang",
  },
  {
    word: "Lowkey",
    definition:
      "Subtly, quietly, without drawing attention. 'Lowkey I thought that episode was the best of the year.' A hedge that signals sincerity — the speaker is confessing something they weren't planning to admit.",
    category: "slang",
  },

  // ── NEW ENTRIES (batch 4 — 100 terms) ──────────────────────────

  // ── SLANG ───────────────────────────────────────────────────────
  {
    word: "Highkey",
    definition:
      "The opposite of lowkey — openly, obviously, with full conviction. 'Highkey the best panel of the month.' Used to signal there's no shame in the take.",
    category: "slang",
  },
  {
    word: "Mid",
    definition:
      "Mediocre, unremarkable, neither good nor bad. One of the harshest casual insults in panel culture — calling someone's take, music, or whole vibe 'mid' is more cutting than calling it bad, because it denies them even the dignity of failure.",
    category: "slang",
  },
  {
    word: "Goated",
    aka: ["GOAT"],
    definition:
      "Greatest Of All Time. To be 'goated' is to be the best in your lane. 'That freestyle was goated.' High, unambiguous praise in the panelverse.",
    category: "slang",
  },
  {
    word: "Rizz",
    aka: ["Rizzler"],
    definition:
      "Charisma, especially the romantic or persuasive kind. Someone with 'rizz' can charm their way onto any panel or out of any beef. 'He's got unspoken rizz.'",
    category: "slang",
  },
  {
    word: "Glazing",
    definition:
      "Excessively praising or defending someone to the point of embarrassment. A more aggressive cousin of simping — 'stop glazing him, he's not that deep.' Common accusation against loyal panel regulars.",
    category: "slang",
  },
  {
    word: "Yap",
    aka: ["Yapping", "Yapper"],
    definition:
      "Talking too much, often without substance. In open panels the 'yap' is both a sin and a sport — a 'certified yapper' can hold the floor for an hour. 'Less yap, more facts.'",
    category: "slang",
  },
  {
    word: "Sus",
    definition:
      "Suspicious or untrustworthy. Popularized by Among Us, fully absorbed into panel slang. 'That story is sus' — something doesn't add up and the chat smells it.",
    category: "slang",
  },
  {
    word: "Bet",
    definition:
      "An affirmation meaning 'okay,' 'agreed,' or 'I'll hold you to that.' A one-word verbal handshake. Can also be a challenge: 'Bet.' — try me.",
    category: "slang",
  },
  {
    word: "Cap",
    aka: ["No Cap", "Capping"],
    definition:
      "A lie or exaggeration. 'That's cap' means you don't believe it. 'No cap' means you're being completely honest. 'Stop capping' is a demand for the truth — frequently invoked when receipts are about to be pulled.",
    category: "slang",
  },
  {
    word: "Lock In",
    aka: ["Locked In"],
    definition:
      "To focus completely and commit to the moment. 'Lock in' is the rallying cry before a serious panel, a rap battle, or a deep reading. The opposite of being distracted or half-present.",
    category: "slang",
  },
  {
    word: "Aura",
    aka: ["Aura Points"],
    definition:
      "An informal measure of how cool, composed, or impressive someone is. You 'gain aura' by handling a situation smoothly and 'lose aura points' by fumbling on camera. A spiritual-sounding meme repurposed as a social scoreboard.",
    category: "slang",
  },
  {
    word: "Opp",
    aka: ["Opps"],
    definition:
      "An opponent, enemy, or hater. In the panelverse your 'opps' are the channels and personalities perpetually beefing with you. 'The opps are in the chat tonight.'",
    category: "slang",
  },
  {
    word: "Pluh",
    definition:
      "A nonsense interjection used as filler, punctuation, or pure chaos energy in chat. Means nothing and everything. A pure artifact of livestream chat culture.",
    category: "slang",
  },
  {
    word: "Crash Out",
    aka: ["Crashing Out", "Crashed Out"],
    definition:
      "To completely lose composure — emotionally melting down, raging, or self-sabotaging on camera. 'He's about to crash out' is a warning that someone's restraint is gone. Prime panel content.",
    category: "slang",
  },
  {
    word: "Pop Off",
    definition:
      "To go off impressively — whether ranting, performing, or destroying someone in an argument. 'Pop off!' is encouragement; 'they popped off' is a recap of a memorable moment.",
    category: "slang",
  },
  {
    word: "Gagged",
    definition:
      "Rendered speechless by something shocking or impressive. Borrowed from ballroom culture. 'I was gagged' means the moment left you stunned — in admiration or disbelief.",
    category: "slang",
  },
  {
    word: "The Girls Are Fighting",
    definition:
      "A gleeful chat phrase deployed whenever two panelists start bickering, regardless of their gender. Frames every petty conflict as catty drama for the audience's amusement.",
    category: "slang",
  },
  {
    word: "Menace",
    aka: ["Menace to Society"],
    definition:
      "An affectionate label for someone who causes delightful chaos. Calling a panelist a 'menace' is half complaint, half compliment — they're a problem, but an entertaining one.",
    category: "slang",
  },
  {
    word: "Unserious",
    definition:
      "Not to be taken seriously — applied to a person, take, or whole vibe. 'This panel is so unserious' can be a complaint or the highest praise depending on the night.",
    category: "slang",
  },
  {
    word: "Sending Me",
    aka: ["I'm Sent", "It Sent Me"],
    definition:
      "Something so funny it 'sends' you into uncontrollable laughter. 'This chat is sending me.' A measure of comedic impact.",
    category: "slang",
  },

  // ── PANELVERSE ──────────────────────────────────────────────────
  {
    word: "Hot Mic",
    definition:
      "When a panelist's microphone is left on while they say something they didn't intend to broadcast. Hot mic moments are panelverse gold — unguarded truths, accidental confessions, background chaos.",
    category: "panelverse",
  },
  {
    word: "Dead Air",
    definition:
      "An awkward silence during a stream when no one is talking and nothing is happening. The enemy of every panel host. Psyche fills dead air with tarot, cat updates, or a sudden philosophical tangent.",
    category: "panelverse",
  },
  {
    word: "Green Room",
    definition:
      "The waiting area where guests sit before being brought onto the panel. In StreamYard, the digital green room is where alliances form, beef simmers, and people get forgotten for an hour.",
    category: "panelverse",
  },
  {
    word: "On the Decks",
    aka: ["Bring Them On"],
    definition:
      "Being actively placed on the visible panel rather than waiting in the wings. 'Put them on the decks' means promote a guest from the green room to the live stage.",
    category: "panelverse",
  },
  {
    word: "Panel Hopper",
    definition:
      "Someone who bounces between multiple channels' panels in a single night, chasing whichever stream has the most action. Loyalty to the drama, not the host.",
    category: "panelverse",
  },
  {
    word: "Stage Diving",
    definition:
      "Jumping into a panel uninvited or barging into a conversation that wasn't yours. Sometimes welcomed as energy, sometimes grounds for a swift clap-off.",
    category: "panelverse",
  },
  {
    word: "The Frame",
    definition:
      "The visible on-screen layout of who's currently on the panel. 'Getting in the frame' means making it onto the broadcast; 'stealing the frame' means dominating attention once you're there.",
    category: "panelverse",
  },
  {
    word: "Soft Block",
    definition:
      "Removing someone from your panel or follows without a public announcement or permanent ban — a quiet distancing rather than a dramatic exile. The passive-aggressive cousin of the gong.",
    category: "panelverse",
  },
  {
    word: "Run It Back",
    definition:
      "To replay, restart, or do something again — a clip, a debate, a whole stream. 'Run it back' is the call for a rematch after a rap battle or a heated exchange.",
    category: "panelverse",
  },
  {
    word: "Cooking Up",
    aka: ["In the Lab"],
    definition:
      "Working on something behind the scenes — a diss track, a collab, a comeback stream. 'He's been cooking up' signals that a major drop is coming.",
    category: "panelverse",
  },
  {
    word: "Panel Veteran",
    aka: ["OG Panelist"],
    definition:
      "A long-tenured community member who has appeared across many eras of the show and remembers the deep lore. Panel veterans carry institutional memory and can settle 'who said what years ago' disputes.",
    category: "panelverse",
  },
  {
    word: "First Timer",
    definition:
      "Someone making their debut appearance on the panel. First timers are often gently grilled, welcomed, or tested by the regulars. How you handle your first panel sets your reputation.",
    category: "panelverse",
  },
  {
    word: "The Wings",
    definition:
      "The unseen periphery of a stream — green room, chat, and side DMs — where people wait, watch, and scheme before stepping into the frame. 'Waiting in the wings.'",
    category: "panelverse",
  },

  // ── STREAMING ───────────────────────────────────────────────────
  {
    word: "StreamYard",
    definition:
      "The browser-based streaming studio many panelverse hosts use to run multi-guest broadcasts. Its duck logo and green-room mechanics are baked into panel culture — see also 'The Quack Pack.'",
    origin: "Streaming software widely used in the panelverse",
    category: "streaming",
  },
  {
    word: "Restream",
    definition:
      "Broadcasting a single stream to multiple platforms at once (YouTube, Twitch, Kick, X). Maximizes reach and provides backup if one platform strikes or drops the feed mid-broadcast.",
    category: "streaming",
  },
  {
    word: "VOD",
    aka: ["Video on Demand"],
    definition:
      "The recorded archive of a livestream, available to watch after the broadcast ends. 'Check the VOD' is how the community fact-checks what really happened. The raw material the Cult Codex is built from.",
    category: "streaming",
  },
  {
    word: "Clip",
    aka: ["Clipped", "Clipper"],
    definition:
      "A short, shareable excerpt from a stream capturing a notable moment. 'Clip that!' is shouted live when something memorable happens. Clippers are community members who farm viral moments from long VODs.",
    category: "streaming",
  },
  {
    word: "Banger",
    definition:
      "An exceptionally good stream, song, clip, or moment. 'That was a banger episode.' Unqualified approval.",
    category: "streaming",
  },
  {
    word: "Going Live",
    definition:
      "The act of starting a broadcast. 'Going live in 5' is the rally signal that pulls the community in. The moment the portal opens.",
    category: "streaming",
  },
  {
    word: "Off Stream",
    aka: ["Offline"],
    definition:
      "Anything that happens when the camera isn't rolling — DMs, phone calls, private drama. 'We settled it off stream' both resolves and hides a conflict from the audience.",
    category: "streaming",
  },
  {
    word: "Brand Deal",
    aka: ["Sponsor"],
    definition:
      "A paid partnership where a creator promotes a product. Rare and complicated in the panelverse, where 'too real' content frequently scares off advertisers. Worn as both aspiration and joke.",
    category: "streaming",
  },
  {
    word: "Engagement Bait",
    definition:
      "Content or statements designed purely to provoke comments, shares, and arguments rather than to communicate anything. The algorithm rewards it; the community resents being played by it.",
    category: "streaming",
  },
  {
    word: "Drop a Sub",
    aka: ["Smash That Sub"],
    definition:
      "A call for viewers to subscribe to the channel. The lifeblood ask of every creator, delivered with varying degrees of irony in the self-aware panelverse.",
    category: "streaming",
  },
  {
    word: "Cooked the Stream",
    definition:
      "When technical failure or chaos ends a broadcast prematurely — a crash, a strike, a porn bomb. 'That porn bomb cooked the stream.'",
    category: "streaming",
  },
  {
    word: "Numbers",
    aka: ["The Numbers"],
    definition:
      "Live viewer count, watch hours, and subscriber stats — the metrics streamers obsess over. 'The numbers are up' or 'doing numbers' signals a stream is performing. The currency of the attention economy.",
    category: "streaming",
  },

  // ── MODERATION ──────────────────────────────────────────────────
  {
    word: "Timeout",
    aka: ["Timed Out"],
    definition:
      "A temporary chat suspension — a user can't type for a set duration. The mild, reversible end of the moderation spectrum, used to cool someone down rather than exile them.",
    category: "moderation",
  },
  {
    word: "Slow Mode",
    definition:
      "A chat setting that limits how often each user can post, used to calm a chat that's moving too fast or being flooded. A crowd-control tool during high-drama streams.",
    category: "moderation",
  },
  {
    word: "Mod Abuse",
    definition:
      "When a moderator misuses their powers — a broader umbrella than 'rogue mod,' covering favoritism, petty timeouts, and silencing critics. A frequent accusation hurled both fairly and unfairly.",
    category: "moderation",
  },
  {
    word: "Ban Evasion",
    definition:
      "Returning to a channel after being banned by using a sock puppet or new account. A cat-and-mouse game in the panelverse, where determined trolls cycle through endless alts.",
    category: "moderation",
  },
  {
    word: "Word Filter",
    aka: ["Blocked Terms"],
    definition:
      "An automated list of banned words that chat messages are screened against. Savvy trolls invent creative misspellings to slip past it — an endless linguistic arms race.",
    category: "moderation",
  },
  {
    word: "Report Brigade",
    aka: ["Mass Report"],
    definition:
      "A coordinated campaign where a group mass-reports a channel or video to trigger automated platform penalties. A weaponization of moderation systems against a target — Psyche has survived several.",
    category: "moderation",
  },
  {
    word: "Verified Mod",
    definition:
      "A moderator whose trust has been established over time, distinguished from new or probationary mods. In the panelverse, mod hierarchy is real and contested.",
    category: "moderation",
  },
  {
    word: "Cleanup Crew",
    definition:
      "The team of mods who spring into action during a raid, porn bomb, or chat meltdown — deleting, banning, and restoring order. The unsung first responders of a chaotic stream.",
    category: "moderation",
  },

  // ── COMMUNITY ───────────────────────────────────────────────────
  {
    word: "Ride or Die",
    definition:
      "A community member who stays loyal through every controversy, strike, and platform migration. The highest tier of allegiance in the Psycheverse — these are the ones who show up when it counts.",
    category: "community",
  },
  {
    word: "Day One",
    aka: ["Day Ones"],
    definition:
      "A supporter who has been there since the beginning. 'Day ones' carry special status and bragging rights — they remember the show before it was an archive.",
    category: "community",
  },
  {
    word: "Fairweather Fan",
    definition:
      "A supporter who shows up only when things are going well and disappears during controversy or low periods. The opposite of ride or die. Identified and remembered when the tide turns.",
    category: "community",
  },
  {
    word: "Lore Keeper",
    definition:
      "A community member who tracks and preserves the show's mythology — who feuded with whom, which episode birthed which meme. Unofficial historians whose work the Cult Codex formalizes.",
    category: "community",
  },
  {
    word: "Dogpile",
    aka: ["Pile On"],
    definition:
      "When a crowd collectively attacks a single person, each adding their own jab until the target is buried. Distinct from a roast by its lack of affection — a dogpile is meant to wound.",
    category: "community",
  },
  {
    word: "Touch Base",
    definition:
      "To reconnect or check in with someone after time apart or after conflict. In the perpetually feuding panelverse, 'touching base' off stream is how broken alliances quietly mend.",
    category: "community",
  },
  {
    word: "Inner Circle",
    definition:
      "The trusted core of the community closest to Psyche — the ones with backstage access, private channels, and real influence. Distinct from the broader audience. Membership shifts with the eras.",
    category: "community",
  },
  {
    word: "Hate Watch",
    aka: ["Hate Watching"],
    definition:
      "Tuning into a stream specifically because you dislike it or the host, then complaining about it. The panelverse paradox: the most dedicated haters are also the most loyal viewers.",
    category: "community",
  },
  {
    word: "Plant",
    definition:
      "Someone secretly aligned with one side who poses as neutral or as a member of the other camp to gather information or stir conflict. A recurring suspicion in community drama.",
    category: "community",
  },
  {
    word: "Cancelled",
    aka: ["Cancel Culture"],
    definition:
      "Subjected to mass public withdrawal of support after a perceived offense. In the panelverse, 'cancelled' is often ironic — people declared cancelled keep streaming, and comebacks are routine.",
    category: "community",
  },
  {
    word: "Vouch",
    aka: ["Vouched For"],
    definition:
      "To publicly stake your reputation on someone's character, smoothing their entry into the community. 'I'll vouch for them.' If they then cause drama, the voucher shares the blame.",
    category: "community",
  },
  {
    word: "Burner",
    aka: ["Burner Account"],
    definition:
      "A throwaway account used to say things anonymously — confess, snitch, or attack without consequences to one's main identity. Distinct from a sock puppet by intent: a burner is for deniability, not impersonation.",
    category: "community",
  },

  // ── TAROT & MYSTIC ──────────────────────────────────────────────
  {
    word: "Querent",
    definition:
      "The person receiving a tarot reading — the one asking the question. In Psyche's panels, anyone who throws a question into a super chat becomes a querent.",
    category: "tarot",
  },
  {
    word: "Major Arcana",
    aka: ["Minor Arcana"],
    definition:
      "The 22 trump cards of the tarot (The Fool, Death, The Tower, etc.) representing major life forces and archetypes; the Minor Arcana are the 56 suit cards covering everyday matters. Psyche reads both, often weaving the Majors into the show's mythology.",
    category: "tarot",
  },
  {
    word: "Reversed",
    aka: ["Reversal"],
    definition:
      "A tarot card that appears upside-down in a spread, traditionally read as a blocked, inverted, or shadow expression of its upright meaning. 'The Tower reversed' softens — or delays — the collapse.",
    category: "tarot",
  },
  {
    word: "The Tower",
    definition:
      "The tarot card of sudden collapse, upheaval, and revelation — the lightning-struck tower. A favorite Psyche reference for moments when someone's carefully built illusion comes crashing down on stream. 'That was a Tower moment.'",
    category: "tarot",
  },
  {
    word: "The Fool's Journey",
    definition:
      "The narrative arc of the Major Arcana read as one story — the soul's progression from innocence (The Fool) to completion (The World). Psyche maps personal and community sagas onto this journey.",
    category: "tarot",
  },
  {
    word: "Clarifier",
    definition:
      "An additional card pulled to shed light on a confusing or ambiguous card already on the table. 'Let me pull a clarifier' — the reading needs more focus before it makes sense.",
    category: "tarot",
  },
  {
    word: "Synchronicity",
    definition:
      "A meaningful coincidence that feels too perfect to be random — Jung's term, central to Psyche's worldview. When a card, a song, and a chat message all align, that's synchronicity confirming you're on the right frequency.",
    category: "tarot",
  },
  {
    word: "Sigil",
    definition:
      "A symbol charged with intention, used in chaos magick to focus the will toward a goal. Psyche connects ancient sigil-craft to modern branding, logos, and even the show's own iconography.",
    category: "tarot",
  },
  {
    word: "Egregore",
    definition:
      "An occult concept for a collective thoughtform — an entity generated and sustained by the shared attention and belief of a group. Psyche frames the Cult of Psyche community itself as an egregore: a living being made of attention.",
    category: "tarot",
  },
  {
    word: "Shadow Self",
    definition:
      "The repressed, hidden side of the personality — everything you refuse to acknowledge about yourself. Distinct from 'shadow work,' which is the practice; the shadow self is the material. The panels often drag it into the light involuntarily.",
    category: "tarot",
  },
  {
    word: "Smudging",
    definition:
      "The ritual of burning herbs (sage, palo santo) to cleanse a space of negative energy. Referenced when the panel feels 'off' or after a particularly toxic guest — the stream needs an energetic reset.",
    category: "tarot",
  },
  {
    word: "Solar Return",
    definition:
      "An astrological chart cast for the exact moment the sun returns to its natal position each year — essentially a cosmic birthday forecast. Psyche reads solar returns to map the themes of someone's coming year.",
    category: "tarot",
  },
  {
    word: "The Magician",
    definition:
      "The tarot card of will, manifestation, and channeling higher forces into material reality — 'as above, so below' incarnate. Psyche identifies with The Magician as the archetype of the creator who turns spirit into content.",
    category: "tarot",
  },
  {
    word: "High Priestess",
    definition:
      "The tarot card of intuition, hidden knowledge, and the subconscious — the keeper of mysteries behind the veil. A recurring archetype Psyche assigns to the show's most enigmatic feminine figures.",
    category: "tarot",
  },

  // ── PSYCHEVERSE ─────────────────────────────────────────────────
  {
    word: "The Awakening Hour",
    definition:
      "Psyche's term for the peak moment of a stream when the conversation transcends drama and becomes genuine collective insight — when the panel stops performing and starts revealing. Rare and sacred.",
    origin: "Cult of Psyche",
    category: "psycheverse",
  },
  {
    word: "Frequency",
    definition:
      "The energetic and intellectual register the show operates on. 'Match my frequency' or 'we're on the same frequency' signals genuine alignment. 'A different frequency' marks the show's post-2024 return — same format, evolved energy.",
    origin: "Cult of Psyche — recurring concept",
    category: "psycheverse",
  },
  {
    word: "The Codex Keeper",
    definition:
      "The role of maintaining and expanding the Cult Codex archive — cataloging transmissions, profiling figures, extracting lore. Part librarian, part mythologist, part AI operator.",
    origin: "Cult Codex",
    category: "psycheverse",
  },
  {
    word: "Mythmaking",
    definition:
      "The active process by which the show turns real events into legend — feuds become sagas, guests become archetypes, episodes become Cult Classics. Psyche is the chief mythmaker; the community co-authors.",
    usage: "\"You are the stormborn architect, a mythmaker who exposes illusions.\"",
    origin: "Cult of Psyche",
    category: "psycheverse",
  },
  {
    word: "The Transmission Log",
    definition:
      "The running chronological record of every episode the show has aired — the backbone of the Cult Codex. Each entry a dated signal in the larger mythology.",
    origin: "Cult Codex",
    category: "psycheverse",
  },
  {
    word: "Cult of Two",
    definition:
      "Psyche's phrase for the origin point of the community — the idea that even a connection between just two people can become a movement. 'The cult of two becomes the many.'",
    usage: "\"The cult of two becomes the many. Digital resurrection. Mystic alchemy.\"",
    origin: "Cult of Psyche lore",
    category: "psycheverse",
  },
  {
    word: "Soul Saga",
    definition:
      "A long-running personal narrative tracked across many episodes — a community member's evolution through arcs, redemptions, and relapses. The Psychenomicon catalogs the major soul sagas.",
    origin: "Cult Codex / Psychenomicon",
    category: "psycheverse",
  },
  {
    word: "The Altar",
    definition:
      "Psyche's on-stream setup — the candles, cards, cats, and crystals visible behind him. More than a backdrop, it's framed as a working altar that consecrates the broadcast space.",
    origin: "Cult of Psyche — stream setup",
    category: "psycheverse",
  },
  {
    word: "Spectacle",
    definition:
      "The Psycheverse term for the show's deliberate theatricality — the masks, the drama, the larger-than-life conflicts. Acknowledged openly: the spectacle is the medium through which real transformation sneaks in.",
    origin: "Cult of Psyche",
    category: "psycheverse",
  },
  {
    word: "The Comeback",
    aka: ["Comeback Stream"],
    definition:
      "Psyche's recurring narrative of return after a strike, ban, hiatus, or smear campaign. Each comeback is staged as resurrection — proof that the signal can't be permanently silenced.",
    origin: "Cult of Psyche — recurring arc",
    category: "psycheverse",
  },
  {
    word: "Wisdom Through Wounds",
    definition:
      "The core Psyche teaching that genuine insight is earned only through survived suffering — the wounded healer principle. Pain isn't an obstacle to wisdom; it's the price of it.",
    origin: "Cult of Psyche — philosophical teaching",
    category: "psycheverse",
  },
  {
    word: "The Open Door",
    definition:
      "Psyche's philosophy of radical accessibility — anyone can join the panel, return after a ban, or be heard. The open door is both the show's greatest strength and its biggest vulnerability to trolls.",
    origin: "Cult of Psyche — guiding principle",
    category: "psycheverse",
  },
  {
    word: "Ego Death",
    definition:
      "The dissolution of the constructed self, whether through psychedelics, spiritual crisis, or brutal public humiliation. In the Psycheverse, getting thoroughly exposed on panel is jokingly framed as a forced ego death — painful but clarifying.",
    category: "psycheverse",
  },

  // ── MUSIC & PERFORMANCE ─────────────────────────────────────────
  {
    word: "Diss Track",
    definition:
      "A song written specifically to attack a rival. A central weapon in the panelverse — Psyche's AI-generated diss tracks (see 'Biscuit Song') turn beef into art and often escalate feuds into full sagas.",
    category: "music",
  },
  {
    word: "Beat",
    definition:
      "The instrumental backing track over which someone raps or sings. 'Drop the beat' kicks off a freestyle. A hard beat can carry a mediocre verse; a great verse can elevate any beat.",
    category: "music",
  },
  {
    word: "Hook",
    aka: ["Chorus"],
    definition:
      "The catchy, repeated part of a song designed to lodge in your head. In panel rap battles, a strong hook can win the crowd even if the verses falter.",
    category: "music",
  },
  {
    word: "Cypher",
    definition:
      "A gathering where rappers take turns freestyling over a shared beat, building off each other's energy. Panel cyphers are communal performances — less competition than collaboration.",
    category: "music",
  },
  {
    word: "Acapella",
    definition:
      "Singing or rapping with no instrumental backing — just the raw voice. Acapella moments on the show strip the performance bare, revealing whether the bars actually hold up.",
    category: "music",
  },
  {
    word: "Auto-Tune",
    definition:
      "Pitch-correction software used to smooth or stylize vocals. In the panelverse it's both a tool and a punchline — 'turn off the auto-tune' is a challenge to prove someone can actually sing.",
    category: "music",
  },
  {
    word: "AI Track",
    aka: ["AI Song", "Suno Track"],
    definition:
      "A song generated using AI music tools, a signature of the modern Psycheverse. Psyche produces AI tracks for diss songs, devotionals, and lore anthems — turning prompts into the show's growing songbook.",
    origin: "Cult of Psyche — AI music production",
    category: "music",
  },
  {
    word: "Drop",
    definition:
      "The moment in a track when the beat hits full force after a build-up — or the release of any new song, video, or project. 'The drop goes crazy.' Anticipation, then payoff.",
    category: "music",
  },
  {
    word: "Anthem",
    definition:
      "A song that captures the spirit of the community and gets adopted as a rallying cry. 'Psyche Haters Club' and the 'Ten Mystical Women' cycle function as Psycheverse anthems — communal, repeatable, identity-defining.",
    category: "music",
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
    { color: "text-accent-gold-text", dot: "bg-accent-gold", label: "Show & Panel", categories: ["psycheverse", "panelverse"] },
    { color: "text-accent-cyan", dot: "bg-accent-cyan", label: "Platform & Moderation", categories: ["streaming", "moderation"] },
    { color: "text-accent-violet-text", dot: "bg-accent-violet", label: "Spiritual & Mystic", categories: ["tarot"] },
    { color: "text-red-400", dot: "bg-red-400", label: "Social & Slang", categories: ["community", "slang"] },
    { color: "text-pink-400", dot: "bg-pink-400", label: "Music & Performance", categories: ["music"] },
  ];

  return (
    <>
      <PageHero
        title="PANELVERSE LEXICON"
        subtitle={`${LEXICON.length} terms from the Cult of Psyche and the wider Panelverse`}
        backgroundImage="/wiki-page-header.jpg"
      
      label="lexicon"
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
              className="w-7 h-7 flex items-center justify-center rounded border border-white/10 text-text-muted hover:text-accent-gold-text hover:border-accent-gold/40 transition-colors"
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
                  <h3 className="font-display text-lg font-bold text-accent-gold-text border-b border-accent-gold/20 pb-1 mb-3">
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
            <div id={`cat-${cat}`} key={cat}>
            <SectionCard title={meta.label}>
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
              episode summaries, 497 community member profiles, 2,781 lore
              entries, and 3,476 topics catalogued in the Cult Codex archive.
              Definitions are derived from contextual usage within the show,
              supplemented by community knowledge and Urban Dictionary where
              applicable.
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
