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

  // Admins bypass paywall
  if (user.role === "admin") return true;

  // Check active subscription with valid period
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
 * Get full subscription status for UI display.
 */
export async function getSubscriptionStatus(userId: string) {
  const user = await prisma.codexUser.findUnique({
    where: { id: userId },
    select: {
      role: true,
      subscriptionStatus: true,
      subscriptionId: true,
      currentPeriodEnd: true,
      stripeCustomerId: true,
    },
  });

  if (!user) return null;

  return {
    isAdmin: user.role === "admin",
    status: user.subscriptionStatus,
    periodEnd: user.currentPeriodEnd,
    hasSubscription: !!user.subscriptionId,
    hasStripeCustomer: !!user.stripeCustomerId,
  };
}
