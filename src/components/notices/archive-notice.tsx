import Link from "next/link";

interface ArchiveNoticeProps {
  entityType: "person" | "episode" | "lore";
  entityName: string;
  className?: string;
}

const NOTICE_TEXT: Record<string, { heading: string; body: string }> = {
  person: {
    heading: "Auto-Generated Profile",
    body: "This profile was automatically created from public stream appearances. Information is AI-extracted and may contain inaccuracies. This page does not represent the views or endorsement of the individual.",
  },
  episode: {
    heading: "AI-Assisted Summary",
    body: "This episode summary was generated using AI analysis of the transcript or metadata. Details may be approximate.",
  },
  lore: {
    heading: "Community-Cataloged Lore",
    body: "This lore entry was extracted from stream discussions using AI. Canon status reflects in-stream characterization, not objective truth.",
  },
};

export function ArchiveNotice({ entityType, entityName, className }: ArchiveNoticeProps) {
  const notice = NOTICE_TEXT[entityType] ?? NOTICE_TEXT.episode;

  return (
    <aside
      className={`rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 ${className ?? ""}`}
      role="note"
      aria-label="Archive notice"
    >
      <div className="flex items-start gap-3">
        <svg
          className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-bold text-amber-400 uppercase tracking-wider">
            {notice.heading}
          </p>
          <p className="mt-1 text-xs text-text-muted leading-relaxed">
            {notice.body}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Link
              href="/corrections"
              className="font-mono text-[10px] text-accent-gold-text hover:underline"
            >
              Report an error
            </Link>
            <Link
              href="/content-policy"
              className="font-mono text-[10px] text-text-muted hover:text-accent-gold-text hover:underline"
            >
              Content policy
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
