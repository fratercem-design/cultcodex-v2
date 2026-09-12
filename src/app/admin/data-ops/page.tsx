"use client";

import { useState } from "react";

interface Person {
  id: string;
  displayName: string;
  slug: string;
  shortBio?: string | null;
  personType?: string;
  _count?: { guestAppearances: number; quotes: number };
}

interface DupeGroup {
  group: Person[];
}

export default function DataOpsPage() {
  const secret = typeof window !== "undefined"
    ? (document.cookie.match(/enrich_secret=([^;]+)/)?.[1] ?? "")
    : "";

  const [enrichSecret, setEnrichSecret] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [ambiguous, setAmbiguous] = useState<Person[]>([]);
  const [dupes, setDupes] = useState<Person[][]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [renameSlug, setRenameSlug] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [renameResult, setRenameResult] = useState<string | null>(null);

  async function call(op: string, extra: Record<string, unknown> = {}) {
    const res = await fetch("/api/admin/data-ops", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Enrich-Secret": enrichSecret },
      body: JSON.stringify({ op, ...extra }),
    });
    return res.json();
  }

  async function doSearch() {
    if (!searchName.trim()) return;
    setLoading("search");
    const data = await call("find-name", { name: searchName.trim() });
    setSearchResults(data.people ?? []);
    setLoading(null);
  }

  async function doAmbiguous() {
    setLoading("ambiguous");
    const data = await call("find-ambiguous");
    setAmbiguous(data.people ?? []);
    setLoading(null);
  }

  async function doDupes() {
    setLoading("dupes");
    const data = await call("list-dupes");
    setDupes(data.dupes ?? []);
    setLoading(null);
  }

  async function doRename() {
    if (!renameSlug.trim() || !renameTo.trim()) return;
    setLoading("rename");
    const data = await call("rename-person", { slug: renameSlug.trim(), newName: renameTo.trim() });
    setRenameResult(data.ok ? `✓ Renamed "${data.oldName}" → "${data.newName}"` : `✗ ${data.error}`);
    setLoading(null);
    setRenameSlug("");
    setRenameTo("");
  }

  return (
    <main className="p-8 max-w-5xl space-y-10">
      <div>
        <h1 className="font-display text-2xl font-bold text-accent-gold">Data Ops</h1>
        <p className="font-mono text-xs text-text-muted mt-1">Name cleanup, deduplication, rename.</p>
      </div>

      {/* Secret */}
      <div className="rounded border border-border bg-surface p-4 space-y-2">
        <label className="font-mono text-[10px] uppercase tracking-widest text-text-muted">Enrich Secret</label>
        <input
          type="password"
          value={enrichSecret}
          onChange={(e) => setEnrichSecret(e.target.value)}
          placeholder="ENRICH_SECRET value from Vercel"
          className="w-full rounded border border-border bg-void px-3 py-2 font-mono text-xs text-text-primary focus:outline-none focus:border-accent-gold/50"
        />
      </div>

      {/* Search */}
      <section className="space-y-3">
        <h2 className="font-display text-sm font-bold text-accent-violet-text">{"/// Search by Name"}</h2>
        <div className="flex gap-2">
          <input
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder='e.g. "joni"'
            className="flex-1 rounded border border-border bg-void px-3 py-2 font-mono text-xs text-text-primary focus:outline-none focus:border-accent-violet/50"
          />
          <button onClick={doSearch} disabled={loading === "search"} className="rounded border border-accent-violet/50 bg-accent-violet/10 px-4 py-2 font-mono text-xs text-accent-violet-text disabled:opacity-50">
            {loading === "search" ? "…" : "Search →"}
          </button>
        </div>
        {searchResults.length > 0 && (
          <PersonTable people={searchResults} onSelect={(p) => setRenameSlug(p.slug)} />
        )}
        {searchResults.length === 0 && loading !== "search" && searchName && (
          <p className="font-mono text-xs text-text-muted">No results.</p>
        )}
      </section>

      {/* Rename */}
      <section className="space-y-3">
        <h2 className="font-display text-sm font-bold text-accent-cyan">{"/// Rename Person"}</h2>
        <div className="flex gap-2">
          <input
            value={renameSlug}
            onChange={(e) => setRenameSlug(e.target.value)}
            placeholder="person slug"
            className="flex-1 rounded border border-border bg-void px-3 py-2 font-mono text-xs text-text-primary focus:outline-none focus:border-accent-cyan/50"
          />
          <span className="font-mono text-xs text-text-muted self-center">→</span>
          <input
            value={renameTo}
            onChange={(e) => setRenameTo(e.target.value)}
            placeholder="new display name"
            className="flex-1 rounded border border-border bg-void px-3 py-2 font-mono text-xs text-text-primary focus:outline-none focus:border-accent-cyan/50"
          />
          <button onClick={doRename} disabled={loading === "rename" || !renameSlug || !renameTo} className="rounded border border-accent-cyan/50 bg-accent-cyan/10 px-4 py-2 font-mono text-xs text-accent-cyan disabled:opacity-50">
            {loading === "rename" ? "…" : "Rename →"}
          </button>
        </div>
        {renameResult && <p className="font-mono text-xs text-text-muted">{renameResult}</p>}
      </section>

      {/* Ambiguous */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-accent-gold-text">{"/// Ambiguous Names (single token, ≤12 chars)"}</h2>
          <button onClick={doAmbiguous} disabled={loading === "ambiguous"} className="rounded border border-accent-gold/50 bg-accent-gold/10 px-4 py-2 font-mono text-xs text-accent-gold-text disabled:opacity-50">
            {loading === "ambiguous" ? "…" : `Find →`}
          </button>
        </div>
        {ambiguous.length > 0 && (
          <PersonTable people={ambiguous} onSelect={(p) => setRenameSlug(p.slug)} />
        )}
      </section>

      {/* Dupes */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-bold text-accent-crimson-text">{"/// Duplicate Names"}</h2>
          <button onClick={doDupes} disabled={loading === "dupes"} className="rounded border border-accent-crimson/50 bg-accent-crimson/10 px-4 py-2 font-mono text-xs text-accent-crimson-text disabled:opacity-50">
            {loading === "dupes" ? "…" : `Find →`}
          </button>
        </div>
        {dupes.length > 0 && dupes.map((group, i) => (
          <div key={i} className="rounded border border-accent-crimson/20 bg-surface p-3 space-y-1">
            <p className="font-mono text-[9px] uppercase tracking-widest text-accent-crimson-text/80">Dupe group {i + 1}</p>
            <PersonTable people={group} onSelect={(p) => setRenameSlug(p.slug)} />
          </div>
        ))}
      </section>
    </main>
  );
}

function PersonTable({ people, onSelect }: { people: Person[]; onSelect: (p: Person) => void }) {
  return (
    <div className="rounded border border-border overflow-auto">
      <table className="w-full font-mono text-xs">
        <thead>
          <tr className="border-b border-border bg-elevated">
            <th className="text-left px-3 py-2 text-text-muted font-normal">Name</th>
            <th className="text-left px-3 py-2 text-text-muted font-normal">Slug</th>
            <th className="text-right px-3 py-2 text-text-muted font-normal">Apps</th>
            <th className="text-right px-3 py-2 text-text-muted font-normal">Quotes</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id} className="border-b border-border/50 hover:bg-surface transition-colors">
              <td className="px-3 py-2 text-text-primary">{p.displayName}</td>
              <td className="px-3 py-2 text-text-muted">{p.slug}</td>
              <td className="px-3 py-2 text-right text-text-muted">{p._count?.guestAppearances ?? "—"}</td>
              <td className="px-3 py-2 text-right text-text-muted">{p._count?.quotes ?? "—"}</td>
              <td className="px-3 py-2 text-right">
                <button
                  onClick={() => onSelect(p)}
                  className="text-accent-violet-text hover:text-accent-cyan transition-colors"
                  title="Use this slug for rename"
                >
                  rename →
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
