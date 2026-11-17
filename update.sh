#!/usr/bin/env bash
# Brings this laptop to the latest company setup. Safe to re-run any time:
# pulls this repo, every marketplace, every plugin and every reference repo.
#   bash update.sh          update, then check
#   bash update.sh --check  only check that this machine matches the repo (plugins, reference repos, skills, agents, handbook)
# First-time setup is install-windows.bat / install-mac.command, which call this.
set -uo pipefail
KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
MODE="${1:-update}"

for tool in git node claude; do
  command -v "$tool" >/dev/null || { echo "Missing: $tool. Install it, then re-run." >&2; exit 1; }
done

if [ "$MODE" = --check ]; then exec node "$KIT/check.mjs"; fi

# This repo is also a plugin marketplace; git uses the GitHub login when there is one.
command -v gh >/dev/null && gh auth setup-git >/dev/null 2>&1

if [ "$MODE" != --no-pull ]; then
  echo "== Pull latest ai-company"
  if git -C "$KIT" pull --ff-only; then exec bash "$KIT/update.sh" --no-pull; fi
  echo "WARN: could not pull ai-company; continuing with the local copy." >&2
fi

# rules/agents/skills/templates are links into this repo, so the pull updated
# them. On Windows CLAUDE.md is a copy, not a link, and must be refreshed.
[ -L "$DEST/CLAUDE.md" ] || cp "$KIT/claude/CLAUDE.md" "$DEST/CLAUDE.md"

# Failures in the loops below are not fatal on their own ("already added",
# "already disabled" are normal). check.mjs at the end decides pass/fail.
rows() { grep -vE '^\s*(#|$)' "$1"; }

echo "== Marketplaces"
rows "$KIT/plugins.txt" | while read -r repo id state; do
  claude plugin marketplace add "$repo" </dev/null >/dev/null 2>&1
done
claude plugin marketplace update </dev/null

echo "== Plugins"
rows "$KIT/plugins.txt" | while read -r repo id state; do
  [ "$id" = - ] && continue
  echo "-- $id ($state)"
  claude plugin install "$id" --scope user </dev/null >/dev/null 2>&1
  claude plugin update "$id" </dev/null >/dev/null 2>&1
  if [ "$state" = on ]; then
    claude plugin enable "$id" --scope user </dev/null >/dev/null 2>&1
  else
    claude plugin disable "$id" --scope user </dev/null >/dev/null 2>&1
  fi
done
claude plugin enable cc-plugin-you-should-know@builtin </dev/null >/dev/null 2>&1

# Clone a GitHub repo to a folder, or pull it if it is already there.
sync_repo() {
  if [ -d "$2/.git" ]; then git -C "$2" pull --ff-only -q </dev/null
  else git clone --depth 1 -q "https://github.com/$1" "$2" </dev/null; fi || echo "WARN: $1 not updated" >&2
}

echo "== Reference repos -> $DEST/vendor"
mkdir -p "$DEST/vendor"
rows "$KIT/refs.txt" | while read -r repo; do
  sync_repo "$repo" "$DEST/vendor/${repo#*/}"
done

echo "== GitHub skills -> $DEST/skills"
rows "$KIT/skills.txt" | while read -r repo name; do
  sync_repo "$repo" "$DEST/skills/$name"
done

echo "== Check"
node "$KIT/check.mjs" && echo "Done. Restart Claude Code to load the changes."
