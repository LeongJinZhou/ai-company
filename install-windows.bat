@echo off
REM One-click setup for a new Windows laptop. Run once after cloning ai-company (branch antigravity).
cd /d "%~dp0"
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id Git.Git
winget install -e --id GitHub.cli
winget install -e --id Gitleaks.Gitleaks
winget install -e --id Python.Python.3.12
winget install -e --id Google.OSVScanner
REM bun: the claude-mem plugin needs it for its memory worker.
winget install -e --id Oven-sh.Bun --source winget
REM The Antigravity installers do not always add agy to PATH.
set "PATH=%PATH%;%USERPROFILE%\.gemini\bin;%USERPROFILE%\.local\bin;%LOCALAPPDATA%\agy\bin"
powershell -Command "if (-not (Get-Command agy -ErrorAction SilentlyContinue)) { irm https://antigravity.google/cli/install.ps1 | iex }"
pip install semgrep
if not exist "%USERPROFILE%\.gemini\config" mkdir "%USERPROFILE%\.gemini\config"
for %%i in (rules agents skills templates) do (
  if exist "%USERPROFILE%\.gemini\config\%%i" ren "%USERPROFILE%\.gemini\config\%%i" "%%i.backup"
  mklink /J "%USERPROFILE%\.gemini\config\%%i" "%CD%\antigravity\%%i"
)
REM Keep one copy of a handbook that was there before the first install.
if exist "%USERPROFILE%\.gemini\config\GEMINI.md" if not exist "%USERPROFILE%\.gemini\config\GEMINI.md.backup" copy "%USERPROFILE%\.gemini\config\GEMINI.md" "%USERPROFILE%\.gemini\config\GEMINI.md.backup"
copy /Y "antigravity\GEMINI.md" "%USERPROFILE%\.gemini\config\GEMINI.md"
REM Git hooks: only when no hooks path is set, so a laptop that also has the Claude kit keeps that kit's hooks
REM (its commit-msg hook removes Claude lines only; the README says so).
git config --global --get core.hooksPath >nul 2>&1 || git config --global core.hooksPath "%CD:\=/%/antigravity/git-hooks"
git config --global init.defaultBranch main
call agy mcp add playwright npx @playwright/mcp@latest
REM Sentry: the site-monitor agent reads errors through it. You sign in with your own Sentry account on first use.
call agy mcp add sentry https://mcp.sentry.dev/mcp
gh auth status >nul 2>&1 || gh auth login
REM Plugins, reference repos and the final check. Re-run update.sh any time to update.
"%ProgramFiles%\Git\bin\bash.exe" "%CD%\update.sh" --no-pull
echo If a tool is "not found", close and reopen the terminal, then run this file again.
pause
