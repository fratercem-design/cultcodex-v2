/**
 * Bulk people dedup pass.
 *
 * Built from scripts/audit-people-fuzzy.txt review. Conservative — only
 * groups where the bios + naming patterns clearly identify the same human.
 *
 * Usage:
 *   npx tsx scripts/_dedup-people-pass2.ts            # dry run (default)
 *   npx tsx scripts/_dedup-people-pass2.ts --execute  # apply
 */

import "dotenv/config";
import { getPrisma, disconnect } from "./ingest/lib";

type Prisma = ReturnType<typeof getPrisma>;

interface MergeGroup {
  label: string;
  keepId: string;
  dupeIds: string[];
  notes?: string;
}

const GROUPS: MergeGroup[] = [
  // ── User-confirmed additions to Alexandra Mayers ─────────────
  {
    label: "Alexandra Mayers (extras)",
    keepId: "cmn5tenff00mgpottlmcnwxje", // alexandra-mayers (already merged in pass 1; this folds in 4 more)
    dupeIds: [
      "cmoc4wk7l04g72ottw1250c75", // alexandra-mares
      "cmo3c15730209ckttu9kt7usg", // alexander-alexandra
      "cmo3beo8100q8ckttlnkmv8xe", // alexandra-alex
      "cmo3ceqmz02tbckttvcc1xpwe", // alexandra-alexander
    ],
    notes: "User-confirmed merges per follow-up message.",
  },

  // ── Psyche / Trix / Father Psyche / John Bates aliases ───────
  {
    label: "Psyche",
    keepId: "cmn46jta40000b0ttcrogz2xs", // psyche (492g/1215q)
    dupeIds: [
      "cmo3b1q4s000dckttvik107oz", // psyche-trix
      "cmo3b38310034cktthnulzd0q", // trix-psyche
      "cmnt1kqmh0000hwttu14xwe6t", // trix
      "cmnt23k7g013yhwttzrbfg4pp", // father-psyche
      "cmnt20ska00xnhwtt9xtpd52s", // psyche-awakens
      "cmo3by25z01tzckttrhs6lkcg", // psych
      "cmo3bm895015xckttcxgyy5ft", // host-trix
      "cmo3bnysn019ockttzlkzr2s5", // psyche-psych
      "cmo3c0evd01ytckttxrju9p7y", // host-psyche-trix
      "cmo3cucao03qrcktt2d76v5ff", // psyche-trix-john-bates
      "cmo3efafo06wfcktt4wjfqfja", // father-psyche-psyche-trix
      "cmo3d1yan0462cktto2eeip71", // john-psyche-trix
      "cmo3d9lxj04m5cktte38pima5", // psyche-trix-tracy
      "cmo3dt1w305nsckttkvvvud9x", // father-psyche-trix
    ],
    notes: "Excludes Tracy/Emma/John Clark/Narrator/cats/etruth/sy-syke as ambiguous or unrelated.",
  },

  // ── Bea / Bita / Beeta / VA — Persian woman, transliterations ─
  {
    label: "Bea (Bita)",
    keepId: "cmn9hme700089w8ttp79it7hx", // bea
    dupeIds: [
      "cmnt1rzyv00fkhwttxupyh8ay", // beeta
      "cmnt1ynot00t3hwttrxvf5n7c", // bita
      "cmo3bmga9016gckttn7xuxspo", // vita
      "cmo3btzs501m5cktt8ihqq4eb", // bita-vida
      "cmo3bbf9y00jzckttgz00wmwo", // beeta-beta
      "cmo3bk9yq0119cktthq6aybl3", // beatas
      "cmo3cjrzd033rckttt3u3kdjy", // beeta-bea
      "cmo3cnyx403csckttc36dk00x", // bea-beanie
      "cmo3cwk1e03veckttf40kxcow", // bea-beas-kitties
      "cmo3cx2hb03wjcktt96fze59j", // bea-beta-kitties
      "cmo3edkyg06s9ckttouglni1q", // beeta-va
      "cmo3d251i046ockttc4qwxzh5", // beta-beeta
      "cmo3dnwtv05deckttqh1xf3zy", // bt-beta-beeta
      "cmo3efhrb06x3ckttnjdglbjl", // bita-beeta
      "cmo3d4qfb04bxckttuy0sw6ob", // beata
      "cmo3d44vi04anckttw3vx60dw", // va-vita
      "cmo3d8snn04kkckttk4xj05bn", // vita-va-beeta
      "cmo3daox204occktt4kn0am68", // beas-kitties
      "cmo3cadoj02kzckttv5hskh0i", // va-beeta
    ],
    notes: "All transliterations / nicknames of the same Persian community member.",
  },

  // ── Janet / Empress Janet ────────────────────────────────────
  {
    label: "Janet",
    keepId: "cmn46mevk0092b0ttkrqr4cei", // janet
    dupeIds: [
      "cmnt1ppvh00alhwttpcj52s2o", // empress-janet
      "cmo3c9heb02ihckttmjlvrlos", // janet-empress-janet
    ],
  },

  // ── Paige / Prairie Paige ────────────────────────────────────
  {
    label: "Paige (Prairie Paige)",
    keepId: "cmn46tozl00xgb0ttddb39ybu", // paige
    dupeIds: [
      "cmnt2ab7s01ihhwttr9unxfe1", // prairie-paige
      "cmnt1oas2007ihwttamthnck2", // prairie
      "cmo3bfkkm00rzckttnl0nhg01", // prairie-page
      "cmo3cwjvu03vdcktti08d0t7l", // paige-prairie-paige
    ],
    notes: "Skips pi-paige (former friend now accusing — could be different).",
  },

  // ── Jamie ────────────────────────────────────────────────────
  {
    label: "Jamie",
    keepId: "cmn46n09t00b7b0tt0tbdgk0t", // jamie
    dupeIds: [
      "cmn46p33x00iyb0ttn47bcfvm", // jamie-rose
      "cmo3cifsi030zckttn5ut29ur", // jamie-cowboys
    ],
  },

  // ── Tiger Butterfly (Laura, Tig) ─────────────────────────────
  {
    label: "Tiger Butterfly",
    keepId: "cmn46lkex0061b0ttarceiome", // tiger-butterfly
    dupeIds: [
      "cmo3b9pu100gickttntmwuzmf", // tig-tiger-butterfly
      "cmo3bkjoa0120ckttb7ivstwx", // laura-tiger-butterfly
      "cmo3cxftc03x9cktt9dn3tb2k", // butterfly
      "cmo3cxfox03x8cktti7mz8cbh", // tiger
      "cmoc346jy00q72ott3dv7gnfd", // tiger-butterfly-joe
    ],
    notes: "Excludes Lola/Laura standalone (could be different person).",
  },

  // ── Mini Manson / Minnie Manson ──────────────────────────────
  {
    label: "Mini Manson",
    keepId: "cmn46p2v900iwb0ttrysqgs55", // mini-manson
    dupeIds: [
      "cmn46sabh00t5b0ttu4bfrjqi", // minnie-manson
      "cmo3d2zg5048dckttmysx7htf", // minnie-mans
    ],
    notes: "Excludes Charles Manson and Marilyn Manson (different real people).",
  },

  // ── Flirty Diamond ───────────────────────────────────────────
  {
    label: "Flirty Diamond",
    keepId: "cmn46kf8j0025b0ttfpnsh5dh", // flirty-diamond
    dupeIds: [
      "cmo3bwrw301rgcktttou24qu6", // flirty
      "cmo3b3i62003qckttvwgr4uds", // diamond
      "cmo3c93q602hecktt9fc0t2gc", // flirty-diamond-david
      "cmo3blffr0146ckttntzy9ni3", // rg-diamond
    ],
  },

  // ── Summer (Summer Dickerson) ────────────────────────────────
  {
    label: "Summer",
    keepId: "cmn46q9o800mnb0ttta19g9oq", // summer
    dupeIds: [
      "cmo3dt9ki05obckttr8rdrenx", // summer-hot-summer
      "cmo3d8e0z04jocktt0p8saj06", // summer-dickerson-hotmesssummer
    ],
    notes: "Excludes Sweet Pea (different) and Sweet Summer (song character).",
  },

  // ── Michael / Michael L / Michael Leguizamon ─────────────────
  {
    label: "Michael",
    keepId: "cmn46kb49001pb0ttzbaktqb2", // michael
    dupeIds: [
      "cmo3c9axc02hwckttxuh5kv8k", // michael-l
      "cmo3c15fz020bcktt6q722bjq", // michael-leguizamon
    ],
  },

  // ── Joker / Joker TV ─────────────────────────────────────────
  {
    label: "Joker",
    keepId: "cmn46n9pm00c8b0ttvr9fqfzg", // joker
    dupeIds: [
      "cmo3eiz9l074mckttuffvu7q2", // joker-tv
    ],
  },

  // ── DJ Electra ───────────────────────────────────────────────
  {
    label: "DJ Electra",
    keepId: "cmn46koy20033b0ttkzuu6x2i", // dj-electra
    dupeIds: [
      "cmo3e8wzx06j0cktt5pqpyjfy", // dj-electra-be
    ],
    notes: "Excludes 'electra' (VTuber — different).",
  },

  // ── Alisa Jordana ────────────────────────────────────────────
  {
    label: "Alisa Jordana",
    keepId: "cmnmhhdfm00ycosttwozm0pjd", // alisa-jordana
    dupeIds: [
      "cmo3b2eot001qckttr8wq087n", // alisa
      "cmo3crm4503kbckttkvo8lcja", // elisa-jordana
      "cmo3ca8ka02kmckttd7jnl4qp", // lisa-alisa
      "cmo3bt7hn01kgckttn1tm6a2p", // lisa-jordana
      "cmo3edrxr06swcktt9vbg9opv", // alisa-jordan
    ],
  },

  // ── Crystal / Crystal Marie ──────────────────────────────────
  {
    label: "Crystal Marie",
    keepId: "cmnt22c98010thwttdmdiefq6", // crystal (kept — has more guests)
    dupeIds: [
      "cmn46u92l00zbb0tta08kd4dh", // crystal-marie
    ],
  },

  // ── Mr. Big Pipes ────────────────────────────────────────────
  {
    label: "Mr. Big Pipes",
    keepId: "cmn46qpdx00o2b0ttzhjuu2me", // mr-big-pipes
    dupeIds: [
      "cmo3c5i6k029nckttie42p0sn", // mrbigpipes
    ],
  },

  // ── Untrackable / UN TRACKABLE ───────────────────────────────
  {
    label: "Untrackable",
    keepId: "cmn46vr6n0148b0ttfqlqlnxp", // untrackable
    dupeIds: [
      "cmnt2z0070312hwttl0r1s0u6", // un-trackable
    ],
  },

  // ── Sig / Sig Signal66 ───────────────────────────────────────
  {
    label: "Sig",
    keepId: "cmn46r6cz00pob0ttatkij4ak", // sig
    dupeIds: [
      "cmo3c5b8m0294cktthi3kux0n", // sig-signal66
    ],
  },

  // ── Rogue Nomad ──────────────────────────────────────────────
  {
    label: "Rogue Nomad",
    keepId: "cmn46n9le00c7b0tt94kkt9fy", // rogue-nomad
    dupeIds: [
      "cmo3duuc505reckttf43pknge", // rogue
    ],
  },

  // ── Lenor / Lenor Lunar ──────────────────────────────────────
  {
    label: "Lenor",
    keepId: "cmo3braok01gackttkx07tmfq", // lenor
    dupeIds: [
      "cmo3ekrrm0789ckttk6m2tmt9", // lenor-lunar
    ],
  },

  // ── Meer / Caesar (Psyche's boyfriend) ───────────────────────
  {
    label: "Meer (Caesar)",
    keepId: "cmnmi1jr3024fosttyktrrezb", // meer
    dupeIds: [
      "cmn46rlyo00r5b0ttu6hu7twa", // caesar
      "cmo3bl0jq0135cktt6q864uxq", // meer-caesar
      "cmo3b9vur00gzckttsit26v8x", // cesar-me
      "cmo3d1ynr0465ckttw7zoou3q", // caesar-meer
      "cmo3cx2uc03wmcktt8iif5xwm", // meer-me
    ],
  },

  // ── Teresa / Traveling Gypsy ─────────────────────────────────
  {
    label: "Teresa (Traveling Gypsy)",
    keepId: "cmo3byyil01vxcktt3vt5hixf", // teresa
    dupeIds: [
      "cmo3cgzpe02y3cktt6lalp2ro", // traveling-gypsy
      "cmo3ctyec03psckttlxim4udv", // teresa-traveling-gypsy
      "cmo3edd6106rpcktt5803n3xn", // traveling-gypsy-teresa
      "cmo3d5tug04edckttlrxreu4e", // ty-traveling-gypsy
    ],
    notes: "Excludes traveling-tipsy (chat supporter — different) and lone 'gypsy' (vague).",
  },

  // ── Benny Blanco ─────────────────────────────────────────────
  {
    label: "Benny Blanco",
    keepId: "cmo3crp8t03kmckttjkjd5684", // benny-blanco
    dupeIds: [
      "cmo3b6kfn009wckttywb1ytet", // benny
      "cmo3b6kjy009xckttett3l3ih", // blanco
      "cmo3ciwdn031yckttpp65ipfh", // benny-benny-blanco
    ],
    notes: "Excludes benny-brand (described as Q's former friend — different).",
  },

  // ── Clumsy Clairvoyant ───────────────────────────────────────
  {
    label: "Clumsy Clairvoyant",
    keepId: "cmo3cs7uj03lucktt77t9w6qm", // clumsy
    dupeIds: [
      "cmo3crphq03kocktt4wgyjhtx", // clumsy-clairvoyant
      "cmo3c66i202backtt77l73vnz", // clumsy-clairvoyance
      "cmo3b6kag009vckttthc7ki7f", // clumsy-clair
    ],
  },

  // ── Nick Johnson (separate from generic Nick) ────────────────
  {
    label: "Nick Johnson",
    keepId: "cmo3bg6kl00suckttcrb197vc", // nick-johnson
    dupeIds: [
      "cmo3ch5wc02yjcktt9wqd7ujm", // nick-johnson-erica-b
      "cmo3b6xxg00atcktttd0u0brc", // nick-johnson-erica-abadu
      "cmo3ciffj030wckttigjfjcxg", // nick-nick-johnson
    ],
    notes: "Distinct from 'nick' alone (different person — exercising panel member).",
  },

  // ── Nick Winters ─────────────────────────────────────────────
  {
    label: "Nick Winters",
    keepId: "cmo3cne6k03b8ckttkj6ssagp", // nick-winters
    dupeIds: [
      "cmo3bbf1800jxcktt9fmgr1kw", // nick-nick-winters-syrup-wizard
    ],
  },

  // ── Theo / Theo thegate61802 ─────────────────────────────────
  {
    label: "Theo",
    keepId: "cmn46wbt10169b0tt6rtks6dv", // theo
    dupeIds: [
      "cmo3ca8bj02kkckttw5yg308p", // theo-thegate61802
    ],
  },

  // ── Trevor / Trevor Ryan ─────────────────────────────────────
  {
    label: "Trevor",
    keepId: "cmn46wbos0168b0ttjbjzrigh", // trevor
    dupeIds: [
      "cmo3bjxuz010gcktt67ttshd7", // trevor-ryan
    ],
  },

  // ── Chona / Jonah ────────────────────────────────────────────
  {
    label: "Chona",
    keepId: "cmo3btcs001krcktt9pakiafl", // chona
    dupeIds: [
      "cmo3cruxs03l0cktt6uo13fgq", // jonah
      "cmo3cskgd03mocktt2b5r755t", // jonah-chona
    ],
    notes: "Both bios identify Filipino moderator — same person.",
  },

  // ── Norcal / Norca ───────────────────────────────────────────
  {
    label: "Norcal",
    keepId: "cmn47j7tv033ib0ttvagnt479", // norcal
    dupeIds: [
      "cmo3eloww079ycktttydy0wju", // norca
    ],
  },

  // ── Bronberg / Bronzbird-Bronberg ────────────────────────────
  {
    label: "Bronberg",
    keepId: "cmo3dolmq05evckttvhy6xl5m", // bronberg
    dupeIds: [
      "cmo3c1zlf022ackttm7gijh3j", // bronzbird-bronberg
    ],
  },

  // ── Bronze Bird / Bronze ─────────────────────────────────────
  {
    label: "Bronze Bird",
    keepId: "cmo3cwkef03vhckttl47na3g7", // bronze-bird
    dupeIds: [
      "cmnt3bt4e03trhwttf8vgaslf", // bronze
      "cmo3cvjtr03t9cktteugflmmz", // bronze-chicken
    ],
  },

  // ── Meezer / Measor ──────────────────────────────────────────
  {
    label: "Meezer",
    keepId: "cmnjbd7s902xf4ott2frs1hfm", // meezer
    dupeIds: [
      "cmo3eezwk06vtckttim18pv70", // meezer-measor
    ],
  },

  // ── Bradley / Bradley-Crusty ─────────────────────────────────
  {
    label: "Bradley",
    keepId: "cmo3cgt3k02xnckttsitvh6u7", // bradley
    dupeIds: [
      "cmo3cy3pg03yqcktt0jcu0oiz", // bradley-crusty
    ],
  },

  // ── Rando ────────────────────────────────────────────────────
  {
    label: "Rando",
    keepId: "cmn46xubu01b5b0ttxe2t57of", // rando
    dupeIds: [
      "cmo3bnczq018gcktttt78c7en", // random-guy-rando
    ],
  },

  // ── Allied / Master Computer Guy ─────────────────────────────
  {
    label: "Allied",
    keepId: "cmn46ujp70105b0ttn53n2b4o", // allied
    dupeIds: [
      "cmnmhsp0e01mhosttfqneswho", // master-computer-guy-ali
      "cmo3d9m1v04m6ckttlfulcgqd", // allied-master-computer
    ],
  },

  // ── Spunky / Stephanie ───────────────────────────────────────
  {
    label: "Spunky (Stephanie)",
    keepId: "cmn5t78in004hpotts0s39w2g", // spunky
    dupeIds: [
      "cmo3bs3dw01hwcktt46m6udzy", // spunky-stephanie
    ],
    notes: "Excludes lone 'stephanie' (vague reference).",
  },

  // ── Uncomfortably Numb / Katie ───────────────────────────────
  {
    label: "Uncomfortably Numb (Katie)",
    keepId: "cmo3cifb9030vckttdwx8td4k", // uncomfortably-numb
    dupeIds: [
      "cmo3c0pe801zbckttrmg2ma63", // katie-uncomfortably-numb
    ],
  },

  // ── Easy / EZ ────────────────────────────────────────────────
  {
    label: "Easy (EZ)",
    keepId: "cmo3beoce00q9ckttvft04bbo", // easy
    dupeIds: [
      "cmo3c0q4n01zhcktt1xrfqba2", // ez-easy
    ],
  },

  // ── Victoria Jay ─────────────────────────────────────────────
  {
    label: "Victoria Jay",
    keepId: "cmo3c152s0208cktt9lw510ab", // victoria-jay
    dupeIds: [
      "cmo3ctnyx03p1ckttwkwv5c2t", // victoria
    ],
  },

  // ── Peter / Peta-Peter ───────────────────────────────────────
  {
    label: "Peter",
    keepId: "cmn5th58700t1pottsabjlrwb", // peter
    dupeIds: [
      "cmo3c34p7024cckttjdj302d5", // peta-peter
    ],
  },

  // ── Mina / Mina-Mirina ───────────────────────────────────────
  {
    label: "Mina",
    keepId: "cmo3dj9ri0554ckttzw34fqmw", // mina
    dupeIds: [
      "cmo3e8bnq06hhcktt75qfdexe", // mina-mirina
    ],
  },

  // ── Shan / Shan Camp ─────────────────────────────────────────
  {
    label: "Shan",
    keepId: "cmo3bkjsk0121ckttpky25v4h", // shan
    dupeIds: [
      "cmo3eawda06n5ckttd83mj4gi", // shan-camp
    ],
  },

  // ── Salmon / Salmon-RG ───────────────────────────────────────
  {
    label: "Salmon",
    keepId: "cmo3bdf1l00nsckttp8076o5s", // salmon
    dupeIds: [
      "cmo3e8k7j06ibcktts0zdub1d", // salmon-rg
    ],
  },

  // ── Arushi / Arushi-Roshi ────────────────────────────────────
  {
    label: "Arushi",
    keepId: "cmo3csktf03mrckttd7sbusr4", // arushi-roshi
    dupeIds: [
      "cmo3cu6wq03qfckttmlq3webp", // arushi
    ],
  },

  // ── Jerry / Jerry Leane ──────────────────────────────────────
  {
    label: "Jerry Leane",
    keepId: "cmo3cnz5v03cuckttzfpej6ju", // jerry-leane
    dupeIds: [
      "cmo3cgtky02xrcktt632hxer3", // jerry
    ],
    notes: "Both bios reference Star Trek / Mars rover work — same person.",
  },

  // ── Eliza Fifth Sage / Fifth Sage ────────────────────────────
  // SKIPPED — bios contradict (Eliza = Bronze Bird's sister; Fifth Sage = victim
  // of porn bombing). Different people.

  // ── Sleeping / Sleeping Energy ───────────────────────────────
  {
    label: "Sleeping Energy",
    keepId: "cmo3ctobr03p4cktt431e67ha", // sleeping
    dupeIds: [
      "cmo3cs1g603lfcktt1yix6oaf", // sleeping-energy
    ],
  },
];

async function fetchPerson(p: Prisma, id: string) {
  return p.person.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          guestAppearances: true,
          quotes: true,
          mentions: true,
          topics: true,
          loreConnections: true,
        },
      },
    },
  });
}

async function mergeOne(p: Prisma, keepId: string, dupeId: string) {
  // EpisodeGuest
  const keeperGuests = await p.episodeGuest.findMany({
    where: { personId: keepId },
    select: { episodeId: true },
  });
  const kg = new Set(keeperGuests.map((g) => g.episodeId));
  const dupeGuests = await p.episodeGuest.findMany({ where: { personId: dupeId } });
  for (const g of dupeGuests) {
    if (kg.has(g.episodeId)) {
      await p.episodeGuest.delete({
        where: { episodeId_personId: { episodeId: g.episodeId, personId: dupeId } },
      });
    } else {
      await p.episodeGuest.update({
        where: { episodeId_personId: { episodeId: g.episodeId, personId: dupeId } },
        data: { personId: keepId },
      });
    }
  }

  // EpisodeMentionedPerson
  const keeperMentions = await p.episodeMentionedPerson.findMany({
    where: { personId: keepId },
    select: { episodeId: true },
  });
  const km = new Set(keeperMentions.map((m) => m.episodeId));
  const dupeMentions = await p.episodeMentionedPerson.findMany({ where: { personId: dupeId } });
  for (const m of dupeMentions) {
    if (km.has(m.episodeId)) {
      await p.episodeMentionedPerson.delete({
        where: { episodeId_personId: { episodeId: m.episodeId, personId: dupeId } },
      });
    } else {
      await p.episodeMentionedPerson.update({
        where: { episodeId_personId: { episodeId: m.episodeId, personId: dupeId } },
        data: { personId: keepId },
      });
    }
  }

  // Quote
  await p.quote.updateMany({
    where: { speakerPersonId: dupeId },
    data: { speakerPersonId: keepId },
  });

  // PersonTopic
  const keeperTopics = await p.personTopic.findMany({
    where: { personId: keepId },
    select: { topicId: true },
  });
  const kt = new Set(keeperTopics.map((t) => t.topicId));
  const dupeTopics = await p.personTopic.findMany({ where: { personId: dupeId } });
  for (const t of dupeTopics) {
    if (kt.has(t.topicId)) {
      await p.personTopic.delete({
        where: { personId_topicId: { personId: dupeId, topicId: t.topicId } },
      });
    } else {
      await p.personTopic.update({
        where: { personId_topicId: { personId: dupeId, topicId: t.topicId } },
        data: { personId: keepId },
      });
    }
  }

  // PersonLore
  const keeperLore = await p.personLore.findMany({
    where: { personId: keepId },
    select: { loreEntryId: true },
  });
  const kl = new Set(keeperLore.map((l) => l.loreEntryId));
  const dupeLore = await p.personLore.findMany({ where: { personId: dupeId } });
  for (const l of dupeLore) {
    if (kl.has(l.loreEntryId)) {
      await p.personLore.delete({
        where: { personId_loreEntryId: { personId: dupeId, loreEntryId: l.loreEntryId } },
      });
    } else {
      await p.personLore.update({
        where: { personId_loreEntryId: { personId: dupeId, loreEntryId: l.loreEntryId } },
        data: { personId: keepId },
      });
    }
  }

  // RelatedPerson — both directions
  const dupeRelFrom = await p.relatedPerson.findMany({ where: { personAId: dupeId } });
  for (const r of dupeRelFrom) {
    if (r.personBId === keepId) {
      await p.relatedPerson.delete({
        where: { personAId_personBId: { personAId: dupeId, personBId: r.personBId } },
      });
      continue;
    }
    const exists = await p.relatedPerson.findUnique({
      where: { personAId_personBId: { personAId: keepId, personBId: r.personBId } },
    });
    if (exists) {
      await p.relatedPerson.delete({
        where: { personAId_personBId: { personAId: dupeId, personBId: r.personBId } },
      });
    } else {
      await p.relatedPerson.update({
        where: { personAId_personBId: { personAId: dupeId, personBId: r.personBId } },
        data: { personAId: keepId },
      });
    }
  }
  const dupeRelTo = await p.relatedPerson.findMany({ where: { personBId: dupeId } });
  for (const r of dupeRelTo) {
    if (r.personAId === keepId) {
      await p.relatedPerson.delete({
        where: { personAId_personBId: { personAId: r.personAId, personBId: dupeId } },
      });
      continue;
    }
    const exists = await p.relatedPerson.findUnique({
      where: { personAId_personBId: { personAId: r.personAId, personBId: keepId } },
    });
    if (exists) {
      await p.relatedPerson.delete({
        where: { personAId_personBId: { personAId: r.personAId, personBId: dupeId } },
      });
    } else {
      await p.relatedPerson.update({
        where: { personAId_personBId: { personAId: r.personAId, personBId: dupeId } },
        data: { personBId: keepId },
      });
    }
  }

  // Preserve dupe display name + altNames on keeper
  const keeper = await p.person.findUnique({
    where: { id: keepId },
    select: { altNames: true, displayName: true },
  });
  const dupe = await p.person.findUnique({
    where: { id: dupeId },
    select: { displayName: true, altNames: true },
  });
  if (keeper && dupe) {
    const merged = new Set<string>(keeper.altNames ?? []);
    if (dupe.displayName && dupe.displayName !== keeper.displayName) merged.add(dupe.displayName);
    for (const a of dupe.altNames ?? []) if (a !== keeper.displayName) merged.add(a);
    await p.person.update({ where: { id: keepId }, data: { altNames: Array.from(merged) } });
  }

  await p.person.delete({ where: { id: dupeId } });
}

async function main() {
  const dryRun = !process.argv.includes("--execute");
  const p = getPrisma();
  let totalDeleted = 0;

  for (const group of GROUPS) {
    console.log(`\n=== ${group.label} ===`);
    if (group.notes) console.log(`  note: ${group.notes}`);
    const keeper = await fetchPerson(p, group.keepId);
    if (!keeper) {
      console.log(`  KEEP ${group.keepId} — NOT FOUND, skipping group`);
      continue;
    }
    console.log(
      `  KEEP   ${keeper.id} | "${keeper.displayName}" (slug=${keeper.slug}) — ${keeper._count.guestAppearances}g/${keeper._count.quotes}q/${keeper._count.mentions}m`
    );
    const valid: string[] = [];
    for (const did of group.dupeIds) {
      const d = await fetchPerson(p, did);
      if (!d) {
        console.log(`  MERGE  ${did} — NOT FOUND, skipping`);
        continue;
      }
      console.log(
        `  MERGE  ${d.id} | "${d.displayName}" (slug=${d.slug}) — ${d._count.guestAppearances}g/${d._count.quotes}q/${d._count.mentions}m`
      );
      valid.push(did);
    }
    if (dryRun) continue;
    for (const did of valid) {
      await mergeOne(p, group.keepId, did);
      totalDeleted++;
    }
    const after = await fetchPerson(p, group.keepId);
    console.log(
      `  -> AFTER ${after?.displayName} ${after?._count.guestAppearances}g/${after?._count.quotes}q/${after?._count.mentions}m`
    );
  }

  if (dryRun) {
    console.log("\nDRY RUN — pass --execute to apply.");
  } else {
    console.log(`\nDone. Deleted ${totalDeleted} dupes. Run scripts/_rebuild-search-text.ts.`);
  }
  await disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
