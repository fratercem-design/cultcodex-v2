import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import type { CodexUserRole } from "@/generated/prisma/client";

// Fail fast: an OAuth provider with undefined credentials fails only at
// sign-in time, per request, with an opaque error. Surface a missing env var
// at boot instead.
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!googleClientId || !googleClientSecret) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        await prisma.codexUser.upsert({
          where: { email: user.email },
          update: {
            avatarUrl: user.image ?? undefined,
          },
          create: {
            email: user.email,
            displayName: user.name ?? user.email.split("@")[0],
            avatarUrl: user.image ?? undefined,
            provider: account?.provider ?? "unknown",
          },
        });
      } catch (err) {
        console.error("[auth] signIn upsert failed:", err);
        // Still allow sign-in even if DB write fails
      }

      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const adminEmails = (process.env.ADMIN_EMAILS ?? "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean);
        const isEnvAdmin = adminEmails.includes(session.user.email.toLowerCase());

        try {
          let codexUser = await prisma.codexUser.findUnique({
            where: { email: session.user.email },
            select: { id: true, displayName: true, role: true, avatarUrl: true, subscriptionStatus: true, subscriptionTier: true, onboardingCompleted: true },
          });

          // If no DB record exists (e.g. signIn upsert failed when DB was down),
          // create the user now so they can actually log in.
          if (!codexUser) {
            codexUser = await prisma.codexUser.upsert({
              where: { email: session.user.email },
              update: { avatarUrl: session.user.image ?? undefined },
              create: {
                email: session.user.email,
                displayName: session.user.name ?? session.user.email.split("@")[0],
                avatarUrl: session.user.image ?? undefined,
                provider: (token as { provider?: string })?.provider ?? "google",
              },
              select: { id: true, displayName: true, role: true, avatarUrl: true, subscriptionStatus: true, subscriptionTier: true, onboardingCompleted: true },
            });
          }

          if (codexUser) {
            (session as SessionWithCodex).codexUser = {
              ...codexUser,
              role: isEnvAdmin ? "admin" : codexUser.role,
            };
          }
        } catch (err) {
          console.error("[auth] session callback DB error:", err);
          // Fallback: minimal select when subscription columns aren't migrated yet.
          // This keeps env-admin users authenticated so the admin UI stays accessible.
          try {
            const minimal = await prisma.codexUser.findUnique({
              where: { email: session.user.email },
              select: { id: true, displayName: true, role: true, avatarUrl: true },
            });
            if (minimal) {
              (session as SessionWithCodex).codexUser = {
                id: minimal.id,
                displayName: minimal.displayName,
                role: isEnvAdmin ? "admin" : minimal.role,
                avatarUrl: minimal.avatarUrl,
                subscriptionStatus: null,
                subscriptionTier: null,
                onboardingCompleted: null,
              };
            }
          } catch {
            // DB completely unavailable — return session without codexUser
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});

export interface CodexSessionUser {
  id: string;
  displayName: string;
  role: CodexUserRole;
  avatarUrl: string | null;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
  onboardingCompleted: boolean | null;
}

export interface SessionWithCodex {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  codexUser?: CodexSessionUser;
  expires: string;
}

export async function getCurrentUser(): Promise<CodexSessionUser | null> {
  try {
    const session = (await auth()) as SessionWithCodex | null;
    return session?.codexUser ?? null;
  } catch {
    // JWTSessionError or other auth failures — treat as unauthenticated
    return null;
  }
}

export async function requireAuth(): Promise<CodexSessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Authentication required");
  return user;
}

export async function requireAdmin(): Promise<CodexSessionUser> {
  const user = await requireAuth();
  if (user.role !== "admin") throw new Error("Admin access required");
  return user;
}

export async function requireSubscriber(): Promise<CodexSessionUser> {
  const user = await requireAuth();
  const { isSubscribed } = await import("@/lib/subscription");
  const subscribed = await isSubscribed(user.id);
  if (!subscribed) throw new Error("Premium subscription required");
  return user;
}
