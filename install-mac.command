#!/bin/bash
# One-click setup for a new Mac. Run once after cloning ai-company.
set -e
cd "$(dirname "$0")"
command -v brew >/dev/null || /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node git gh gitleaks semgrep osv-scanner
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
gh auth status >/dev/null 2>&1 || gh auth login
echo "Done. Merge claude/settings-additions.json into ~/.claude/settings.json if not done yet."
echo "Then open a folder in VS Code, run: claude   and type: /model opusplan"
