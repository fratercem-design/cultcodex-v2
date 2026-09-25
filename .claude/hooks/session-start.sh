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
# across sessions. Idempotent and non-interactive. `--no-save` keeps it from
# rewriting package-lock.json: the container's npm 10 drops the `libc` fields
# that npm 11 (Dependabot/CI) writes, which left the tree dirty every session.
npm install --no-save
# Use `npm ci` rather than `npm install`: install rewrites package-lock.json
# when the container's npm differs from the one that wrote it (e.g. dropping
# `libc` fields), leaving a dirty tree every session. ci never touches the
# lockfile. --prefer-offline reuses the npm cache to offset the clean install.
npm ci --prefer-offline --no-audit --no-fund
