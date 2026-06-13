#!/bin/bash
set -euo pipefail

# SessionStart hook for Claude Code on the web.
# Installs JS dependencies so tests, linters, and the dev server work in
# remote sessions. `postinstall` runs `prisma generate`, so the Prisma client
# (generated to src/generated/prisma) is ready once this completes.

# Only run in remote (Claude Code on the web) environments.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Resolve repo root: prefer the value Claude Code provides, fall back to the
# script's location so the hook is also runnable directly for validation.
cd "${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

# Prefer `npm install` over `npm ci` so the cached container state is reused
# across sessions. Idempotent and non-interactive.
npm install
