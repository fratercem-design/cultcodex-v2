#!/usr/bin/env python3
"""PreToolUse hook: block Claude from writing vault notes outside _agent/.

Keeps the vault a record of what you wrote. Set VAULT_ALLOW_WRITES=1 in the
environment to lift the guard for one session.
"""
import json
import os
import sys
from pathlib import Path

if os.environ.get("VAULT_ALLOW_WRITES") == "1":
    sys.exit(0)

event = json.load(sys.stdin)
tool_input = event.get("tool_input") or {}
target = tool_input.get("file_path") or tool_input.get("notebook_path")
if not target:
    sys.exit(0)

vault = Path(os.environ.get("CLAUDE_PROJECT_DIR") or event.get("cwd") or ".").resolve()
path = Path(target)
path = (path if path.is_absolute() else vault / path).resolve()

try:
    rel = path.relative_to(vault)
except ValueError:
    sys.exit(0)  # outside the vault: not this hook's business

if rel.parts and rel.parts[0] == "_agent":
    sys.exit(0)

print(
    f"Blocked: {rel} is one of the user's notes. In this vault Claude writes only to _agent/. "
    "Put the output or draft in _agent/ (drafts in _agent/drafts/) and tell the user where to move it.",
    file=sys.stderr,
)
sys.exit(2)
