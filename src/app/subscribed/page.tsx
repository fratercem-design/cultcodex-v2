import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email updates — CultCodex",
  robots: { index: false, follow: false },
};

const MESSAGES: Record<string, { title: string; body: string }> = {
  confirmed: {
    title: "You're confirmed",
    body: "You'll get an email when Cult of Psyche goes live. Every email has an unsubscribe link.",
  },
  unsubscribed: {
    title: "You're unsubscribed",
    body: "Your address is off the list and you won't get any more of these emails.",
  },
  invalid: {
    title: "That link didn't work",
    body: "It may be incomplete or already used. Sign up again from the live page to get a fresh link.",
  },
};

export default async function SubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const msg = MESSAGES[status ?? ""] ?? MESSAGES.invalid;

  return (
    <main id="main-content" className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-2xl font-bold text-accent-gold">{msg.title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">{msg.body}</p>
      <Link href="/" className="mt-6 font-mono text-xs text-accent-gold-text hover:underline">
        Back to the archive →
      </Link>
    </main>
  );
}
