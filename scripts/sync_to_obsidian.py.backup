#!/usr/bin/env python3
"""
CultCodex → Obsidian Vault Sync Script
=======================================
Reads from the configured CultCodex PostgreSQL database and writes
Obsidian-compatible markdown files to the vault.

One-way sync: DB is source of truth, Obsidian is the readable wiki view.
Idempotent — safe to re-run. Only updates files that changed.

Prisma uses camelCase column names with quoted identifiers in Postgres.
This script uses the correct quoted names throughout.

Usage:
  python sync_to_obsidian.py                    # sync everything
  python sync_to_obsidian.py --episodes         # only episodes
  python sync_to_obsidian.py --people           # only people
  python sync_to_obsidian.py --lore             # only lore entries
  python sync_to_obsidian.py --topics           # only topics
  python sync_to_obsidian.py --psychenomicon    # only psychenomicon chapters
  python sync_to_obsidian.py --quotes           # only quotes
  python sync_to_obsidian.py --dry-run          # preview without writing
  python sync_to_obsidian.py --limit 10         # limit per model (testing)

Environment:
  Set DATABASE_URL in .env or pass via --db-url
  Format: postgresql://user:***@host:port/database
"""

import os
import sys
import re
import hashlib
import argparse
from datetime import datetime, timezone
from pathlib import Path

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("ERROR: psycopg2 not found. Install with: pip install psycopg2-binary")
    sys.exit(1)

# -- Configuration ---

VAULT_PATH = Path(r"C:\Users\johnb\obsidianlink\codex")

EPISODES_DIR = VAULT_PATH / "04-Shows" / "Cult-of-Psyche" / "Episodes"
PEOPLE_DIR = VAULT_PATH / "03-People"
CANONICAL_LORE_DIR = VAULT_PATH / "14-Oracle" / "Canonical Lore"
COMMUNITY_LORE_DIR = VAULT_PATH / "14-Oracle" / "Community Lore"
TOPICS_DIR = VAULT_PATH / "11-Knowledge Base"
PSYCHENOMICON_DIR = VAULT_PATH / "14-Oracle" / "Psychenomicon"
SYNC_LOG = VAULT_PATH / "10-Scripts" / "cultcodex-sync-log.md"

ALL_DIRS = [
    EPISODES_DIR, PEOPLE_DIR, CANONICAL_LORE_DIR,
    COMMUNITY_LORE_DIR, TOPICS_DIR, PSYCHENOMICON_DIR,
]

# -- Helpers ---

def slugify(text: str) -> str:
    if not text:
        return "untitled"
    s = text.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'-+', '-', s)
    return s[:80]


def content_hash(text: str) -> str:
    return hashlib.md5(text.encode('utf-8')).hexdigest()[:12]


def clean_text(text):
    if not text:
        return ""
    if not isinstance(text, str):
        text = str(text)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    return text.strip()


def get_db_url(args) -> str:
    if args.db_url:
        return args.db_url
    env_path = Path(r"C:\Users\johnb\cultcodex-v2\.env")
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("DATABASE_URL="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    db_url = os.environ.get("DATABASE_URL")
    if db_url:
        return db_url
    print("ERROR: No DATABASE_URL found. Pass via --db-url or set in .env")
    sys.exit(1)


def connect(db_url: str):
    try:
        conn = psycopg2.connect(db_url)
        conn.set_session(readonly=True, autocommit=True)
        return conn
    except psycopg2.OperationalError as e:
        print(f"ERROR: Cannot connect to database: {e}")
        sys.exit(1)


def ensure_dirs():
    for d in ALL_DIRS:
        d.mkdir(parents=True, exist_ok=True)


def write_if_changed(filepath: Path, content: str, dry_run: bool = False) -> bool:
    new_hash = content_hash(content)
    hash_marker = f"<!-- sync-hash: {new_hash} -->"
    if filepath.exists():
        existing = filepath.read_text(encoding='utf-8')
        match = re.search(r'<!-- sync-hash: ([a-f0-9]+) -->', existing)
        if match and match.group(1) == new_hash:
            return False
    full_content = content + f"\n\n{hash_marker}"
    if dry_run:
        print(f"  [DRY-RUN] Would write: {filepath}")
        return True
    filepath.write_text(full_content, encoding='utf-8')
    return True


def fmt_date(d):
    if hasattr(d, 'strftime'):
        return d.strftime('%B %d, %Y')
    return str(d) if d else ""


def fmt_ts(seconds):
    if not seconds:
        return ""
    mins = seconds // 60
    secs = seconds % 60
    return f"[{mins}:{secs:02d}]"


def esc_yaml(value):
    if value is None:
        return None
    sv = str(value).replace('"', '\\"')
    return sv


# -- Sync: Episodes ---

def sync_episodes(conn, limit, dry_run):
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    query = """
        SELECT e.id, e.title, e.slug, e."episodeNumber", e."airDate",
               e.duration, e."youtubeVideoId",
               e."summaryShort", e."summaryLong",
               e."summaryFacts", e."summaryThemes", e."cutOfPsyche",
               e."contentType", e.status, e."isHumanReviewed",
               e."createdAt", e."updatedAt",
               s.title as series_title, s.slug as series_slug
        FROM "Episode" e
        LEFT JOIN "Series" s ON e."seriesId" = s.id
        WHERE e.status != 'unavailable'
        ORDER BY e."airDate" DESC NULLS LAST, e."episodeNumber" DESC NULLS LAST
    """
    if limit:
        query += f" LIMIT {limit}"
    cur.execute(query)
    rows = cur.fetchall()
    count = 0

    for row in rows:
        slug = row['slug'] or slugify(row['title'])
        filepath = EPISODES_DIR / f"{slug}.md"

        # Guests
        cur2 = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur2.execute("""
            SELECT p."displayName", p.slug
            FROM "EpisodeGuest" eg
            JOIN "Person" p ON eg."personId" = p.id
            WHERE eg."episodeId" = %s
        """, (row['id'],))
        guests = cur2.fetchall()
        guest_links = [f"[[{g['displayName']}]]" for g in guests]

        # Topics
        cur2.execute("""
            SELECT t.title, t.slug
            FROM "EpisodeTopic" et
            JOIN "Topic" t ON et."topicId" = t.id
            WHERE et."episodeId" = %s
        """, (row['id'],))
        topics = cur2.fetchall()
        topic_links = [f"[[{t['title']}]]" for t in topics]

        # Quotes
        cur2.execute("""
            SELECT q.text, q."timestampSeconds", q.context, q.significance,
                   p."displayName" as speaker
            FROM "Quote" q
            LEFT JOIN "Person" p ON q."speakerPersonId" = p.id
            WHERE q."episodeId" = %s
            ORDER BY q."timestampSeconds" ASC NULLS LAST
        """, (row['id'],))
        quotes = cur2.fetchall()

        # Lore
        cur2.execute("""
            SELECT le.title, le.slug, le."canonStatus"
            FROM "EpisodeLore" el
            JOIN "LoreEntry" le ON el."loreEntryId" = le.id
            WHERE el."episodeId" = %s
        """, (row['id'],))
        lore = cur2.fetchall()
        lore_links = [f"[[{l['title']}|{l['title']}]]" for l in lore]

        # Build frontmatter
        fm = {
            'title': row['title'],
            'slug': row['slug'],
            'episode_number': row['episodeNumber'],
            'air_date': str(row['airDate']) if row['airDate'] else None,
            'duration': row['duration'],
            'youtube_video_id': row['youtubeVideoId'],
            'content_type': row['contentType'],
            'status': row['status'],
            'human_reviewed': row['isHumanReviewed'],
            'series': row['series_title'],
            'tags': ['episode', 'cult-of-psyche'],
            'synced_at': datetime.now(timezone.utc).isoformat(),
        }

        lines = []
        lines.append("---")
        for k, v in fm.items():
            if v is None:
                continue
            if isinstance(v, list):
                lines.append(f"{k}: [{', '.join(str(i) for i in v)}]")
            elif isinstance(v, bool):
                lines.append(f"{k}: {str(v).lower()}")
            else:
                lines.append(f'{k}: "{esc_yaml(v)}"')
        lines.append("---")
        lines.append("")
        lines.append(f"# {row['title']}")
        lines.append("")

        if row['episodeNumber']:
            lines.append(f"**Episode {row['episodeNumber']}**")
        if row['airDate']:
            lines.append(f"**Aired:** {fmt_date(row['airDate'])}")
        if row['duration']:
            lines.append(f"**Duration:** {row['duration']}")
        if row['series_title']:
            lines.append(f"**Series:** [[{row['series_title']}]]")
        lines.append("")

        if guest_links:
            lines.append(f"**Guests:** {', '.join(guest_links)}")
        if topic_links:
            lines.append(f"**Topics:** {', '.join(topic_links)}")
        lines.append("")

        if row['youtubeVideoId']:
            lines.append(f"**Watch:** https://www.youtube.com/watch?v={row['youtubeVideoId']}")
            lines.append("")

        if row['summaryShort']:
            lines.append("## Summary")
            lines.append("")
            lines.append(clean_text(row['summaryShort']))
            lines.append("")

        if row['summaryLong']:
            lines.append("## Deep Dive")
            lines.append("")
            lines.append(clean_text(row['summaryLong']))
            lines.append("")

        if row['summaryFacts']:
            lines.append("## What Happened")
            lines.append("")
            lines.append(clean_text(row['summaryFacts']))
            lines.append("")

        if row['summaryThemes']:
            lines.append("## Themes & Patterns")
            lines.append("")
            lines.append(clean_text(row['summaryThemes']))
            lines.append("")

        if row['cutOfPsyche']:
            lines.append("## Cut of Psyche")
            lines.append("")
            lines.append(clean_text(row['cutOfPsyche']))
            lines.append("")

        if quotes:
            lines.append("## Notable Quotes")
            lines.append("")
            for q in quotes:
                ts = fmt_ts(q['timestampSeconds'])
                speaker = q['speaker'] or "Unknown"
                lines.append(f'> {clean_text(q["text"])}')
                lines.append(f'--- **{speaker}**{ts}')
                if q['context']:
                    lines.append(f'  *Context: {clean_text(q["context"])}')
                lines.append("")

        if lore:
            lines.append("## Lore Connections")
            lines.append("")
            for l in lore:
                lines.append(f"- [[{l['title']}]] *(canon: {l['canonStatus'] or 'unknown'})*")
            lines.append("")

        lines.append("---")
        lines.append(f"*Synced from CultCodex DB - Last DB update: {row['updatedAt']}*")

        content = "\n".join(lines)
        if write_if_changed(filepath, content, dry_run):
            count += 1

    cur.close()
    return count


# -- Sync: People ---

def sync_people(conn, limit, dry_run):
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    query = """
        SELECT id, "displayName", slug, "altNames", "shortBio", "loreSummary",
               "avatarUrl", "youtubeChannelUrl", "personType",
               "searchText", "createdAt", "updatedAt"
        FROM "Person"
        ORDER BY "displayName" ASC
    """
    if limit:
        query += f" LIMIT {limit}"
    cur.execute(query)
    rows = cur.fetchall()
    count = 0

    for row in rows:
        slug = row['slug'] or slugify(row['displayName'])
        filepath = PEOPLE_DIR / f"{slug}.md"

        fm = {
            'title': row['displayName'],
            'slug': row['slug'],
            'person_type': row['personType'],
            'youtube_channel': row['youtubeChannelUrl'],
            'tags': ['person', row['personType'] or 'mentioned'],
            'synced_at': datetime.now(timezone.utc).isoformat(),
        }

        # Appearances
        cur2 = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur2.execute("""
            SELECT e.title, e.slug, e."airDate", e."episodeNumber"
            FROM "EpisodeGuest" eg
            JOIN "Episode" e ON eg."episodeId" = e.id
            WHERE eg."personId" = %s
            ORDER BY e."airDate" DESC NULLS LAST
        """, (row['id'],))
        appearances = cur2.fetchall()

        # Mentions
        cur2.execute("""
            SELECT e.title, e.slug, e."airDate"
            FROM "EpisodeMentionedPerson" emp
            JOIN "Episode" e ON emp."episodeId" = e.id
            WHERE emp."personId" = %s
            ORDER BY e."airDate" DESC NULLS LAST
        """, (row['id'],))
        mentions = cur2.fetchall()

        # Topics
        cur2.execute("""
            SELECT t.title, t.slug
            FROM "PersonTopic" pt
            JOIN "Topic" t ON pt."topicId" = t.id
            WHERE pt."personId" = %s
        """, (row['id'],))
        topics = cur2.fetchall()

        # Lore
        cur2.execute("""
            SELECT le.title, le.slug
            FROM "PersonLore" pl
            JOIN "LoreEntry" le ON pl."loreEntryId" = le.id
            WHERE pl."personId" = %s
        """, (row['id'],))
        lore = cur2.fetchall()

        # Quotes
        cur2.execute("""
            SELECT q.text, q."timestampSeconds", e.title as episode_title
            FROM "Quote" q
            LEFT JOIN "Episode" e ON q."episodeId" = e.id
            WHERE q."speakerPersonId" = %s
            ORDER BY q."timestampSeconds" ASC NULLS LAST
            LIMIT 20
        """, (row['id'],))
        quotes = cur2.fetchall()

        # Build markdown
        lines = []
        lines.append("---")
        for k, v in fm.items():
            if v is None:
                continue
            if isinstance(v, list):
                lines.append(f"{k}: [{', '.join(str(i) for i in v)}]")
            else:
                lines.append(f'{k}: "{esc_yaml(v)}"')
        lines.append("---")
        lines.append("")
        lines.append(f"# {row['displayName']}")
        lines.append("")

        if row['altNames']:
            alt = ', '.join(row['altNames']) if isinstance(row['altNames'], list) else str(row['altNames'])
            lines.append(f"**Also known as:** {alt}")
        if row['personType']:
            lines.append(f"**Type:** {row['personType']}")
        if row['youtubeChannelUrl']:
            lines.append(f"**YouTube:** {row['youtubeChannelUrl']}")
        lines.append("")

        if row['shortBio']:
            lines.append("## Bio")
            lines.append("")
            lines.append(clean_text(row['shortBio']))
            lines.append("")

        if row['loreSummary']:
            lines.append("## In the Lore")
            lines.append("")
            lines.append(clean_text(row['loreSummary']))
            lines.append("")

        if topics:
            lines.append("## Topics")
            lines.append("")
            for t in topics:
                lines.append(f"- [[{t['title']}]]")
            lines.append("")

        if appearances:
            lines.append("## Appearances")
            lines.append("")
            for a in appearances:
                ep_str = f"Episode {a['episodeNumber']}" if a['episodeNumber'] else ""
                date_str = fmt_date(a['airDate']) if a['airDate'] else ""
                lines.append(f"- [[{a['title']}]] {ep_str} ({date_str})")
            lines.append("")

        if mentions:
            lines.append("## Mentioned In")
            lines.append("")
            for m in mentions:
                date_str = fmt_date(m['airDate']) if m['airDate'] else ""
                lines.append(f"- [[{m['title']}]] ({date_str})")
            lines.append("")

        if lore:
            lines.append("## Lore Connections")
            lines.append("")
            for l in lore:
                lines.append(f"- [[{l['title']}]]")
            lines.append("")

        if quotes:
            lines.append("## Quotes")
            lines.append("")
            for q in quotes:
                ep = f" -- *[[{q['episode_title']}]]*" if q['episode_title'] else ""
                lines.append(f'> {clean_text(q["text"])}{ep}')
                lines.append("")

        lines.append("---")
        lines.append(f"*Synced from CultCodex DB - Last DB update: {row['updatedAt']}*")

        content = "\n".join(lines)
        if write_if_changed(filepath, content, dry_run):
            count += 1

    cur.close()
    return count


# -- Sync: Lore ---

def sync_lore(conn, limit, dry_run):
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    query = """
        SELECT id, title, slug, category, summary, "fullEntry",
               "canonStatus", "createdAt", "updatedAt"
        FROM "LoreEntry"
        ORDER BY title ASC
    """
    if limit:
        query += f" LIMIT {limit}"
    cur.execute(query)
    rows = cur.fetchall()
    count = 0

    for row in rows:
        slug = row['slug'] or slugify(row['title'])
        canon = row['canonStatus'] or 'speculative'
        target_dir = CANONICAL_LORE_DIR if canon in ('canonical', 'disputed') else COMMUNITY_LORE_DIR
        filepath = target_dir / f"{slug}.md"

        fm = {
            'title': row['title'],
            'slug': row['slug'],
            'category': row['category'],
            'canon_status': canon,
            'tags': ['lore', f'canon-{canon}'],
            'synced_at': datetime.now(timezone.utc).isoformat(),
        }

        # Episodes
        cur2 = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur2.execute("""
            SELECT e.title, e.slug, e."airDate", e."episodeNumber"
            FROM "EpisodeLore" el
            JOIN "Episode" e ON el."episodeId" = e.id
            WHERE el."loreEntryId" = %s
            ORDER BY e."airDate" ASC NULLS LAST
        """, (row['id'],))
        episodes = cur2.fetchall()

        # People
        cur2.execute("""
            SELECT p."displayName", p.slug
            FROM "PersonLore" pl
            JOIN "Person" p ON pl."personId" = p.id
            WHERE pl."loreEntryId" = %s
        """, (row['id'],))
        people = cur2.fetchall()

        # Topics
        cur2.execute("""
            SELECT t.title, t.slug
            FROM "LoreTopic" lt
            JOIN "Topic" t ON lt."topicId" = t.id
            WHERE lt."loreEntryId" = %s
        """, (row['id'],))
        topics = cur2.fetchall()

        # Related lore
        cur2.execute("""
            SELECT le.title, le.slug
            FROM "RelatedLore" rl
            JOIN "LoreEntry" le ON rl."loreBId" = le.id
            WHERE rl."loreAId" = %s
        """, (row['id'],))
        related = cur2.fetchall()

        lines = []
        lines.append("---")
        for k, v in fm.items():
            if v is None:
                continue
            if isinstance(v, list):
                lines.append(f"{k}: [{', '.join(str(i) for i in v)}]")
            else:
                lines.append(f'{k}: "{esc_yaml(v)}"')
        lines.append("---")
        lines.append("")
        lines.append(f"# {row['title']}")
        lines.append("")
        lines.append(f"> **Canon Status:** {canon}")
        if row['category']:
            lines.append(f"> **Category:** {row['category']}")
        lines.append("")

        if row['summary']:
            lines.append("## Summary")
            lines.append("")
            lines.append(clean_text(row['summary']))
            lines.append("")

        if row['fullEntry']:
            lines.append("## Full Entry")
            lines.append("")
            lines.append(clean_text(row['fullEntry']))
            lines.append("")

        if episodes:
            lines.append("## Appears In")
            lines.append("")
            for e in episodes:
                ep_str = f"Ep {e['episodeNumber']}" if e['episodeNumber'] else ""
                lines.append(f"- [[{e['title']}]] {ep_str}")
            lines.append("")

        if people:
            lines.append("## Connected People")
            lines.append("")
            for p in people:
                lines.append(f"- [[{p['displayName']}]]")
            lines.append("")

        if topics:
            lines.append("## Topics")
            lines.append("")
            for t in topics:
                lines.append(f"- [[{t['title']}]]")
            lines.append("")

        if related:
            lines.append("## Related Lore")
            lines.append("")
            for r in related:
                lines.append(f"- [[{r['title']}]]")
            lines.append("")

        lines.append("---")
        lines.append(f"*Synced from CultCodex DB - Last DB update: {row['updatedAt']}*")

        content = "\n".join(lines)
        if write_if_changed(filepath, content, dry_run):
            count += 1

    cur.close()
    return count


# -- Sync: Topics ---

def sync_topics(conn, limit, dry_run):
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    query = """
        SELECT id, title, slug, description, "createdAt", "updatedAt"
        FROM "Topic"
        ORDER BY title ASC
    """
    if limit:
        query += f" LIMIT {limit}"
    cur.execute(query)
    rows = cur.fetchall()
    count = 0

    for row in rows:
        slug = row['slug'] or slugify(row['title'])
        filepath = TOPICS_DIR / f"{slug}.md"

        fm = {
            'title': row['title'],
            'slug': row['slug'],
            'tags': ['topic', 'knowledge-base'],
            'synced_at': datetime.now(timezone.utc).isoformat(),
        }

        cur2 = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur2.execute("""
            SELECT e.title, e.slug, e."episodeNumber", e."airDate"
            FROM "EpisodeTopic" et
            JOIN "Episode" e ON et."episodeId" = e.id
            WHERE et."topicId" = %s
            ORDER BY e."airDate" DESC NULLS LAST
        """, (row['id'],))
        episodes = cur2.fetchall()

        cur2.execute("""
            SELECT p."displayName", p.slug
            FROM "PersonTopic" pt
            JOIN "Person" p ON pt."personId" = p.id
            WHERE pt."topicId" = %s
        """, (row['id'],))
        people = cur2.fetchall()

        cur2.execute("""
            SELECT le.title, le.slug
            FROM "LoreTopic" lt
            JOIN "LoreEntry" le ON lt."loreEntryId" = le.id
            WHERE lt."topicId" = %s
        """, (row['id'],))
        lore = cur2.fetchall()

        lines = []
        lines.append("---")
        for k, v in fm.items():
            if v is None:
                continue
            if isinstance(v, list):
                lines.append(f"{k}: [{', '.join(str(i) for i in v)}]")
            else:
                lines.append(f'{k}: "{esc_yaml(v)}"')
        lines.append("---")
        lines.append("")
        lines.append(f"# {row['title']}")
        lines.append("")

        if row['description']:
            lines.append(clean_text(row['description']))
            lines.append("")

        if episodes:
            lines.append("## Episodes")
            lines.append("")
            for e in episodes:
                ep_str = f"Ep {e['episodeNumber']}" if e['episodeNumber'] else ""
                lines.append(f"- [[{e['title']}]] {ep_str}")
            lines.append("")

        if people:
            lines.append("## People")
            lines.append("")
            for p in people:
                lines.append(f"- [[{p['displayName']}]]")
            lines.append("")

        if lore:
            lines.append("## Lore")
            lines.append("")
            for l in lore:
                lines.append(f"- [[{l['title']}]]")
            lines.append("")

        lines.append("---")
        lines.append(f"*Synced from CultCodex DB - Last DB update: {row['updatedAt']}*")

        content = "\n".join(lines)
        if write_if_changed(filepath, content, dry_run):
            count += 1

    cur.close()
    return count


# -- Sync: Psychenomicon ---

def sync_psychenomicon(conn, limit, dry_run):
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    query = """
        SELECT id, "chapterNumber", title, slug, "episodeId",
               "canonText", "interpretationText", "mythicText",
               "emergingSignals", "archetypesData", "threadRefs",
               "isMajorEvent", status, "createdAt", "updatedAt"
        FROM "PsychenomiconChapter"
        ORDER BY "chapterNumber" ASC
    """
    if limit:
        query += f" LIMIT {limit}"
    cur.execute(query)
    rows = cur.fetchall()
    count = 0

    for row in rows:
        slug = row['slug'] or slugify(row['title'])
        filepath = PSYCHENOMICON_DIR / f"Chapter {row['chapterNumber']:03d} - {slug}.md"

        fm = {
            'title': row['title'],
            'slug': row['slug'],
            'chapter_number': row['chapterNumber'],
            'is_major_event': row['isMajorEvent'],
            'status': row['status'],
            'tags': ['psychenomicon', 'canon'],
            'synced_at': datetime.now(timezone.utc).isoformat(),
        }

        episode_link = None
        if row['episodeId']:
            cur2 = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cur2.execute('SELECT title, slug FROM "Episode" WHERE id = %s', (row['episodeId'],))
            ep = cur2.fetchone()
            if ep:
                episode_link = f"[[{ep['title']}]]"

        cur2 = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur2.execute("""
            SELECT pe.name, pe.slug, pea."archetypeAt", pea.significance
            FROM "PsychenomiconEntityAppearance" pea
            JOIN "PsychenomiconEntity" pe ON pea."entityId" = pe.id
            WHERE pea."chapterId" = %s
        """, (row['id'],))
        entities = cur2.fetchall()

        cur2.execute("""
            SELECT pt.title, pt.slug
            FROM "PsychenomiconThreadChapter" ptc
            JOIN "PsychenomiconThread" pt ON ptc."threadId" = pt.id
            WHERE ptc."chapterId" = %s
        """, (row['id'],))
        threads = cur2.fetchall()

        lines = []
        lines.append("---")
        for k, v in fm.items():
            if v is None:
                continue
            if isinstance(v, list):
                lines.append(f"{k}: [{', '.join(str(i) for i in v)}]")
            elif isinstance(v, bool):
                lines.append(f"{k}: {str(v).lower()}")
            else:
                lines.append(f'{k}: "{esc_yaml(v)}"')
        lines.append("---")
        lines.append("")
        lines.append(f"# Chapter {row['chapterNumber']}: {row['title']}")
        lines.append("")

        if row['isMajorEvent']:
            lines.append("> [!warning] Major Event")
            lines.append("> This chapter marks a major turning point in the narrative.")
            lines.append("")

        if episode_link:
            lines.append(f"**Source Episode:** {episode_link}")
            lines.append("")

        if row['canonText']:
            lines.append("## Canon")
            lines.append("")
            lines.append(clean_text(row['canonText']))
            lines.append("")

        if row['interpretationText']:
            lines.append("## Interpretation")
            lines.append("")
            lines.append(clean_text(row['interpretationText']))
            lines.append("")

        if row['mythicText']:
            lines.append("## Mythic Layer")
            lines.append("")
            lines.append(clean_text(row['mythicText']))
            lines.append("")

        if row['emergingSignals']:
            signals = row['emergingSignals']
            if isinstance(signals, list) and signals:
                lines.append("## Emerging Signals")
                lines.append("")
                for s in signals:
                    lines.append(f"- {s}")
                lines.append("")

        if entities:
            lines.append("## Entities")
            lines.append("")
            for e in entities:
                archetype = f" *({e['archetypeAt']})*" if e['archetypeAt'] else ""
                sig = f" -- {e['significance']}" if e['significance'] else ""
                lines.append(f"- **{e['name']}**{archetype}{sig}")
            lines.append("")

        if threads:
            lines.append("## Threads")
            lines.append("")
            for t in threads:
                lines.append(f"- [[{t['title']}]]")
            lines.append("")

        lines.append("---")
        lines.append(f"*Synced from CultCodex DB - Last DB update: {row['updatedAt']}*")

        content = "\n".join(lines)
        if write_if_changed(filepath, content, dry_run):
            count += 1

    cur.close()
    return count


# -- Sync: Quotes Index ---

def sync_quotes(conn, limit, dry_run):
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    query = """
        SELECT q.id, q.text, q."timestampSeconds", q.context, q.significance,
               p."displayName" as speaker, p.slug as speaker_slug,
               e.title as episode_title, e.slug as episode_slug
        FROM "Quote" q
        LEFT JOIN "Person" p ON q."speakerPersonId" = p.id
        LEFT JOIN "Episode" e ON q."episodeId" = e.id
        ORDER BY q."createdAt" DESC
    """
    if limit:
        query += f" LIMIT {limit}"
    cur.execute(query)
    rows = cur.fetchall()

    lines = [
        "---",
        'title: Quote Index',
        'tags: [quote, index]',
        f'synced_at: {datetime.now(timezone.utc).isoformat()}',
        "---",
        "",
        "# Quote Index",
        "",
        f"_{len(rows)} quotes in the archive._",
        "",
    ]

    for q in rows:
        speaker = q['speaker'] or "Unknown"
        ep = f" -- *[[{q['episode_title']}]]*" if q['episode_title'] else ""
        ts = fmt_ts(q['timestampSeconds'])
        lines.append(f'> {clean_text(q["text"])}')
        lines.append(f'--- **{speaker}**{ts}{ep}')
        if q['significance']:
            lines.append(f'  *Significance: {clean_text(q["significance"])}')
        lines.append("")

    lines.append("---")
    lines.append(f"*Synced from CultCodex DB - {len(rows)} quotes*")

    filepath = VAULT_PATH / "14-Oracle" / "Quote Index.md"
    filepath.parent.mkdir(parents=True, exist_ok=True)
    content = "\n".join(lines)
    count = 1 if write_if_changed(filepath, content, dry_run) else 0
    cur.close()
    return count


# -- Sync Log ---

def write_sync_log(results, dry_run):
    now = datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')
    lines = [
        f"## {now}",
        "",
        "| Model | Written |",
        "|-------|---------|",
    ]
    for model, count in results.items():
        lines.append(f"| {model} | {count} |")
    lines.append("")

    if dry_run:
        lines = [f"~~{l}~~" for l in lines]
        lines.insert(0, "_DRY RUN - no files written_")
        lines.insert(1, "")

    log_path = SYNC_LOG
    log_path.parent.mkdir(parents=True, exist_ok=True)

    if log_path.exists():
        existing = log_path.read_text(encoding='utf-8')
        parts = existing.split("---", 2)
        if len(parts) >= 3:
            new_content = parts[0] + "---" + parts[1] + "---" + "\n\n" + "\n".join(lines) + "\n" + parts[2]
        else:
            new_content = "\n".join(lines) + "\n" + existing
    else:
        new_content = [
            "---",
            "title: CultCodex Sync Log",
            "tags: [sync, log, automation]",
            "---",
            "",
            "# CultCodex to Obsidian Sync Log",
            "",
        ] + lines

    if not dry_run:
        log_path.write_text("\n".join(new_content) if isinstance(new_content, list) else new_content, encoding='utf-8')


# -- Main ---

def main():
    parser = argparse.ArgumentParser(description="Sync CultCodex PostgreSQL database to Obsidian vault")
    parser.add_argument("--db-url", help="PostgreSQL connection string")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing files")
    parser.add_argument("--limit", type=int, help="Limit records per model (for testing)")
    group = parser.add_argument_group("content filters")
    group.add_argument("--episodes", action="store_true")
    group.add_argument("--people", action="store_true")
    group.add_argument("--lore", action="store_true")
    group.add_argument("--topics", action="store_true")
    group.add_argument("--psychenomicon", action="store_true")
    group.add_argument("--quotes", action="store_true")
    args = parser.parse_args()

    sync_all = not any([args.episodes, args.people, args.lore, args.topics, args.psychenomicon, args.quotes])

    print("=" * 60)
    print("CultCodex to Obsidian Sync")
    print("=" * 60)
    print()

    db_url = get_db_url(args)
    display_url = re.sub(r'://[^:]+:[^@]+@', '://***:***@', db_url)
    print(f"Database: {display_url}")
    print(f"Vault:    {VAULT_PATH}")
    print(f"Dry run:  {args.dry_run}")
    print()

    conn = connect(db_url)
    ensure_dirs()

    results = {}

    if sync_all or args.episodes:
        print("[1/6] Syncing episodes...")
        count = sync_episodes(conn, args.limit, args.dry_run)
        results['Episodes'] = count
        print(f"       -> {count} files written/updated")

    if sync_all or args.people:
        print("[2/6] Syncing people...")
        count = sync_people(conn, args.limit, args.dry_run)
        results['People'] = count
        print(f"       -> {count} files written/updated")

    if sync_all or args.lore:
        print("[3/6] Syncing lore entries...")
        count = sync_lore(conn, args.limit, args.dry_run)
        results['Lore'] = count
        print(f"       -> {count} files written/updated")

    if sync_all or args.topics:
        print("[4/6] Syncing topics...")
        count = sync_topics(conn, args.limit, args.dry_run)
        results['Topics'] = count
        print(f"       -> {count} files written/updated")

    if sync_all or args.psychenomicon:
        print("[5/6] Syncing psychenomicon chapters...")
        count = sync_psychenomicon(conn, args.limit, args.dry_run)
        results['Psychenomicon'] = count
        print(f"       -> {count} files written/updated")

    if sync_all or args.quotes:
        print("[6/6] Syncing quotes...")
        count = sync_quotes(conn, args.limit, args.dry_run)
        results['Quotes'] = count
        print(f"       -> {count} files written/updated")

    conn.close()
    write_sync_log(results, args.dry_run)

    print()
    print("=" * 60)
    total = sum(results.values())
    print(f"Done. {total} files written/updated across {len(results)} models.")
    if not args.dry_run:
        print(f"Log: {SYNC_LOG}")
    print("=" * 60)


if __name__ == "__main__":
    main()
