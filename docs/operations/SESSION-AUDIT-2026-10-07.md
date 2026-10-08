# Claude Code session audit - 2026-10-07

Scanned 47 session transcripts (Sep 16 - Oct 7). Status verified against disk/git where possible.

## Fixed in this pass
- [x] Kling referral on /recommends - branch `fix/kling-recommendation` (committed, not pushed). Dropped the invented "bonus credits" claim.
- [x] Abandoned pagination hardening rescued from `competent-dijkstra` worktree - branch `fix/bounded-query-params` (5 tests pass, tsc clean, not pushed). Its `db.ts` hunk had unresolved conflict markers and is superseded by #329, so it was left out.

## Needs your yes/no (I did not do these)
- [ ] Push both branches + open PRs
- [ ] Remove stale worktree `competent-dijkstra-8b0759` (work now rescued) and tidy `magical-wescoff-8712b0`
- [ ] PR for pushed branch `claude/rumble-backfill-scripts` (1 commit, no PR)
- [ ] Commit or discard untracked `AUDIT-2026-09-30.md`, `.agents/`, `.codex/`, `AGENTS.md` in cultcodex-v2
- [ ] Delete `.env.vercel-production` (likely holds prod secrets; Vercel is gone)
- [ ] Antigravity meditation app: hit spend limit mid-audit; open design question on "flat descent" for 4 doors; `safeVisualRate()` never called
- [ ] Jarvis Mark-LV: venv + `setup.py` awaiting go; Gemini key is yours to paste
- [ ] Jarvis dashboard (code/jarvis): Next.js -> 15.5.25 critical fix, nested `jarvis` folder, `data/` in .gitignore
- [ ] 25 Kling video clips for the live-chat song: need your go + credit estimate (~2,100 credits left)
- [ ] Bing sitemap: if still ~3.3K URLs, submit the 6 sub-sitemaps individually
- [ ] Domain transfer reminder (both domains expire 2027-09-09) - calendar entry never confirmed
- [ ] Staging Stripe sandbox checkout test (you enter the test card)
- [ ] `npm audit` leftovers; Sentry DSN not set in prod
- [ ] Briefcast: Gmail app password + live Stripe key in `.env`; clip 3 podcaster episodes
- [ ] leftover-light book project: not a git repo; chapters 1-11 transcripts missing (backfill)
- [ ] Dify has no model provider; Docker MCP `connect` never run; Presenton never launched

## Security hygiene (yours to do)
- `HF_TOKEN` in plaintext in a OneDrive-synced PowerShell profile
- "amsterdam1" pasted into a chat on 09-28 - rotate if it was a password
- Store-Python app execution aliases still shadow real Python (hook root cause)
