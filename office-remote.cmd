@echo off
REM Starts the myoffice page and its Tailscale forwarder, both hidden.
REM Run once by hand, or at every login through a shortcut in the Startup folder.
REM One-time setup per laptop (after signing in to Tailscale):
REM   "%ProgramFiles%\Tailscale\tailscale.exe" serve --bg --http=80 4546
REM Both are started detached: the office keeps running in the foreground, so a
REM plain call would never reach the forwarder.
powershell -NoProfile -WindowStyle Hidden -Command "Start-Process node -ArgumentList '\"%USERPROFILE%\.claude\skills\myoffice\bin\cli.js\" --no-open' -WindowStyle Hidden; Start-Process node -ArgumentList '\"%~dp0office-proxy.mjs\"' -WindowStyle Hidden"
