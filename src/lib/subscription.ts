import { prisma } from "@/lib/db";

/**
 * Check if a user has an active transcript subscription.
 * Admins always have access.
 */
export async function isSubscribed(userId: string): Promise<boolean> {
  const user = await prisma.codexUser.findUnique({
    where: { id: userId },
    select: {
      role: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
    },
  });

  if (!user) return false;
  if (user.role === "admin") return true;

  if (
    user.subscriptionStatus === "active" &&
    user.currentPeriodEnd &&
    user.currentPeriodEnd > new Date()
  ) {
    return true;
  }

  return false;
}

/**
 * Check if a user has the "system" tier (Full System, $25/mo).
 * Admins always qualify.
 */
export async function hasSystemTier(userId: string): Promise<boolean> {
  const user = await prisma.codexUser.findUnique({
    where: { id: userId },
    select: { role: true, subscriptionStatus: true, subscriptionTier: true, currentPeriodEnd: true },
  });
  if (!user) return false;
  if (user.role === "admin") return true;
  return (
    user.subscriptionStatus === "active" &&
    user.subscriptionTier === "system" &&
    !!user.currentPeriodEnd &&
    user.currentPeriodEnd > new Date()
  );
}

/**
 * Get full subscription status for UI display.
 */
export async function getSubscriptionStatus(userId: string) {
  const user = await prisma.codexUser.findUnique({
    where: { id: userId },
    select: {
      role: true,
      subscriptionStatus: true,
      subscriptionTier: true,
      subscriptionId: true,
      currentPeriodEnd: true,
      stripeCustomerId: true,
    },
  });

  if (!user) return null;

  return {
    isAdmin: user.role === "admin",
    status: user.subscriptionStatus,
    tier: user.subscriptionTier,
    periodEnd: user.currentPeriodEnd,
    hasSubscription: !!user.subscriptionId,
    hasStripeCustomer: !!user.stripeCustomerId,
  };
}
