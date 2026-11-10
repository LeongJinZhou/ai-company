@echo off
REM One-click setup for a new Windows laptop. Run once after cloning ai-company.
cd /d "%~dp0"
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id Git.Git
winget install -e --id GitHub.cli
winget install -e --id Gitleaks.Gitleaks
winget install -e --id Python.Python.3.12
winget install -e --id Google.OSVScanner
powershell -Command "if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { irm https://claude.ai/install.ps1 | iex }"
call npm install -g ccusage
pip install semgrep
if not exist "%USERPROFILE%\.claude" mkdir "%USERPROFILE%\.claude"
for %%i in (rules agents skills templates) do (
  if exist "%USERPROFILE%\.claude\%%i" ren "%USERPROFILE%\.claude\%%i" "%%i.backup"
  mklink /J "%USERPROFILE%\.claude\%%i" "%CD%\claude\%%i"
)
copy /Y "claude\CLAUDE.md" "%USERPROFILE%\.claude\CLAUDE.md"
git config --global core.hooksPath "%CD:\=/%/claude/git-hooks"
git config --global init.defaultBranch main
call claude mcp add --scope user playwright npx @playwright/mcp@latest
gh auth login
echo Done. Merge claude\settings-additions.json into %USERPROFILE%\.claude\settings.json if not done yet.
echo If a tool is "not found", close and reopen the terminal, then run this file again.
pause
