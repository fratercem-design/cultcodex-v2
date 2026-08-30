import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Auth configuration error. Contact the admin.",
  AccessDenied: "Access denied. You may not have permission to sign in.",
  Verification: "The verification link has expired or was already used.",
  OAuthSignin: "Error starting OAuth sign-in. Try again.",
  OAuthCallback: "Error during OAuth callback. Try again.",
  OAuthCreateAccount: "Could not create account. Try again.",
  EmailCreateAccount: "Could not create account. Try again.",
  Callback: "Error in auth callback. Try again.",
  OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
  SessionRequired: "You must be signed in to access this page.",
  Default: "An unexpected auth error occurred.",
};

export default async function AuthErrorPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  const message = ERROR_MESSAGES[error ?? "Default"] ?? ERROR_MESSAGES.Default;

  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-4">
      <div className="text-center space-y-5 max-w-sm">
        <p className="font-mono text-[9px] uppercase tracking-[0.4em] text-accent-crimson-text">
          {"/// auth_error"}
        </p>
        <p className="font-display text-xl font-bold text-text-primary">
          Sign-in failed
        </p>
        {error && (
          <p className="font-mono text-[10px] text-text-muted/60 uppercase tracking-wider">
            code: {error}
          </p>
        )}
        <p className="text-sm text-text-muted">{message}</p>
        <div className="flex items-center justify-center gap-4 pt-2">
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 rounded border border-accent-violet/50 bg-accent-violet/10 px-4 py-2 font-mono text-xs font-bold text-accent-violet-text hover:bg-accent-violet/20 transition-colors"
          >
            Try again →
          </Link>
          <Link
            href="/"
            className="font-mono text-[10px] text-text-muted hover:text-accent-violet-text transition-colors"
          >
            ← Home
          </Link>
        </div>
      </div>
    </main>
  );
}
