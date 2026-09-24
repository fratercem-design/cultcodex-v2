import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Leads — Admin",
};

/**
 * Lead pipeline.
 *
 * Every capture surface writes two rows: a Subscriber (the lead) and a
 * CodexUser (the account waiting to be claimed). A lead has become a
 * signed-in Initiate when its CodexUser carries a real auth provider —
 * `auth.ts` overwrites the placeholder "initiate" the first time they log in.
 * That single field is what separates the two columns below.
 */
async function getLeads() {
  try {
    const subscribers = await prisma.subscriber.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        source: true,
        giftStage: true,
        verified: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const emails = subscribers.map((s) => s.email).filter((e): e is string => Boolean(e));

    const accounts = emails.length
      ? await prisma.codexUser.findMany({
          where: { email: { in: emails } },
          select: {
            email: true,
            provider: true,
            handle: true,
            onboardingCompleted: true,
            subscriptionTier: true,
            createdAt: true,
          },
        })
      : [];

    const byEmail = new Map(accounts.map((a) => [a.email.toLowerCase(), a]));

    return subscribers.map((s) => {
      const account = s.email ? byEmail.get(s.email.toLowerCase()) : undefined;
      const claimed = Boolean(account && account.provider !== "initiate");
      return { ...s, account: account ?? null, claimed };
    });
  } catch {
    return null;
  }
}

type Lead = NonNullable<Awaited<ReturnType<typeof getLeads>>>[number];

function Stat({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="rounded border border-border bg-surface p-4">
      <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-text-muted">{label}</p>
      <p className={`mt-1 font-display text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  return (
    <tr className="border-b border-border align-top">
      <td className="py-2 pr-4 font-mono text-xs text-text-primary">
        {lead.email ?? <span className="text-text-muted">— no address —</span>}
        {lead.name && <span className="block text-text-muted">{lead.name}</span>}
      </td>
      <td className="py-2 pr-4 font-mono text-[12px] text-text-muted">{lead.source ?? "—"}</td>
      <td className="py-2 pr-4 font-mono text-[12px] text-text-muted">
        {lead.createdAt.toISOString().slice(0, 10)}
      </td>
      <td className="py-2 pr-4 font-mono text-[12px]">
        {lead.account ? (
          <span className="text-accent-cyan">yes</span>
        ) : (
          <span className="text-red-400">missing</span>
        )}
      </td>
      <td className="py-2 pr-4 font-mono text-[12px]">
        {lead.claimed ? (
          <span className="text-accent-gold-text">
            {lead.account?.provider}
            {lead.account?.handle ? ` · @${lead.account.handle}` : ""}
          </span>
        ) : (
          <span className="text-text-muted">unclaimed</span>
        )}
      </td>
      <td className="py-2 font-mono text-[12px] text-text-muted">
        {lead.account?.onboardingCompleted ? (
          <span className="text-accent-gold-text">complete</span>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

export default async function AdminLeadsPage() {
  await requireAdminPage();

  const leads = await getLeads();

  if (!leads) {
    return (
      <main id="main-content" className="max-w-5xl p-8">
        <h1 className="mb-2 font-display text-2xl font-bold text-accent-gold">Lead Pipeline</h1>
        <p className="font-mono text-xs text-red-400">
          Could not read the database. The lead tables are unavailable right now.
        </p>
      </main>
    );
  }

  const total = leads.length;
  const withAccount = leads.filter((l) => l.account).length;
  const claimed = leads.filter((l) => l.claimed).length;
  const completed = leads.filter((l) => l.account?.onboardingCompleted).length;
  const conversion = total ? Math.round((claimed / total) * 100) : 0;

  const bySource = new Map<string, number>();
  for (const l of leads) bySource.set(l.source ?? "—", (bySource.get(l.source ?? "—") ?? 0) + 1);

  const unclaimed = leads.filter((l) => !l.claimed);

  return (
    <main id="main-content" className="max-w-6xl p-8">
      <h1 className="mb-2 font-display text-2xl font-bold text-accent-gold">Lead Pipeline</h1>
      <p className="mb-6 max-w-2xl font-mono text-xs leading-relaxed text-text-muted">
        Everyone who has handed over an address, and how far they got. A lead becomes an{" "}
        <span className="text-accent-gold-text">Initiate</span> the moment they sign in — their account
        already exists, so signing in claims it rather than creating a second one. Capture surfaces
        are <Link href="/initiate" className="text-accent-cyan underline">/initiate</Link> and the{" "}
        <Link href="/onboarding" className="text-accent-cyan underline">/onboarding</Link> gate.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label="Leads" value={total} accent="text-text-primary" />
        <Stat label="Accounts made" value={withAccount} accent="text-accent-cyan" />
        <Stat label="Signed in" value={claimed} accent="text-accent-gold-text" />
        <Stat label="Onboarded" value={completed} accent="text-accent-gold-text" />
        <Stat label="Conversion" value={`${conversion}%`} accent="text-accent-violet-text" />
      </div>

      {withAccount < total && (
        <p className="mb-6 rounded border border-red-400/40 bg-red-400/5 p-3 font-mono text-[12px] text-red-400">
          {total - withAccount} lead(s) have no Codex account. These predate auto-registration, or
          provisioning failed at capture time. They can still be emailed; they just have nothing to
          claim yet.
        </p>
      )}

      <h2 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent-gold-text">
        By source
      </h2>
      <div className="mb-8 flex flex-wrap gap-2">
        {[...bySource.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([src, n]) => (
            <span
              key={src}
              className="rounded border border-border bg-surface px-3 py-1 font-mono text-[12px] text-text-muted"
            >
              {src} <span className="text-accent-gold-text">{n}</span>
            </span>
          ))}
      </div>

      <h2 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent-cyan">
        Unclaimed — the people to email ({unclaimed.length})
      </h2>
      <p className="mb-3 font-mono text-[12px] text-text-muted">
        Accounts sitting ready. The conversion action is a message telling them it exists — never a
        second sign-up form, and never a nudge that implies they owe us anything.
      </p>
      <div className="mb-10 overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-border text-left">
              {["Lead", "Source", "Captured", "Account", "Claimed", "Onboarding"].map((h) => (
                <th
                  key={h}
                  className="pb-2 pr-4 font-mono text-[12px] uppercase tracking-[0.16em] text-text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {unclaimed.slice(0, 100).map((l) => (
              <LeadRow key={l.id} lead={l} />
            ))}
          </tbody>
        </table>
        {!unclaimed.length && (
          <p className="py-4 font-mono text-xs text-text-muted">
            No unclaimed leads. Everyone captured has signed in.
          </p>
        )}
      </div>

      <h2 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent-gold-text">
        All leads ({total})
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-border text-left">
              {["Lead", "Source", "Captured", "Account", "Claimed", "Onboarding"].map((h) => (
                <th
                  key={h}
                  className="pb-2 pr-4 font-mono text-[12px] uppercase tracking-[0.16em] text-text-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <LeadRow key={l.id} lead={l} />
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
