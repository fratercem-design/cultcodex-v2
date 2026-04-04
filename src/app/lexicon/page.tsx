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

const CATEGORY_META: Record<
  Category,
  { label: string; color: string; description: string }
> = {
  panelverse: {
    label: "Panelverse",
    color: "text-accent-gold",
    description: "Terms specific to the YouTube panel livestream ecosystem",
  },
  streaming: {
    label: "Streaming",
    color: "text-accent-cyan",
    description: "General livestreaming and content creator terminology",
  },
  community: {
    label: "Community",
    color: "text-purple-400",
    description: "Terms describing community dynamics and social interactions",
  },
  tarot: {
    label: "Tarot & Mystic",
    color: "text-amber-400",
    description: "Tarot, divination, and spiritual terminology used on the show",
  },
  psycheverse: {
    label: "Psycheverse",
    color: "text-red-400",
    description:
      "Terms coined by or unique to the Cult of Psyche community",
  },
  slang: {
    label: "Slang",
    color: "text-green-400",
    description: "Internet and panel culture slang terms",
  },
  music: {
    label: "Music & Performance",
    color: "text-pink-400",
    description: "Terms related to freestyle rap, music, and live performances",
  },
  moderation: {
    label: "Moderation",
    color: "text-orange-400",
    description: "Terms related to stream moderation and chat management",
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

  return (
    <>
      <PageHero
        title="PANELVERSE LEXICON"
        subtitle={`${LEXICON.length} terms from the Cult of Psyche and the wider Panelverse`}
        backgroundImage="/wiki-page-header.jpg"
      />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {/* Category jump links */}
        <nav className="flex flex-wrap gap-2 text-xs font-mono">
          {order.map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <a
                key={cat}
                href={`#${cat}`}
                className={`px-2 py-1 rounded border border-white/10 hover:border-white/30 transition ${meta.color}`}
              >
                {meta.label} ({grouped.get(cat)?.length ?? 0})
              </a>
            );
          })}
        </nav>

        {order.map((cat) => {
          const meta = CATEGORY_META[cat];
          const terms = grouped.get(cat);
          if (!terms?.length) return null;

          return (
            <SectionCard key={cat} title={meta.label} id={cat}>
              <p className="text-xs text-text-secondary mb-4 italic">
                {meta.description}
              </p>
              <dl className="space-y-5">
                {terms.map((term) => (
                  <div
                    key={term.word}
                    className="border-l-2 border-white/10 pl-4 hover:border-accent-gold/50 transition-colors"
                  >
                    <dt className="font-bold text-sm">
                      <span className={meta.color}>{term.word}</span>
                      {term.aka && term.aka.length > 0 && (
                        <span className="text-text-secondary font-normal text-xs ml-2">
                          aka {term.aka.join(", ")}
                        </span>
                      )}
                    </dt>
                    <dd className="text-sm text-text-primary leading-relaxed mt-1">
                      {term.definition}
                    </dd>
                    {term.usage && (
                      <dd className="text-xs text-text-secondary mt-1 italic font-serif">
                        {term.usage}
                      </dd>
                    )}
                    {term.origin && (
                      <dd className="text-xs text-accent-gold/60 mt-1 font-mono">
                        Origin: {term.origin}
                      </dd>
                    )}
                  </div>
                ))}
              </dl>
            </SectionCard>
          );
        })}

        <SectionCard title="About This Lexicon">
          <div className="text-sm text-text-secondary leading-relaxed space-y-2">
            <p>
              This lexicon was compiled from analysis of 3,374 quotes, 1,327
              episode summaries, and 497 community member profiles in the Cult
              Codex archive. Definitions are derived from contextual usage within
              the show, supplemented by community knowledge and Urban Dictionary
              where applicable.
            </p>
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
