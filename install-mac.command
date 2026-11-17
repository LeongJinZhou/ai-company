#!/bin/bash
# One-click setup for a new Mac. Run once after cloning ai-company.
set -e
cd "$(dirname "$0")"
command -v brew >/dev/null || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
# bun: the claude-mem plugin needs it for its memory worker.
brew install node git gh gitleaks semgrep osv-scanner oven-sh/bun/bun
command -v claude >/dev/null || curl -fsSL https://claude.ai/install.sh | bash
npm install -g ccusage
mkdir -p ~/.claude
for item in CLAUDE.md rules agents skills templates; do
  [ -e ~/.claude/$item ] && [ ! -L ~/.claude/$item ] && mv ~/.claude/$item ~/.claude/$item.backup
  ln -sfn "$PWD/claude/$item" ~/.claude/$item
done
chmod +x claude/git-hooks/*
git config --global core.hooksPath "$PWD/claude/git-hooks"
git config --global init.defaultBranch main
claude mcp add --scope user playwright npx @playwright/mcp@latest || true
# Sentry: the site-monitor agent reads errors through it. You sign in with your own Sentry account on first use.
claude mcp add --scope user --transport http sentry https://mcp.sentry.dev/mcp || true
gh auth status >/dev/null 2>&1 || gh auth login
# Plugins, reference repos and the final check. Re-run update.sh any time to update.
bash "$PWD/update.sh" --no-pull
echo "Open a folder in VS Code and run: claude"
