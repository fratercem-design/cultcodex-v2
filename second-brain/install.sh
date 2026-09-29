#!/usr/bin/env bash
# Install the second-brain kit.
#
#   ./install.sh                     # new vault at ~/SecondBrain
#   ./install.sh ~/Notes/MyVault     # new vault at a custom path
#   ./install.sh --into ~/Vault      # add commands/scripts to an EXISTING vault (never touches your notes)
#   ./install.sh --global ~/Vault    # also make the commands available in every Claude Code session
set -euo pipefail

KIT="$(cd "$(dirname "$0")" && pwd)/vault"
MODE="new"
GLOBAL=0
TARGET=""

while [ $# -gt 0 ]; do
  case "$1" in
    --into) MODE="into"; shift; TARGET="${1:-}";;
    --global) GLOBAL=1;;
    -h|--help) sed -n '2,8p' "$0"; exit 0;;
    *) TARGET="$1";;
  esac
  shift || true
done
TARGET="${TARGET:-$HOME/SecondBrain}"
TARGET="${TARGET/#\~/$HOME}"

command -v python3 >/dev/null || { echo "python3 is required (macOS: xcode-select --install)"; exit 1; }

copy_if_absent() {  # src dest: copy without overwriting anything that already exists
  mkdir -p "$(dirname "$2")"
  if [ -e "$2" ]; then echo "  skip (exists): ${2#$TARGET/}"; else cp -R "$1" "$2"; echo "  added: ${2#$TARGET/}"; fi
}

if [ "$MODE" = "new" ]; then
  if [ -d "$TARGET" ] && [ -n "$(ls -A "$TARGET" 2>/dev/null)" ]; then
    echo "$TARGET already exists and isn't empty. Use:  ./install.sh --into \"$TARGET\""; exit 1
  fi
  mkdir -p "$TARGET"
  cp -R "$KIT"/. "$TARGET"/
  find "$TARGET" -name .gitkeep -delete
  echo "Created vault at $TARGET"
else
  [ -d "$TARGET" ] || { echo "No vault at $TARGET"; exit 1; }
  echo "Adding kit to existing vault $TARGET (your notes are not touched):"
  for f in .claude/commands .claude/hooks .claude/settings.json _system/scripts _system/templates _agent CLAUDE.md; do
    if [ -d "$KIT/$f" ]; then
      for g in "$KIT/$f"/*; do copy_if_absent "$g" "$TARGET/$f/$(basename "$g")"; done
    else
      copy_if_absent "$KIT/$f" "$TARGET/$f"
    fi
  done
  mkdir -p "$TARGET/_agent/drafts" "$TARGET/Context"
  for g in "$KIT/Context"/*.md; do copy_if_absent "$g" "$TARGET/Context/$(basename "$g")"; done
  echo "Note: .obsidian settings were left alone. See README 'Obsidian settings' to set the daily-note folder and templates."
fi

chmod +x "$TARGET/_system/scripts/vault.py" "$TARGET/.claude/hooks/guard_writes.py" 2>/dev/null || true

if [ "$GLOBAL" = 1 ]; then
  mkdir -p "$HOME/.claude/commands/vault"
  for g in "$TARGET"/.claude/commands/*.md; do
    name="$(basename "$g")"
    # Global copies cd into the vault first, so they work from any directory as /vault:<name>
    { sed -n '1,/^---$/{p}' "$g" | sed '1d' | sed '$d' | sed '1i ---' ; echo "---"; echo; \
      echo "First, work from the vault: run every vault.py command as \`python3 \"$TARGET/_system/scripts/vault.py\" --vault \"$TARGET\" …\` and read files under \`$TARGET\`. Write output only to \`$TARGET/_agent/\`."; echo; \
      awk 'BEGIN{n=0} /^---$/{n++; next} n>=2' "$g"; } > "$HOME/.claude/commands/vault/$name"
  done
  echo "Installed global commands as /vault:<name> in ~/.claude/commands/vault/"
fi

cat <<MSG

Next steps
  1. Open Obsidian → "Open folder as vault" → $TARGET
  2. Fill in Context/About Me.md, How I Work.md, Current State.md (15 minutes, the biggest win)
  3. cd "$TARGET" && claude
  4. Type /context
MSG
