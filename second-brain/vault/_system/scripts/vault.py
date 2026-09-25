#!/usr/bin/env python3
"""vault.py - read-only graph + text queries over an Obsidian vault.

Gives Claude Code the same link-graph view Obsidian has (backlinks, orphans,
dead ends, unresolved links, tags, neighborhoods) without needing the
Obsidian app to be running. Standard library only.

By default the agent's own output folders (_agent/, _system/) are excluded so
every pattern it finds comes from notes YOU wrote. Pass --include-agent to
override.

Usage:  python3 _system/scripts/vault.py <command> [args]   (run from vault root)
        python3 _system/scripts/vault.py --help
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import re
import sys
from collections import Counter, defaultdict, deque
from pathlib import Path

EXCLUDED_DIRS = {".obsidian", ".trash", ".git", ".claude", "node_modules"}
AGENT_DIRS = {"_agent", "_system"}
EXCLUDED_FILES = {"CLAUDE.md", "AGENTS.md"}  # instructions for the agent, not your thinking
DAILY_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})$")
DATE_IN_NAME_RE = re.compile(r"(\d{4}-\d{2}-\d{2})")
WIKILINK_RE = re.compile(r"!?\[\[([^\]\|#\^]+)(?:[#\^][^\]\|]*)?(?:\|[^\]]*)?\]\]")
MDLINK_RE = re.compile(r"\[[^\]]*\]\(([^)\s]+\.md)\)")
TAG_RE = re.compile(r"(?:(?<=\s)|^)#([A-Za-z][\w/\-]*)")
CODE_FENCE_RE = re.compile(r"```.*?```", re.S)
INLINE_CODE_RE = re.compile(r"`[^`]*`")
FRONTMATTER_RE = re.compile(r"\A---\n(.*?)\n---\n?", re.S)
CONFIDENCE_RE = re.compile(r"confidence\s*[:=]{1,2}\s*([A-Za-z0-9.%/]+)", re.I)
IDEA_LINE_RE = re.compile(r"(#idea\b|^\s*[-*]?\s*(idea|what if|hypothesis|theory)\s*[:\-])", re.I)


class Note:
    __slots__ = ("path", "rel", "name", "text", "body", "frontmatter", "links",
                 "tags", "date", "is_daily")

    def __init__(self, path: Path, root: Path):
        self.path = path
        self.rel = path.relative_to(root).as_posix()
        self.name = path.stem
        try:
            self.text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            self.text = ""
        fm_match = FRONTMATTER_RE.match(self.text)
        self.frontmatter = fm_match.group(1) if fm_match else ""
        self.body = self.text[fm_match.end():] if fm_match else self.text
        self.links: list[str] = []
        self.tags: set[str] = set()
        self.is_daily = bool(DAILY_RE.match(self.name))
        self.date = self._date()
        self._parse()

    def _date(self) -> dt.date:
        m = DATE_IN_NAME_RE.search(self.name)
        if m:
            try:
                return dt.date.fromisoformat(m.group(1))
            except ValueError:
                pass
        fm = re.search(r"^(?:date|created)\s*:\s*[\"']?(\d{4}-\d{2}-\d{2})", self.frontmatter, re.M)
        if fm:
            try:
                return dt.date.fromisoformat(fm.group(1))
            except ValueError:
                pass
        return dt.date.fromtimestamp(self.path.stat().st_mtime)

    def _parse(self) -> None:
        clean = INLINE_CODE_RE.sub("", CODE_FENCE_RE.sub("", self.body))
        for m in WIKILINK_RE.finditer(clean):
            if m.group(1).strip():
                self.links.append(m.group(1).strip())
        for m in MDLINK_RE.finditer(clean):
            self.links.append(Path(m.group(1)).stem)
        for m in TAG_RE.finditer(clean):
            self.tags.add(m.group(1).lower())
        # frontmatter tags: "tags: [a, b]" or a YAML list
        fm_tags = re.search(r"^tags\s*:\s*(.*?)(?=^\w|\Z)", self.frontmatter, re.M | re.S)
        if fm_tags:
            for t in re.findall(r"[A-Za-z][\w/\-]*", fm_tags.group(1)):
                self.tags.add(t.lower())


class Vault:
    def __init__(self, root: Path, include_agent: bool = False):
        self.root = root
        skip = EXCLUDED_DIRS | (set() if include_agent else AGENT_DIRS)
        self.notes: list[Note] = []
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = [d for d in dirnames if d not in skip and not d.startswith(".")]
            for f in filenames:
                if f.endswith(".md") and not (include_agent is False and f in EXCLUDED_FILES):
                    self.notes.append(Note(Path(dirpath) / f, root))
        self.by_name: dict[str, Note] = {}
        self.by_rel: dict[str, Note] = {}
        for n in self.notes:
            self.by_name.setdefault(n.name.lower(), n)
            self.by_rel[n.rel.lower()] = n
            self.by_rel[n.rel[:-3].lower()] = n
        self.out: dict[str, set[str]] = defaultdict(set)   # rel -> rels
        self.inc: dict[str, set[str]] = defaultdict(set)
        self.unresolved: dict[str, set[str]] = defaultdict(set)  # target -> source rels
        for n in self.notes:
            for target in n.links:
                hit = self.resolve_link(target)
                if hit is None:
                    self.unresolved[target].add(n.rel)
                elif hit.rel != n.rel:
                    self.out[n.rel].add(hit.rel)
                    self.inc[hit.rel].add(n.rel)

    def resolve_link(self, target: str) -> Note | None:
        t = target.strip().lower()
        if t.endswith(".md"):
            t = t[:-3]
        return self.by_rel.get(t) or self.by_name.get(t.split("/")[-1])

    def find(self, query: str) -> Note:
        """Resolve a user-supplied note name: exact, then case-insensitive substring."""
        hit = self.resolve_link(query)
        if hit:
            return hit
        q = query.lower()
        matches = [n for n in self.notes if q in n.name.lower()]
        if not matches:
            sys.exit(f"No note matching '{query}'. Try: vault.py search \"{query}\"")
        matches.sort(key=lambda n: (len(n.name), n.name))
        if len(matches) > 1:
            print(f"(matched '{matches[0].rel}'; others: {', '.join(m.name for m in matches[1:6])})",
                  file=sys.stderr)
        return matches[0]

    def neighbors(self, rel: str) -> set[str]:
        return self.out[rel] | self.inc[rel]

    def neighborhood(self, rel: str, depth: int) -> dict[str, int]:
        seen = {rel: 0}
        q = deque([rel])
        while q:
            cur = q.popleft()
            if seen[cur] >= depth:
                continue
            for nb in self.neighbors(cur):
                if nb not in seen:
                    seen[nb] = seen[cur] + 1
                    q.append(nb)
        return seen

    def shortest_path(self, a: str, b: str) -> list[str] | None:
        prev = {a: None}
        q = deque([a])
        while q:
            cur = q.popleft()
            if cur == b:
                path = []
                while cur is not None:
                    path.append(cur)
                    cur = prev[cur]
                return path[::-1]
            for nb in sorted(self.neighbors(cur)):
                if nb not in prev:
                    prev[nb] = cur
                    q.append(nb)
        return None


def snippet(text: str, pattern: re.Pattern, width: int = 110) -> list[str]:
    out = []
    for line in text.splitlines():
        if pattern.search(line):
            line = line.strip()
            m = pattern.search(line)
            start = max(0, m.start() - width // 2)
            out.append(("…" if start else "") + line[start:start + width] + ("…" if len(line) > start + width else ""))
    return out


def since(days: int) -> dt.date:
    return dt.date.today() - dt.timedelta(days=days)


# ---------------------------------------------------------------- commands

def cmd_stats(v: Vault, a) -> None:
    daily = [n for n in v.notes if n.is_daily]
    links = sum(len(s) for s in v.out.values())
    print(f"vault: {v.root}")
    print(f"notes: {len(v.notes)}  (daily: {len(daily)})")
    print(f"resolved links: {links}   unresolved targets: {len(v.unresolved)}")
    print(f"orphans (no links in or out): {sum(1 for n in v.notes if not v.neighbors(n.rel))}")
    if daily:
        ds = sorted(n.date for n in daily)
        print(f"daily notes span: {ds[0]} → {ds[-1]}")
    folders = Counter(n.rel.split("/")[0] if "/" in n.rel else "(root)" for n in v.notes)
    print("folders: " + ", ".join(f"{k} {c}" for k, c in folders.most_common()))


def cmd_backlinks(v: Vault, a) -> None:
    n = v.find(a.note)
    print(f"# backlinks → {n.rel}")
    pat = re.compile(r"\[\[" + re.escape(n.name) + r"([#\^|][^\]]*)?\]\]", re.I)
    for rel in sorted(v.inc[n.rel], key=lambda r: v.by_rel[r.lower()].date):
        src = v.by_rel[rel.lower()]
        print(f"- {rel} ({src.date})")
        for s in snippet(src.body, pat)[:3]:
            print(f"    {s}")


def cmd_links(v: Vault, a) -> None:
    n = v.find(a.note)
    print(f"# outgoing links from {n.rel}")
    for rel in sorted(v.out[n.rel]):
        print(f"- {rel}")
    missing = [t for t, srcs in v.unresolved.items() if n.rel in srcs]
    for t in sorted(missing):
        print(f"- [[{t}]] (unresolved)")


def cmd_orphans(v: Vault, a) -> None:
    print("# orphans — no incoming links" + (" and no outgoing links" if a.strict else ""))
    rows = [n for n in v.notes if not v.inc[n.rel] and not n.is_daily and (not a.strict or not v.out[n.rel])]
    for n in sorted(rows, key=lambda n: n.date, reverse=True):
        print(f"- {n.rel} ({n.date}, {len(n.body.split())} words)")


def cmd_deadends(v: Vault, a) -> None:
    print("# dead ends — notes with no outgoing links")
    rows = [n for n in v.notes if not v.out[n.rel] and not n.is_daily]
    for n in sorted(rows, key=lambda n: n.date, reverse=True):
        print(f"- {n.rel} ({n.date}, {len(v.inc[n.rel])} backlinks)")


def cmd_unresolved(v: Vault, a) -> None:
    print("# unresolved links — mentioned but never written (latent interests)")
    for t, srcs in sorted(v.unresolved.items(), key=lambda kv: -len(kv[1])):
        print(f"- [[{t}]] ×{len(srcs)}  from: {', '.join(sorted(srcs)[:4])}{' …' if len(srcs) > 4 else ''}")


def cmd_hubs(v: Vault, a) -> None:
    print("# hubs — most connected notes")
    rows = sorted(v.notes, key=lambda n: -len(v.neighbors(n.rel)))[: a.limit]
    for n in rows:
        print(f"- {n.rel}  in:{len(v.inc[n.rel])} out:{len(v.out[n.rel])}")


def cmd_tags(v: Vault, a) -> None:
    if a.name:
        name = a.name.lstrip("#").lower()
        print(f"# notes tagged #{name}")
        for n in sorted(v.notes, key=lambda n: n.date):
            if any(t == name or t.startswith(name + "/") for t in n.tags):
                print(f"- {n.rel} ({n.date})")
        return
    counts = Counter(t for n in v.notes for t in n.tags)
    print("# tag counts")
    for t, c in counts.most_common():
        print(f"- #{t} {c}")


def cmd_daily(v: Vault, a) -> None:
    cutoff = since(a.days)
    notes = sorted((n for n in v.notes if n.is_daily and n.date >= cutoff), key=lambda n: n.date)
    if not notes:
        print(f"(no daily notes in the last {a.days} days)")
    for n in notes:
        if a.titles:
            print(f"- {n.rel} ({len(n.body.split())} words)")
        else:
            print(f"\n===== {n.rel} =====\n{n.body.strip()}")


def cmd_recent(v: Vault, a) -> None:
    cutoff = dt.datetime.now().timestamp() - a.days * 86400
    rows = [n for n in v.notes if n.path.stat().st_mtime >= cutoff or n.date >= since(a.days)]
    print(f"# notes created/edited in the last {a.days} days")
    for n in sorted(rows, key=lambda n: n.path.stat().st_mtime, reverse=True):
        print(f"- {n.rel} (dated {n.date}, {len(n.body.split())} words, links {len(v.neighbors(n.rel))})")


def cmd_search(v: Vault, a) -> None:
    pat = re.compile("|".join(a.terms) if a.regex else "|".join(re.escape(t) for t in a.terms), re.I)
    hits = [(n, snippet(n.body, pat)) for n in v.notes]
    hits = [(n, s) for n, s in hits if s or pat.search(n.name)]
    hits.sort(key=lambda h: h[0].date)
    print(f"# {len(hits)} notes matching {a.terms} (chronological)")
    for n, s in hits[: a.limit]:
        print(f"\n- {n.rel} ({n.date})")
        for line in s[:4]:
            print(f"    {line}")


def cmd_timeline(v: Vault, a) -> None:
    """Month-by-month mention counts — the skeleton for /trace."""
    pat = re.compile("|".join(re.escape(t) for t in a.terms), re.I)
    months: dict[str, list[tuple[Note, int]]] = defaultdict(list)
    for n in v.notes:
        c = len(pat.findall(n.body)) + (1 if pat.search(n.name) else 0)
        if c:
            months[n.date.strftime("%Y-%m")].append((n, c))
    if not months:
        print("(no mentions)")
        return
    print(f"# timeline for {a.terms}")
    for m in sorted(months):
        rows = months[m]
        total = sum(c for _, c in rows)
        print(f"{m}  {'█' * min(total, 40)} {total}  — " + ", ".join(n.name for n, _ in rows[:6])
              + (" …" if len(rows) > 6 else ""))
    first = min((n for rows in months.values() for n, _ in rows), key=lambda n: n.date)
    print(f"\nfirst appearance: {first.rel} ({first.date})")


def cmd_neighborhood(v: Vault, a) -> None:
    n = v.find(a.note)
    hood = v.neighborhood(n.rel, a.depth)
    print(f"# neighborhood of {n.rel} (depth {a.depth}, {len(hood) - 1} notes)")
    for rel, d in sorted(hood.items(), key=lambda kv: (kv[1], kv[0])):
        if d:
            print(f"{'  ' * (d - 1)}- [{d}] {rel}")


def cmd_bridge(v: Vault, a) -> None:
    def hood_for(term: str) -> tuple[set[str], str]:
        hit = v.resolve_link(term)
        if hit:
            return set(v.neighborhood(hit.rel, a.depth)), hit.rel
        pat = re.compile(re.escape(term), re.I)
        seeds = {n.rel for n in v.notes if pat.search(n.body) or pat.search(n.name) or term.lower() in n.tags}
        out = set(seeds)
        for s in seeds:
            out |= set(v.neighborhood(s, max(a.depth - 1, 0)))
        return out, f"{len(seeds)} notes mentioning '{term}'"

    ha, la = hood_for(a.a)
    hb, lb = hood_for(a.b)
    print(f"# bridge: {a.a} ({la}) ⇄ {a.b} ({lb})")
    print(f"\n## {a.a} neighborhood ({len(ha)})\n" + "\n".join(f"- {r}" for r in sorted(ha)[:40]))
    print(f"\n## {a.b} neighborhood ({len(hb)})\n" + "\n".join(f"- {r}" for r in sorted(hb)[:40]))
    shared = ha & hb
    print(f"\n## shared notes — natural bridges ({len(shared)})")
    for r in sorted(shared):
        print(f"- {r}")
    if shared:
        return
    best = None
    for x in ha:
        for y in hb:
            p = v.shortest_path(x, y) if x != y else [x]
            if p and (best is None or len(p) < len(best)):
                best = p
        if best and len(best) <= 2:
            break
    if best:
        print("\n## shortest link path\n" + " → ".join(best))


def cmd_confidence(v: Vault, a) -> None:
    print("# confidence markers (hypotheses and beliefs you've rated)")
    for n in sorted(v.notes, key=lambda n: n.date):
        found = CONFIDENCE_RE.findall(n.frontmatter) + CONFIDENCE_RE.findall(n.body)
        if found:
            age = (dt.date.today() - dt.date.fromtimestamp(n.path.stat().st_mtime)).days
            print(f"- {n.rel}: {', '.join(found)}  (last edited {age}d ago)")


def cmd_ideas(v: Vault, a) -> None:
    """Idea-shaped lines in recent daily notes, with whether they already link somewhere."""
    cutoff = since(a.days)
    print(f"# idea candidates from daily notes, last {a.days} days")
    for n in sorted((n for n in v.notes if n.is_daily and n.date >= cutoff), key=lambda n: n.date):
        for line in n.body.splitlines():
            if IDEA_LINE_RE.search(line):
                linked = "linked" if WIKILINK_RE.search(line) else "unlinked"
                print(f"- {n.date} [{linked}] {line.strip()[:200]}")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--vault", default=os.environ.get("VAULT_PATH", "."), help="vault root (default: cwd or $VAULT_PATH)")
    p.add_argument("--include-agent", action="store_true", help="also read _agent/ and _system/")
    sub = p.add_subparsers(dest="cmd", required=True)

    sub.add_parser("stats", help="vault overview")
    for name in ("backlinks", "links"):
        sp = sub.add_parser(name, help=f"{name} for a note")
        sp.add_argument("note")
    sp = sub.add_parser("orphans", help="notes nothing links to")
    sp.add_argument("--strict", action="store_true", help="also require no outgoing links")
    sub.add_parser("deadends", help="notes with no outgoing links")
    sub.add_parser("unresolved", help="links to notes that don't exist yet")
    sp = sub.add_parser("hubs", help="most connected notes")
    sp.add_argument("--limit", type=int, default=20)
    sp = sub.add_parser("tags", help="tag counts, or notes for one tag")
    sp.add_argument("name", nargs="?")
    sp = sub.add_parser("daily", help="print recent daily notes")
    sp.add_argument("--days", type=int, default=7)
    sp.add_argument("--titles", action="store_true", help="names only")
    sp = sub.add_parser("recent", help="recently created/edited notes")
    sp.add_argument("--days", type=int, default=7)
    sp = sub.add_parser("search", help="full-text search, chronological")
    sp.add_argument("terms", nargs="+")
    sp.add_argument("--regex", action="store_true")
    sp.add_argument("--limit", type=int, default=60)
    sp = sub.add_parser("timeline", help="month-by-month mentions of terms")
    sp.add_argument("terms", nargs="+")
    sp = sub.add_parser("neighborhood", help="notes within N link-hops")
    sp.add_argument("note")
    sp.add_argument("--depth", type=int, default=2)
    sp = sub.add_parser("bridge", help="connect two notes or topics through the graph")
    sp.add_argument("a")
    sp.add_argument("b")
    sp.add_argument("--depth", type=int, default=2)
    sub.add_parser("confidence", help="notes carrying confidence markers")
    sp = sub.add_parser("ideas", help="idea-shaped lines in recent daily notes")
    sp.add_argument("--days", type=int, default=14)

    a = p.parse_args()
    root = Path(a.vault).expanduser().resolve()
    if not root.is_dir():
        sys.exit(f"vault not found: {root}")
    v = Vault(root, include_agent=a.include_agent)
    globals()["cmd_" + a.cmd](v, a)


if __name__ == "__main__":
    main()
