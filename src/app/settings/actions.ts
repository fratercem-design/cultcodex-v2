"use server";

import { requireAuth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Self-serve account deletion. Mirrors the admin `deleteUserAccount`: most
 * user-owned rows cascade, but ChatMessage, NotificationPreference and Favorite
 * have no cascade in the schema, so they go first in the same transaction. The
 * newsletter Subscriber row is keyed by email, not user, so it is removed too.
 *
 * Active Stripe subscriptions must be cancelled first (billing portal) so we
 * never orphan a customer who is still being charged.
 */
export async function deleteOwnAccount(confirmEmail: string): Promise<{ error?: string }> {
  const session = await requireAuth();

  const user = await prisma.codexUser.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, role: true, subscriptionId: true, subscriptionStatus: true },
  });
  if (!user) return { error: "Account not found." };

  const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  if (user.role === "admin" || adminEmails.includes(user.email.toLowerCase())) {
    return { error: "Admin accounts can't be deleted here. Contact another admin." };
  }
  if (user.subscriptionId && user.subscriptionStatus !== "canceled") {
    return { error: "Cancel your subscription first (Subscription → Manage), then delete your account." };
  }
  if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return { error: "The email you typed doesn't match your account." };
  }

  await prisma.$transaction([
    prisma.chatMessage.deleteMany({ where: { userId: user.id } }),
    prisma.notificationPreference.deleteMany({ where: { userId: user.id } }),
    prisma.favorite.deleteMany({ where: { userId: user.id } }),
    prisma.subscriber.deleteMany({ where: { email: user.email } }),
    prisma.codexUser.delete({ where: { id: user.id } }),
  ]);

  // Throws NEXT_REDIRECT on success, so nothing after this runs.
  await signOut({ redirectTo: "/?account=deleted" });
  return {};
}
