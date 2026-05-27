import Link from "next/link";

interface AiNoticeProps {
  variant?: "inline" | "banner";
  className?: string;
}

/**
 * Minimal AI-generated content disclaimer.
 * Inline: one line, placed beneath a summary or profile section.
 * Banner: slightly more prominent for whole-page AI content (e.g. Psychenomicon).
 */
export function AiNotice({ variant = "inline", className = "" }: AiNoticeProps) {
  if (variant === "banner") {
    return (
      <div
        className={`flex items-start gap-2 rounded border border-border bg-surface/40 px-3 py-2 ${className}`}
        role="note"
        aria-label="AI-generated content notice"
      >
        <span className="shrink-0 text-[10px] text-accent-violet mt-0.5">◈</span>
        <p className="text-[11px] text-text-muted leading-snug">
          <span className="text-text-secondary font-medium">AI-generated interpretation.</span>{" "}
          Descriptions summarize on-stream discussion and performance personas — not verified
          real-world claims. Content may be inaccurate or incomplete.{" "}
          <Link
            href="/about/methodology"
            className="text-accent-violet hover:underline underline-offset-2"
          >
            How this works
          </Link>{" "}
          ·{" "}
          <Link
            href="/suggest-correction"
            className="text-accent-violet hover:underline underline-offset-2"
          >
            Suggest a correction
          </Link>
        </p>
      </div>
    );
  }

  return (
    <p
      className={`text-[10px] text-text-muted font-mono leading-relaxed ${className}`}
      role="note"
    >
      <span className="text-accent-violet/70">◈</span> AI-generated · summarizes on-stream
      discussion, not verified claims ·{" "}
      <Link
        href="/about/methodology"
        className="hover:text-accent-violet underline-offset-2 hover:underline"
      >
        methodology
      </Link>
    </p>
  );
}
