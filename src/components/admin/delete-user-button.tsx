"use client";

import { useTransition } from "react";

export function DeleteUserButton({
  email,
  remove,
}: {
  email: string;
  remove: (confirmEmail: string) => Promise<{ error?: string }>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const typed = window.prompt(
          `Permanently delete ${email}? This removes their account, comments, cards and saved items and can't be undone.\n\nType the email to confirm:`,
        );
        if (typed === null) return;
        startTransition(async () => {
          const result = await remove(typed).catch(() => ({ error: "Delete failed." }));
          if (result.error) window.alert(result.error);
        });
      }}
      className="rounded px-1.5 py-0.5 text-[12px] text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      {pending ? "deleting…" : "delete account"}
    </button>
  );
}
