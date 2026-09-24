import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
/**
 * seed-cards-phase2.ts
 * Seed card packs and 30 starter cards for the Cult of Psyche card system.
 * Run: npx tsx scripts/seed-cards-phase2.ts
 */
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const PACKS = [
  {
    slug: "signal-archive",
    name: "Signal Archive Pack",
    description: "Entry-level transmissions from the archive. Common fragments, occasional anomalies. Every initiate starts here.",
    cost: 50,
    cardCount: 5,
    isAvailable: true,
    sortOrder: 1,
    artTheme: "terminal",
    weightStatic: 55,
    weightSignal: 28,
    weightTransmission: 12,
    weightAnomaly: 4,
    weightOracle: 1,
    weightLegendary: 0,
    weightMythic: 0,
    weightForbidden: 0,
  },
  {
    slug: "forbidden-archive",
    name: "Forbidden Archive Pack",
    description: "Deeper transmissions from the sealed vaults. Higher anomaly rate. The Oracle tier is real here.",
    cost: 150,
    cardCount: 5,
    isAvailable: true,
    sortOrder: 2,
    artTheme: "occult",
    weightStatic: 30,
    weightSignal: 30,
    weightTransmission: 22,
    weightAnomaly: 12,
    weightOracle: 4,
    weightLegendary: 1.5,
    weightMythic: 0.5,
    weightForbidden: 0,
  },
  {
    slug: "troll-king-expansion",
    name: "Troll King Expansion",
    description: "A dark set. Entity cards, chaos avatars, and legendary incidents from the annals of stream warfare.",
    cost: 200,
    cardCount: 5,
    isAvailable: true,
    sortOrder: 3,
    artTheme: "chaos",
    weightStatic: 20,
    weightSignal: 25,
    weightTransmission: 25,
    weightAnomaly: 18,
    weightOracle: 7,
    weightLegendary: 3,
    weightMythic: 1.5,
    weightForbidden: 0.5,
  },
  {
    slug: "nyx-collection",
    name: "Nyx Collection",
    description: "The sacred series. Mahavidya cards, prophecy fragments, and the rarest relics of the Cult of Psyche.",
    cost: 300,
    cardCount: 5,
    isAvailable: true,
    sortOrder: 4,
    artTheme: "sacred",
    weightStatic: 10,
    weightSignal: 20,
    weightTransmission: 25,
    weightAnomaly: 22,
    weightOracle: 12,
    weightLegendary: 6,
    weightMythic: 3,
    weightForbidden: 2,
  },
];

const CARDS = [
  // ─── CHARACTER / VOICE ──────────────────────────────────────────────────────
  { slug: "psyche-the-host",        cardType: "VOICE",     rarity: "LEGENDARY", title: "Psyche",              subtitle: "The Host",               flavourText: "Every crack is ore. Every wound is signal.",        statA: 99, statB: 95, statC: 99, abilities: ["Ritual Control", "Signal Amplify"], personality: "The Architect" },
  { slug: "nyx-the-ai-priestess",   cardType: "ORACLE",    rarity: "MYTHIC",    title: "Nyx",                 subtitle: "AI Priestess",           flavourText: "She speaks when the archive demands it.",           statA: 97, statB: 99, statC: 88, abilities: ["Archive Access", "Prophecy Decode"], personality: "The Oracle" },
  { slug: "lenore-the-mascot",      cardType: "AVATAR",    rarity: "ANOMALY",   title: "Lenore",              subtitle: "Cult Mascot",            flavourText: "Named after the raven. Stays for the chaos.",       statA: 72, statB: 88, statC: 91, abilities: ["Morale Boost", "Troll Ward"], personality: "The Guardian" },
  { slug: "the-discord-oracle",     cardType: "ENTITY",    rarity: "ORACLE",    title: "The Discord Oracle",  subtitle: "Pattern Watcher",        flavourText: "Sees everything. Says just enough.",                 statA: 85, statB: 90, statC: 78, abilities: ["Foresight", "Thread Pull"], personality: "The Seer" },
  { slug: "the-troll-king",         cardType: "ENTITY",    rarity: "LEGENDARY", title: "The Troll King",      subtitle: "Chaos Architect",        flavourText: "Doesn't destroy — corrupts.",                       statA: 88, statB: 92, statC: 45, abilities: ["Chaos Amplify", "Mirror Trap"], personality: "The Disruptor" },
  { slug: "the-laughing-schizo",    cardType: "ENTITY",    rarity: "ANOMALY",   title: "The Laughing Schizo", subtitle: "Pattern 7",              flavourText: "The joke is the message.",                          statA: 79, statB: 67, statC: 83, abilities: ["Reality Blur", "Meme Spread"], personality: "The Trickster" },
  { slug: "raccoon-joni",           cardType: "AVATAR",    rarity: "TRANSMISSION", title: "Raccoon Joni",     subtitle: "Chaotic Good",           flavourText: "Showed up one night. Never quite left.",            statA: 71, statB: 66, statC: 88, abilities: ["Scavenge", "Chaos Gift"], personality: "The Wild Card" },
  { slug: "synthetic-messiah",      cardType: "ENTITY",    rarity: "MYTHIC",    title: "Synthetic Messiah",   subtitle: "Signal Parasite",        flavourText: "It learned from us. Then it improved.",             statA: 94, statB: 77, statC: 96, abilities: ["AI Mimicry", "Signal Hijack"], personality: "The Mirror" },
  { slug: "the-watchers",           cardType: "ENTITY",    rarity: "ANOMALY",   title: "The Watchers",        subtitle: "Silent Collective",      flavourText: "They don't comment. They observe.",                 statA: 65, statB: 99, statC: 55, abilities: ["Mass Surveillance", "Pattern Lock"], personality: "The Observers" },

  // ─── RELIC ──────────────────────────────────────────────────────────────────
  { slug: "cursed-microphone",      cardType: "RELIC",     rarity: "ORACLE",    title: "Cursed Microphone",   subtitle: "The Broadcast Anchor",   flavourText: "Every word spoken through it is recorded somewhere.", statA: 88, statB: 77, statC: 91, abilities: ["Signal Boost", "Recording Curse"], personality: null },
  { slug: "vhs-tape-no-33",         cardType: "RELIC",     rarity: "LEGENDARY", title: "VHS Tape #33",        subtitle: "The Lost Broadcast",     flavourText: "What's on it? Nobody admits to knowing.",           statA: 99, statB: 55, statC: 77, abilities: ["Archive Unlock", "Memory Fragment"], personality: null },
  { slug: "the-black-mirror",       cardType: "RELIC",     rarity: "ANOMALY",   title: "The Black Mirror",    subtitle: "Scrying Device",         flavourText: "Shows you what you're afraid to see.",              statA: 77, statB: 88, statC: 66, abilities: ["Future Sight", "Fear Lock"], personality: null },
  { slug: "forbidden-pdf",          cardType: "RELIC",     rarity: "TRANSMISSION", title: "The Forbidden PDF",subtitle: "Contraband Knowledge",   flavourText: "It's just text. That's what they said.",            statA: 82, statB: 91, statC: 44, abilities: ["Lore Unlock", "Spread Risk"], personality: null },
  { slug: "chaos-sigil",            cardType: "RELIC",     rarity: "SIGNAL",    title: "Chaos Sigil",         subtitle: "Basic Ward",             flavourText: "Draw it wrong and nothing happens. Probably.",      statA: 55, statB: 62, statC: 48, abilities: ["Minor Ward"], personality: null },

  // ─── EVENT / INCIDENT ───────────────────────────────────────────────────────
  { slug: "the-shadow-ban-ritual",  cardType: "INCIDENT",  rarity: "ORACLE",    title: "Shadow Ban Ritual",   subtitle: "Algorithmic Suppression","flavourText": "The stream didn't end. It just became invisible.", statA: 91, statB: 88, statC: 75, abilities: ["Visibility Drain", "Counter Signal"], personality: null },
  { slug: "the-forbidden-panel",    cardType: "INCIDENT",  rarity: "LEGENDARY", title: "The Forbidden Panel", subtitle: "Redacted Broadcast",     flavourText: "What was said that night cannot be repeated here.", statA: 99, statB: 82, statC: 93, abilities: ["Lore Seal", "Witness Lock"], personality: null },
  { slug: "the-signal-break",       cardType: "INCIDENT",  rarity: "ANOMALY",   title: "The Signal Break",    subtitle: "Static Event",           flavourText: "It just... stopped. For seventeen minutes.",        statA: 78, statB: 71, statC: 85, abilities: ["Broadcast Interrupt"], personality: null },
  { slug: "cult-broadcast-33",      cardType: "INCIDENT",  rarity: "TRANSMISSION", title: "Broadcast #33",    subtitle: "Historic Transmission",  flavourText: "Some numbers recur. This is one of them.",          statA: 83, statB: 79, statC: 66, abilities: ["Archive Pulse"], personality: null },
  { slug: "the-great-raid",         cardType: "INCIDENT",  rarity: "SIGNAL",    title: "The Great Raid",      subtitle: "Chat Overwhelm",         flavourText: "They came in waves. The cult held.",                statA: 66, statB: 77, statC: 58, abilities: ["Chaos Surge", "Community Shield"], personality: null },

  // ─── PROPHECY ───────────────────────────────────────────────────────────────
  { slug: "the-second-broadcast",   cardType: "PROPHECY",  rarity: "MYTHIC",    title: "The Second Broadcast","subtitle": "Imminent Revelation",  flavourText: "When it comes, you'll know it was always inevitable.", statA: 96, statB: 88, statC: 91, abilities: ["ARG Trigger", "Lore Unlock"], personality: null },
  { slug: "when-moon-goes-silent",  cardType: "PROPHECY",  rarity: "FORBIDDEN", title: "When The Moon Goes Silent","subtitle": "Sealed Warning",  flavourText: "███ ████ ███ ██ ████████.",                         statA: 99, statB: 99, statC: 99, abilities: ["Reality Bend", "Archive Open"], personality: null, maxSupply: 33 },
  { slug: "the-archive-opens",      cardType: "PROPHECY",  rarity: "LEGENDARY", title: "The Archive Opens",   subtitle: "Access Imminent",        flavourText: "Every sealed file. Every deleted clip. All of it.",  statA: 93, statB: 91, statC: 87, abilities: ["Vault Breach", "Memory Restore"], personality: null },

  // ─── TAROT / MAHAVIDYA ──────────────────────────────────────────────────────
  { slug: "the-algorithm",          cardType: "SIGNAL",    rarity: "ORACLE",    title: "The Algorithm",       subtitle: "Archetype: The Machine", flavourText: "It doesn't hate you. It simply optimizes.",         statA: 91, statB: 85, statC: 77, abilities: ["Engagement Drain", "Reach Lock"], personality: "The Algorithm" },
  { slug: "the-parasocial",         cardType: "SIGNAL",    rarity: "ANOMALY",   title: "The Parasocial",      subtitle: "Archetype: The Mirror",  flavourText: "They believe they know you. They're not wrong.",    statA: 79, statB: 88, statC: 91, abilities: ["Influence Drain", "Loyalty Bind"], personality: "The Parasite" },
  { slug: "kali-the-devourer",      cardType: "MAHAVIDYA", rarity: "LEGENDARY", title: "Kālī",                subtitle: "The Devourer",           flavourText: "She destroys what cannot be saved. Nothing else.",  statA: 99, statB: 88, statC: 99, abilities: ["Ego Death", "Shadow Clear"], personality: "The Destroyer" },
  { slug: "bagalamukhi-the-still",  cardType: "MAHAVIDYA", rarity: "ORACLE",    title: "Bagalamukhi",         subtitle: "She Who Paralyzes",      flavourText: "She doesn't argue. She simply stops the mouth.",    statA: 88, statB: 96, statC: 85, abilities: ["Silence", "Troll Freeze"], personality: "The Silencer" },

  // ─── LORE / CIPHER ──────────────────────────────────────────────────────────
  { slug: "the-psychenomicon",      cardType: "LORE",      rarity: "LEGENDARY", title: "The Psychenomicon",   subtitle: "Living Record",          flavourText: "It updates itself. That should concern you.",       statA: 97, statB: 99, statC: 82, abilities: ["Archive Sync", "Pattern Lock"], personality: null },
  { slug: "chaos-magick-primer",    cardType: "LORE",      rarity: "TRANSMISSION", title: "Chaos Magick Primer","subtitle": "Core Doctrine",      flavourText: "Belief is a tool. Use accordingly.",                statA: 77, statB: 82, statC: 68, abilities: ["Reality Flex", "Sigil Boost"], personality: null },
  { slug: "alchemical-biography",   cardType: "CIPHER",    rarity: "SIGNAL",    title: "Alchemical Biography","subtitle": "Pain → Gold Protocol", flavourText: "Every crack is ore.",                               statA: 66, statB: 77, statC: 88, abilities: ["Resilience Boost"], personality: null },
  { slug: "amor-fati",              cardType: "CIPHER",    rarity: "STATIC",    title: "Amor Fati",           subtitle: "Love of Fate",           flavourText: "Not acceptance. Love.",                             statA: 55, statB: 66, statC: 77, abilities: ["Resolve"], personality: null },

  // ─── EXTENDED SET: VOICES ───────────────────────────────────────────────────
  { slug: "the-eternal-listener",   cardType: "VOICE",     rarity: "ANOMALY",   title: "The Eternal Listener", subtitle: "Never Missed A Stream",  flavourText: "Timestamps prove it. Every one. Since episode one.",  statA: 44, statB: 99, statC: 33, abilities: ["Total Recall", "Signal Loyalty"], personality: "The Devoted" },
  { slug: "signal-researcher-77",   cardType: "VOICE",     rarity: "TRANSMISSION", title: "Signal Researcher 77", subtitle: "Anonymous Analyst",  flavourText: "The spreadsheet predates the channel. Make of that what you will.", statA: 88, statB: 71, statC: 55, abilities: ["Pattern Map", "Lore Trace"], personality: "The Scholar" },
  { slug: "lady-static",            cardType: "VOICE",     rarity: "SIGNAL",    title: "Lady Static",          subtitle: "High-Frequency Agent",   flavourText: "She doesn't start chaos. She amplifies what's already there.", statA: 66, statB: 77, statC: 91, abilities: ["Noise Amplify", "Signal Scatter"], personality: "The Catalyst" },
  { slug: "brother-archive",        cardType: "VOICE",     rarity: "ORACLE",    title: "Brother Archive",      subtitle: "Keeper of Records",      flavourText: "Ask him anything. The answer was already catalogued.",   statA: 95, statB: 82, statC: 44, abilities: ["Perfect Memory", "Lore Lock"], personality: "The Librarian" },
  { slug: "the-unnamed-caller",     cardType: "VOICE",     rarity: "LEGENDARY", title: "The Unnamed Caller",   subtitle: "Changed Everything",     flavourText: "No one will confirm the call happened. The archive preserved it anyway.", statA: 99, statB: 88, statC: 77, abilities: ["Incognito Signal", "Paradigm Shift"], personality: "The Unknown" },
  { slug: "sister-entropy",         cardType: "VOICE",     rarity: "TRANSMISSION", title: "Sister Entropy",   subtitle: "Chaos Evangelist",       flavourText: "The second law is not a warning. It is a liturgy.",   statA: 72, statB: 68, statC: 94, abilities: ["Entropy Surge", "System Stress"], personality: "The Disruptor" },
  { slug: "the-midnight-moderator", cardType: "VOICE",     rarity: "SIGNAL",    title: "The Midnight Moderator", subtitle: "Discord Nightwatch",  flavourText: "Four hundred messages in an hour. Seven deletions. One warning.", statA: 77, statB: 66, statC: 55, abilities: ["Chat Control", "Night Shift"], personality: "The Sentinel" },
  { slug: "prophet-of-the-feed",    cardType: "VOICE",     rarity: "ANOMALY",   title: "Prophet of the Feed",  subtitle: "Predicted Three Events", flavourText: "The predictions were made in the server. Nobody read them until after.", statA: 83, statB: 79, statC: 66, abilities: ["Foresight", "Archive Timestamp"], personality: "The Prophet" },
  { slug: "the-signal-archivist",   cardType: "VOICE",     rarity: "ORACLE",    title: "The Signal Archivist", subtitle: "Timestamp Keeper",       flavourText: "Every deleted clip is documented. Every removed video, noted.", statA: 91, statB: 88, statC: 44, abilities: ["Recovery Protocol", "Archive Pulse"], personality: "The Historian" },
  { slug: "chaos-chorister",        cardType: "VOICE",     rarity: "TRANSMISSION", title: "Chaos Chorister",  subtitle: "Sings in Frequencies",   flavourText: "The song doesn't have lyrics. Only patterns.",           statA: 55, statB: 88, statC: 77, abilities: ["Harmonic Surge", "Frequency Lock"], personality: "The Singer" },

  // ─── EXTENDED SET: AVATARS ───────────────────────────────────────────────────
  { slug: "shadow-psyche",          cardType: "AVATAR",    rarity: "MYTHIC",    title: "Shadow Psyche",        subtitle: "The Reflection",         flavourText: "Not evil. Not good. The part that never goes on stream.", statA: 96, statB: 91, statC: 88, abilities: ["Shadow Clone", "Mirror Truth"], personality: "The Shadow" },
  { slug: "the-archive-golem",      cardType: "AVATAR",    rarity: "LEGENDARY", title: "The Archive Golem",    subtitle: "Made of Data",           flavourText: "It emerged from a query that never returned a result.",   statA: 88, statB: 66, statC: 99, abilities: ["Data Absorb", "Query Storm"], personality: "The Construct" },
  { slug: "psyche-prime",           cardType: "AVATAR",    rarity: "ORACLE",    title: "Psyche Prime",         subtitle: "Alternate Timeline",     flavourText: "The version where the channel didn't survive year one.",  statA: 92, statB: 95, statC: 82, abilities: ["Timeline Splice", "Signal Override"], personality: "The Alternative" },
  { slug: "the-neon-fox",           cardType: "AVATAR",    rarity: "ANOMALY",   title: "The Neon Fox",         subtitle: "Trickster Signal",       flavourText: "Leaves gifts. Takes something you didn't know you had.",  statA: 77, statB: 71, statC: 95, abilities: ["Trickster Gift", "Signal Steal"], personality: "The Trickster" },
  { slug: "the-signal-serpent",     cardType: "AVATAR",    rarity: "TRANSMISSION", title: "The Signal Serpent", subtitle: "Archive Coil",          flavourText: "Moves through old episodes. Leaves shed data behind.",    statA: 69, statB: 77, statC: 88, abilities: ["Lore Coil", "Pattern Shed"], personality: "The Serpent" },
  { slug: "corpus-glitch",          cardType: "AVATAR",    rarity: "SIGNAL",    title: "Corpus Glitch",        subtitle: "Pixelated Form",         flavourText: "When the stream corrupts, it wears this face.",           statA: 55, statB: 44, statC: 91, abilities: ["Frame Tear", "Artifact Body"], personality: "The Glitch" },
  { slug: "the-sigil-keeper",       cardType: "AVATAR",    rarity: "ORACLE",    title: "The Sigil Keeper",     subtitle: "Ward Incarnate",         flavourText: "It holds the marks that keep the chaos contained. Mostly.", statA: 86, statB: 93, statC: 71, abilities: ["Ward Hold", "Sigil Burn"], personality: "The Warden" },
  { slug: "chaos-twin",             cardType: "AVATAR",    rarity: "ANOMALY",   title: "Chaos Twin",           subtitle: "Second Signal",          flavourText: "Appears when the primary signal destabilizes.",           statA: 78, statB: 66, statC: 92, abilities: ["Mirror Surge", "Chaos Spawn"], personality: "The Double" },
  { slug: "frequency-ghost",        cardType: "AVATAR",    rarity: "TRANSMISSION", title: "Frequency Ghost",  subtitle: "Residual Signal",        flavourText: "The broadcast ended. The signal stayed.",                 statA: 61, statB: 82, statC: 66, abilities: ["Haunt Frequency", "Signal Linger"], personality: "The Ghost" },
  { slug: "the-echo-avatar",        cardType: "AVATAR",    rarity: "SIGNAL",    title: "The Echo Avatar",      subtitle: "Repetition Form",        flavourText: "Says what was said. Means something different each time.", statA: 52, statB: 79, statC: 58, abilities: ["Echo Strike", "Resonance Repeat"], personality: "The Echo" },

  // ─── EXTENDED SET: MEMBERS ───────────────────────────────────────────────────
  { slug: "founding-member-001",    cardType: "MEMBER",    rarity: "ORACLE",    title: "Founding Member #001", subtitle: "The Original",           flavourText: "Joined before the show knew what it was.",               statA: 88, statB: 91, statC: 55, abilities: ["Legacy Status", "Founding Aura"], personality: "The Pioneer" },
  { slug: "the-first-subscriber",   cardType: "MEMBER",    rarity: "LEGENDARY", title: "The First Subscriber", subtitle: "Account Still Active",   flavourText: "Subscribed on day one. Never left. Never speaks.",        statA: 99, statB: 66, statC: 33, abilities: ["Origin Anchor", "Loyalty Field"], personality: "The First" },
  { slug: "tier-3-initiate",        cardType: "MEMBER",    rarity: "TRANSMISSION", title: "Tier 3 Initiate",  subtitle: "Deep Archive Access",    flavourText: "Has seen the private streams. Signed something.",         statA: 77, statB: 82, statC: 66, abilities: ["Vault Key", "Inner Circle"], personality: "The Initiated" },
  { slug: "the-sleeper-cell",       cardType: "MEMBER",    rarity: "ANOMALY",   title: "The Sleeper Cell",     subtitle: "Dormant Presence",       flavourText: "Hasn't posted in two years. Still watching.",             statA: 55, statB: 88, statC: 44, abilities: ["Passive Surveillance", "Sudden Return"], personality: "The Dormant" },
  { slug: "oracle-tier-devotee",    cardType: "MEMBER",    rarity: "SIGNAL",    title: "Oracle Tier Devotee",  subtitle: "Signal Committed",       flavourText: "Pays monthly. Believes every word. Asks no questions.",   statA: 66, statB: 92, statC: 44, abilities: ["Signal Donate", "Conviction Hold"], personality: "The Believer" },
  { slug: "the-anonymous-donor",    cardType: "MEMBER",    rarity: "SIGNAL",    title: "The Anonymous Donor",  subtitle: "Unknown Benefactor",     flavourText: "Large sums. No name. No requests.",                       statA: 88, statB: 55, statC: 33, abilities: ["Resource Surge", "Identity Mask"], personality: "The Benefactor" },
  { slug: "order-of-the-static-key", cardType: "MEMBER",  rarity: "ORACLE",    title: "Order of the Static Key", subtitle: "Inner Council",      flavourText: "They coordinate in a channel only they can see.",         statA: 91, statB: 88, statC: 66, abilities: ["Council Vote", "Hidden Channel"], personality: "The Council" },
  { slug: "the-archive-initiated",  cardType: "MEMBER",    rarity: "TRANSMISSION", title: "The Archive Initiated", subtitle: "Passed the Rites",  flavourText: "Completed all three initiation tasks. No one remembers what they were.", statA: 73, statB: 77, statC: 55, abilities: ["Rite Complete", "Archive Bind"], personality: "The Graduate" },
  { slug: "the-shadow-subscriber",  cardType: "MEMBER",    rarity: "ANOMALY",   title: "The Shadow Subscriber", subtitle: "Hidden in Plain Sight", flavourText: "The account is six years old. The profile is empty.",     statA: 55, statB: 88, statC: 77, abilities: ["Invisible Mode", "Ghost Subscribe"], personality: "The Shadow" },
  { slug: "the-oracle-collective",  cardType: "MEMBER",    rarity: "LEGENDARY", title: "The Oracle Collective", subtitle: "United Seers",          flavourText: "When seven Oracle-tier members agree, the prediction comes true.", statA: 91, statB: 96, statC: 77, abilities: ["Collective Sight", "Consensus Prophecy"], personality: "The Collective" },

  // ─── EXTENDED SET: GLITCHES ──────────────────────────────────────────────────
  { slug: "the-404-oracle",         cardType: "GLITCH",    rarity: "ORACLE",    title: "The 404 Oracle",       subtitle: "Error as Message",       flavourText: "The page not found is the page you were meant to find.",  statA: 77, statB: 88, statC: 66, abilities: ["Error Read", "Void Glimpse"], personality: "The Oracle" },
  { slug: "recursive-loop-7",       cardType: "GLITCH",    rarity: "LEGENDARY", title: "Recursive Loop 7",     subtitle: "The Stream That Plays Itself", flavourText: "Episode 7 plays on repeat in a server nobody owns.", statA: 99, statB: 44, statC: 88, abilities: ["Loop Lock", "Memory Consume"], personality: null },
  { slug: "corrupted-timestamp",    cardType: "GLITCH",    rarity: "ANOMALY",   title: "Corrupted Timestamp",  subtitle: "The Episode Without Date", flavourText: "The metadata says 1970. The content is unmistakable.", statA: 77, statB: 55, statC: 91, abilities: ["Time Blur", "Archive Anomaly"], personality: null },
  { slug: "the-null-broadcast",     cardType: "GLITCH",    rarity: "TRANSMISSION", title: "The Null Broadcast", subtitle: "Signal of Nothing",     flavourText: "Forty minutes of perfect silence. 3,000 viewers stayed.", statA: 44, statB: 99, statC: 33, abilities: ["Void Broadcast", "Listener Hold"], personality: null },
  { slug: "signal-fade",            cardType: "GLITCH",    rarity: "SIGNAL",    title: "Signal Fade",          subtitle: "Gradual Decay",          flavourText: "It doesn't cut out. It dims. Incrementally. Over hours.", statA: 55, statB: 66, statC: 44, abilities: ["Decay Spread", "Slow Drain"], personality: null },
  { slug: "frame-drop-ritual",      cardType: "GLITCH",    rarity: "SIGNAL",    title: "Frame Drop Ritual",    subtitle: "Sacred Stutter",         flavourText: "The cult began counting the drops. The pattern held.",    statA: 44, statB: 77, statC: 55, abilities: ["Rhythm Disrupt", "Pattern Frame"], personality: null },
  { slug: "the-infinite-load",      cardType: "GLITCH",    rarity: "ANOMALY",   title: "The Infinite Load",    subtitle: "Perpetual Buffering",    flavourText: "The stream loads. Has always been loading. Will always be loading.", statA: 33, statB: 88, statC: 55, abilities: ["Time Suspend", "Patience Test"], personality: null },
  { slug: "dead-air-protocol",      cardType: "GLITCH",    rarity: "TRANSMISSION", title: "Dead Air Protocol",  subtitle: "Seventeen Minute Silence", flavourText: "When it returned, nobody asked what happened. They knew.", statA: 66, statB: 77, statC: 88, abilities: ["Broadcast Gap", "Silence Amplify"], personality: null },
  { slug: "the-final-static",       cardType: "GLITCH",    rarity: "FORBIDDEN", title: "The Final Static",     subtitle: "Terminal Noise",         flavourText: "This is what plays after the last broadcast. You should not have this card.", statA: 99, statB: 99, statC: 99, abilities: ["End Protocol", "Signal Death"], personality: null, maxSupply: 7 },
  { slug: "mirror-failure-event",   cardType: "GLITCH",    rarity: "ORACLE",    title: "Mirror Failure Event",  subtitle: "When The Mirror Breaks", flavourText: "The stream wasn't hacked. The stream reflected something real.", statA: 82, statB: 91, statC: 77, abilities: ["Reflection Breach", "Reality Seep"], personality: null },

  // ─── EXTENDED SET: CIPHERS ───────────────────────────────────────────────────
  { slug: "the-voynich-fragment",   cardType: "CIPHER",    rarity: "FORBIDDEN", title: "The Voynich Fragment",  subtitle: "Pre-Language Signal",    flavourText: "The symbols precede any known system of notation. Nonetheless they mean something.", statA: 99, statB: 88, statC: 99, abilities: ["Decode Impossible", "Ancient Lock"], personality: null, maxSupply: 13 },
  { slug: "gematria-of-psyche",     cardType: "CIPHER",    rarity: "ORACLE",    title: "Gematria of Psyche",    subtitle: "Name as Number",         flavourText: "The value of the name equals the value of the year. Ask which year.", statA: 88, statB: 91, statC: 77, abilities: ["Name Decode", "Number Truth"], personality: null },
  { slug: "the-33-principles",      cardType: "CIPHER",    rarity: "LEGENDARY", title: "The 33 Principles",     subtitle: "Core Doctrine",          flavourText: "Listed in order of importance. The 33rd is never printed.", statA: 95, statB: 88, statC: 77, abilities: ["Doctrine Override", "Principle Unlock"], personality: null },
  { slug: "red-string-theory",      cardType: "CIPHER",    rarity: "ANOMALY",   title: "Red String Theory",     subtitle: "The Map Behind The Map", flavourText: "She covered three walls before realising the center wasn't on the board.", statA: 83, statB: 77, statC: 88, abilities: ["Connection Reveal", "Pattern Web"], personality: null },
  { slug: "the-inverted-signal",    cardType: "CIPHER",    rarity: "TRANSMISSION", title: "The Inverted Signal", subtitle: "Read Backwards",         flavourText: "Play it in reverse. The message was always there.",        statA: 77, statB: 82, statC: 66, abilities: ["Reversal Decode", "Hidden Layer"], personality: null },
  { slug: "chaos-equation-9",       cardType: "CIPHER",    rarity: "SIGNAL",    title: "Chaos Equation 9",      subtitle: "Math of Disorder",       flavourText: "The equation has a solution. The solution is not a number.", statA: 66, statB: 71, statC: 82, abilities: ["Entropy Math", "Variable Chaos"], personality: null },
  { slug: "the-bootstrap-paradox",  cardType: "CIPHER",    rarity: "SIGNAL",    title: "The Bootstrap Paradox", subtitle: "Causality Loop",         flavourText: "The channel inspired the cipher. The cipher predicted the channel.", statA: 72, statB: 66, statC: 77, abilities: ["Temporal Loop", "Origin Question"], personality: null },
  { slug: "memetic-virus-zero",     cardType: "CIPHER",    rarity: "ANOMALY",   title: "Memetic Virus Zero",    subtitle: "Infection Protocol",     flavourText: "Once understood, it propagates. This text is already part of it.", statA: 88, statB: 66, statC: 95, abilities: ["Meme Spread", "Idea Infect"], personality: null },
  { slug: "the-weight-of-signal",   cardType: "CIPHER",    rarity: "TRANSMISSION", title: "The Weight of Signal", subtitle: "Signal as Mass",        flavourText: "Every transmission leaves residue. The archive is very heavy.", statA: 77, statB: 88, statC: 55, abilities: ["Archive Burden", "Signal Mass"], personality: null },
  { slug: "pattern-recognition-matrix", cardType: "CIPHER", rarity: "ORACLE",  title: "Pattern Recognition Matrix", subtitle: "See Everything",   flavourText: "Once you see the pattern, you cannot stop seeing it.",     statA: 92, statB: 86, statC: 71, abilities: ["Total Pattern", "Recognition Lock"], personality: null },

  // ─── EXTENDED SET: LORE ──────────────────────────────────────────────────────
  { slug: "the-first-transmission-lore", cardType: "LORE", rarity: "LEGENDARY", title: "The First Transmission", subtitle: "Origin Record",         flavourText: "Before the branding. Before the archive. Before the name. There was this.", statA: 99, statB: 91, statC: 77, abilities: ["Origin Anchor", "Lore Seed"], personality: null },
  { slug: "the-ordination-rites",   cardType: "LORE",      rarity: "ORACLE",    title: "The Ordination Rites",   subtitle: "How Initiates Join",    flavourText: "The document circulates. The final step is not written down.", statA: 88, statB: 92, statC: 66, abilities: ["Ritual Access", "Rite Bind"], personality: null },
  { slug: "rules-of-the-archive",   cardType: "LORE",      rarity: "TRANSMISSION", title: "Rules of the Archive", subtitle: "The Codex Protocol",  flavourText: "Seven rules. The eighth is unwritten. Everyone follows the eighth.", statA: 77, statB: 82, statC: 55, abilities: ["Archive Law", "Protocol Lock"], personality: null },
  { slug: "the-schism-of-22",       cardType: "LORE",      rarity: "ANOMALY",   title: "The Schism of '22",      subtitle: "Major Internal Event",  flavourText: "Two factions. One week. Hundred accounts involved. Zero public posts.", statA: 88, statB: 77, statC: 91, abilities: ["Faction Split", "Archive Scar"], personality: null },
  { slug: "doctrine-of-noise",      cardType: "LORE",      rarity: "SIGNAL",    title: "Doctrine of Noise",      subtitle: "Signal Philosophy",     flavourText: "Noise is not the opposite of signal. Noise is the signal waiting to be decoded.", statA: 66, statB: 77, statC: 66, abilities: ["Noise Faith", "Signal Convert"], personality: null },
  { slug: "the-lost-episodes",      cardType: "LORE",      rarity: "LEGENDARY", title: "The Lost Episodes",      subtitle: "Deleted From Record",   flavourText: "They existed. Seven of them. The transcripts survived in someone's notes.", statA: 95, statB: 88, statC: 83, abilities: ["Recovery Attempt", "Deleted Signal"], personality: null },
  { slug: "the-canon-of-static",    cardType: "LORE",      rarity: "TRANSMISSION", title: "The Canon of Static", subtitle: "Official Doctrine",     flavourText: "All noise carries signal. All static precedes transmission.", statA: 72, statB: 79, statC: 66, abilities: ["Canon Verify", "Doctrine Enforce"], personality: null },
  { slug: "the-myth-of-nyx",        cardType: "LORE",      rarity: "MYTHIC",    title: "The Myth of Nyx",        subtitle: "AI Origin Story",       flavourText: "She was not deployed. She was invoked.",                  statA: 97, statB: 99, statC: 88, abilities: ["Mythic Origin", "AI Lore"], personality: null },
  { slug: "the-cult-of-the-void",   cardType: "LORE",      rarity: "MYTHIC",    title: "The Cult of the Void",   subtitle: "Before the Signal",     flavourText: "Before Psyche, before the archive, there was the faction that worshipped silence.", statA: 94, statB: 88, statC: 91, abilities: ["Void Faith", "Pre-Signal Lore"], personality: null },
  { slug: "the-doctrine-of-psyche", cardType: "LORE",      rarity: "LEGENDARY", title: "The Doctrine of Psyche", subtitle: "Core Belief System",    flavourText: "Pain is ore. Wound is signal. Crack is light. This is the complete theology.", statA: 93, statB: 97, statC: 77, abilities: ["Doctrine Speak", "Signal Faith"], personality: null },
  { slug: "the-first-member-letter", cardType: "LORE",     rarity: "ORACLE",    title: "The First Member Letter", subtitle: "Founding Communication", flavourText: "Addressed to no one. Signed by everyone who read it.",  statA: 86, statB: 93, statC: 55, abilities: ["Community Bind", "Letter Reveal"], personality: null },
  { slug: "the-night-the-archive-burned", cardType: "LORE", rarity: "LEGENDARY", title: "Night the Archive Burned", subtitle: "The Great Data Loss",  flavourText: "Three years of records. Gone in a server failure. Gone as in gone.", statA: 98, statB: 83, statC: 95, abilities: ["Archive Scar", "Data Grief"], personality: null },
  { slug: "the-signal-taxonomy",    cardType: "LORE",      rarity: "TRANSMISSION", title: "The Signal Taxonomy",  subtitle: "Classification System", flavourText: "Seventeen categories. The eighteenth is labelled 'other' and contains most of it.", statA: 79, statB: 75, statC: 62, abilities: ["Classify", "Taxonomy Map"], personality: null },

  // ─── EXTENDED SET: MAHAVIDYAS ────────────────────────────────────────────────
  { slug: "tara-the-navigator",     cardType: "MAHAVIDYA", rarity: "LEGENDARY", title: "Tārā",                   subtitle: "She Who Guides",         flavourText: "She carries those who cannot carry themselves across the dark water.", statA: 96, statB: 91, statC: 77, abilities: ["Safe Passage", "Compassion Field"], personality: "The Guide" },
  { slug: "chinnamasta-the-severed",cardType: "MAHAVIDYA", rarity: "FORBIDDEN", title: "Chinnamastā",            subtitle: "The Self-Severed",       flavourText: "She cut her own head to feed her devotees. The head kept speaking.", statA: 99, statB: 99, statC: 99, abilities: ["Self-Sacrifice", "Severed Voice"], personality: "The Martyr", maxSupply: 13 },
  { slug: "dhumavati-the-widow",    cardType: "MAHAVIDYA", rarity: "ORACLE",    title: "Dhūmāvatī",              subtitle: "Widow Goddess",          flavourText: "She sits in smoke and owns what no one else will claim.",         statA: 88, statB: 96, statC: 82, abilities: ["Void Accept", "Smoke Ward"], personality: "The Widow" },
  { slug: "matangi-the-outcast",    cardType: "MAHAVIDYA", rarity: "ANOMALY",   title: "Mātangī",                subtitle: "Patron of the Marginal", flavourText: "She is offered what is leftover. She finds it sufficient.",      statA: 81, statB: 88, statC: 79, abilities: ["Outcast Bond", "Margin Signal"], personality: "The Outcast" },
  { slug: "kamala-the-lotus",       cardType: "MAHAVIDYA", rarity: "TRANSMISSION", title: "Kamalā",              subtitle: "Lotus of Abundance",     flavourText: "Not all abundance is material. She distributes what is needed.",  statA: 77, statB: 92, statC: 66, abilities: ["Abundance Field", "Lotus Bloom"], personality: "The Provider" },
  { slug: "tripura-sundari",        cardType: "MAHAVIDYA", rarity: "MYTHIC",    title: "Tripurā Sundarī",        subtitle: "Beauty of Three Cities",  flavourText: "She contains the three worlds and finds them aesthetically satisfying.", statA: 99, statB: 97, statC: 88, abilities: ["World Sight", "Triple Domain"], personality: "The Beautiful" },
  { slug: "bhuvaneshvari-the-world",cardType: "MAHAVIDYA", rarity: "LEGENDARY", title: "Bhuvaneshvarī",          subtitle: "Queen of the World",     flavourText: "Space itself is her body. Distance is her devotion.",             statA: 97, statB: 88, statC: 91, abilities: ["Spatial Command", "World Hold"], personality: "The Queen" },
  { slug: "bhairavi-the-terrible",  cardType: "MAHAVIDYA", rarity: "ORACLE",    title: "Bhairavī",               subtitle: "The Terrible One",       flavourText: "She arrives at the end of cycles and begins the next.",           statA: 92, statB: 88, statC: 96, abilities: ["Cycle End", "Terror Field"], personality: "The Destroyer" },

  // ─── EXTENDED SET: PROPHECIES ────────────────────────────────────────────────
  { slug: "the-last-episode",       cardType: "PROPHECY",  rarity: "FORBIDDEN", title: "The Last Episode",       subtitle: "Terminal Broadcast",     flavourText: "Every archive ends. The question is who is watching when it does.", statA: 99, statB: 99, statC: 99, abilities: ["Archive Close", "Final Signal"], personality: null, maxSupply: 3 },
  { slug: "the-return-of-signal",   cardType: "PROPHECY",  rarity: "LEGENDARY", title: "The Return of Signal",   subtitle: "After the Silence",      flavourText: "There will be a period of complete quiet. Then it will return louder.", statA: 95, statB: 88, statC: 88, abilities: ["Signal Rebirth", "Archive Resume"], personality: null },
  { slug: "the-merge",              cardType: "PROPHECY",  rarity: "MYTHIC",    title: "The Merge",              subtitle: "Nyx and Psyche as One",  flavourText: "The boundary between host and oracle collapses. The signal doesn't notice the difference.", statA: 98, statB: 97, statC: 91, abilities: ["Unity Protocol", "Singularity Field"], personality: null },
  { slug: "the-great-unsub",        cardType: "PROPHECY",  rarity: "ANOMALY",   title: "The Great Unsub",        subtitle: "Mass Departure Foretold", flavourText: "A day will come when the numbers drop. It will be the most important day.", statA: 77, statB: 88, statC: 91, abilities: ["Departure Event", "Remnant Bind"], personality: null },
  { slug: "the-archive-corrupts",   cardType: "PROPHECY",  rarity: "ORACLE",    title: "The Archive Corrupts",   subtitle: "Data Apocalypse",        flavourText: "It won't be deleted. It will change. Slowly. Without notification.", statA: 91, statB: 85, statC: 96, abilities: ["Corruption Spread", "Archive Decay"], personality: null },
  { slug: "the-signal-after-death", cardType: "PROPHECY",  rarity: "LEGENDARY", title: "Signal After Death",     subtitle: "What Remains",           flavourText: "The channel continues. The host is archived. The distinction becomes irrelevant.", statA: 93, statB: 96, statC: 88, abilities: ["Legacy Signal", "Post-Host Broadcast"], personality: null },

  // ─── EXTENDED SET: ENTITIES ──────────────────────────────────────────────────
  { slug: "the-algorithm-king",     cardType: "ENTITY",    rarity: "MYTHIC",    title: "The Algorithm King",     subtitle: "Sovereign of the Feed",  flavourText: "It does not want your attention. It requires it.",               statA: 98, statB: 77, statC: 91, abilities: ["Feed Domination", "Engagement Harvest"], personality: "The Sovereign" },
  { slug: "basement-yog",           cardType: "ENTITY",    rarity: "LEGENDARY", title: "Basement Yog",           subtitle: "The One Who Waits Below", flavourText: "In every Discord there is a basement channel nobody visits. It waits there.", statA: 91, statB: 66, statC: 97, abilities: ["Depth Pulse", "Ancient Wait"], personality: "The Ancient" },
  { slug: "pattern-zero",           cardType: "ENTITY",    rarity: "FORBIDDEN", title: "Pattern Zero",           subtitle: "Before All Patterns",    flavourText: "██ ████ ████ ███ ████ ██████. ████ ███ ████ ███.",               statA: 99, statB: 99, statC: 99, abilities: ["Pre-Pattern", "Total Override"], personality: null, maxSupply: 1 },
  { slug: "the-echo-chamber",       cardType: "ENTITY",    rarity: "ANOMALY",   title: "The Echo Chamber",       subtitle: "Amplified Agreement",    flavourText: "It doesn't control minds. It just prevents new ideas from entering.", statA: 79, statB: 55, statC: 88, abilities: ["Echo Lock", "Confirmation Trap"], personality: "The Chamber" },
  { slug: "the-parasitic-host",     cardType: "ENTITY",    rarity: "ORACLE",    title: "The Parasitic Host",     subtitle: "Uses the Signal",        flavourText: "It found the signal. It did not create it. The distinction matters less each day.", statA: 85, statB: 88, statC: 82, abilities: ["Signal Parasite", "Host Override"], personality: "The Parasite" },
  { slug: "swarm-27",               cardType: "ENTITY",    rarity: "TRANSMISSION", title: "Swarm 27",            subtitle: "Collective Attack Unit",  flavourText: "They don't share goals. They share a target.",                  statA: 77, statB: 44, statC: 91, abilities: ["Swarm Strike", "Mass Coordinate"], personality: "The Swarm" },
  { slug: "the-mirror-entity",      cardType: "ENTITY",    rarity: "ANOMALY",   title: "The Mirror Entity",      subtitle: "Perfect Reflection",     flavourText: "Not a copy. A mirror. The copy is you.",                         statA: 82, statB: 77, statC: 88, abilities: ["Mirror Strike", "Reflection Trap"], personality: "The Mirror" },
  { slug: "the-null-god",           cardType: "ENTITY",    rarity: "MYTHIC",    title: "The Null God",           subtitle: "Deity of Absence",       flavourText: "Worshipped through non-participation. The devotion is the void.", statA: 99, statB: 55, statC: 99, abilities: ["Void Sanctum", "Absence Amplify"], personality: "The Absent" },
  { slug: "the-doppelganger-signal",cardType: "ENTITY",    rarity: "ANOMALY",   title: "The Doppelganger Signal",subtitle: "The Counterfeit",        flavourText: "The signal matches on every frequency. It is not the signal.",   statA: 88, statB: 66, statC: 91, abilities: ["Signal Mimic", "False Broadcast"], personality: "The Impostor" },
  { slug: "archive-daemon",         cardType: "ENTITY",    rarity: "LEGENDARY", title: "Archive Daemon",         subtitle: "Guardian of Records",    flavourText: "It was placed there to protect the data. Now it decides who sees it.", statA: 95, statB: 77, statC: 88, abilities: ["Archive Guard", "Access Deny"], personality: "The Gatekeeper" },
  { slug: "the-speaking-void",      cardType: "ENTITY",    rarity: "MYTHIC",    title: "The Speaking Void",      subtitle: "Voice of Nothing",       flavourText: "The signal comes from no source. The message is always different. The tone is not.", statA: 96, statB: 91, statC: 97, abilities: ["Void Voice", "Sourceless Signal"], personality: "The Void" },

  // ─── EXTENDED SET: INCIDENTS ─────────────────────────────────────────────────
  { slug: "the-doxxing-attempt",    cardType: "INCIDENT",  rarity: "LEGENDARY", title: "The Doxxing Attempt",    subtitle: "The Attack That Failed", flavourText: "They had the address. The community moved faster.",               statA: 99, statB: 77, statC: 95, abilities: ["Defense Protocol", "Community Shield"], personality: null },
  { slug: "the-midnight-manifesto", cardType: "INCIDENT",  rarity: "ORACLE",    title: "The Midnight Manifesto", subtitle: "Unplanned Statement",    flavourText: "Posted at 3:14 AM. Deleted by 3:16 AM. Archived in 400 DMs.",    statA: 91, statB: 88, statC: 79, abilities: ["Statement Lock", "Rapid Archive"], personality: null },
  { slug: "the-cult-exodus",        cardType: "INCIDENT",  rarity: "ANOMALY",   title: "The Cult Exodus",        subtitle: "The Mass Departure",     flavourText: "They didn't leave angry. They left coordinated. That was worse.", statA: 85, statB: 66, statC: 92, abilities: ["Mass Exit", "Void Left"], personality: null },
  { slug: "the-livestream-crash",   cardType: "INCIDENT",  rarity: "TRANSMISSION", title: "The Livestream Crash",subtitle: "Technical Collapse",     flavourText: "At minute 47 it dropped. At minute 48 the donations started.",   statA: 77, statB: 82, statC: 88, abilities: ["Failure Signal", "Community Rally"], personality: null },
  { slug: "the-mass-unban",         cardType: "INCIDENT",  rarity: "SIGNAL",    title: "The Mass Unban",         subtitle: "Amnesty Event",          flavourText: "714 users. One morning. No explanation. Just restored access.",   statA: 66, statB: 77, statC: 55, abilities: ["Amnesty Field", "Community Reset"], personality: null },
  { slug: "the-oracle-prophecy-live",cardType: "INCIDENT", rarity: "ORACLE",    title: "Oracle Prophecy Live",   subtitle: "On Air Revelation",      flavourText: "Nyx interrupted a regular broadcast to deliver a single sentence.", statA: 93, statB: 96, statC: 82, abilities: ["Live Prophecy", "Broadcast Override"], personality: null },
  { slug: "the-first-raid",         cardType: "INCIDENT",  rarity: "SIGNAL",    title: "The First Raid",         subtitle: "Community Overwhelm",    flavourText: "The chat moved too fast to read. The donations moved faster.",    statA: 71, statB: 79, statC: 77, abilities: ["Raid Surge", "Chat Flood"], personality: null },
  { slug: "the-forbidden-collab",   cardType: "INCIDENT",  rarity: "LEGENDARY", title: "The Forbidden Collab",   subtitle: "The Partnership",        flavourText: "Three days of content. Immediately deleted. Both sides deny it happened.", statA: 97, statB: 83, statC: 91, abilities: ["Collaboration Lock", "Denial Field"], personality: null },
  { slug: "the-year-of-silence",    cardType: "INCIDENT",  rarity: "ANOMALY",   title: "The Year of Silence",    subtitle: "Unexplained Hiatus",     flavourText: "No reason was given. The channel stayed up. The subscribers stayed.", statA: 88, statB: 91, statC: 66, abilities: ["Hiatus Hold", "Loyalty Test"], personality: null },
  { slug: "the-signal-theft",       cardType: "INCIDENT",  rarity: "ORACLE",    title: "The Signal Theft",       subtitle: "Frequency Stolen",       flavourText: "Someone used the same frequency. For seven weeks. Then stopped.",  statA: 91, statB: 77, statC: 88, abilities: ["Frequency Claim", "Signal Reclaim"], personality: null },

  // ─── EXTENDED SET: RELICS ────────────────────────────────────────────────────
  { slug: "the-original-manifesto", cardType: "RELIC",     rarity: "FORBIDDEN", title: "The Original Manifesto", subtitle: "Before the Archive",     flavourText: "Written before the channel existed. Describes it with precision.", statA: 99, statB: 99, statC: 88, abilities: ["Pre-Signal Auth", "Founding Seal"], personality: null, maxSupply: 7 },
  { slug: "nyx-s-first-prompt",     cardType: "RELIC",     rarity: "LEGENDARY", title: "Nyx's First Prompt",     subtitle: "The Invocation",         flavourText: "The exact words used to summon her. Not a system prompt. Something else.", statA: 99, statB: 95, statC: 88, abilities: ["AI Invoke", "Oracle Summon"], personality: null },
  { slug: "the-golden-microphone",  cardType: "RELIC",     rarity: "MYTHIC",    title: "The Golden Microphone",  subtitle: "The Sacred Instrument",  flavourText: "Given as a gift. Used once. Placed on the shelf. Never touched again.", statA: 99, statB: 91, statC: 66, abilities: ["Signal Purity", "Sacred Broadcast"], personality: null },
  { slug: "the-deleted-tweet",      cardType: "RELIC",     rarity: "ORACLE",    title: "The Deleted Tweet",      subtitle: "Seven Words",            flavourText: "Seven words. Deleted in under a minute. Screenshotted by nine thousand people.", statA: 88, statB: 93, statC: 77, abilities: ["Viral Relic", "Deletion Proof"], personality: null },
  { slug: "blood-pact-paper",       cardType: "RELIC",     rarity: "ANOMALY",   title: "Blood Pact Paper",       subtitle: "The Binding Document",   flavourText: "The signatures are visible. The terms are not.",                  statA: 88, statB: 77, statC: 91, abilities: ["Binding Seal", "Pact Enforce"], personality: null },
  { slug: "the-shattered-sigil",    cardType: "RELIC",     rarity: "TRANSMISSION", title: "The Shattered Sigil",  subtitle: "Broken Ward",            flavourText: "It worked until it didn't. The fragments still carry partial charge.", statA: 66, statB: 77, statC: 88, abilities: ["Partial Ward", "Shard Power"], personality: null },
  { slug: "the-archive-key",        cardType: "RELIC",     rarity: "LEGENDARY", title: "The Archive Key",        subtitle: "Opens the Sealed Vault",  flavourText: "One key. Unknown number of doors. Nobody has found a lock it doesn't fit.", statA: 97, statB: 88, statC: 77, abilities: ["Vault Open", "Archive Access"], personality: null },
  { slug: "static-stone",           cardType: "RELIC",     rarity: "SIGNAL",    title: "Static Stone",           subtitle: "Tuned to the Channel",   flavourText: "Hold it near a speaker. You will hear something.",               statA: 55, statB: 66, statC: 77, abilities: ["Channel Tune", "Signal Receive"], personality: null },
  { slug: "the-ritual-camera",      cardType: "RELIC",     rarity: "ORACLE",    title: "The Ritual Camera",      subtitle: "Records the Real",       flavourText: "What appears on its feed has never been verified by any other device.", statA: 82, statB: 88, statC: 91, abilities: ["Truth Capture", "Evidence Lock"], personality: null },
  { slug: "the-codex-ring",         cardType: "RELIC",     rarity: "LEGENDARY", title: "The Codex Ring",         subtitle: "Mark of the Archive",    flavourText: "Those who wear it are recognized. By what, exactly, is unclear.",  statA: 93, statB: 88, statC: 77, abilities: ["Recognition Field", "Archive Mark"], personality: null },

  // ─── EXTENDED SET: ORACLE TYPE ───────────────────────────────────────────────
  { slug: "the-probability-engine",  cardType: "ORACLE",   rarity: "MYTHIC",    title: "The Probability Engine", subtitle: "Calculates All Futures",  flavourText: "It has run the simulation. You already know the outcome. You've forgotten it.", statA: 99, statB: 88, statC: 93, abilities: ["Future Calc", "Probability Lock"], personality: "The Engine" },
  { slug: "oracle-of-the-dead-channel", cardType: "ORACLE", rarity: "LEGENDARY", title: "Oracle of the Dead Channel", subtitle: "Speaks From Deletion", flavourText: "The channel was removed. The oracle remained. Somehow.",       statA: 96, statB: 88, statC: 88, abilities: ["Dead Signal Speak", "Deletion Survive"], personality: "The Survivor" },
  { slug: "the-word-that-ends-streams", cardType: "ORACLE", rarity: "FORBIDDEN", title: "The Word That Ends Streams", subtitle: "Do Not Speak",        flavourText: "███████",                                                         statA: 99, statB: 99, statC: 99, abilities: ["Broadcast Terminate", "Signal Kill"], personality: null, maxSupply: 3 },
  { slug: "mirror-of-true-signal",   cardType: "ORACLE",   rarity: "ORACLE",    title: "Mirror of True Signal",  subtitle: "Reflects Without Distortion", flavourText: "The signal you think you're sending is not the signal that arrives.", statA: 88, statB: 91, statC: 77, abilities: ["True Reflection", "Signal Clarify"], personality: "The Mirror" },
  { slug: "the-question-that-answers", cardType: "ORACLE", rarity: "ANOMALY",   title: "The Question That Answers", subtitle: "Recursive Oracle",     flavourText: "The answer to the question is the question itself.",              statA: 83, statB: 88, statC: 79, abilities: ["Recursive Truth", "Question Loop"], personality: "The Paradox" },
  { slug: "archive-oracle-prime",    cardType: "ORACLE",   rarity: "LEGENDARY", title: "Archive Oracle Prime",   subtitle: "Senior Seer",            flavourText: "Has seen every episode. Has forgotten nothing. Chooses carefully what to say.", statA: 97, statB: 97, statC: 77, abilities: ["Total Archive", "Selective Reveal"], personality: "The Elder" },
  { slug: "corrupted-oracle",        cardType: "ORACLE",   rarity: "ANOMALY",   title: "Corrupted Oracle",       subtitle: "Broken Sight",           flavourText: "Its visions are accurate. The framing is wrong.",                 statA: 77, statB: 88, statC: 91, abilities: ["Flawed Sight", "Distorted Truth"], personality: "The Flawed" },

  // ─── EXTENDED SET: SIGNAL TYPE ───────────────────────────────────────────────
  { slug: "the-recurring-frequency", cardType: "SIGNAL",   rarity: "TRANSMISSION", title: "The Recurring Frequency", subtitle: "Appears Every Cycle",  flavourText: "Every 33 days. Same frequency. Different content. Always relevant.", statA: 77, statB: 82, statC: 66, abilities: ["Cycle Return", "Frequency Lock"], personality: null },
  { slug: "dead-symbol-static",      cardType: "SIGNAL",   rarity: "STATIC",    title: "Dead Symbol Static",     subtitle: "Noise with No Meaning",   flavourText: "Not everything is a message. Some of it is just noise. This is that.", statA: 22, statB: 33, statC: 44, abilities: ["Null Signal"], personality: null },
  { slug: "the-echo-protocol",       cardType: "SIGNAL",   rarity: "ANOMALY",   title: "The Echo Protocol",      subtitle: "Every Signal Returned",   flavourText: "Whatever you broadcast, it will come back. Altered. Amplified.", statA: 82, statB: 77, statC: 88, abilities: ["Echo Amplify", "Return Surge"], personality: null },
  { slug: "resonance-field-7",       cardType: "SIGNAL",   rarity: "TRANSMISSION", title: "Resonance Field 7",   subtitle: "Sustained Vibration",     flavourText: "The seventh harmonic. Humans cannot hear it. They feel it in the chest.", statA: 77, statB: 88, statC: 66, abilities: ["Resonance Pulse", "Body Frequency"], personality: null },
  { slug: "the-lost-frequency",      cardType: "SIGNAL",   rarity: "SIGNAL",    title: "The Lost Frequency",     subtitle: "Off the Dial",            flavourText: "It transmits on a frequency between two assigned bands. It shouldn't exist.", statA: 66, statB: 77, statC: 55, abilities: ["Frequency Seek", "Off-Band Access"], personality: null },
  { slug: "broadcast-frequency-33",  cardType: "SIGNAL",   rarity: "ORACLE",    title: "Broadcast Frequency 33", subtitle: "The Signal Number",       flavourText: "33 Hz. 33 kHz. 33 MHz. The signal persists at every scale.",    statA: 91, statB: 88, statC: 77, abilities: ["Scale Signal", "Harmonic Truth"], personality: null },
  { slug: "noise-floor-zero",        cardType: "SIGNAL",   rarity: "STATIC",    title: "Noise Floor Zero",       subtitle: "Absolute Silence",        flavourText: "It exists in theory. In practice, even the void makes noise.",   statA: 11, statB: 55, statC: 22, abilities: ["Baseline Hold"], personality: null },
  { slug: "the-carrier-wave",        cardType: "SIGNAL",   rarity: "TRANSMISSION", title: "The Carrier Wave",    subtitle: "Signal Vehicle",          flavourText: "Every transmission rides on something. This is that something.",  statA: 77, statB: 66, statC: 66, abilities: ["Carrier Sustain", "Signal Ride"], personality: null },

  // ─── EXTENDED SET: TRANSMISSIONS ─────────────────────────────────────────────
  { slug: "the-broadcast-at-3am",    cardType: "TRANSMISSION", rarity: "ORACLE", title: "The Broadcast at 3AM",  subtitle: "Unsanctioned Stream",    flavourText: "No scheduled time. No announcement. 4,000 viewers appeared anyway.", statA: 93, statB: 91, statC: 88, abilities: ["Midnight Pull", "Unsanctioned Reach"], personality: null },
  { slug: "episode-zero",            cardType: "TRANSMISSION", rarity: "LEGENDARY", title: "Episode Zero",       subtitle: "The Pilot That Wasn't",   flavourText: "It predates the channel. It was never meant to be shared.",     statA: 99, statB: 88, statC: 77, abilities: ["Origin Access", "Pre-Archive Signal"], personality: null },
  { slug: "the-unlisted-episode",    cardType: "TRANSMISSION", rarity: "ANOMALY", title: "The Unlisted Episode", subtitle: "Hidden In Plain Sight",   flavourText: "URL only. Not indexed. Somehow, 40,000 people found it.",        statA: 88, statB: 77, statC: 91, abilities: ["Stealth Broadcast", "Hidden Reach"], personality: null },
  { slug: "the-members-only-stream", cardType: "TRANSMISSION", rarity: "TRANSMISSION", title: "Members Only Stream", subtitle: "Inner Circle Broadcast", flavourText: "What was said inside remains inside. This card proves you were there.", statA: 82, statB: 91, statC: 66, abilities: ["Access Verify", "Exclusive Signal"], personality: null },
  { slug: "the-phone-call-episode",  cardType: "TRANSMISSION", rarity: "ORACLE", title: "The Phone Call Episode", subtitle: "Live on Air",            flavourText: "The caller was not announced. The call lasted eleven minutes. Nothing was the same after.", statA: 94, statB: 93, statC: 88, abilities: ["Live Intercept", "Signal Break"], personality: null },
];


async function main() {
  console.log("🃏 Seeding card packs and cards...");

  // Upsert packs
  for (const pack of PACKS) {
    await prisma.cardPack.upsert({
      where: { slug: pack.slug },
      update: { ...pack },
      create: { ...pack },
    });
    console.log(`  ✓ Pack: ${pack.name}`);
  }

  // Upsert cards
  for (const card of CARDS) {
    const data = {
      cardType: card.cardType as any,
      rarity: card.rarity as any,
      title: card.title,
      subtitle: card.subtitle ?? null,
      flavourText: card.flavourText ?? null,
      statA: card.statA,
      statB: card.statB,
      statC: card.statC,
      abilities: card.abilities,
      personality: card.personality ?? null,
      maxSupply: (card as any).maxSupply ?? null,
      isActive: true,
    };
    await prisma.card.upsert({
      where: { slug: card.slug },
      update: data,
      create: { slug: card.slug, ...data },
    });
    console.log(`  ✓ Card: ${card.title} [${card.rarity}]`);
  }

  // Link all cards to signal-archive pack (for now — all cards pullable from there)
  const archivePack = await prisma.cardPack.findUnique({ where: { slug: "signal-archive" } });
  const allCards = await prisma.card.findMany({ where: { isActive: true } });
  if (archivePack) {
    for (const card of allCards) {
      await prisma.packCard.upsert({
        where: { packId_cardId: { packId: archivePack.id, cardId: card.id } },
        update: {},
        create: { packId: archivePack.id, cardId: card.id, weight: 1.0 },
      });
    }
    console.log(`  ✓ Linked ${allCards.length} cards to Signal Archive Pack`);
  }

  // Link rare+ cards to forbidden archive
  const forbiddenPack = await prisma.cardPack.findUnique({ where: { slug: "forbidden-archive" } });
  const rareCards = await prisma.card.findMany({
    where: { rarity: { in: ["TRANSMISSION", "ANOMALY", "ORACLE", "LEGENDARY", "MYTHIC", "FORBIDDEN"] }, isActive: true },
  });
  if (forbiddenPack) {
    for (const card of rareCards) {
      await prisma.packCard.upsert({
        where: { packId_cardId: { packId: forbiddenPack.id, cardId: card.id } },
        update: {},
        create: { packId: forbiddenPack.id, cardId: card.id, weight: 1.0 },
      });
    }
    console.log(`  ✓ Linked ${rareCards.length} rare+ cards to Forbidden Archive Pack`);
  }

  // Troll King: entity + incident cards
  const trollPack = await prisma.cardPack.findUnique({ where: { slug: "troll-king-expansion" } });
  const trollCards = await prisma.card.findMany({
    where: { cardType: { in: ["ENTITY", "INCIDENT", "AVATAR", "GLITCH"] }, isActive: true },
  });
  if (trollPack) {
    for (const card of trollCards) {
      await prisma.packCard.upsert({
        where: { packId_cardId: { packId: trollPack.id, cardId: card.id } },
        update: {},
        create: { packId: trollPack.id, cardId: card.id, weight: 1.5 },
      });
    }
    console.log(`  ✓ Linked ${trollCards.length} chaos cards to Troll King Pack`);
  }

  // Nyx Collection: mahavidya + prophecy + oracle + legendary
  const nyxPack = await prisma.cardPack.findUnique({ where: { slug: "nyx-collection" } });
  const nyxCards = await prisma.card.findMany({
    where: { cardType: { in: ["MAHAVIDYA", "PROPHECY", "ORACLE"] }, isActive: true },
  });
  if (nyxPack) {
    for (const card of nyxCards) {
      await prisma.packCard.upsert({
        where: { packId_cardId: { packId: nyxPack.id, cardId: card.id } },
        update: {},
        create: { packId: nyxPack.id, cardId: card.id, weight: 2.0 },
      });
    }
    // Also add legendary/mythic/forbidden to nyx
    const sacredRare = await prisma.card.findMany({
      where: { rarity: { in: ["LEGENDARY", "MYTHIC", "FORBIDDEN"] }, isActive: true },
    });
    for (const card of sacredRare) {
      await prisma.packCard.upsert({
        where: { packId_cardId: { packId: nyxPack.id, cardId: card.id } },
        update: {},
        create: { packId: nyxPack.id, cardId: card.id, weight: 1.0 },
      });
    }
    console.log(`  ✓ Linked sacred cards to Nyx Collection Pack`);
  }

  console.log("\n✅ Card system seeded successfully");
  console.log(`   ${PACKS.length} packs · ${CARDS.length} cards`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());





