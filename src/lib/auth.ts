import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import type { CodexUserRole } from "@/generated/prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

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

      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const codexUser = await prisma.codexUser.findUnique({
          where: { email: session.user.email },
          select: { id: true, displayName: true, role: true, avatarUrl: true, subscriptionStatus: true, subscriptionTier: true },
        });
        if (codexUser) {
          const adminEmails = (process.env.ADMIN_EMAILS ?? "")
            .split(",")
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean);
          const isEnvAdmin = adminEmails.includes(session.user.email.toLowerCase());
          (session as SessionWithCodex).codexUser = {
            ...codexUser,
            role: isEnvAdmin ? "admin" : codexUser.role,
          };
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
});

export interface CodexSessionUser {
  id: string;
  displayName: string;
  role: CodexUserRole;
  avatarUrl: string | null;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
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
  const session = (await auth()) as SessionWithCodex | null;
  return session?.codexUser ?? null;
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
