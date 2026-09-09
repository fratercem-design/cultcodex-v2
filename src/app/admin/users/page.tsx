import { prisma } from "@/lib/db";
import { grantOracleAccess, setMemberTitle } from "@/app/admin/actions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Users — Admin",
};

async function getUsers() {
  try {
    return await prisma.codexUser.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        isLifetimeMember: true,
        memberTitle: true,
        isPublicMember: true,
        codexSlug: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  } catch {
    return null;
  }
}

type User = NonNullable<Awaited<ReturnType<typeof getUsers>>>[number];

export default async function AdminUsersPage() {
  const users = await getUsers();

  const oracleUsers = users?.filter((u) => u.role === "admin" || u.subscriptionTier === "system" || u.isLifetimeMember) ?? [];
  const otherSubscribers = users?.filter((u) => !oracleUsers.includes(u) && u.subscriptionStatus === "active") ?? [];
  const freeUsers = users?.filter((u) => !oracleUsers.includes(u) && !otherSubscribers.includes(u)) ?? [];

  return (
    <main id="main-content" className="p-8 max-w-5xl">
      <h1 className="font-display text-2xl font-bold text-accent-gold mb-2">
        User Management
      </h1>
      <p className="font-mono text-xs text-text-muted mb-8">
        {users === null ? "DB migration pending" : `${users.length} total users`}
      </p>

      {users === null && (
        <div className="mb-8 rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 font-mono text-xs text-yellow-400">
          {"⚠ "} DB columns are still migrating — the user list is unavailable. You can still grant access using the form below. Reload once the deploy finishes.
        </div>
      )}

      {/* Grant Oracle Access */}
      <section className="mb-10 rounded-xl border border-accent-gold/20 bg-surface p-6">
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-accent-gold-text mb-4">
          Grant Oracle Access
        </h2>
        <form
          action={async (formData: FormData) => {
            "use server";
            const email = formData.get("email") as string;
            if (email) await grantOracleAccess(email.trim().toLowerCase());
          }}
          className="flex gap-3"
        >
          <input
            name="email"
            type="email"
            required
            placeholder="user@example.com"
            className="flex-1 rounded border border-border bg-elevated px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-gold focus:outline-none"
          />
          <button
            type="submit"
            className="rounded bg-accent-gold px-5 py-2 font-mono text-sm font-bold text-void hover:bg-accent-gold/80 transition-colors"
          >
            Grant Oracle ✦
          </button>
        </form>
      </section>

      {/* Oracle / Admin Users */}
      <UserTable title="Oracle Members" users={oracleUsers} highlightColor="gold" />

      {/* Active Subscribers */}
      {otherSubscribers.length > 0 && (
        <UserTable title="Active Subscribers" users={otherSubscribers} highlightColor="cyan" />
      )}

      {/* Free Users */}
      {freeUsers.length > 0 && (
        <UserTable title="Free Users" users={freeUsers} highlightColor="default" />
      )}
    </main>
  );
}

function UserTable({
  title,
  users,
  highlightColor,
}: {
  title: string;
  users: User[];
  highlightColor: "gold" | "cyan" | "default";
}) {
  const headerColor =
    highlightColor === "gold"
      ? "text-accent-gold-text"
      : highlightColor === "cyan"
      ? "text-accent-cyan"
      : "text-text-muted";

  if (users.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className={`font-mono text-xs font-bold uppercase tracking-widest mb-3 ${headerColor}`}>
        {title} ({users.length})
      </h2>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="border-b border-border bg-elevated">
              <th className="px-4 py-2.5 text-left text-text-muted font-normal">User</th>
              <th className="px-4 py-2.5 text-left text-text-muted font-normal">Role / Tier</th>
              <th className="px-4 py-2.5 text-left text-text-muted font-normal">Title</th>
              <th className="px-4 py-2.5 text-left text-text-muted font-normal">Public</th>
              <th className="px-4 py-2.5 text-left text-text-muted font-normal">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, i) => (
              <tr
                key={user.id}
                className={`border-b border-border/50 ${
                  i % 2 === 0 ? "bg-surface" : "bg-elevated/30"
                }`}
              >
                <td className="px-4 py-3">
                  <p className="text-text-primary font-bold truncate max-w-[180px]">{user.displayName}</p>
                  <p className="text-text-muted/70 truncate max-w-[180px]">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    {user.role === "admin" && (
                      <span className="inline-block rounded px-1.5 py-0.5 text-[10px] bg-accent-gold/15 text-accent-gold-text">
                        admin
                      </span>
                    )}
                    {user.isLifetimeMember && (
                      <span className="inline-block rounded px-1.5 py-0.5 text-[10px] bg-purple-500/15 text-purple-400">
                        lifetime
                      </span>
                    )}
                    {user.subscriptionTier && (
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] ${
                        user.subscriptionTier === "system"
                          ? "bg-accent-cyan/15 text-accent-cyan"
                          : "bg-text-muted/10 text-text-muted"
                      }`}>
                        {user.subscriptionTier}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <SetTitleForm userId={user.id} currentTitle={user.memberTitle} />
                </td>
                <td className="px-4 py-3">
                  <span className={user.isPublicMember ? "text-accent-gold-text" : "text-text-muted/50"}>
                    {user.isPublicMember ? "yes" : "no"}
                  </span>
                  {user.codexSlug && (
                    <p className="text-text-muted/50 text-[10px]">/{user.codexSlug}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-text-muted/70">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SetTitleForm({ userId, currentTitle }: { userId: string; currentTitle: string | null }) {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        const title = formData.get("title") as string;
        await setMemberTitle(userId, title);
      }}
      className="flex gap-1"
    >
      <input
        name="title"
        defaultValue={currentTitle ?? ""}
        placeholder="Oracle"
        className="w-24 rounded border border-border/50 bg-elevated/50 px-1.5 py-1 text-[10px] text-text-primary placeholder:text-text-muted/60 focus:border-accent-gold/40 focus:outline-none"
      />
      <button
        type="submit"
        className="rounded px-1.5 py-1 text-[10px] bg-border/50 text-text-muted hover:text-text-primary transition-colors"
      >
        set
      </button>
    </form>
  );
}
