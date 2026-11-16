# Changelog

All notable changes to this repo are listed here, in the Keep a Changelog format.

## [Unreleased]

### Changed
- Assistant workflow: every order runs in five steps (study, propose one short plan, build, check itself, show). The lead studies the product instead of interviewing the founder, the founder says yes once, and the lead builds with the skills the task needs: a design skill for every screen, backend and security standards for server code
- Security and testing rules stay always on and apply from the first line of a prototype; testing grows with the product; scale rules apply only when the spec says the product needs them
- Only caveman stays a core plugin; ecc, superpowers, claude-mem and ponytail are installed but off (a new session loaded about 76,000 tokens with five plugins on)
- brief-to-spec writes the spec from its own study with recorded defaults and a look-and-theme section; github-secretary merges and releases only on the founder's word
- The scale rules moved from `claude/rules/` (loaded into every session) to the scale-standards skill (read on demand); the handbook has a Cost section: read only what the task needs, batch calls, sub-agents only when they save context, a new session per task

### Removed
- founder-proxy, the tiers (Tiny, Normal, Risky), the founder gates and the chain of planner, approver, builder and reviewers per feature

## [1.3.0] - 2026-11-16

### Changed
- Right-sized workflow: Tiny tasks are planned by the lead in 5 lines with no planner and no founder-proxy call (one reviewer, the tool gate and the must-escalate check stay); plans cut the work into slices and Gate 1 runs once per plan; skills are proposed per project and per plan, checked by founder-proxy and proven by each worker; the caveman and ponytail rules are spelled out in the handbook Style section

## [1.2.0] - 2026-11-16

### Changed
- Chain of command: a Fable founder-proxy decides the routine founder gates (plan approval, merge, patch and minor releases) and logs each decision in docs/STATUS.md; the founder is asked only about the must-escalate list; briefs carry a "why" line; Tiny tasks get one proxy call, at the merge gate

## [1.1.1] - 2026-11-16

### Fixed
- Tier rule: the install lists (`plugins.txt`, `skills.txt`, `refs.txt`), everything under `rules/` and `templates/`, and `*.cmd` and `*.ps1` scripts are Risky; a file on the risky list is never Tiny because of its extension (#17)

## [1.1.0] - 2026-11-16

### Added
- Hard rule: workers change files only with the Write or Edit tools (#15)

### Changed
- Lean workflow: tiers by diff (Tiny, Normal, Risky), a tool gate before any reviewer, one security review, re-checks scoped to the fix, sonnet for security-reviewer and tester on Normal tasks, and a lead that warns and waits when it is not on opus (#15)
- CI uses actions/checkout and actions/setup-node v7 (#12, #13)

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
