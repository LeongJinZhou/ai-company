@echo off
REM Starts the myoffice page and its Tailscale forwarder, both hidden.
REM Run once by hand, or at every login through a shortcut in the Startup folder.
REM One-time setup per laptop (after signing in to Tailscale):
REM   "%ProgramFiles%\Tailscale\tailscale.exe" serve --bg 4546
node "%USERPROFILE%\.claude\skills\myoffice\bin\cli.js" --no-open
powershell -NoProfile -WindowStyle Hidden -Command "Start-Process node -ArgumentList '\"%~dp0office-proxy.mjs\"' -WindowStyle Hidden"
