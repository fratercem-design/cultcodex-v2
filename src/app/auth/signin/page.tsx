import type { Metadata } from "next";
import { PageHero } from "@/components/ui/page-hero";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";

export const dynamic = "force-dynamic";

// Account utility route: route-specific title, and kept out of the index —
// it has no archive content and its callbackUrl variants would multiply into
// near-duplicate URLs (2026-08 audit).
export const metadata: Metadata = {
  title: "Sign In — CultCodex",
  description: "Sign in to your CultCodex account.",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignInPage({ searchParams }: PageProps) {
  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl ?? "/";

  return (
    <>
      <PageHero
        title="SIGN IN"
        subtitle="Join the Codex"
        backgroundImage="/wiki-page-header.jpg"
        label="access"
      />
      <main className="mx-auto max-w-md px-4 py-12">
        <div className="rounded-lg border border-border bg-surface p-8 space-y-6">
          <div className="text-center">
            <h2 className="font-display text-lg text-text-primary">
              Welcome to CultCodex
            </h2>
            <p className="mt-1 text-sm text-text-muted">
              Sign in to react, comment, and join the conversation.
            </p>
          </div>

          <GoogleSignInButton callbackUrl={redirectTo} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-2 font-mono text-text-muted">or</span>
            </div>
          </div>

          <p className="text-center text-xs text-text-muted">
            Email sign-in coming soon.
          </p>
        </div>
      </main>
    </>
  );
}
