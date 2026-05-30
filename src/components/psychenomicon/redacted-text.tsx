"use client";

import Link from "next/link";

/**
 * Parses chapter text containing tier-gated markers:
 *   [[LOCKED: hidden text]]  → blurred for Observers (needs Initiate+)
 *   [[ORACLE: hidden text]]  → blurred for Initiates (needs Architect tier)
 *
 * Renders revealed text as-is; gated text as a blurred pill with an unlock CTA.
 */

interface Segment {
  type: "text" | "locked" | "oracle";
  content: string;
}

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  // Match [[LOCKED:...]] or [[ORACLE:...]]
  const re = /\[\[(LOCKED|ORACLE):\s*([\s\S]*?)\]\]/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: "text", content: text.slice(last, match.index) });
    }
    segments.push({
      type: match[1] === "ORACLE" ? "oracle" : "locked",
      content: match[2].trim(),
    });
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    segments.push({ type: "text", content: text.slice(last) });
  }

  return segments;
}

interface RedactedBlockProps {
  content: string;
  tier: "locked" | "oracle";
}

function RedactedBlock({ tier }: RedactedBlockProps) {
  const isOracle = tier === "oracle";
  const label = isOracle ? "Architect" : "Initiate+";
  const href = isOracle ? "/premium#system" : "/premium#access";
  const borderCls = isOracle ? "border-accent-violet/30" : "border-accent-gold/30";
  const textCls = isOracle ? "text-accent-violet" : "text-accent-gold";
  const bgCls = isOracle ? "bg-accent-violet/5" : "bg-accent-gold/5";

  return (
    <span className={`inline-flex items-center gap-2 rounded border ${borderCls} ${bgCls} px-3 py-1 my-0.5`}>
      <span className="font-mono text-[10px] text-text-muted/50 select-none tracking-wider">
        ████████████████████
      </span>
      <Link
        href={href}
        className={`font-mono text-[9px] uppercase tracking-[0.2em] ${textCls} hover:underline whitespace-nowrap`}
        onClick={(e) => e.stopPropagation()}
      >
        {label} to unlock →
      </Link>
    </span>
  );
}

interface RedactedTextProps {
  text: string;
  /** Tier the current viewer holds: undefined = not subscribed, "access" = Initiate+, "system" = Architect */
  viewerTier?: "access" | "system" | null;
  className?: string;
}

export function RedactedText({ text, viewerTier, className }: RedactedTextProps) {
  const segments = parseSegments(text);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.content}</span>;
        }
        if (seg.type === "locked") {
          // Initiate+ and Oracle can see this
          if (viewerTier === "access" || viewerTier === "system") {
            return <span key={i} className="text-accent-gold/90">{seg.content}</span>;
          }
          return <RedactedBlock key={i} content={seg.content} tier="locked" />;
        }
        // oracle
        if (viewerTier === "system") {
          return <span key={i} className="text-accent-violet/90">{seg.content}</span>;
        }
        return <RedactedBlock key={i} content={seg.content} tier="oracle" />;
      })}
    </span>
  );
}

/**
 * Paragraph-aware version: splits text on blank lines and renders each paragraph,
 * with redacted markers inline within paragraphs.
 */
export function RedactedParagraphs({
  text,
  viewerTier,
  className = "text-sm text-text-primary leading-relaxed",
}: RedactedTextProps) {
  const paragraphs = text.split(/\n{2,}/).filter(Boolean);

  return (
    <>
      {paragraphs.map((para, i) => (
        <p key={i} className={`mb-4 last:mb-0 ${className}`}>
          <RedactedText text={para.trim()} viewerTier={viewerTier} />
        </p>
      ))}
    </>
  );
}
