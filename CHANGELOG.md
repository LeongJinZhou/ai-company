# Changelog

All notable changes to this repo are listed here, in the Keep a Changelog format.

## [Unreleased]

## [1.0.0] - 2026-11-15

### Added
- Initial company setup: handbook, rules, staff agents, skills, templates, installers (before #1)
- ECC-led company kit with plugins and one-command update (#1)
- myoffice live agent view as a GitHub-synced skill (#3)
- Open the office privately from a phone with Tailscale (#5)
- Tiered models (fable plans, opus checks, sonnet builds) and mandatory skill use (#10)

### Changed
- Say that myoffice hides sub-agents until Subagents is turned on (#4)
- Low-severity findings do not start a fix round (#7)
- Repo polish: README with banner and diagrams, settings in sync, PR template, Dependabot, changelog, Mac installer no longer suggests opusplan (#11)

### Fixed
- Handbook weak spots found in the ECC review (#2)
- Office launcher starts the forwarder on a cold start (#6)
- Model routing (fable thinks, opus does and checks, sonnet for GitHub) and workflow gaps (#8)
- Planner no longer suggests a model; ignore Playwright output (#9)
