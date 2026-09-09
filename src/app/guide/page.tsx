import { buildMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";

export const metadata = buildMetadata({
  title: "The Cult Master's Guide — CULT CODEX",
  description:
    "The Cult Master's Guide to a Safe, Intelligent, and Transformative Community — the philosophy, rules, and moderation doctrine of the Cult of Psyche.",
  path: "/guide",
});

const RULES: { title: string; body: React.ReactNode }[] = [
  {
    title: "Rule One — Respect the Person. Challenge the Idea.",
    body: (
      <>
        <p>
          Ideas are sacred only because they deserve examination. People deserve dignity.
          Nothing discussed on Cult of Psyche is above criticism. Nothing discussed requires
          agreement.
        </p>
        <p>
          Members are encouraged to passionately challenge ideas while treating the individual
          presenting them with basic human respect.
        </p>
        <p className="text-text-muted">
          Statements like &ldquo;I disagree,&rdquo; &ldquo;I think your evidence is weak,&rdquo;
          or &ldquo;I see it differently&rdquo; are welcomed. Statements like &ldquo;You&rsquo;re
          garbage,&rdquo; &ldquo;Kill yourself,&rdquo; &ldquo;You&rsquo;re worthless,&rdquo; or
          &ldquo;You should disappear&rdquo; have no place here.
        </p>
      </>
    ),
  },
  {
    title: "Rule Two — Every Voice Begins Equal",
    body: (
      <p>
        Titles do not matter. Subscriber count does not matter. Income, education, religion,
        and political identity do not matter. Everyone enters the conversation with the same
        opportunity to be heard. Ideas earn influence. Not status.
      </p>
    ),
  },
  {
    title: "Rule Three — Curiosity Before Combat",
    body: (
      <>
        <p>
          When hearing something strange, ask. Don&rsquo;t assume. Instead of saying &ldquo;that&rsquo;s
          ridiculous,&rdquo; try &ldquo;what led you to believe that?&rdquo; or &ldquo;how did you
          reach that conclusion?&rdquo; or &ldquo;what evidence convinced you?&rdquo;
        </p>
        <p className="text-text-muted">Curiosity builds bridges. Assumptions build walls.</p>
      </>
    ),
  },
  {
    title: "Rule Four — Extraordinary Claims Welcome",
    body: (
      <>
        <p>Extraordinary certainty is not.</p>
        <p>
          Cult of Psyche explores occult traditions, paranormal experiences, mysticism,
          religion, consciousness, simulation theory, artificial intelligence, ancient
          civilizations, psychology, conspiracies, high strangeness, philosophy, near-death
          experiences, remote viewing, tarot, dreams, UFOs, magic, and esoteric symbolism.
        </p>
        <p className="text-text-muted">
          Everything may be explored. Nothing receives automatic endorsement.
        </p>
      </>
    ),
  },
  {
    title: "Rule Five — Skeptics Belong Here",
    body: (
      <>
        <p>
          Believers belong. Skeptics belong. Scientists belong. Mystics belong. Christians,
          atheists, pagans, Muslims, Jews, Hindus, Buddhists, agnostics, materialists,
          simulation theorists, and alien enthusiasts — everyone.
        </p>
        <p className="text-text-muted">
          No worldview receives special protection. No worldview receives automatic ridicule.
        </p>
      </>
    ),
  },
  {
    title: "Rule Six — Steelman Before You Strawman",
    body: (
      <p>
        Represent another person&rsquo;s position as accurately as possible before criticizing
        it. If they say &ldquo;that&rsquo;s what I meant,&rdquo; then you&rsquo;ve earned the
        right to disagree.
      </p>
    ),
  },
  {
    title: "Rule Seven — Debate is Not War",
    body: (
      <p>
        Winning is not the goal. Discovery is. People change their minds here. That is a sign
        of strength, not weakness.
      </p>
    ),
  },
  {
    title: "Rule Eight — The Cult Does Not Worship Personalities",
    body: (
      <p>
        Not the host. Not moderators. Not famous guests. Not internet celebrities. Ideas are
        evaluated independently of who speaks them. Even the Cult Master expects to be
        challenged.
      </p>
    ),
  },
  {
    title: "Rule Nine — Entertainment Without Cruelty",
    body: (
      <>
        <p>We love absurdity. We love satire. We love dark humor. We love chaos.</p>
        <p>
          But humiliation is not entertainment. Bullying is not entertainment. Dogpiling is not
          entertainment. If someone becomes the target of endless ridicule, moderators may
          intervene regardless of whether rules have technically been broken.
        </p>
      </>
    ),
  },
  {
    title: "Rule Ten — Trolls Are Studied, Not Fed",
    body: (
      <>
        <p>
          Internet culture is fascinating. Troll psychology is fascinating. Manipulation is
          fascinating. We may analyze trolling. We do not reward it.
        </p>
        <p className="text-text-muted">Attention is a currency. Use it wisely.</p>
      </>
    ),
  },
  {
    title: "Rule Eleven — No Doxxing. Ever.",
    body: (
      <p>
        Personal addresses, family members, employers, private information, financial records,
        medical records, and children are not acceptable discussion topics without the
        person&rsquo;s consent. Ideas are public. Private lives are not.
      </p>
    ),
  },
  {
    title: "Rule Twelve — Consent Matters",
    body: (
      <p>
        No one is required to answer every question. No one is required to reveal personal
        information. Guests may decline any topic. The Cult respects boundaries.
      </p>
    ),
  },
  {
    title: "Rule Thirteen — Truth Over Tribalism",
    body: (
      <p>
        The moment loyalty becomes more important than truth, the Cult has failed. We
        celebrate being proven wrong. Every mistaken belief corrected is a victory.
      </p>
    ),
  },
  {
    title: "Rule Fourteen — Independent Thinking is Sacred",
    body: (
      <p>
        Members should never outsource their thinking — not to YouTubers, governments,
        religions, scientists, influencers, or even the Cult Master. Question everything.
        Including this document.
      </p>
    ),
  },
  {
    title: "Rule Fifteen — The Gateway Principle",
    body: (
      <p>
        Every person arrives carrying invisible burdens — trauma, hope, fear, grief,
        curiosity, loneliness. Treat newcomers as travelers crossing a gateway, not enemies
        entering a battlefield.
      </p>
    ),
  },
];

const ESCALATION = [
  { level: "Level 1", action: "Gentle reminder." },
  { level: "Level 2", action: "Official warning." },
  { level: "Level 3", action: "Temporary mute." },
  { level: "Level 4", action: "Temporary removal." },
  { level: "Level 5", action: "Permanent removal." },
];

const BAN_REASONS = [
  "Doxxing",
  "Credible threats",
  "Harassment campaigns",
  "Repeated hate speech",
  "Spam attacks",
  "Impersonation",
  "Predatory behavior",
];

export default function GuidePage() {
  return (
    <>
      <PageHero
        title="THE CULT MASTER'S GUIDE"
        subtitle="A safe, intelligent, and transformative community"
        backgroundImage="/lore-header.jpg"
        label="doctrine"
      />
      <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <SectionCard title="The Philosophy of the Cult" accent="gold" ornament>
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              The Cult of Psyche is not a religion. It is not a political movement. It is not
              an ideology demanding conformity.
            </p>
            <p className="font-semibold text-accent-gold-text">It is a gathering place for explorers.</p>
            <p>
              Our symbol is not blind obedience — it is curiosity. Every person who walks
              through our gateway remains completely free to believe whatever they choose. The
              purpose of the Cult is not to tell people what reality is. The purpose is to
              investigate reality together.
            </p>
            <p>
              We value mystery more than certainty. Questions more than answers. Growth more
              than victory. Character more than popularity. Everyone who enters the panel
              becomes both teacher and student.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="The Prime Directive" accent="cyan">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              Every decision made by the Cult Master, moderators, and community should be
              guided by one simple question:
            </p>
            <p className="border-l-2 border-accent-cyan/50 pl-4 italic text-accent-cyan">
              &ldquo;Does this increase understanding, or merely increase conflict?&rdquo;
            </p>
            <p>
              Entertainment matters. Debate matters. Humor matters. But understanding always
              comes first.
            </p>
          </div>
        </SectionCard>

        {RULES.map((rule) => (
          <SectionCard key={rule.title} title={rule.title} accent="gold">
            <div className="space-y-3 text-sm text-text-primary leading-relaxed">{rule.body}</div>
          </SectionCard>
        ))}

        <SectionCard title="Moderation Philosophy" accent="violet">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              Moderators are guardians of the conversation — not enforcers of ideology. Their
              mission is to preserve fairness, safety, flow, and respect.
            </p>
            <p>
              Moderators should interfere as little as possible. But when intervention becomes
              necessary, they should act quickly, consistently, and transparently.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Escalation System" accent="violet">
          <div className="space-y-4 text-sm text-text-primary leading-relaxed">
            <ol className="space-y-2">
              {ESCALATION.map((step) => (
                <li key={step.level} className="flex gap-3">
                  <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-violet-text shrink-0">
                    {step.level}
                  </span>
                  <span>{step.action}</span>
                </li>
              ))}
            </ol>
            <p>Permanent bans are reserved for:</p>
            <ul className="space-y-1 list-disc list-inside text-text-muted">
              {BAN_REASONS.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="Open Panel Etiquette" accent="muted">
          <ul className="space-y-2 text-sm text-text-primary leading-relaxed list-disc list-inside">
            <li>Wait your turn.</li>
            <li>Avoid constant interruptions.</li>
            <li>Disagree without domination.</li>
            <li>Leave space for quieter voices.</li>
            <li>Do not intentionally derail discussions.</li>
            <li>Accept when conversations naturally move on.</li>
          </ul>
        </SectionCard>

        <SectionCard title="Mental Health" accent="red">
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>
              Cult of Psyche explores unusual beliefs and extraordinary experiences. Some
              discussions may involve spirituality, altered states, or deeply personal
              experiences. Members should avoid presenting personal interpretations as medical
              advice or encouraging others to reject professional care.
            </p>
            <p>
              When conversations touch on serious mental health concerns, compassion comes
              first. Encourage people to seek qualified support when appropriate while
              respecting their dignity and privacy.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Community Traditions" accent="gold">
          <p className="mb-2 text-sm text-text-primary">Members are encouraged to:</p>
          <ul className="space-y-2 text-sm text-text-primary leading-relaxed list-disc list-inside">
            <li>Welcome newcomers.</li>
            <li>Celebrate intellectual humility.</li>
            <li>Share books.</li>
            <li>Recommend documentaries.</li>
            <li>Introduce unusual ideas.</li>
            <li>Ask impossible questions.</li>
            <li>Admit uncertainty.</li>
            <li>Laugh often.</li>
            <li>Remain impossible to manipulate.</li>
          </ul>
        </SectionCard>

        <SectionCard title="The Cult Master's Oath" accent="gold" ornament>
          <div className="space-y-3 text-sm text-text-primary leading-relaxed">
            <p>As Cult Master, I do not promise certainty. I promise curiosity.</p>
            <p>
              I will challenge ideas — including my own. I will protect open discussion while
              defending the dignity of those who participate. I will not demand agreement. I
              will not punish respectful dissent. I will encourage wonder over dogma, questions
              over slogans, and character over popularity.
            </p>
            <p>
              Every person who enters these gates remains free. Free to believe. Free to
              question. Free to disagree. Free to leave.
            </p>
            <p className="text-text-muted">
              The greatest mystery is not what we already know. It is what we have yet to
              discover together.
            </p>
            <p className="pt-2 font-serif text-lg font-black text-accent-gold-text">
              Welcome to the Gateway.
              <br />
              Welcome to the Cult of Psyche.
            </p>
          </div>
        </SectionCard>
      </main>
    </>
  );
}
