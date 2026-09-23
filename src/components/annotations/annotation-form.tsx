"use client";

import { useRef, useState } from "react";
import { submitAnnotation } from "@/app/annotations/actions";

interface Props {
  targetType: string;
  targetId: string;
  returnPath: string;
}

export function AnnotationForm({ targetType, targetId, returnPath }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-lg border border-accent-cyan/30 bg-accent-cyan/5 px-4 py-3 text-center">
        <p className="font-mono text-xs text-accent-cyan">
          Annotation submitted — it&apos;ll appear once approved.
        </p>
        <button
          onClick={() => setDone(false)}
          className="mt-1 font-mono text-[12px] text-text-muted hover:text-accent-cyan transition-colors"
        >
          Add another →
        </button>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        setSubmitting(true);
        try {
          await submitAnnotation(fd);
          formRef.current?.reset();
          setDone(true);
        } finally {
          setSubmitting(false);
        }
      }}
      className="space-y-2"
    >
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="returnPath" value={returnPath} />
      <textarea
        name="body"
        required
        rows={3}
        minLength={10}
        maxLength={1500}
        placeholder="Add a connection, a correction, a piece of context the archive missed…"
        className="w-full rounded-lg border border-accent-cyan/25 bg-void/60 px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan/60 focus:outline-none resize-none"
      />
      <div className="flex items-center justify-between">
        <p className="font-mono text-[12px] text-text-muted">Submitted annotations are reviewed before they appear.</p>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg border border-accent-cyan/40 bg-accent-cyan/10 px-4 py-1.5 font-mono text-[12px] font-bold text-accent-cyan transition-all hover:bg-accent-cyan/20 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit annotation ◈"}
        </button>
      </div>
    </form>
  );
}
