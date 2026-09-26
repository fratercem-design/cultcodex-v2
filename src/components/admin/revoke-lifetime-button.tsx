"use client";

import { useTransition } from "react";

export function RevokeLifetimeButton({
  label,
  revoke,
}: {
  label: string;
  revoke: () => Promise<{ error?: string }>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Revoke lifetime access for ${label}? Their account stays; paid features stop.`)) return;
        startTransition(async () => {
          const result = await revoke().catch(() => ({ error: "Revoke failed." }));
          if (result.error) window.alert(result.error);
        });
      }}
      className="mt-1 rounded px-1.5 py-0.5 text-[12px] text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      {pending ? "revoking…" : "revoke lifetime"}
    </button>
  );
}
