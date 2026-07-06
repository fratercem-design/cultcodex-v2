import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import { getCounts } from "@/lib/queries/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const [subStatus, stats] = await Promise.all([
    user ? getSubscriptionStatus(user.id) : Promise.resolve(null),
    getCounts(),
  ]);

  return NextResponse.json({
    user: user ? { id: user.id, role: user.role } : null,
    subscription: subStatus,
    stats,
  });
}
