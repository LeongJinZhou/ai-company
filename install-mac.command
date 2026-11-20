#!/bin/bash
# One-click setup for a new Mac. Run once after cloning ai-company (branch antigravity).
set -e
cd "$(dirname "$0")"
command -v brew >/dev/null || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# bun: the claude-mem plugin needs it for its memory worker.
brew install node git gh gitleaks semgrep osv-scanner oven-sh/bun/bun
# The Antigravity installer puts agy in ~/.local/bin and does not always add it to PATH.
export PATH="$PATH:$HOME/.local/bin:$HOME/.gemini/bin"
command -v agy >/dev/null || curl -fsSL https://antigravity.google/cli/install.sh | bash
mkdir -p ~/.gemini/config
for item in GEMINI.md rules agents skills templates; do
  [ -e ~/.gemini/config/$item ] && [ ! -L ~/.gemini/config/$item ] && mv ~/.gemini/config/$item ~/.gemini/config/$item.backup
  ln -sfn "$PWD/antigravity/$item" ~/.gemini/config/$item
done
chmod +x antigravity/git-hooks/*
# Git hooks: only when no hooks path is set, so a laptop that also has the Claude kit keeps that kit's hooks
# (its commit-msg hook removes Claude lines only; the README says so).
git config --global --get core.hooksPath >/dev/null || git config --global core.hooksPath "$PWD/antigravity/git-hooks"
git config --global init.defaultBranch main
agy mcp add playwright npx @playwright/mcp@latest || true
# Sentry: the site-monitor agent reads errors through it. You sign in with your own Sentry account on first use.
agy mcp add sentry https://mcp.sentry.dev/mcp || true
gh auth status >/dev/null 2>&1 || gh auth login
# Plugins, reference repos and the final check. Re-run update.sh any time to update.
bash "$PWD/update.sh" --no-pull
echo "Open a project folder in a terminal and run: agy"
