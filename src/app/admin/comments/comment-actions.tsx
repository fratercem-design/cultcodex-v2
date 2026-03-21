"use client";

import { useTransition } from "react";
import { moderateComment } from "@/app/admin/actions";
import { useRouter } from "next/navigation";

interface Props {
  commentId: string;
  flagged: boolean;
}

export function CommentActions({ commentId, flagged }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = (action: "approve" | "delete") => {
    if (action === "delete" && !confirm("Delete this comment permanently?")) return;
    startTransition(async () => {
      await moderateComment(commentId, action);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-1 flex-shrink-0">
      {flagged && (
        <button
          onClick={() => handleAction("approve")}
          disabled={isPending}
          className="rounded border border-accent-green/30 bg-accent-green/10 px-3 py-1 font-mono text-[10px] text-accent-green hover:bg-accent-green/20 disabled:opacity-50"
        >
          Approve
        </button>
      )}
      <button
        onClick={() => handleAction("delete")}
        disabled={isPending}
        className="rounded border border-red-400/30 bg-red-400/10 px-3 py-1 font-mono text-[10px] text-red-400 hover:bg-red-400/20 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
