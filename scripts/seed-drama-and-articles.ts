import { getPrisma, disconnect } from "./ingest/lib";

// Seeds the first Drama Files (/drama, category "drama") and Articles
// (/articles, category "article"). Grounded in the archive's own episode
// summaries — nothing invented, everything hedged where it was hedged
// on-stream. Idempotent via upsert on slug.

type Entry = {
  slug: string;
  title: string;
  category: "drama" | "article";
  summary: string;
  fullEntry: string;
  episodeSlug?: string;
};

const ENTRIES: Entry[] = [
  {
    slug: "the-christine-raid-incident",
    title: "The Christine Raid Incident",
    category: "drama",
    episodeSlug: "point-by-point-analysis-of-the-slanderous-allegations-plus-christines-wacky-playhouse",
    summary:
      "Psyche raids Christine's stream bearing viewers as gifts. Christine responds with the banhammer. A point-by-point rebuttal of 'slanderous allegations' follows, delivered with the gravity of a UN tribunal and the energy of a wacky playhouse.",
    fullEntry:
      "FILE STATUS: closed, unresolved, eternally re-litigated.\n\nThe sequence of events, as preserved in the record: Psyche arrives at Christine's stream in the traditional manner of the raid — bringing viewers, goodwill, and chaos in roughly equal measure. The raid ends the way several diplomatic missions in cult history have ended: with a ban.\n\nWhat followed was the now-canonical 'Point by Point Analysis of the Slanderous Allegations' — a full-episode rebuttal addressing each accusation in circulation, delivered point by point, with exhibits. Allegations were denied. Frustrations were aired. The phrase 'Christine's Wacky Playhouse' entered the permanent lexicon.\n\nThe Codex takes no position on who was right. The Codex notes only that the banhammer (see: The Banhammer, artifacts wing) claimed another entry in its ledger, and that the drama produced more content than the original raid ever could have.\n\nSEVERITY ASSESSMENT: Full Poltergeist.\nRECURRENCE RISK: guaranteed.",
  },
  {
    slug: "the-sweetie-impersonation-affair",
    title: "The Sweetie Impersonation Affair",
    category: "drama",
    episodeSlug: "its-the-start-of-a-new-day-lets-goooo",
    summary:
      "Panelist Arthur impersonates streamer 'Sweetie' convincingly enough to fool Christine and others. The panel becomes a masquerade. Trust in voices is never fully restored.",
    fullEntry:
      "FILE STATUS: declassified with mild embarrassment for all parties.\n\nDuring a panel preserved in the archive, Arthur executed what the record describes as a successful impersonation of another streamer known as 'Sweetie' — successful enough that Christine and others engaged with the impostor as the genuine article.\n\nThe Codex wishes to stress the structural implications: if one panelist can be two people, the panel's true headcount is unknowable. Cult scholars refer to this as the Authentic-vs-Imposter Problem (see also: the authentic vs imposter Nick, characters wing), and it remains unsolved.\n\nNo lasting harm was recorded. Lasting suspicion, however, was archived in full.\n\nSEVERITY ASSESSMENT: Elevated Nonsense.\nLESSON, IF ANY: verify the voice before you confess to it.",
  },
  {
    slug: "the-ip2-infiltration-night",
    title: "The IP2 Infiltration Night",
    category: "drama",
    episodeSlug: "good-vibes-only-open-panel-browsing-the-codex",
    summary:
      "Trolls from an outside faction flood the chat with threats while panelist conflicts flare simultaneously. The next stream is titled GOOD VIBES ONLY, which is how you know it was bad.",
    fullEntry:
      "FILE STATUS: sealed under the Good Vibes Accord.\n\nThe record describes a difficult night: chat infiltrated by an outside troll faction (identified on-stream as IP2) making threats of the ugliest varieties, while interpersonal conflicts among panelists flared on a second front. A two-theater war, fought live.\n\nThe response, preserved in the following broadcast, was doctrinally significant: a stream titled 'GOOD VIBES ONLY Open Panel, Browsing the Codex' — opening with an intense song about manipulation and false righteousness, followed by a relaxed, cat-filled panel. The cats, as ever, were the de-escalation mechanism (see: cats as content drivers, concepts wing).\n\nThe Codex classifies this as the canonical demonstration of the archive's oldest survival law: when the outside gets loud, browse the Codex and pet the cat.\n\nSEVERITY ASSESSMENT: Full Poltergeist, downgraded to Mild Disturbance by feline intervention.",
  },
  {
    slug: "the-cash-app-tribunal",
    title: "The Cash App Tribunal",
    category: "drama",
    episodeSlug: "bronze-text-to-speech",
    summary:
      "A malfunctioning text-to-speech opens the proceedings by reading an unrelated police roleplay. The community then conducts heated hearings on Cash App fraud claims, boundary violations, and alleged conspiracies. The TTS remains the most coherent speaker.",
    fullEntry:
      "FILE STATUS: ongoing; the tribunal never formally adjourned.\n\nThe session opened, per the record, with the text-to-speech system malfunctioning and reciting an unrelated police roleplay scenario to a bewildered court. The host attempted repairs. The machine had said what it came to say.\n\nProceedings then moved to the main docket: heated community commentary regarding Cash App fraud investigations, boundary violations, fake friendships, and allegations of conspiracy — with speaker Brown Bird entering extended testimony of frustration into the record.\n\nThe Codex notes for posterity that no verdict was reached, no funds were located, and the broken TTS delivered the evening's only uncontested statement.\n\nSEVERITY ASSESSMENT: Elevated Nonsense with financial subplot.\nEXHIBIT A: the machine that spoke out of turn.",
  },
  {
    slug: "the-whisper-network-wars",
    title: "The Whisper Network Wars",
    category: "drama",
    episodeSlug: "i-see-the-board-exposing-whisper-networks",
    summary:
      "A multi-episode campaign against the whisper networks — rumors, half-truths, and 600-pound trolls — fought with spoken-word poetry, strategic silence, and the occasional point-by-point airstrike.",
    fullEntry:
      "FILE STATUS: open. This war does not end; it merely changes channels.\n\nAcross a run of episodes in the archive ('I See the Board', 'My 600 Pound Troll', 'I'd Rather Just Hang Out Alone', 'The Stupidity is Painful'), the record documents a sustained campaign against what the host termed whisper networks: informal channels where half-truths circulate without accountability, letting crowds draw their own wrong conclusions on schedule.\n\nThe counter-arsenal, as deployed on-stream: theatrical spoken-word openings, strategic visibility, composure as a weapon, and the occasional full-episode rebuttal when composure had done all it could.\n\nThe Codex observes that every era of the cult has its whisper war, and every whisper war produces the era's best poetry. This is either alchemy or attrition. The scholars are divided, quietly, in a network of whispers.\n\nSEVERITY ASSESSMENT: chronic, weaponized into art.",
  },
  {
    slug: "on-whisper-networks-a-field-guide",
    title: "On Whisper Networks: A Field Guide to Rumors in Small Communities",
    category: "article",
    episodeSlug: "i-see-the-board-exposing-whisper-networks",
    summary:
      "What the 'I See the Board' era taught the archive about how gossip actually works: half-truths over lies, implication over accusation, and why strategic visibility beats denial.",
    fullEntry:
      "Every small community eventually discovers it has a second communication system running underneath the first. The show's 'I See the Board' era put that system on the examination table.\n\nThe mechanics, as laid out on-stream, are worth preserving: whisper networks rarely traffic in outright lies. Lies are falsifiable. The efficient rumor is a half-truth — accurate enough to survive a fact-check, incomplete enough to mislead — passed along with a raised eyebrow rather than a claim. The crowd draws its own conclusions, and no individual node of the network ever said the false thing out loud. Accountability evaporates by design.\n\nThe counter-strategy documented in the archive is equally specific. Not denial — denial feeds the network, because a denial restates the rumor with your name attached. Instead: strategic visibility. Say what you are doing, in public, on the record, repeatedly, so the half-truth has to compete with a whole one. Composure as counterweapon; the record as rebuttal.\n\nWhether it worked is a question the Drama Files can argue about (see: The Whisper Network Wars). But as a field theory of small-community gossip, it holds up better than most academic treatments — and it rhymed.\n\nFiled under: things the show understood before it understood itself.",
  },
  {
    slug: "the-raid-as-ritual",
    title: "The Raid as Ritual: On Sending Your Audience Somewhere Else",
    category: "article",
    episodeSlug: "raid-plan-go-to-danny-stranger-kiss-for-100-viewers",
    summary:
      "From kiss-for-100-viewers incentives to diplomatic incidents: what the archive's raid history says about the strangest gift economy in live streaming.",
    fullEntry:
      "The raid is the strangest ritual live streaming ever invented: at the end of a broadcast, a host takes their most valuable possession — a live audience — and gives it away to someone else, all at once, as a gift that arrives like a flood.\n\nThe archive documents the full spectrum of the form. At one end, the incentive raid: the recorded plan to raid Danny Stranger's stream with a kiss promised at the 100-viewer mark — the audience as dowry, the milestone as vow. At the other end, the diplomatic incident: the Christine raid, which ended in a ban and a full-episode point-by-point response (see: The Christine Raid Incident, Drama Files).\n\nBetween those poles sits the truth of the ritual. A raid is a gift that cannot be refused quietly. It says: here is everything I gathered tonight — deal with it. Received well, it builds alliances that outlast platforms. Received badly, it produces the finest drama in the record.\n\nEither outcome feeds the archive, which may be why the show never stopped doing it. The Codex, which eats drama and goodwill with equal appetite, declines to recommend a policy.\n\nFiled under: gift economies, occupational hazards of generosity.",
  },
];

async function main() {
  const prisma = getPrisma();
  for (const e of ENTRIES) {
    const episode = e.episodeSlug
      ? await prisma.episode.findUnique({ where: { slug: e.episodeSlug }, select: { id: true } })
      : null;
    const data = {
      title: e.title,
      category: e.category,
      summary: e.summary,
      fullEntry: e.fullEntry,
      canonStatus: "humorous" as const,
      searchText: `${e.title} ${e.summary}`,
      firstMentionEpisodeId: episode?.id ?? null,
    };
    await prisma.loreEntry.upsert({
      where: { slug: e.slug },
      create: { slug: e.slug, ...data },
      update: data,
    });
    console.log(`upserted ${e.category}: ${e.slug}${episode ? " (episode linked)" : ""}`);
  }
  const counts = await Promise.all([
    prisma.loreEntry.count({ where: { category: "drama" } }),
    prisma.loreEntry.count({ where: { category: "article" } }),
  ]);
  console.log(`totals — drama: ${counts[0]}, article: ${counts[1]}`);
  await disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
