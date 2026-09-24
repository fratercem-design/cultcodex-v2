import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/page-hero";
import { SectionCard } from "@/components/ui/section-card";

export const revalidate = 3600;

export const metadata = buildMetadata({
  title: "The First Gate Procedure",
  description:
    "How a stranger becomes a fellow traveler, how a fellow traveler becomes a gatekeeper, and how a guest gets onto the Open Panel. The onboarding procedure of the Cult of Psyche, written down and public.",
  path: "/onboarding/procedure",
});

/** The five brand values, stated as operating constraints rather than adjectives. */
const PRINCIPLES: { value: string; counter: string; rule: string }[] = [
  {
    value: "Awakening",
    counter: "not recruitment",
    rule: "We never pursue. No cold DMs, no follow-backs engineered to look personal, no “we’ve been watching you.” People arrive because something we made in public was worth arriving for. Success is that someone understands themselves better — not that headcount went up.",
  },
  {
    value: "Transparency",
    counter: "the gate is visible",
    rule: "Every stage tells the person what stage they are in, what happens next, and how to stop. Nothing in this procedure is confidential from the people it is applied to. This page is the proof — it is public because it has to be.",
  },
  {
    value: "Neutrality",
    counter: "no house verdict",
    rule: "We host the argument; we do not settle it. No track requires agreement with any belief — about tarot, about cosmology, about any dispute involving real people. Newcomers are never briefed on who the good guys are, because that is not a thing we tell people.",
  },
  {
    value: "Community",
    counter: "fellow travelers, never followers",
    rule: "Belonging is never sold, staged, or ranked. No tier buys access to people. A gatekeeper has duties, not status, and can hand the lantern back at any time without explanation or penalty.",
  },
  {
    value: "Transformation",
    counter: "the point of all of it",
    rule: "Every stage should leave someone more capable of thinking for themselves than the stage before. A procedure that produces loyal people instead of self-directed people has failed, however good the numbers look.",
  },
];

interface Stage {
  id: string;
  name: string;
  owner: string;
  trigger: string;
  action: string;
  handoff: string;
  done: string;
}

const TRACK_A: Stage[] = [
  {
    id: "A1",
    name: "First Contact",
    owner: "Nyx",
    trigger: "Someone arrives from a video, a clip, or the archive. They have not spoken.",
    action:
      "Nothing is required of them. The pinned comment and stream description carry the same three facts: what this is, that it is free, and that leaving requires no announcement. Nyx greets first-time chatters once, plainly, without a script that pretends to recognise them.",
    handoff: "A link to the First Gate reading and to the open archive. Nothing gated behind an email.",
    done: "They come back a second time, unprompted.",
  },
  {
    id: "A2",
    name: "The First Gate",
    owner: "self-directed",
    trigger: "They ask what this actually is — in chat, in comments, or by reading on their own.",
    action:
      "Point at the written answer rather than performing one. The Handbook covers why we gather, the nature of mystery, and the masks people wear. It is deliberately unpersuasive: it explains the frame and declines to sell it.",
    handoff:
      "The charter, in one sentence: a community for exploring truth, exposing deception, embracing mystery, and understanding ourselves and the strange corners of human nature through open conversation.",
    done: "They can state what the group is without using the word “cult” as either a joke or an accusation.",
  },
  {
    id: "A3",
    name: "First Panel",
    owner: "Gatekeeper",
    trigger: "They speak during a live show — a question, a reading request, or a disagreement.",
    action:
      "Answer the actual question. Do not reward arrival with special attention; do not withhold it either. If they disagree with the host, that goes on air unedited — this is the strongest signal the frame is real, and it cannot be faked later.",
    handoff: "Their point is engaged with on the record, whether or not it was right.",
    done: "They have spoken twice on separate occasions.",
  },
  {
    id: "A4",
    name: "Named",
    owner: "Gatekeeper",
    trigger: "Regulars start recognising them by name.",
    action:
      "Nothing ceremonial. No announcement, no welcome post, no role granted. Recognition is allowed to happen socially rather than administratively — the moment a badge marks belonging, belonging becomes something we can revoke, and that changes what it is.",
    handoff: "Nothing. This stage is the absence of an event, on purpose.",
    done: "Someone other than the host greets them by name unprompted.",
  },
  {
    id: "A5",
    name: "Fellow Traveler",
    owner: "self-directed",
    trigger: "They explain the group to a newcomer without being asked to.",
    action:
      "Correct the lore gently if they get it wrong, in public, without embarrassment on either side. Getting it slightly wrong in good faith is how a living tradition transmits; a group that polices its own retelling has stopped being a community and started being a brand.",
    handoff: "An open invitation to the Gatekeeper track — offered once, never repeated, never chased.",
    done: "This stage does not close. It is the destination.",
  },
];

const TRACK_B: Stage[] = [
  {
    id: "B1",
    name: "Invitation",
    owner: "Cult Master",
    trigger:
      "A fellow traveler has been present long enough to have been wrong in public at least once, and handled it well.",
    action:
      "Invite privately. State the duties, the time cost, and the fact that the role carries no status and no access to anything hidden. Volunteering enthusiastically is not a qualification; wanting the role for its own sake is a mild counter-indication.",
    handoff: "The Handbook, the escalation ladder below, and an explicit “no” option with no consequence attached.",
    done: "They accept in their own words, after at least one night to think.",
  },
  {
    id: "B2",
    name: "The Oath",
    owner: "Cult Master",
    trigger: "Acceptance received.",
    action:
      "The oath is read aloud, by them, in whatever setting they prefer — recorded or not, public or not. It is not a loyalty pledge and contains no reference to the group, the host, or the doctrine. It is four commitments about how they will behave.",
    handoff:
      "Ask before concluding. Stay curious longer than is comfortable. Collect no followers. Leave the gate open behind you.",
    done: "Said out loud once. Never repeated, never renewed, never used as leverage afterwards.",
  },
  {
    id: "B3",
    name: "Shadow Training",
    owner: "Gatekeeper (existing)",
    trigger: "Oath complete, no tools granted yet.",
    action:
      "Walk the five-rung ladder with real examples from past streams. Cover the three failure modes explicitly: the mod who argues, the mod who enjoys it, and the mod who mistakes a difficult person for a dangerous one.",
    handoff: "The ladder, and the standing instruction that any rung may be skipped downward but never upward without cause.",
    done: "They can name which rung a live situation is on, twice, correctly, before acting.",
  },
  {
    id: "B4",
    name: "Shadowed Shift",
    owner: "Gatekeeper (existing)",
    trigger: "Training complete.",
    action:
      "Two full shows with tools granted and an experienced gatekeeper watching the same chat. Every action taken gets a one-line reason afterwards. Nyx handles the mechanical layer — repeat-spam, link floods, known patterns — so the human is only ever making judgment calls.",
    handoff: "Tools, the Nyx handoff conventions, and a debrief after each show.",
    done: "Two shows completed with reasons given for every action.",
  },
  {
    id: "B5",
    name: "Standing Duty",
    owner: "Cult Master",
    trigger: "Shadowed shifts complete.",
    action:
      "Quarterly review, both directions — the gatekeeper reviews the leadership as explicitly as the leadership reviews them. Standing agenda item: has anything in how we run this started to look like capture? Handing the lantern back is a normal outcome of a review, not a failure of one.",
    handoff: "An open exit: no notice period, no explanation owed, no change in how they are treated afterwards.",
    done: "Ongoing. Reviewed quarterly, indefinitely.",
  },
];

const TRACK_C: Stage[] = [
  {
    id: "C1",
    name: "The Brief",
    owner: "Cult Master",
    trigger: "A guest is booked, however informally.",
    action:
      "Send the brief before the tech check, in writing. It states the format, the length, that there is no script, that they will be disagreed with, and that they may end their participation at any point mid-show with no explanation. It also states what will not happen: no ambush topics, no surprise third parties, no confrontation staged for content.",
    handoff: "Format, runtime, the no-ambush guarantee, and the topics that are off the table.",
    done: "They confirm in writing that they read it.",
  },
  {
    id: "C2",
    name: "Tech Check",
    owner: "Gatekeeper",
    trigger: "Brief confirmed. Runs on a separate day from the show where possible.",
    action:
      "Audio first — it is the only one that ruins an episode on its own. Then camera, then the join link, then what to do when they drop, which they will. Confirm the name and pronouns they want on the lower third, and use exactly those.",
    handoff: "Join link, a fallback contact, and the drop-out procedure.",
    done: "Clean audio confirmed on the actual link they will use.",
  },
  {
    id: "C3",
    name: "Consent on Record",
    owner: "Cult Master",
    trigger: "Before going live, every time, including for returning guests.",
    action:
      "Confirm on record: recording, where it will be published, that clips may be cut from it, and how to request a cut be pulled afterwards. A returning guest still gets asked — consent given once is not consent given permanently.",
    handoff: "A stated route to have something removed, and the name of the person who can action it.",
    done: "Verbal confirmation captured before the stream starts.",
  },
  {
    id: "C4",
    name: "After",
    owner: "Cult Master",
    trigger: "Show ends.",
    action:
      "Send the link when it publishes. Ask one question — was anything misrepresented — and act on the answer. Then leave them alone: no pressure to return, no promotion of their appearance beyond what was agreed.",
    handoff: "The published link, the clip list, and the pull-request route again.",
    done: "Link sent and any correction actioned.",
  },
];

const LADDER: { act: string; body: string }[] = [
  { act: "Ignore it", body: "Most of it is weather. Responding is the reward being sought, and withholding it costs nothing." },
  {
    act: "Name the behaviour, not the person",
    body: "“That’s a personal attack” — never “you’re a troll.” The first is correctable; the second is an identity, and nobody has ever been argued out of one.",
  },
  {
    act: "Ask an actual question",
    body: "Bad faith rarely survives a genuine question. Good faith usually improves under one. Either way the ambiguity resolves, which is the point.",
  },
  {
    act: "Mute",
    body: "Quietly. No announcement, no audience, no farewell. A public removal hands the person exactly the moment they came for.",
  },
  {
    act: "Remove",
    body: "Once, without a speech, and logged with a one-line reason. If a rung-5 action needs a paragraph to justify, it was probably a rung-3 situation.",
  },
];

const RED_LINES: { title: string; body: string }[] = [
  { title: "No pursuit.", body: "Nobody is DM’d, love-bombed, or “checked in on” as a retention tactic. Warmth that is scheduled is not warmth." },
  { title: "No hidden exit.", body: "Leaving is never made socially expensive, never framed as a loss, never met with a follow-up asking why." },
  { title: "No paid belonging.", body: "Money may buy a product. It never buys access to people, standing in the group, or proximity to the host." },
  {
    title: "No verdicts on real people.",
    body: "Ongoing disputes involving named individuals are discussed structurally — how manipulation works, how crowds turn — never by repeating specific accusations as established fact. This holds regardless of who is asking or what has been said about us.",
  },
  { title: "No certainty as a credential.", body: "Nobody advances by believing harder. A newcomer who thinks the whole frame is nonsense is fully welcome and gets exactly the same treatment." },
  { title: "No leverage from the oath.", body: "The oath is never quoted back at someone to win an argument or discourage them from leaving." },
];

function StageRow({ stage }: { stage: Stage }) {
  return (
    <div className="border-b border-border py-4 last:border-b-0 sm:grid sm:grid-cols-[9rem_1fr] sm:gap-6">
      <div className="mb-2 sm:mb-0">
        <p className="font-mono text-[12px] tracking-[0.12em] text-accent-gold-text">{stage.id}</p>
        <p className="font-serif text-base font-bold text-text-primary">{stage.name}</p>
        <p className="mt-0.5 font-mono text-[12px] uppercase tracking-[0.14em] text-text-muted">
          Owner &middot; {stage.owner}
        </p>
      </div>
      <dl className="space-y-1.5 font-mono text-xs leading-relaxed">
        <div className="sm:grid sm:grid-cols-[5.5rem_1fr] sm:gap-3">
          <dt className="text-[12px] uppercase tracking-[0.16em] text-text-muted sm:pt-0.5">Trigger</dt>
          <dd className="text-text-muted">{stage.trigger}</dd>
        </div>
        <div className="sm:grid sm:grid-cols-[5.5rem_1fr] sm:gap-3">
          <dt className="text-[12px] uppercase tracking-[0.16em] text-text-muted sm:pt-0.5">Action</dt>
          <dd className="text-text-muted">{stage.action}</dd>
        </div>
        <div className="sm:grid sm:grid-cols-[5.5rem_1fr] sm:gap-3">
          <dt className="text-[12px] uppercase tracking-[0.16em] text-text-muted sm:pt-0.5">Hand-off</dt>
          <dd className="text-text-muted">{stage.handoff}</dd>
        </div>
        <div className="sm:grid sm:grid-cols-[5.5rem_1fr] sm:gap-3">
          <dt className="text-[12px] uppercase tracking-[0.16em] text-text-muted sm:pt-0.5">Done when</dt>
          <dd className="text-accent-cyan">{stage.done}</dd>
        </div>
      </dl>
    </div>
  );
}

export default function OnboardingProcedurePage() {
  return (
    <div className="min-h-screen bg-void">
      <PageHero
        title="THE FIRST GATE PROCEDURE"
        subtitle="How a stranger becomes a fellow traveler — written down, so it happens the same way every time"
        backgroundImage="/lore-header.jpg"
        label="procedure"
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-10 space-y-8">
        <SectionCard accent="gold">
          <p className="font-serif text-lg italic text-accent-gold-text">
            &ldquo;I do not ask for worship. I ask for awakening.&rdquo;
          </p>
          <p className="mt-4 font-mono text-xs leading-relaxed text-text-muted">
            This is the operating procedure behind the doctrine in{" "}
            <Link href="/guide" className="text-accent-cyan underline underline-offset-2">
              The Cult Master&rsquo;s Guide
            </Link>
            . The Guide says what we believe about running a community. This says what actually
            happens, step by step, to a person who walks in — and it is public so that anyone
            can hold us to it. Everything below is voluntary at every stage, for everyone,
            permanently.
          </p>
          <p className="mt-3 font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">
            Owner &middot; Cult Master &nbsp;&bull;&nbsp; Automation &middot; Nyx &nbsp;&bull;&nbsp;
            Reviewed quarterly
          </p>
        </SectionCard>

        <section>
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-accent-gold-text">
            00 &nbsp;The five rules that govern every track
          </h2>
          <SectionCard accent="muted">
            <p className="mb-4 font-mono text-xs leading-relaxed text-text-muted">
              These are our stated values, converted from adjectives into operating constraints. If
              a step below ever conflicts with one of these, the rule wins and the step is wrong.
            </p>
            <ul className="divide-y divide-border">
              {PRINCIPLES.map((p) => (
                <li key={p.value} className="py-3 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-5">
                  <div className="mb-1 sm:mb-0">
                    <p className="font-serif text-base text-accent-gold-text">{p.value}</p>
                    <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-text-muted">
                      {p.counter}
                    </p>
                  </div>
                  <p className="font-mono text-xs leading-relaxed text-text-muted">{p.rule}</p>
                </li>
              ))}
            </ul>
          </SectionCard>
        </section>

        <SectionCard title="How to read this" accent="cyan">
          <p className="font-mono text-xs leading-relaxed text-text-muted">
            Three tracks run independently, and a person can be on more than one. Each stage states
            its <span className="text-text-primary">trigger</span> (what starts it), the{" "}
            <span className="text-text-primary">action</span> (what we do), the{" "}
            <span className="text-text-primary">hand-off</span> (what they walk away with), and{" "}
            <span className="text-accent-cyan">done when</span> — the observable condition that
            closes it. Nothing is timed. Nobody is chased. A stage that never closes is a person who
            decided not to continue, which is a valid outcome and needs no follow-up.
          </p>
        </SectionCard>

        <section>
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-accent-gold-text">
            A &nbsp;Track A — The Traveler
          </h2>
          <SectionCard accent="gold">
            <p className="mb-2 font-mono text-xs leading-relaxed text-text-muted">
              First contact through to a regular presence. Five stages, no gates in the coercive
              sense — every one is a door that only opens from the newcomer&rsquo;s side.
            </p>
            {TRACK_A.map((s) => (
              <StageRow key={s.id} stage={s} />
            ))}
          </SectionCard>
        </section>

        <section>
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-accent-violet-text">
            B &nbsp;Track B — The Gatekeeper
          </h2>
          <SectionCard accent="violet">
            <p className="mb-2 font-mono text-xs leading-relaxed text-text-muted">
              Moderators. The only track with real screening, because it is the only one that hands
              someone power over other people&rsquo;s participation.
            </p>
            {TRACK_B.map((s) => (
              <StageRow key={s.id} stage={s} />
            ))}
          </SectionCard>
        </section>

        <section>
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-accent-cyan">
            C &nbsp;Track C — The Panel Guest
          </h2>
          <SectionCard accent="cyan">
            <p className="mb-2 font-mono text-xs leading-relaxed text-text-muted">
              Anyone appearing on the Open Panel. Short track, high stakes: this is the one where a
              mistake goes out live and stays online.
            </p>
            {TRACK_C.map((s) => (
              <StageRow key={s.id} stage={s} />
            ))}
          </SectionCard>
        </section>

        <section>
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-accent-gold-text">
            02 &nbsp;Shadow protocol — the escalation ladder
          </h2>
          <SectionCard accent="muted">
            <p className="mb-3 font-mono text-xs leading-relaxed text-text-muted">
              Referenced by stage B3. Start at the lowest rung that fits. Move down freely; move up
              only with a stated reason. Nyx handles mechanical patterns before any of this begins,
              so every rung below is a human judgment about a human.
            </p>
            <ol className="divide-y divide-border">
              {LADDER.map((r, i) => (
                <li key={r.act} className="flex gap-4 py-3">
                  <span className="shrink-0 border border-border px-2 py-1 font-mono text-[12px] text-accent-gold-text">
                    R{i + 1}
                  </span>
                  <span className="font-mono text-xs leading-relaxed">
                    <span className="text-text-primary">{r.act}</span>
                    <span className="mt-0.5 block text-text-muted">{r.body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-4 font-mono text-xs italic leading-relaxed text-accent-gold-text">
              The rule underneath all five: protect the circle without becoming the thing you are
              protecting it from. A gatekeeper who is enjoying the ladder is on the wrong rung.
            </p>
          </SectionCard>
        </section>

        <section>
          <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-red-400">
            03 &nbsp;Red lines — never, in any track, for any reason
          </h2>
          <SectionCard accent="red">
            <ul className="space-y-3">
              {RED_LINES.map((r) => (
                <li key={r.title} className="font-mono text-xs leading-relaxed">
                  <span className="text-red-400">{r.title}</span>{" "}
                  <span className="text-text-muted">{r.body}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </section>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/initiate"
            className="rounded border border-accent-gold bg-accent-gold/15 px-5 py-2.5 font-mono text-sm font-bold text-accent-gold-text transition hover:bg-accent-gold/25"
          >
            Walk through the first gate →
          </Link>
          <Link
            href="/guide"
            className="rounded border border-border px-5 py-2.5 font-mono text-sm text-text-muted transition hover:border-accent-cyan/60 hover:text-accent-cyan"
          >
            Read the doctrine behind it
          </Link>
        </div>

        <p className="pb-6 text-center font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">
          No followers. Only fellow travelers.
        </p>
      </div>
    </div>
  );
}
