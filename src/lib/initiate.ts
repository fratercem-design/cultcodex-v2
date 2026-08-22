/**
 * Lead-capture account provisioning.
 *
 * A visitor who hands over a name + email on a capture surface gets a real
 * CodexUser row created for them immediately, so the account exists before
 * they ever sign in. When they later sign in with Google using the same
 * address, `auth.ts` upserts on `email` and its `update` branch touches only
 * `avatarUrl` — so this row is adopted intact, keeping anything already
 * attached to it (handle, sigil, wallet, cards, onboarding progress).
 *
 * `provider: "initiate"` marks accounts that were pre-provisioned this way and
 * have never actually authenticated. Nothing here grants access that a signed
 * -out visitor did not already have: the row is a container waiting to be
 * claimed, not a logged-in session.
 */
import { prisma } from "@/lib/db";

export type ProvisionOutcome =
  | { status: "created"; userId: string }
  | { status: "existing"; userId: string }
  | { status: "failed" };

/** Derive a display name from the supplied name, falling back to the email local-part. */
function toDisplayName(name: string | undefined, email: string): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed.slice(0, 80);
  return email.split("@")[0].slice(0, 80);
}

/**
 * Create the CodexUser for a captured lead, or return the existing one.
 *
 * Never throws — capture flows must not fail because account provisioning did.
 * The caller decides what to tell the visitor; the lead itself is already
 * stored on the Subscriber row by that point.
 */
export async function provisionCodexUser(input: {
  email: string;
  name?: string;
}): Promise<ProvisionOutcome> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { status: "failed" };

  try {
    const existing = await prisma.codexUser.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) return { status: "existing", userId: existing.id };

    const created = await prisma.codexUser.create({
      data: {
        email,
        displayName: toDisplayName(input.name, email),
        provider: "initiate",
      },
      select: { id: true },
    });
    return { status: "created", userId: created.id };
  } catch (err) {
    console.error("[initiate] codexUser provisioning failed:", err);
    return { status: "failed" };
  }
}
