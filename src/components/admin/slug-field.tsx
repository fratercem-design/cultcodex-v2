"use client";

import { useState, useCallback } from "react";

interface SlugFieldProps {
  titleLabel?: string;
  titleName?: string;
  defaultTitle?: string;
  defaultSlug?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function SlugField({
  titleLabel = "Title",
  titleName = "title",
  defaultTitle = "",
  defaultSlug = "",
}: SlugFieldProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [slug, setSlug] = useState(defaultSlug);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      if (!slugManuallyEdited) {
        setSlug(slugify(newTitle));
      }
    },
    [slugManuallyEdited]
  );

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSlug(e.target.value);
      setSlugManuallyEdited(true);
    },
    []
  );

  return (
    <>
      <div>
        <label className="block font-mono text-xs text-text-muted mb-1">
          {titleLabel}
        </label>
        <input
          type="text"
          name={titleName}
          value={title}
          onChange={handleTitleChange}
          required
          className="w-full rounded border border-border bg-elevated px-3 py-1.5 font-mono text-sm text-text-primary focus:border-accent-green focus:outline-none"
        />
      </div>
      <div>
        <label className="block font-mono text-xs text-text-muted mb-1">
          Slug
        </label>
        <input
          type="text"
          name="slug"
          value={slug}
          onChange={handleSlugChange}
          className="w-full rounded border border-border bg-elevated px-3 py-1.5 font-mono text-sm text-text-primary focus:border-accent-green focus:outline-none"
        />
        <p className="mt-0.5 font-mono text-[9px] text-text-muted">
          Auto-generated from {titleLabel.toLowerCase()}. Edit to customize.
        </p>
      </div>
    </>
  );
}
