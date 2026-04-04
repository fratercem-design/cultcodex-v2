/**
 * MEGA DEDUP + BIO CLEANUP
 *
 * 1. Merge confirmed duplicate person records
 * 2. Rewrite negative/slanderous bios to be fair and balanced
 * 3. Enrich bios for major recurring characters
 */

import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

// =====================================================================
// MERGE DEFINITIONS — [canonical slug, ...duplicate slugs to merge in]
// =====================================================================
const MERGES: Array<{
  canonical: string;       // slug of the record to keep
  dupes: string[];         // slugs of records to merge INTO canonical
  displayName?: string;    // override display name
  altNames?: string[];     // set altNames
  bio?: string;            // set shortBio
  personType?: string;     // override type
}> = [
  // --- EXACT SPELLING DUPES ---
  {
    canonical: "beetlejuice",
    dupes: ["beetle-juice"],
    displayName: "Beetlejuice",
    altNames: ["Beetle Juice"],
    bio: "Recurring panel guest and entertainer known for colorful appearances on the show.",
  },
  {
    canonical: "mr-big-pipes",
    dupes: ["mrbigpipes"],
    displayName: "Mr. Big Pipes",
    altNames: ["MrBigPipes"],
    bio: "Regular panel participant known for his deep voice and entertaining presence on the show.",
  },
  {
    canonical: "untrackable",
    dupes: ["un-trackable"],
    displayName: "Untrackable",
    altNames: ["UN TRACKABLE"],
    bio: "Panel regular and community member who participates in discussions and debates.",
  },

  // --- BETA / BEA / VA MEGA-CLUSTER ---
  // One person: Persian-Canadian woman, cat lover, panel regular, friend of Psyche
  {
    canonical: "bea",
    dupes: [
      "bea-beanie", "bea-beas-kitties", "bea-beta",
      "ba-bea", "beeta", "beeta-beta", "beeta-bea", "beeta-va",
      "bt-beta-beeta", "be-beta", "be-golden-girl-cat-lady",
      "beta-bg", "beta-be-va", "beta-beat-up", "beta-beeta",
      "beta-va", "va-beta", "beta-bea", "beta-bea-va",
      "va-vita", "vita-va-beeta",
      "bita", "bita-beeta", "bita-vida",
    ],
    displayName: "Bea",
    altNames: ["Beta", "Beeta", "VA", "Bita", "Vita", "Vida", "Be", "Golden Girl", "Cat Lady", "Beanie"],
    bio: "Persian-Canadian panel regular and one of Psyche's closest friends. Known for her 'Beta's Kitties' channel, her love of cats, cooking, and antique shopping. A passionate and expressive community member from Orange County, California who brings energy and heart to every panel appearance.",
    personType: "recurring",
  },

  // --- PAIGE / PRAIRIE PAIGE ---
  {
    canonical: "paige",
    dupes: ["paige-prairie-paige", "prairie-paige", "prairie-page", "prairie", "pi-paige"],
    displayName: "Paige",
    altNames: ["Prairie Paige", "Prairie Page", "Prairie", "Pi"],
    bio: "Canadian panel regular and tarot reader from Alberta. Known for hosting trivia segments, her calming presence, and her cats Raven and Fart Bean. One of the show's most consistent and beloved recurring guests.",
    personType: "recurring",
  },

  // --- FLIRTY DIAMOND ---
  {
    canonical: "flirty-diamond",
    dupes: ["flirty-diamond-david", "flirty"],
    displayName: "Flirty Diamond",
    altNames: ["David", "Flirty"],
    bio: "Energetic panel personality known for memorable and often chaotic appearances. A community fixture who generates strong reactions and lively discussions.",
    personType: "recurring",
  },

  // --- JAY DOG ---
  {
    canonical: "jay-dog",
    dupes: ["jay-dog-jd"],
    displayName: "Jay Dog",
    altNames: ["JD"],
    bio: "Long-time community member and former moderator. A frequent topic of discussion on the show with a multi-year history in the panel scene.",
    personType: "recurring",
  },

  // --- CARL ---
  {
    canonical: "carl",
    dupes: ["carl-aging-demon", "carl-ld"],
    displayName: "Carl",
    altNames: ["King Paimon", "Aging Demon", "LD"],
    bio: "Recurring panel personality and Beta's ex-boyfriend. Known for his interest in the occult, particularly black magic, and for his involvement in ongoing community drama and interpersonal conflicts.",
    personType: "recurring",
  },

  // --- CLUMSY CLAIRVOYANT ---
  {
    canonical: "clumsy-clairvoyant",
    dupes: ["clumsy-clairvoyance", "clumsy", "clumsy-clair"],
    displayName: "Clumsy Clairvoyant",
    altNames: ["Clumsy", "Clumsy Clair", "Clumsy Clairvoyance"],
    bio: "Tarot reader and psychic with her own YouTube channel and merchandise store. A regular viewer and panel guest known for playing card games and offering readings.",
    personType: "recurring",
  },

  // --- CRYSTAL MARIE ---
  {
    canonical: "crystal-marie",
    dupes: ["crystal"],
    displayName: "Crystal Marie",
    altNames: ["Crystal"],
    bio: "Recurring panel figure and community member who participates actively in group discussions and interpersonal dynamics.",
    personType: "recurring",
  },

  // --- GHOST ---
  {
    canonical: "ghost",
    dupes: ["ghost-crucible-ghost", "crucible-ghost", "crucible"],
    displayName: "Ghost",
    altNames: ["Crucible Ghost", "Crucible"],
    bio: "Community member and panel debater known for engaging in political and philosophical discussions. A recurring presence on the show.",
    personType: "recurring",
  },

  // --- SUMMER ---
  {
    canonical: "summer",
    dupes: ["summer-dickerson-hotmesssummer", "summer-hot-summer"],
    displayName: "Summer",
    altNames: ["Hot Summer", "HotMessSummer", "Summer Dickerson"],
    bio: "Kentucky native and mother of ten known as 'the boss.' Advocates for marginalized people, does weekly community outreach, and hosts her own podcast. A dear friend of the show with a bold and caring personality.",
    personType: "recurring",
  },

  // --- TERESA / TRAVELING GYPSY ---
  {
    canonical: "teresa",
    dupes: ["teresa-traveling-gypsy", "traveling-gypsy", "traveling-gypsy-teresa"],
    displayName: "Teresa",
    altNames: ["Traveling Gypsy", "Traveling Gypsy Teresa"],
    bio: "Canadian healthcare worker and tarot reader who has been part of the community for over a year. Known for sponsoring panel episodes, performing card readings, and her cat named Jackass.",
    personType: "recurring",
  },

  // --- TRACY ---
  {
    canonical: "tracy",
    dupes: ["tracy-x-tracy", "tracy-x"],
    displayName: "Tracy",
    altNames: ["X Tracy", "Tracy X", "X1965"],
    bio: "Long-time recurring panelist and YouTuber with the X1965 channel. Known for her extensive tattoo collection, her love of pets, and her candid personality. One of the show's most frequent guests.",
    personType: "recurring",
  },

  // --- TIGER BUTTERFLY ---
  {
    canonical: "tiger-butterfly",
    dupes: ["tiger", "laura-tiger-butterfly"],
    displayName: "Tiger Butterfly",
    altNames: ["Tiger", "Laura Tiger Butterfly"],
    bio: "Recurring guest with Capricorn sun, Cancer rising, and Virgo moon. A warm community member who receives regular tarot readings and brings good energy to panel discussions.",
    personType: "recurring",
  },

  // --- SAM / SAM MAN ---
  {
    canonical: "sam",
    dupes: ["sam-man", "samman", "sam-man-sam-man-nyc", "sam-samman-nyc", "sam-ans"],
    displayName: "Sam Man",
    altNames: ["Sam", "Samman", "Sam Man NYC", "Sam Ans"],
    bio: "NYC-based content creator and Leo who provides support and advice during streams. A panel regular known for his cooking streams, costume performances, and entertaining personality.",
    personType: "recurring",
  },

  // --- JIM NICK ---
  {
    canonical: "jim-nick",
    dupes: ["jimnick", "jim-jimny", "jim-jimny-jimnik"],
    displayName: "Jim Nick",
    altNames: ["Jimnick", "Jimny", "Jimnik"],
    bio: "Panel participant known for joining rap battles and physical comedy performances during streams.",
  },

  // --- BRONZE BIRD ---
  {
    canonical: "bronze-bird",
    dupes: ["bronzebird", "bronzbird-bronberg", "bronze-chicken", "bronze"],
    displayName: "Bronze Bird",
    altNames: ["Bronzebird", "Bronzbird", "Bronberg", "Bronze", "Bronze Chicken"],
    bio: "Panel guest who participates in rap battles and lively exchanges. Known for engaging discussions and confrontational debates with other community members.",
  },

  // --- SASK / CANADA DRY ---
  {
    canonical: "canada-dry",
    dupes: ["sask", "sask-canada-dry", "saskatchewan-sean-sask", "saskatchewan-sask-sketch", "canada-dry-sass"],
    displayName: "Canada Dry",
    altNames: ["Sask", "Saskatchewan", "Saskatchewan Sean", "Sass", "Sketch"],
    bio: "Canadian graphic designer and artist from British Columbia who creates drawings for panel participants. Known for his artistic talent, technical support, and participations in trivia and panel discussions.",
    personType: "recurring",
  },

  // --- BIG TALL ROB / BLADE ---
  {
    canonical: "blade",
    dupes: ["big-rob-blade", "big-tall-rob-sexy-rob", "big-tall-sexy-rob", "big-tall-sex", "blade-big-tall"],
    displayName: "Blade",
    altNames: ["Big Rob", "Big Tall Rob", "Big Tall Sexy Rob", "Sexy Rob"],
    bio: "6'8\" Samoan panel personality known for his deep voice, hunting stories, and voice impressions. A long-time supportive friend and viewer of the show.",
    personType: "recurring",
  },

  // --- LENOR ---
  {
    canonical: "lenor",
    dupes: ["lenor-lunar"],
    displayName: "Lenor",
    altNames: ["Lunar"],
    bio: "Recurring panel member described as being 'in the corner' with 'claws out for lies.' A regular presence in the community.",
    personType: "recurring",
  },

  // --- LOLA ---
  {
    canonical: "lola",
    dupes: ["lola-laura"],
    displayName: "Lola",
    altNames: ["Laura"],
    bio: "Regular panel member and viewer whose real name is Laura. Known for her confident presence in panel discussions.",
    personType: "recurring",
  },

  // --- MEEZER ---
  {
    canonical: "meezer",
    dupes: ["meezer-measor"],
    displayName: "Meezer",
    altNames: ["Measor"],
    bio: "Psyche's ex-boyfriend who remains a friend. Artist, musician, and tattoo artist who may own Pink Ink tattoo shop. Performed Bo Burnham's 'That Funny Feeling' on the show.",
  },

  // --- SIG ---
  {
    canonical: "sig",
    dupes: ["sig-signal66"],
    displayName: "Sig",
    altNames: ["Signal66"],
    bio: "Recurring panel guest and contrarian who engages in passionate debates. Known for his strong opinions and his black cat.",
    personType: "recurring",
  },

  // --- MISER ---
  {
    canonical: "miser",
    dupes: ["miser-maser"],
    displayName: "Miser",
    altNames: ["Maser"],
    bio: "Community member involved in the group's interpersonal dynamics. A quiet but consistent panel presence who often experiences technical difficulties.",
    personType: "recurring",
  },

  // --- MICHAEL ---
  {
    canonical: "michael",
    dupes: ["michael-l"],
    displayName: "Michael",
    altNames: ["Michael L"],
    bio: "Long-time recurring panel participant known for his energetic presence. A community fixture who has been part of the show since its early days.",
    personType: "recurring",
  },

  // --- ALISA JORDANA ---
  {
    canonical: "alisa-jordana",
    dupes: ["alisa-jordan", "alisa"],
    displayName: "Alisa Jordana",
    altNames: ["Alisa Jordan", "Alisa", "Elisa Jordana"],
    bio: "Howard Stern-connected streamer who Psyche regularly calls and raids. Known for her dramatic on-stream moments and her connections to the wider streaming and entertainment world.",
    personType: "recurring",
  },

  // --- JOKER ---
  {
    canonical: "joker",
    dupes: ["joker-tv"],
    displayName: "Joker",
    altNames: ["Joker TV"],
    bio: "Regular panel participant known for his humor, playful energy, and willingness to participate in on-stream challenges and performances.",
    personType: "recurring",
  },

  // --- KELL / KELLOGGS ---
  {
    canonical: "kell-kelloggs",
    dupes: ["kell-kelly", "kellog-kelly"],
    displayName: "Kelloggs",
    altNames: ["Kell", "Kelly", "Kellog"],
    bio: "Long-time community member and moderator from the Liverpool area. A 'scouser' who provides encouragement and support to fellow community members.",
    personType: "recurring",
  },

  // --- MUSIC MARTY ---
  {
    canonical: "music-biz-marty",
    dupes: ["music-is-marty"],
    displayName: "Music Biz Marty",
    altNames: ["Music is Marty", "Marty"],
    bio: "Deceased internet personality and streamer who appeared on Psyche's show. Known for his sports predictions and visits to fellow streamers. Remembered fondly by the community.",
  },

  // --- JERRY ---
  {
    canonical: "jerry",
    dupes: ["jerry-leane"],
    displayName: "Jerry Leane",
    altNames: ["Jerry"],
    bio: "Writer and entertainment industry veteran who claims work on Star Trek, Mars rover projects, and famous songs. A supporter and chat regular.",
  },

  // --- BENNY BLANCO ---
  {
    canonical: "benny-blanco",
    dupes: ["benny", "benny-benny-blanco"],
    displayName: "Benny Blanco",
    altNames: ["Benny"],
    bio: "23-year-old community member who enjoys dirt bikes. A subject of discussion on the show regarding personal matters and community dynamics.",
    personType: "recurring",
  },

  // --- TREVOR ---
  {
    canonical: "trevor",
    dupes: ["trevor-ryan"],
    displayName: "Trevor",
    altNames: ["Trevor Ryan"],
    bio: "Regular guest from Michigan known for his humor and playful energy. Has friendly conversations with Psyche about various topics and has been part of the show's regular circle.",
  },

  // --- JAMIE ---
  {
    canonical: "jamie",
    dupes: ["jamie-cowboys"],
    displayName: "Jamie",
    altNames: ["Cowboys"],
    bio: "Recurring panel participant with Capricorn sun and Aquarius moon. A long-time supporter and moderator of the show.",
    personType: "recurring",
  },

  // --- ARUSHI ---
  {
    canonical: "arushi",
    dupes: ["arushi-roshi"],
    displayName: "Arushi",
    altNames: ["Roshi"],
    bio: "Viewer and aspiring doctor who has shared dreams for interpretation and received tarot readings on the show.",
  },

  // --- BARRY ---
  {
    canonical: "barry",
    dupes: ["barry-the-turtle", "barry-the-turtle-tortuga"],
    displayName: "Barry",
    altNames: ["Barry the Turtle", "Tortuga"],
    bio: "Regular panelist and top donator who is an active part of the community's interpersonal dynamics.",
  },

  // --- JOE ---
  {
    canonical: "joe",
    dupes: ["joe-shipley"],
    displayName: "Joe",
    altNames: ["Joe Shipley"],
    bio: "Panel participant who appears periodically and engages in community discussions. Not to be confused with other panelists sharing the name.",
  },

  // --- JOHN ---
  {
    canonical: "john",
    dupes: ["john-clark"],
    displayName: "John Clark",
    altNames: ["John"],
    bio: "Supportive viewer from London who practices BJJ (Brazilian Jiu-Jitsu). Receives regular detailed tarot readings during streams.",
  },

  // --- JAMIE ROSE ---
  // Keeping separate from Jamie — different person

  // --- KATE ---
  // Kate and Kate the Turtle seem like different people (one is a mod, one is a rival streamer)

  // --- OPEN PANEL generic records ---
  {
    canonical: "open-panel",
    dupes: ["open-panel-guests", "open-panel-participants"],
    displayName: "Open Panel Guests",
    bio: "Various unidentified participants in open panel discussions throughout the show's run.",
  },

  // --- VARIOUS/UNSPECIFIED generic records ---
  {
    canonical: "various-guests",
    dupes: ["various-panel-members", "unspecified-guests", "unspecified-guest"],
    displayName: "Various Guests",
    bio: "Unspecified panel participants and guests across multiple episodes.",
  },

  // --- PANELISTS ---
  {
    canonical: "panelist-1",
    dupes: ["panelist-2"],
    displayName: "Panelists",
    bio: "Guest participants in open panel discussions.",
  },

  // --- PSYCHE'S CATS ---
  {
    canonical: "psyches-cats",
    dupes: ["psyches-cat", "mr-trix", "lenore", "lenore-pie-mr-kitty"],
    displayName: "Psyche's Cats",
    altNames: ["Trix", "Mr. Trix", "Lenore", "Pie", "Mr. Kitty"],
    bio: "Psyche's beloved cats who make regular appearances during livestreams and tarot readings. Trix is the youngest male cat, and Lenore (also called Pie or Mr. Kitty) is known for scratching and causing mischief on camera.",
    personType: "recurring",
  },

  // --- D-HIGH ---
  {
    canonical: "d-high-dehi",
    dupes: [],
    displayName: "D-High",
    altNames: ["Dehi"],
    bio: "Regular guest who streams on Kick and Twitch. Previously appeared in the community under different names.",
  },

  // --- DJ ELECTRA ---
  {
    canonical: "dj-electra-be",
    dupes: [],
    displayName: "DJ Electra",
    altNames: ["BE"],
    bio: "Regular panel participant who creates intro videos for streamers and gifted Psyche his wireless earbuds.",
  },

  // --- SPUNKY ---
  {
    canonical: "spunky",
    dupes: ["spunky-stephanie"],
    displayName: "Spunky",
    altNames: ["Stephanie"],
    bio: "Community member and host of another streaming channel. Participates in panel discussions and cross-community events.",
  },

  // --- MINA ---
  {
    canonical: "mina",
    dupes: ["mina-mirina"],
    displayName: "Mina",
    altNames: ["Mirina"],
    bio: "Panel participant and nurse. Appeared on the panel to participate in community discussions and share her perspective.",
  },

  // --- NICK ---
  // Keep separate — likely different Nicks

  // --- TY ---
  {
    canonical: "ty-ty-santos",
    dupes: ["ty-t-white-desantes", "ty-t-ty-desantis"],
    displayName: "Ty",
    altNames: ["Ty Santos", "T White DeSantes", "Ty DeSantis", "T"],
    bio: "Man in his 40s from Houston, Texas who is into boxing and streaming. Known for his intense verbal exchanges and passionate personality during panel appearances.",
  },

  // --- SLEEPING ---
  {
    canonical: "sleeping-energy",
    dupes: ["sleeping"],
    displayName: "Sleeping Energy",
    altNames: [],
    bio: "Returning viewer who has received tarot readings about spiritual matters and personal concerns.",
  },

  // --- SHAN ---
  {
    canonical: "shan",
    dupes: ["shan-camp"],
    displayName: "Shan",
    altNames: ["Shan Camp"],
    bio: "Chat participant and community member who receives special recognition from Psyche.",
  },

  // --- JONAH ---
  {
    canonical: "jonah",
    dupes: ["jonah-chona"],
    displayName: "Jonah",
    altNames: ["Chona"],
    bio: "Regular viewer and moderator from the Philippines who runs 'Chona Adventure Vlogs' channel. Receives tarot readings on the show.",
  },

  // --- SAMANTHA ---
  {
    canonical: "samantha",
    dupes: ["samantha-avery"],
    displayName: "Samantha",
    altNames: ["Samantha Avery"],
    bio: "Chat participant and viewer who engages in stream discussions.",
  },

  // --- VICTORIA ---
  {
    canonical: "victoria",
    dupes: ["victoria-jay"],
    displayName: "Victoria",
    altNames: ["Victoria Jay"],
    bio: "Panel participant and viewer who appears in discussions.",
  },
];

// =====================================================================
// STANDALONE BIO REWRITES — fair, balanced, no slander
// =====================================================================
const BIO_UPDATES: Array<{ slug: string; bio: string; altNames?: string[] }> = [
  {
    slug: "alexander-mcqueen",
    bio: "Recurring panel guest who claims a background in law enforcement. Known for his loud, energetic personality and memorable panel moments. A former moderator and divisive community figure who generates strong reactions.",
  },
  {
    slug: "alexandra-mayers",
    bio: "IRL streamer and content creator behind the YouTube channels AlexandraMayers, IRLNewsTime, and ip2wiki.info. Transitioned from entertainment to Bible study streams, news commentary, and community advocacy. Known for her passionate and direct communication style.",
  },
  {
    slug: "christine",
    bio: "Long-time supporter and recurring panelist who has deep loyalty to the community. Known for her strong opinions and willingness to stand up for what she believes in.",
  },
  {
    slug: "rain",
    bio: "Community member mentioned across multiple streams. A figure in the broader streaming ecosystem.",
  },
  {
    slug: "rains",
    bio: "Panel participant referenced in original music and community discussions.",
  },
  {
    slug: "chris-k",
    bio: "Panel guest who appeared on several episodes. Known for expressing strong and polarizing views during discussions.",
  },
  {
    slug: "groovy-jimmy",
    bio: "Former co-host and friend of Psyche from earlier show days. Known for his involvement in the community's formative period.",
  },
  {
    slug: "aaron-carter",
    bio: "Deceased celebrity discussed on the show as an example of how online communities can impact public figures.",
  },
  {
    slug: "beat-the-witch",
    bio: "Female streamer and panel participant who has been the subject of strong opinions from other community members. Known for her presence in the broader streaming scene.",
  },
  {
    slug: "beeta",  // Will be merged, but just in case
    bio: "See Bea — same person under different spelling.",
  },
  {
    slug: "shannon",
    bio: "Community member who appeared during Psyche's guest spot on the Tommy James show.",
  },
  {
    slug: "fuzzy",
    bio: "Community member known for quoting scripture during panel discussions.",
  },
  {
    slug: "fuzzy-bear",
    bio: "Panel participant who shared opinions during community discussions.",
  },
  {
    slug: "black-rg",
    bio: "Panel participant with a multi-year history in the community. Known for engaging in spirited debates with other members.",
  },
  {
    slug: "blogger",
    bio: "Livestreamer in his mid-40s who creates content about other streamers and content creators.",
  },
  {
    slug: "bronberg",
    bio: "Panel participant who engages in lively commentary and discussions.",
  },
  {
    slug: "drunk-person",
    bio: "An unidentified individual who joined a panel discussion.",
  },
  {
    slug: "mc-nemesis",
    bio: "Panel participant who has been banned from Psyche's panel for repeated language violations.",
  },
  {
    slug: "the-ham-sandwich-girl",
    bio: "A panel guest who had a disagreement with Psyche during a stream.",
  },
  {
    slug: "quantum-gayen",
    bio: "A viewer in the chat who was hidden for content violations.",
  },
  {
    slug: "sebastian",
    bio: "Panel participant who claims LDS membership. Was modded and unmodded multiple times during streams.",
  },
  {
    slug: "yumi",
    bio: "Indonesian teacher and panel regular who engages in political and cultural discussions.",
  },
  {
    slug: "scam",
    bio: "Discord community member who claims to represent 'the Greece.' Participates in community exchanges.",
  },
  {
    slug: "big-elo",
    bio: "Experienced streamer who offers advice about YouTube monetization and maintaining partnership status.",
  },
  {
    slug: "allied-master-computer",
    bio: "Panel participant discussed in relation to community dynamics and information sharing.",
  },
  {
    slug: "ss-sean-cheyenne-solo",
    bio: "Panel guest from Texas, nearly 50 years old. Shares personal stories and engages in candid discussions.",
  },
  {
    slug: "salmon-rg",
    bio: "Panel member who participates in debates and community discussions.",
  },
  {
    slug: "kanye-west",
    bio: "Rapper and cultural figure discussed on the show for his public statements about the music industry.",
  },
  {
    slug: "marilyn-manson",
    bio: "Shock-rock musician discussed on the show in relation to concert tours and stage incidents.",
  },
  {
    slug: "charlie-kirk",
    bio: "Conservative activist and founder of Turning Point USA, discussed on the show in relation to current events.",
  },
  {
    slug: "elisa-jordana",
    bio: "Streamer connected to the Howard Stern universe. Discussed on the show in relation to community events.",
  },
  {
    slug: "crackodana",
    bio: "Community member with a monetized channel, discussed in relation to community dynamics.",
  },
  {
    slug: "fifth-sage",
    bio: "Community member whose identity was impersonated during a stream incident.",
  },
  {
    slug: "marty",
    bio: "Former collaborator who participated in the show's early days and was part of the content creation circle.",
  },
  {
    slug: "emma",
    bio: "Panel personality known for her creative storytelling, including channeling characters during streams. A distinctive voice in the community.",
    altNames: ["Emma"],
  },
  {
    slug: "psyche",
    bio: "Host of the Cult of Psyche podcast and owner of the CultCodex archive. Male streamer, tarot reader, musician, and content creator. Known for hosting open panel discussions, creating original music, and building a vibrant streaming community.",
  },
  {
    slug: "michael-leguizamon",
    bio: "Deceased former panel participant remembered by the community for his contributions to the show.",
  },
  {
    slug: "nick-nick-winters-syrup-wizard",
    bio: "Northern California resident and former medicinal cannabis business worker who shares personal stories on the panel.",
  },
  {
    slug: "unknown-participant",
    bio: "Unidentified panel participant in episode discussions.",
  },
];

// =====================================================================
// EXECUTION
// =====================================================================
async function main() {
  const prisma = getPrisma();
  let totalMerged = 0;
  let totalDeleted = 0;
  let totalBiosUpdated = 0;

  console.log("=== MEGA DEDUP + BIO CLEANUP ===\n");

  // --- PHASE 1: MERGES ---
  for (const merge of MERGES) {
    const canonical = await prisma.person.findFirst({
      where: { slug: merge.canonical },
      select: { id: true, displayName: true },
    });
    if (!canonical) {
      console.log(`[SKIP] Canonical "${merge.canonical}" not found`);
      continue;
    }

    for (const dupeSlug of merge.dupes) {
      const dupe = await prisma.person.findFirst({
        where: { slug: dupeSlug },
        select: { id: true, displayName: true, _count: { select: { guestAppearances: true, quotes: true } } },
      });
      if (!dupe) {
        // console.log(`  [SKIP] Dupe "${dupeSlug}" not found`);
        continue;
      }

      // Move guest appearances
      const appearances = await prisma.episodeGuest.findMany({
        where: { personId: dupe.id },
      });
      let moved = 0, skipped = 0;
      for (const app of appearances) {
        const exists = await prisma.episodeGuest.findFirst({
          where: { personId: canonical.id, episodeId: app.episodeId },
        });
        if (exists) {
          await prisma.episodeGuest.delete({
            where: { episodeId_personId: { episodeId: app.episodeId, personId: dupe.id } },
          });
          skipped++;
        } else {
          await prisma.episodeGuest.update({
            where: { episodeId_personId: { episodeId: app.episodeId, personId: dupe.id } },
            data: { personId: canonical.id },
          });
          moved++;
        }
      }

      // Move quotes
      const qResult = await prisma.quote.updateMany({
        where: { speakerPersonId: dupe.id },
        data: { speakerPersonId: canonical.id },
      });

      // Move topics
      const topics = await prisma.personTopic.findMany({ where: { personId: dupe.id } });
      for (const t of topics) {
        const exists = await prisma.personTopic.findFirst({
          where: { personId: canonical.id, topicId: t.topicId },
        });
        if (exists) {
          await prisma.personTopic.delete({
            where: { personId_topicId: { personId: dupe.id, topicId: t.topicId } },
          });
        } else {
          await prisma.personTopic.update({
            where: { personId_topicId: { personId: dupe.id, topicId: t.topicId } },
            data: { personId: canonical.id },
          });
        }
      }

      // Delete dupe
      await prisma.person.delete({ where: { id: dupe.id } });
      totalMerged += moved;
      totalDeleted++;
      console.log(`  "${dupe.displayName}" → "${canonical.displayName}": ${moved} eps, ${skipped} dups, ${qResult.count} quotes`);
    }

    // Update canonical record
    const updateData: any = {};
    if (merge.displayName) updateData.displayName = merge.displayName;
    if (merge.altNames) updateData.altNames = merge.altNames;
    if (merge.bio) updateData.shortBio = merge.bio;
    if (merge.personType) updateData.personType = merge.personType;

    if (Object.keys(updateData).length > 0) {
      await prisma.person.update({ where: { id: canonical.id }, data: updateData });
    }

    // Rebuild searchText
    const updated = await prisma.person.findUnique({
      where: { id: canonical.id },
      select: { displayName: true, altNames: true, shortBio: true, loreSummary: true },
    });
    if (updated) {
      const searchText = [updated.displayName, ...(updated.altNames as string[]), updated.shortBio, updated.loreSummary].filter(Boolean).join(" ");
      await prisma.person.update({ where: { id: canonical.id }, data: { searchText } });
    }
  }

  console.log(`\nPhase 1 complete: ${totalMerged} appearances moved, ${totalDeleted} records deleted`);

  // --- PHASE 2: BIO REWRITES ---
  console.log("\n--- Phase 2: Bio rewrites ---");
  for (const update of BIO_UPDATES) {
    const person = await prisma.person.findFirst({
      where: { slug: update.slug },
      select: { id: true, displayName: true },
    });
    if (!person) continue;

    const data: any = { shortBio: update.bio };
    if (update.altNames) data.altNames = update.altNames;
    await prisma.person.update({ where: { id: person.id }, data });

    // Rebuild searchText
    const p = await prisma.person.findUnique({
      where: { id: person.id },
      select: { displayName: true, altNames: true, shortBio: true, loreSummary: true },
    });
    if (p) {
      const searchText = [p.displayName, ...(p.altNames as string[]), p.shortBio, p.loreSummary].filter(Boolean).join(" ");
      await prisma.person.update({ where: { id: person.id }, data: { searchText } });
    }

    totalBiosUpdated++;
  }
  console.log(`Bio rewrites: ${totalBiosUpdated} updated`);

  // --- FINAL STATS ---
  const stats = await prisma.person.groupBy({
    by: ["personType"],
    _count: true,
  });
  const total = await prisma.person.count();
  console.log(`\n=== FINAL STATE ===`);
  console.log(`Total people: ${total}`);
  for (const s of stats) {
    console.log(`  ${s.personType}: ${s._count}`);
  }

  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
