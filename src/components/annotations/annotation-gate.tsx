"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAnnotationAccess } from "@/app/annotations/actions";
import { AnnotationForm } from "./annotation-form";

interface Props {
  targetType: string;
  targetId: string;
  returnPath: string;
}

/**
 * The per-viewer half of AnnotationSection: the submit form for Initiate+
 * members, a sign-in / upgrade prompt for everyone else. Resolved in the
 * browser so the surrounding page carries no cookies and can be cached.
 */
export function AnnotationGate({ targetType, targetId, returnPath }: Props) {
  const [access, setAccess] = useState<{ signedIn: boolean; canAnnotate: boolean } | null>(null);

  useEffect(() => {
    getAnnotationAccess()
      .then(setAccess)
      .catch(() => setAccess({ signedIn: false, canAnnotate: false }));
  }, []);

  if (!access) return null;

  if (access.canAnnotate) {
    return (
      <div className="rounded-xl border border-accent-cyan/20 bg-accent-cyan/[0.03] p-4">
        <AnnotationForm targetType={targetType} targetId={targetId} returnPath={returnPath} />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      <p className="font-mono text-[12px] text-text-muted">
        {access.signedIn ? "Annotating is an Initiate+ feature." : "Sign in as Initiate+ to annotate."}
      </p>
      <Link
        href={access.signedIn ? "/premium" : "/auth/signin"}
        className="font-mono text-[12px] uppercase tracking-widest rounded border border-accent-gold/30 text-accent-gold-text px-3 py-1.5 hover:bg-accent-gold/5 transition-colors"
      >
        {access.signedIn ? "Become Initiate+ →" : "Sign in →"}
      </Link>
    </div>
  );
}
