import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <span className="text-6xl">🔮</span>
      <h1 className="mt-4 font-display text-3xl font-bold text-accent-gold">
        404
      </h1>
      <p className="mt-2 font-mono text-sm text-accent-cyan">
        This transmission was lost in the void
      </p>
      <p className="mt-1 font-mono text-xs text-text-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-lg border border-accent-green bg-accent-green/10 px-4 py-2 font-mono text-xs text-accent-green transition-colors hover:bg-accent-green/20"
        >
          Return Home
        </Link>
        <Link
          href="/episodes"
          className="rounded-lg border border-border px-4 py-2 font-mono text-xs text-text-muted transition-colors hover:border-accent-green/30 hover:text-text-primary"
        >
          Browse Episodes
        </Link>
      </div>
    </main>
  );
}
