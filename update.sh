#!/usr/bin/env bash
# Brings this laptop to the latest company setup. Safe to re-run any time:
# pulls this repo, every plugin and every reference repo.
#   bash update.sh          update, then check
#   bash update.sh --check  only check that this machine matches the repo (plugins, reference repos, skills, agents, rules, handbook, settings, tools)
# First-time setup is install-windows.bat / install-mac.command, which call this.
set -uo pipefail
KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="$HOME/.gemini/config"
MODE="${1:-update}"
# The Antigravity installers put agy in one of these folders and do not always add it to PATH.
PATH="$PATH:$HOME/.gemini/bin:$HOME/.local/bin:$HOME/AppData/Local/agy/bin"

for tool in git node agy; do
  command -v "$tool" >/dev/null || { echo "Missing: $tool. Install it, then re-run." >&2; exit 1; }
done

if [ "$MODE" = --check ]; then exec node "$KIT/check.mjs"; fi

# Plugins are cloned from GitHub; git uses the GitHub login when there is one.
command -v gh >/dev/null && gh auth setup-git >/dev/null 2>&1

if [ "$MODE" != --no-pull ]; then
  echo "== Pull latest ai-company (antigravity)"
  if git -C "$KIT" pull --ff-only; then exec bash "$KIT/update.sh" --no-pull; fi
  echo "WARN: could not pull ai-company; continuing with the local copy. If a file here was changed by hand, 'git status' in $KIT shows it." >&2
fi

# rules/agents/skills/templates are links into this repo, so the pull updated
# them. On Windows GEMINI.md is a copy, not a link, and must be refreshed.
mkdir -p "$DEST"
[ -L "$DEST/GEMINI.md" ] || cp "$KIT/antigravity/GEMINI.md" "$DEST/GEMINI.md"

# Lessons: kit.md comes with the kit and is the same on every laptop. SKILL.md
# is your own file: created once, never overwritten, ignored by git. An own
# file from before 2.0.2 gets one line at its end that points to kit.md.
LESSONS="$KIT/antigravity/skills/lessons"
[ -e "$LESSONS/SKILL.md" ] || cp "$LESSONS/own-template.md" "$LESSONS/SKILL.md"
grep -q '`kit\.md` beside this file' "$LESSONS/SKILL.md" || printf '\nAlso read `kit.md` beside this file: the lessons that come with the kit.\n' >> "$LESSONS/SKILL.md"

# The kit's settings (the lead model): added when missing, never changed when
# you set your own value.
node "$KIT/settings-merge.mjs" || echo "WARN: settings.json was not changed; see the message above." >&2

# Failures in the loop below are not fatal on their own ("already disabled" is
# normal). check.mjs at the end decides pass/fail.
rows() { grep -vE '^\s*(#|$)' "$1"; }

echo "== Plugins"
rows "$KIT/plugins.txt" | while read -r repo name state; do
  [ "$name" = - ] && continue
  echo "-- $name ($state)"
  # An install over an existing one replaces it: that is the update.
  agy plugin install "https://github.com/$repo" </dev/null >/dev/null 2>&1
  if [ "$state" = on ]; then
    agy plugin enable "$name" </dev/null >/dev/null 2>&1
  else
    agy plugin disable "$name" </dev/null >/dev/null 2>&1
  fi
done

# Clone a GitHub repo to a folder, or pull it if it is already there.
# core.longpaths: two of the reference repos hold paths that pass Windows' 260
# characters when the home folder has a long name.
sync_repo() {
  if [ -d "$2/.git" ]; then git -C "$2" -c core.longpaths=true pull --ff-only -q </dev/null
  else git clone -c core.longpaths=true --depth 1 -q "https://github.com/$1" "$2" </dev/null; fi || echo "WARN: $1 not updated" >&2
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
node "$KIT/check.mjs" && echo "Done. Restart Antigravity to load the changes."
