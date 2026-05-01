"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const PRESET_TITLES = [
  "Oracle",
  "Acolyte",
  "Archivist",
  "Void Walker",
  "Shadow Dancer",
  "Lore Keeper",
  "Scrollkeeper",
  "Psyche Cultist",
  "Initiate",
  "Devotee",
  "Neon Priest",
  "True Believer",
  "Founding Member",
  "The Unseen",
];

interface ProfileFormProps {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  memberTitle: string | null;
  isPublicMember: boolean;
  memberSince: Date;
  isAdmin: boolean;
  isSystemTier: boolean;
  bio: string | null;
  codexSlug: string | null;
  codexPagePublic: boolean;
}

export function ProfileForm({
  displayName,
  email,
  avatarUrl,
  memberTitle: initialTitle,
  isPublicMember: initialPublic,
  memberSince,
  isAdmin,
  isSystemTier,
  bio: initialBio,
  codexSlug: initialSlug,
  codexPagePublic: initialPagePublic,
}: ProfileFormProps) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [customTitle, setCustomTitle] = useState(
    initialTitle && !PRESET_TITLES.includes(initialTitle) ? initialTitle : ""
  );
  const [useCustom, setUseCustom] = useState(
    !!initialTitle && !PRESET_TITLES.includes(initialTitle)
  );
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // System-tier fields
  const [bio, setBio] = useState(initialBio ?? "");
  const [codexSlug, setCodexSlug] = useState(initialSlug ?? "");
  const [codexPagePublic, setCodexPagePublic] = useState(initialPagePublic);
  const [codexSaving, setCodexSaving] = useState(false);
  const [codexSaved, setCodexSaved] = useState(false);
  const [codexError, setCodexError] = useState<string | null>(null);

  const effectiveTitle = useCustom ? customTitle : title;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberTitle: effectiveTitle.trim() || null,
          isPublicMember: isPublic,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCodexSave() {
    setCodexSaving(true);
    setCodexError(null);
    setCodexSaved(false);
    try {
      const res = await fetch("/api/me/codex-page", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: bio.trim() || null,
          codexSlug: codexSlug.trim() || null,
          codexPagePublic,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setCodexError(data.error ?? "Failed to save");
      } else {
        setCodexSaved(true);
        setTimeout(() => setCodexSaved(false), 3000);
      }
    } catch {
      setCodexError("Network error. Please try again.");
    } finally {
      setCodexSaving(false);
    }
  }

  const memberSinceStr = new Date(memberSince).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Identity Card */}
      <div className="rounded-xl border border-accent-gold/40 bg-gradient-to-b from-accent-gold/8 to-surface p-6">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-accent-gold/40 shadow-lg shadow-accent-gold/20">
              <Image src={avatarUrl} alt={displayName} fill className="object-cover" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent-gold/40 bg-accent-gold/10 text-2xl shadow-lg shadow-accent-gold/20">
              🌑
            </div>
          )}
          <div>
            <p className="font-display text-lg font-bold text-text-primary">{displayName}</p>
            <p className="font-mono text-[11px] text-text-muted">{email}</p>
            <div className="mt-1 flex items-center gap-2">
              {isAdmin ? (
                <span className="rounded border border-accent-gold/50 bg-accent-gold/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-accent-gold">
                  Admin
                </span>
              ) : (
                <span className="rounded border border-accent-cyan/50 bg-accent-cyan/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-accent-cyan">
                  Premium
                </span>
              )}
              {effectiveTitle.trim() && (
                <span className="rounded border border-accent-gold/30 bg-surface px-2 py-0.5 font-mono text-[9px] text-accent-gold">
                  {effectiveTitle}
                </span>
              )}
            </div>
          </div>
        </div>
        <p className="mt-3 border-t border-accent-gold/10 pt-3 font-mono text-[10px] text-text-muted">
          Member since{" "}
          <span className="text-accent-gold font-bold">{memberSinceStr}</span>
        </p>
      </div>

      {/* Flair Title */}
      <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-accent-gold">Cult Flair Title</h3>
          <p className="mt-1 font-mono text-[11px] text-text-muted">
            Your title appears on your profile and the public Member Roll
          </p>
        </div>

        {/* Preset Grid */}
        {!useCustom && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {PRESET_TITLES.map((t) => (
              <button
                key={t}
                onClick={() => setTitle(t)}
                className={`rounded-lg border px-3 py-2 text-left font-mono text-[11px] transition-all ${
                  title === t
                    ? "border-accent-gold bg-accent-gold/15 text-accent-gold shadow-md shadow-accent-gold/20"
                    : "border-border bg-elevated text-text-muted hover:border-accent-gold/40 hover:text-text-primary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {/* Custom Title Toggle */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => {
              setUseCustom(!useCustom);
              if (useCustom) setTitle(initialTitle && PRESET_TITLES.includes(initialTitle) ? initialTitle : "");
            }}
            className="font-mono text-[11px] text-accent-cyan hover:underline"
          >
            {useCustom ? "← Choose a preset title" : "Or write your own title →"}
          </button>
        </div>

        {useCustom && (
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value.slice(0, 40))}
            placeholder="Enter your custom title..."
            className="w-full rounded-lg border border-border bg-elevated px-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus:border-accent-gold/50 focus:outline-none focus:ring-1 focus:ring-accent-gold/30"
          />
        )}

        {effectiveTitle.trim() && (
          <div className="rounded-lg border border-accent-gold/20 bg-accent-gold/5 px-4 py-2.5">
            <p className="font-mono text-[10px] text-text-muted">Preview</p>
            <p className="mt-0.5 font-mono text-sm font-bold text-accent-gold">
              {displayName} — <span className="font-normal italic">{effectiveTitle}</span>
            </p>
          </div>
        )}
      </div>

      {/* Member Roll Toggle */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-bold text-accent-gold">Public Member Roll</h3>
            <p className="mt-1 font-mono text-[11px] text-text-muted">
              Appear on the{" "}
              <Link href="/members" className="text-accent-cyan hover:underline">
                /members
              </Link>{" "}
              page. Show the Psycheverse you&apos;re an official cult member.
            </p>
          </div>
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`relative mt-1 h-6 w-11 flex-shrink-0 rounded-full border transition-colors duration-200 ${
              isPublic
                ? "border-accent-gold bg-accent-gold/80"
                : "border-border bg-elevated"
            }`}
            aria-label="Toggle public member roll"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                isPublic ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        {isPublic && (
          <p className="mt-3 font-mono text-[10px] text-accent-cyan/80">
            ✓ You&apos;ll appear on the public Member Roll with your flair title
          </p>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center justify-between">
        <div>
          {error && <p className="font-mono text-[11px] text-red-400">{error}</p>}
          {saved && (
            <p className="font-mono text-[11px] text-green-400">
              ✓ Profile saved
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg border border-accent-gold bg-accent-gold/15 px-6 py-2.5 font-mono text-sm font-bold text-accent-gold transition-all hover:bg-accent-gold/25 hover:shadow-lg hover:shadow-accent-gold/20 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>

      {/* ── Full System: personal codex page ── */}
      {isSystemTier && (
        <div className="mt-2 space-y-4 rounded-xl border border-accent-violet/30 bg-gradient-to-b from-accent-violet/5 to-surface p-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent-violet/60 mb-1">
              ✦ Full System
            </p>
            <h3 className="font-display text-base font-bold text-accent-violet">Your Codex Page</h3>
            <p className="mt-1 font-mono text-[11px] text-text-muted">
              A public profile page on the Member Roll — your permanent place in the archive.
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="Tell the archive who you are..."
              className="w-full rounded-lg border border-border bg-elevated px-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus:border-accent-violet/50 focus:outline-none focus:ring-1 focus:ring-accent-violet/30 resize-none"
            />
            <p className="font-mono text-[10px] text-text-muted/50 text-right">{bio.length}/500</p>
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <label className="font-mono text-[11px] uppercase tracking-wider text-text-muted">Page URL</label>
            <div className="flex items-center gap-0">
              <span className="rounded-l-lg border border-r-0 border-border bg-elevated px-3 py-2.5 font-mono text-[11px] text-text-muted/60">
                cultcodex.me/members/
              </span>
              <input
                type="text"
                value={codexSlug}
                onChange={(e) => setCodexSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40))}
                placeholder="your-name"
                className="flex-1 rounded-r-lg border border-border bg-elevated px-3 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus:border-accent-violet/50 focus:outline-none focus:ring-1 focus:ring-accent-violet/30"
              />
            </div>
            <p className="font-mono text-[10px] text-text-muted/50">
              Lowercase letters, numbers, hyphens only. Min 3 characters.
            </p>
          </div>

          {/* Page visibility */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-mono text-[11px] font-bold text-text-primary">Public page</h4>
              <p className="font-mono text-[10px] text-text-muted">
                When enabled, your page is visible to anyone with the link.
              </p>
            </div>
            <button
              onClick={() => setCodexPagePublic(!codexPagePublic)}
              className={`relative mt-0.5 h-6 w-11 flex-shrink-0 rounded-full border transition-colors duration-200 ${
                codexPagePublic
                  ? "border-accent-violet bg-accent-violet/80"
                  : "border-border bg-elevated"
              }`}
              aria-label="Toggle public codex page"
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  codexPagePublic ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Preview link */}
          {codexSlug && (
            <p className="font-mono text-[11px] text-accent-violet/70">
              Your page:{" "}
              <a href={`/members/${codexSlug}`} className="underline hover:text-accent-violet">
                /members/{codexSlug}
              </a>
            </p>
          )}

          {/* Codex page save */}
          <div className="flex items-center justify-between pt-1">
            <div>
              {codexError && <p className="font-mono text-[11px] text-red-400">{codexError}</p>}
              {codexSaved && <p className="font-mono text-[11px] text-green-400">✓ Codex page saved</p>}
            </div>
            <button
              onClick={handleCodexSave}
              disabled={codexSaving}
              className="rounded-lg border border-accent-violet bg-accent-violet/15 px-6 py-2.5 font-mono text-sm font-bold text-accent-violet transition-all hover:bg-accent-violet/25 hover:shadow-lg hover:shadow-accent-violet/20 disabled:opacity-50"
            >
              {codexSaving ? "Saving..." : "Save Codex Page"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
