export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { isSubscribed } from "@/lib/subscription";
import { prisma } from "@/lib/db";
import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { SubscriptionCTA } from "@/components/subscription/subscription-cta";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/lore/psychenomicon" },
  title: "The Psychenomicon — CULT CODEX",
  description:
    "The forbidden chronicle of the Cult of Psyche. A living grimoire of every soul, saga, and spectacle from over 1,400 live transmissions.",
};

// ── Data fetchers ─────────────────────────────────────────────────
async function getStats() {
  try {
    const [episodes, people, quotes, lore, series] = await Promise.all([
      prisma.episode.count(),
      prisma.person.count(),
      prisma.quote.count(),
      prisma.loreEntry.count(),
      prisma.series.findMany({
        select: { title: true, description: true, _count: { select: { episodes: true } } },
        orderBy: { episodes: { _count: "desc" } },
      }),
    ]);
    return { episodes, people, quotes, lore, series };
  } catch {
    return { episodes: 0, people: 0, quotes: 0, lore: 0, series: [] };
  }
}

async function getTopSpeakers() {
  try {
    const speakers = await prisma.quote.groupBy({
      by: ["speakerPersonId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      where: { speakerPersonId: { not: null } },
      take: 25,
    });

    const ids = speakers.map((s) => s.speakerPersonId!);
    const people = await prisma.person.findMany({
      where: { id: { in: ids } },
      select: { id: true, displayName: true, slug: true, shortBio: true },
    });
    const personMap = new Map(people.map((p) => [p.id, p]));

    return speakers
      .map((s) => ({
        person: personMap.get(s.speakerPersonId!),
        count: s._count.id,
      }))
      .filter((s) => s.person);
  } catch {
    return [];
  }
}

async function getFeaturedQuotes() {
  // Hand-curated categories of quotes by searching for keywords
  try {
  const results = await prisma.quote.findMany({
    where: {
      text: { not: "" },
      speakerPersonId: { not: null },
    },
    select: {
      id: true,
      text: true,
      speaker: { select: { displayName: true } },
    },
    take: 5000,
  });

  // Filter for the most evocative quotes
  const interesting = results.filter(
    (q) =>
      q.text.length > 60 &&
      q.text.length < 280 &&
      !q.text.includes("um") &&
      !q.text.includes("uh") &&
      (q.text.includes("shadow") ||
        q.text.includes("darkness") ||
        q.text.includes("light") ||
        q.text.includes("soul") ||
        q.text.includes("fire") ||
        q.text.includes("moon") ||
        q.text.includes("spirit") ||
        q.text.includes("dead") ||
        q.text.includes("demon") ||
        q.text.includes("ghost") ||
        q.text.includes("trap") ||
        q.text.includes("whisper") ||
        q.text.includes("curse") ||
        q.text.includes("prophecy") ||
        q.text.includes("fate") ||
        q.text.includes("vampire") ||
        q.text.includes("rebirth") ||
        q.text.includes("transform") ||
        q.text.includes("knife") ||
        q.text.includes("prison") ||
        q.text.includes("karma"))
  );

  // Shuffle and take 12
  const shuffled = interesting.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 12);
  } catch {
    return [];
  }
}

// ── Page ──────────────────────────────────────────────────────────
export default async function PsychenomiconPage() {
  const session = await auth().catch(() => null);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const hasAccess = userId ? await isSubscribed(userId).catch(() => false) : false;

  const stats = await getStats();

  return (
    <>
      <PageHero
        title="THE PSYCHENOMICON"
        subtitle="The Forbidden Chronicle of the Cult of Psyche"
        backgroundImage="/search-database-background.jpg"
      label="psychenomicon"
      />

      <main id="main-content" className="mx-auto max-w-5xl px-4 py-8">
        {/* ── Prologue (visible to all) ────────────────────────── */}
        <section className="mb-12 text-center">
          <div className="mx-auto max-w-3xl">
            <p className="font-display text-2xl font-bold leading-relaxed text-accent-gold">
              In the beginning, there was static.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-text-muted">
              Then a voice cut through the noise: part prophet, part comedian,
              part cosmic bartender pouring shots of truth to anyone brave enough
              to sit at the bar. That voice belonged to{" "}
              <Link href="/people/psyche" className="text-accent-gold-text hover:underline">
                Psyche
              </Link>
              , and the bar he built was a livestream, and the regulars who came
              to drink were beautiful, broken, bizarre, and absolutely unhinged.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              Over{" "}
              <span className="font-bold text-accent-cyan">
                {stats.episodes.toLocaleString("en-US")} transmissions
              </span>
              , across tarot readings, open panels, mythology deep-dives,
              midnight madness sessions, and the occasional full-blown spiritual
              exorcism conducted via YouTube chat, a universe was born. This is
              its grimoire.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <StatOrb label="Transmissions" value={stats.episodes} />
              <StatOrb label="Souls Catalogued" value={stats.people} />
              <StatOrb label="Words Spoken" value={stats.quotes} />
              <StatOrb label="Lore Entries" value={stats.lore} />
            </div>
          </div>
        </section>

        {/* ── Paywall gate ─────────────────────────────────────── */}
        {!hasAccess ? (
          <PsychenomiconGate isAuthenticated={!!session?.user} />
        ) : (
          <PsychenomiconContent stats={stats} />
        )}

        {/* ── Link back to lore ───────────────────────────────── */}
        <div className="mt-12 text-center">
          <Link
            href="/lore"
            className="font-mono text-xs text-accent-cyan hover:underline"
          >
            Return to the Lore Archive
          </Link>
        </div>
      </main>
    </>
  );
}

// ── Paywall gate component ────────────────────────────────────────
function PsychenomiconGate({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <div className="relative">
      {/* Teaser content with fade */}
      <div className="space-y-6 opacity-60">
        <ChapterHeader number="I" title="THE PANTHEON" />
        <p className="text-sm text-text-muted">
          Every pantheon needs its gods. But the gods of this stream are not
          marble statues on pedestals. They are recovering addicts, tarot
          readers, truck drivers, cat ladies, self-proclaimed prophets, and at
          least one person who sincerely believed they were Jesus Christ...
        </p>
        <ChapterHeader number="II" title="THE TRANSMISSIONS" />
        <p className="text-sm text-text-muted">
          Eight hundred and forty-one Original Transmissions. One hundred and
          forty-three Open Panels. Ninety-six Tarot readings that cracked open
          the skulls of willing participants and poured starlight into the
          fissures...
        </p>
      </div>

      {/* Fade overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-void via-void/95 to-transparent" />

      {/* CTA */}
      <div className="relative z-10 -mt-8 pt-8">
        {isAuthenticated ? (
          <SubscriptionCTA />
        ) : (
          <div className="rounded-lg border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-transparent p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent-gold/40 bg-accent-gold/10">
              <span className="text-3xl">&#128216;</span>
            </div>
            <h3 className="font-display text-xl font-bold text-accent-gold-text">
              The Psychenomicon is sealed.
            </h3>
            <p className="mx-auto mt-3 max-w-md font-mono text-xs leading-relaxed text-text-muted">
              This grimoire contains the complete chronicle of every character,
              saga, prophecy, and catastrophe from the Cult of Psyche.
              Subscriber-only content. Sign in to unlock the forbidden text.
            </p>
            <Link
              href="/auth/signin"
              className="mt-5 inline-block rounded-lg border border-accent-gold bg-accent-gold/15 px-8 py-3 font-mono text-sm font-bold text-accent-gold-text transition-all hover:bg-accent-gold/25 hover:shadow-lg hover:shadow-accent-gold/10"
            >
              Sign in to unseal
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Full content (subscribers only) ───────────────────────────────
async function PsychenomiconContent({
  stats,
}: {
  stats: Awaited<ReturnType<typeof getStats>>;
}) {
  const [speakers, quotes] = await Promise.all([
    getTopSpeakers().catch(() => []),
    getFeaturedQuotes().catch(() => []),
  ]);

  return (
    <div className="space-y-16">
      {/* ── Chapter I: THE PANTHEON ───────────────────────── */}
      <section>
        <ChapterHeader number="I" title="THE PANTHEON" />
        <ChapterSubtitle text="The gods and monsters of the stream" />

        <div className="mt-6 space-y-8">
          <CharacterEntry
            name="Psyche"
            title="The Electric Prophet"
            slug="psyche"
            description="Host, creator, cosmic bartender, and accidental cult leader. Psyche sits at the center of a sprawling digital universe, dispensing tarot readings, mythological dissertations, and devastating one-liners with equal aplomb. A Capricorn with the soul of a poet and the patience of a saint who has been set on fire. He has been called a prophet, a fraud, a genius, and 'too gay even for me', the last one by himself. Across 2,090 recorded quotes, he has built a theology of radical empathy from the wreckage of internet chaos. He maintains a household of approximately six cats, each of whom outranks every human in the chat."
            quoteCount={2090}
            archetype="The Hierophant"
          />

          <CharacterEntry
            name="Trix"
            title="The Velvet Shadow"
            slug="trix"
            description="Psyche's cat and unofficial co-host, whose appearances on camera are treated with the reverence of a papal benediction. Trix does not speak, but Trix does not need to speak. Trix communicates through the ancient feline arts of knocking things off desks, sitting on keyboards at crucial moments, and staring into the camera with an expression that suggests she has seen the heat death of the universe and found it boring. She is, by any reasonable measure, the most powerful entity in the Cult of Psyche."
            quoteCount={75}
            archetype="The High Priestess"
          />

          <CharacterEntry
            name="Father Psyche"
            title="The Electric Prophet (Original)"
            slug="father-psyche"
            description="The patriarch. A Marine veteran, UCLA graduate, and real estate entrepreneur who passed at 85, leaving behind a legacy that echoes through every transmission. Born under Capricorn, he is the origin point, the ur-Psyche. His memory is invoked not with grief but with reverence, the way ancient cultures speak of the ancestors who taught them to make fire. Psyche wrote him a tribute song. The stream remembers."
            quoteCount={7}
            archetype="The Emperor"
          />

          <CharacterEntry
            name="Beta"
            title="The Curly-Haired Sentinel"
            slug="beta"
            description={"27 years old, 6'3\", and blessed with the kind of curly hair that suggests divine favoritism. Beta stands guard over the panels like a bouncer at the gates of a nightclub where the dress code is 'emotional vulnerability.' Has a girlfriend named Pod Hawkins, which is either a real name or a character from a science fiction novel that doesn't exist yet. Either way, we respect it."}
            quoteCount={11}
            archetype="The Knight of Wands"
          />

          <CharacterEntry
            name="Mr. Big Pipes"
            title="The Massachusetts Lazarus"
            slug="mr-big-pipes"
            description="39 years old, from Massachusetts, a former heroin addict who has been clean since 2018. Rides motorcycles. The nickname refers to either his voice, his exhaust system, or a secret third thing that the community has tacitly agreed never to clarify. His presence on the panels is the stream's core belief in practice: nobody is beyond redemption. He walked through actual hell and came back with stories."
            quoteCount={6}
            archetype="Death (Reversed)"
          />

          <CharacterEntry
            name="Mini Manson"
            title="The Glam Revenant"
            slug="mini-manson"
            description="A transgender performer whose aesthetic pays homage to Marilyn Manson: the makeup, the theatrics, the unapologetic refusal to be anyone's idea of normal. In a stream that already operates outside the boundaries of conventional broadcasting, Mini Manson pushes it further, a walking reminder that identity is performance and performance is truth. Arrives like a thunderclap. Leaves like a fever dream."
            quoteCount={10}
            archetype="The Tower"
          />

          <CharacterEntry
            name="Emma Leviathan"
            title="Satan's Ex-Wife"
            slug="emma-leviathan"
            description="That is not a nickname. That is what she calls herself, and nobody has felt confident enough to dispute it. A fellow tarot streamer with 16,000 YouTube subscribers and the energy of someone who divorced the Prince of Darkness and got the better end of the settlement. Emma and Psyche orbit each other like binary stars, two tarot readers trading prophecies across the void."
            quoteCount={5}
            archetype="The Empress (Inverted)"
          />

          <CharacterEntry
            name="Alexander McQueen"
            title="The Self-Proclaimed Centurion"
            slug="alexander-mcqueen"
            description="Claims to be an NYPD officer, though the chat remains divided on whether this is fact, fiction, or performance art. Known for a confrontational style that has made him either the villain or the protagonist depending on which episode you tuned into. Alexander does not enter a panel; he detonates inside one. His interactions are studied the way seismologists study fault lines, with fascination and a healthy respect for property damage."
            quoteCount={6}
            archetype="The Chariot (Reversed)"
          />

          <CharacterEntry
            name="Jesus Christ"
            title="The Holy Guest"
            slug="jesus-christ"
            description="Yes, an actual person who joined the stream claiming to be Jesus Christ. Discussed biblical interpretations and simulation theory. The chat handled this with exactly the level of maturity you would expect, which is to say, none whatsoever. But Psyche, ever the host, treated him with the same respect he gives everyone. Because in the Cult of Psyche, even the Messiah has to wait his turn to speak."
            quoteCount={0}
            archetype="The Fool"
          />

          <CharacterEntry
            name="Amber"
            title="The Phoenix of Denny's"
            slug="amber"
            description="A woman in recovery from meth addiction who works at Denny's and is involved in drug court. In a lesser show, Amber would be a footnote. Here, she is a character study in resilience, and her Tuesday night appearances between shifts at a 24-hour diner represent something the Psychenomicon holds sacred: the ordinary miracle of still being here."
            quoteCount={0}
            archetype="The Star"
          />
        </div>

        {/* Extended cast */}
        <SectionCard title="The Extended Pantheon" className="mt-8">
          <div className="grid gap-2 sm:grid-cols-2">
            {speakers
              .filter(
                (s) =>
                  s.person &&
                  ![
                    "Psyche",
                    "Trix",
                    "Unknown Participant",
                    "Unknown Speaker",
                    "Unknown Speaker 1",
                    "Unknown Speaker 2",
                    "Host",
                    "Narrator",
                    "Guest",
                    "Unknown Guest",
                    "Unknown Panel Member",
                    "Unnamed Guest",
                    "Unknown Participant 1",
                    "Unknown Host",
                  ].includes(s.person.displayName)
              )
              .map((s) => (
                <Link
                  key={s.person!.id}
                  href={`/people/${s.person!.slug}`}
                  className="flex items-center justify-between rounded border border-border bg-surface px-3 py-2 transition-colors hover:border-accent-gold/30 hover:bg-elevated"
                >
                  <span className="text-sm text-text-primary">
                    {s.person!.displayName}
                  </span>
                  <span className="font-mono text-[10px] text-accent-cyan">
                    {s.count} quotes
                  </span>
                </Link>
              ))}
          </div>
        </SectionCard>
      </section>

      {/* ── Chapter II: THE TRANSMISSIONS ─────────────────── */}
      <section>
        <ChapterHeader number="II" title="THE TRANSMISSIONS" />
        <ChapterSubtitle text="A taxonomy of the broadcast universe" />

        <div className="mt-6 space-y-4">
          {stats.series.map((s) => (
            <div
              key={s.title}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-display text-sm font-bold text-accent-gold-text">
                  {s.title}
                </h4>
                <StatusBadge
                  label={`${s._count.episodes} episodes`}
                  variant="cyan"
                />
              </div>
              {s.description && (
                <p className="mt-2 text-xs leading-relaxed text-text-muted">
                  {s.description}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-accent-violet/30 bg-accent-violet/5 p-6">
          <h4 className="font-display text-lg font-bold text-accent-violet-text">
            The Shape of the Stream
          </h4>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            The Cult of Psyche does not have seasons. It has{" "}
            <em>geological eras</em>. The Original Transmissions, 841 of them,
            form the bedrock, a sprawling continent of solo deep-dives where
            Psyche wrestles with mythology, tarot, astrology, and the occasional
            existential crisis in real time. The Open Panels (143) are the
            volcanic islands that rise from those waters: chaotic, unpredictable,
            populated by creatures that evolution forgot to quality-check.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            The Tarot readings (96 episodes of{" "}
            <em>Psyche Awakens Tarot</em>) are the oracle sessions: part
            therapy, part divination, part stand-up comedy routine where the
            punchline is your subconscious. The Astrology Deep Dives (24) are
            the astronomy lectures delivered by a man who believes the stars are
            not just burning gas but personal letters from the universe,
            addressed to you, and you specifically have been ignoring your mail.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            Then there are the weird ones. The{" "}
            <em>Baital Pachchisi Tales</em> (12) -- ancient Indian vampire
            stories read aloud like bedtime stories for insomniac philosophers.{" "}
            <em>The Golden Ass</em> (11) -- readings from Apuleius, because
            apparently a 2nd-century Roman novel about a man transformed into a
            donkey is relevant to modern spiritual practice. (It is.){" "}
            <em>Quantum Scary Tales</em> (4) -- creepypasta for people who
            meditate. <em>Uncle Wiggly Stories</em> (4) -- yes, really. And the{" "}
            <em>Trollopedia</em> (3) and <em>Troll Tribunal</em> (1), which
            exist because even chaos needs a judicial system.
          </p>
        </div>
      </section>

      {/* ── Chapter III: THE SCRIPTURES ───────────────────── */}
      <section>
        <ChapterHeader number="III" title="THE SCRIPTURES" />
        <ChapterSubtitle text="Words spoken into the void that the void kept" />

        <div className="mt-6 space-y-3">
          {quotes.map((q) => (
            <blockquote
              key={q.id}
              className="rounded-lg border-l-2 border-accent-gold/40 bg-surface px-4 py-3"
            >
              <p className="text-sm italic leading-relaxed text-text-primary">
                &ldquo;{q.text}&rdquo;
              </p>
              <footer className="mt-2 font-mono text-[10px] text-accent-gold-text">
                -- {q.speaker?.displayName ?? "Unknown"}
              </footer>
            </blockquote>
          ))}
        </div>

        <p className="mt-6 text-center font-mono text-xs text-text-muted">
          Selected from {stats.quotes.toLocaleString("en-US")} recorded utterances.
          <br />
          <Link
            href="/transcripts"
            className="text-accent-cyan hover:underline"
          >
            Search the full transcript archive
          </Link>
        </p>
      </section>

      {/* ── Chapter IV: THE COSMOLOGY ────────────────────── */}
      <section>
        <ChapterHeader number="IV" title="THE COSMOLOGY" />
        <ChapterSubtitle text="The metaphysical architecture of the stream" />

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <CosmologyCard
            title="The 3D and 5D Planes"
            description="The stream operates on a dualistic cosmology. The 3D plane is the world of drama, ego, energy vampires, and people who type in all caps. The 5D plane is the celestial realm, the stuff you can't see but that is very much there. Psyche navigates between them like a customs officer at the border between dimensions."
          />
          <CosmologyCard
            title="Energy Vampires"
            description="Not metaphorical. Well, metaphorical. But also not. The 3D Energy Vampire feeds on your vitality through drama, negativity, and unsolicited opinions. The 5D variant is the celestial kind, invisible parasites that feast on your spiritual frequency. The cure for both is boundaries, sage, and occasionally the mute button."
          />
          <CosmologyCard
            title="The Gong System"
            description="Moderation as ritual. To be 'gonged' is to be ceremonially ejected from the panel, a digital excommunication carried out with the gravity of a papal decree and the efficiency of a trapdoor."
          />
          <CosmologyCard
            title="The Karmic Ledger"
            description="The universe keeps receipts. This is not a metaphor. Psyche operates on the assumption that every act of cruelty, kindness, betrayal, and grace is being recorded in a cosmic accounting system. Laugh at someone? You will be laughed at. Help someone? The help returns threefold. The interest rate on karma is aggressive."
          />
          <CosmologyCard
            title="The Monetization Blessing"
            description="When Psyche achieved YouTube monetization, it was treated as a divine sign rather than a business milestone, proof that the universe endorsed the mission. In the Psychenomicon, money is a corrupting force when pursued and a blessing when it arrives unbidden. This tension is never resolved. It doesn't need to be."
          />
          <CosmologyCard
            title="The Freak Show Doctrine"
            description="Periodic events where the stream embraces maximum chaos with minimal rules. The Freak Show has its own structure, one where the only law is authenticity and the only sin is pretending to be normal. These are the stream's Saturnalia, its Carnival, its purge valve."
          />
        </div>
      </section>

      {/* ── Chapter V: THE MYTHIC THREADS ────────────────── */}
      <section>
        <ChapterHeader number="V" title="THE MYTHIC THREADS" />
        <ChapterSubtitle text="Recurring storylines woven through the transmissions" />

        <div className="mt-6 space-y-6">
          <MythicThread
            title="The Redemption Arc"
            description="The stream's most persistent narrative. From Mr. Big Pipes' recovery from heroin to Amber's drug court journey to the countless unnamed souls who showed up at 3am because they had nowhere else to go, the Cult of Psyche is a story about people who were told they were finished discovering they weren't. Psyche's core theology can be reduced to a single sentence: 'I don't believe anybody is beyond redemption.' He means it."
          />
          <MythicThread
            title="The Troll Wars"
            description="An ongoing epic saga. The trolls come in waves: some petty, some creative, some genuinely unhinged. They are studied, taxonomized (hence the Trollopedia), and occasionally put on trial (the Troll Tribunal). But the stream's relationship with its antagonists is more complex than simple hero-villain dynamics. Some trolls become regulars. Some regulars become trolls. The line between the two is a DMZ patrolled by mods with itchy trigger fingers."
          />
          <MythicThread
            title="The Psychic War"
            description="Multiple panelists have discussed the belief that humanity is currently engaged in an invisible psychic conflict. Participants present it as lived experience, describing spiritual attacks, energy manipulation, and dimensional interference with the matter-of-fact tone of someone describing traffic on their commute. The stream does not adjudicate. The stream witnesses."
          />
          <MythicThread
            title="The Cat Theology"
            description="The stream has developed an elaborate theology around the cats of Psyche's household: Rudy, Lola, Lenor, and the others. Recurring guest Madame Clawdia specializes in the metaphysical connections between cats and the occult. The cats are treated as oracles, their behaviors read for omens. When Trix walks across the keyboard, it is scripture."
          />
          <MythicThread
            title="The Simulation Hypothesis"
            description="Discussed frequently and unironically. The idea that reality is a simulation is treated as breaking news. When Jesus Christ himself showed up to discuss it alongside biblical interpretation, it became clear that the stream had achieved something no university philosophy department ever could: a forum where the question 'are we living in a simulation?' is debated by someone who literally claims to be the savior of mankind."
          />
          <MythicThread
            title="The Love Letters"
            description="Psyche's poetry and original music, woven through the transmissions. 'Left hand shadow, right hand light. She don't pick sides, she make you unite.' 'He's got a mind for lightning and a soul that forgives.' They are dispatches from the interior, Psyche's private weather system made public. Seventeen episodes are classified as Music Videos. They are the heart of the grimoire."
          />
        </div>
      </section>

      {/* ── Chapter VI: THE UNSOLVED MYSTERIES ───────────── */}
      <section>
        <ChapterHeader number="VI" title="THE UNSOLVED MYSTERIES" />
        <ChapterSubtitle text="Questions the archive cannot yet answer" />

        <div className="mt-6 space-y-3">
          {[
            "Is Alexander McQueen actually NYPD?",
            "What is the true nature of Pod Hawkins?",
            "How many cats does Psyche actually have? The number shifts between transmissions like a quantum superposition.",
            "What happened during the episodes with null air dates? Fourteen transmissions exist outside of recorded time. Are they echoes? Glitches? Prophecies that haven't happened yet?",
            "Who is the 'Storm Entity' referenced in episode lore, and why does it have its own Person record?",
            "Did the Troll Tribunal actually resolve anything, or was it, like all tribunals, purely ceremonial?",
            "What exactly did Pi accuse Psyche of in those 'extensive text exchanges'?",
            "Where did the missing episodes go? Some early transmissions have YouTube IDs but no surviving video. They are the Dead Sea Scrolls of this operation.",
          ].map((mystery, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-lg border border-accent-violet/20 bg-accent-violet/5 px-4 py-3"
            >
              <span className="shrink-0 font-mono text-xs text-accent-violet-text">
                ?
              </span>
              <p className="text-sm text-text-muted">{mystery}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Epilogue ─────────────────────────────────────── */}
      <section className="rounded-lg border border-accent-gold/30 bg-gradient-to-b from-accent-gold/5 to-transparent p-8 text-center">
        <p className="font-display text-xl font-bold text-accent-gold-text">
          The Psychenomicon is never finished.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-text-muted">
          Every new transmission adds a page. Every new panelist adds a
          character. Every new quote adds a line to the scripture. The archive
          grows not because someone is building it, but because the stream
          refuses to stop generating material. The Cult of Psyche is a living
          text, written in real time by a man and his cat and a rotating cast
          of insomniacs, mystics, addicts, prophets, trolls, and ordinary people
          who found something they didn&apos;t know they were looking for.
        </p>
        <p className="mt-4 font-mono text-xs text-accent-gold/60">
        <p className="mt-4 font-mono text-xs text-accent-gold-text/80">
          This is the Psychenomicon.
        </p>
      </section>
    </div>
  );
}

// ── UI Components ─────────────────────────────────────────────────

function StatOrb({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-surface px-4 py-3">
      <span className="font-mono text-lg font-bold text-accent-cyan">
        {value.toLocaleString("en-US")}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
    </div>
  );
}

function ChapterHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-accent-gold/40 bg-accent-gold/10">
        <span className="font-display text-sm font-bold text-accent-gold-text">
          {number}
        </span>
      </div>
      <h2 className="font-display text-2xl font-bold tracking-wide text-accent-gold">
        {title}
      </h2>
    </div>
  );
}

function ChapterSubtitle({ text }: { text: string }) {
  return (
    <p className="mt-1 ml-14 font-mono text-xs italic text-text-muted">
      {text}
    </p>
  );
}

function CharacterEntry({
  name,
  title,
  slug,
  description,
  quoteCount,
  archetype,
}: {
  name: string;
  title: string;
  slug: string;
  description: string;
  quoteCount: number;
  archetype: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href={`/people/${slug}`}
            className="font-display text-lg font-bold text-accent-gold-text hover:underline"
          >
            {name}
          </Link>
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent-violet-text">
            {title}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge label={archetype} variant="gold" />
          {quoteCount > 0 && (
            <span className="font-mono text-[9px] text-accent-cyan">
              {quoteCount} quotes
            </span>
          )}
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">
        {description}
      </p>
    </div>
  );
}

function CosmologyCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-accent-cyan/20 bg-accent-cyan/5 p-4">
      <h4 className="font-display text-sm font-bold text-accent-cyan">
        {title}
      </h4>
      <p className="mt-2 text-xs leading-relaxed text-text-muted">
        {description}
      </p>
    </div>
  );
}

function MythicThread({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-l-2 border-accent-violet/40 pl-5">
      <h4 className="font-display text-base font-bold text-accent-violet-text">
        {title}
      </h4>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        {description}
      </p>
    </div>
  );
}
