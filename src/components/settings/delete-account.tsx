"use client";

import { useState, useTransition } from "react";

export function DeleteAccount({
  email,
  remove,
}: {
  email: string;
  remove: (confirmEmail: string) => Promise<{ error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-red-500/40 px-3 py-1.5 font-mono text-[12px] text-red-400 transition-colors hover:bg-red-500/10"
      >
        Delete my account
      </button>
    );
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          // Success signs the user out and redirects, handled by Next.
          const result = await remove(typed).catch(() => ({ error: "Delete failed. Please try again." }));
          if (result.error) setError(result.error);
        });
      }}
    >
      <p className="font-mono text-[12px] text-text-muted leading-relaxed">
        This permanently deletes your account, favorites, comments, cards, wallet and newsletter
        subscription. It can&apos;t be undone. Type <span className="text-text-primary">{email}</span> to confirm.
      </p>
      <input
        type="email"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        aria-label="Confirm your email"
        className="w-full rounded border border-line bg-surface px-3 py-2 font-mono text-[12px] text-text-primary"
      />
      {error && <p role="alert" className="font-mono text-[12px] text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || typed.trim().length === 0}
          className="rounded bg-red-500/80 px-3 py-1.5 font-mono text-[12px] text-white transition-colors hover:bg-red-500 disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Permanently delete"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => { setOpen(false); setTyped(""); setError(null); }}
          className="rounded px-3 py-1.5 font-mono text-[12px] text-text-muted hover:text-text-primary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
