# Changelog

All notable changes to this repo are listed here, in the Keep a Changelog format.

## [Unreleased]

## [2.0.0] - 2026-11-17

### Added
- MIT licence (`LICENSE`): anyone may use, copy and change the kit
- Your own lessons stay on your laptop: the repo ships `claude/skills/lessons/starter.md`, `update.sh` creates `claude/skills/lessons/SKILL.md` from it once and never overwrites it, git ignores that file, and `check.mjs` reports when it is missing
- README: who the kit is for, what it needs, what the installer changes on your machine and what a task cost in the benchmark
- The Windows installer keeps one copy (`CLAUDE.md.backup`) of a handbook that was in `~/.claude` before the first install

### Changed
- The handbook no longer describes one person, and `docs/STATUS.md` holds the current state only
- Assistant workflow: every order runs in five steps (study, propose one short plan, build, check itself, show). The lead studies the product instead of interviewing the founder, the founder says yes once, and the lead builds with the skills the task needs: a design skill for every screen, backend and security standards for server code
- Security and testing rules stay always on and apply from the first line of a prototype; testing grows with the product; scale rules apply only when the spec says the product needs them
- Only caveman stays a core plugin; ecc, superpowers, claude-mem and ponytail are installed but off (a new session loaded about 76,000 tokens with five plugins on)
- brief-to-spec writes the spec from its own study with recorded defaults and a look-and-theme section; github-secretary merges and releases only on the founder's word
- The scale rules moved from `claude/rules/` (loaded into every session) to the scale-standards skill (read on demand); the handbook has a Cost section: read only what the task needs, batch calls, sub-agents only when they save context, a new session per task
- A change to a permission check or a database query now also goes to security-reviewer. The benchmark of 2026-11-17 showed that such a change (order 3) was checked only by the lead itself
- Two modes. Building checks each change with independent reviewers: tools first, a new code-reviewer agent on every code change, ux-reviewer on every new screen, architect on the data model of a new project with a database or login, one saved browser test per feature. Production is the full sweep of the whole product on the founder's word "production", before real users or real data
- The skill map points a bug that survived one fix to the systematic-debugging skill file on disk, with the plugin off
- Business thinking: a new product-sense skill (who it is for, what exists, the simpler way, success numbers, cost to run), read only for a new product or large feature; the plan says why the product is worth building and gives plain advice when the lead would build less or something different
- The company learns: the lessons skill holds verified lessons across all projects (a skill, because a session cannot read a file outside its project folder), and the lead proposes one rule change when the founder corrects the same kind of thing twice
- Safety net: a local checkpoint before every substantial change and the word "undo" to return to it; a database change that can lose data asks first and is backed up first; reports say what a thing does for the user before its technical name and list what changed
- The README says the repo is public (the founder's decision of 2026-11-17)

### Removed
- founder-proxy, the tiers (Tiny, Normal, Risky), the founder gates and the chain of planner, approver, builder and reviewers per feature
- `docs/PLAN.md`, the plan for 1.3.0
- `claude/skills/lessons/SKILL.md` as a file in the repo. No release had it: it was on main only, between 1.3.0 and 2.0.0. A laptop that pulled main in that time: the pull removes the file and `bash update.sh` creates a new one from the starter; get the old lessons back with `git show 9ecebc4:claude/skills/lessons/SKILL.md`. If the file has changes that were never committed, the pull stops: save a copy, run `git checkout -- claude/skills/lessons/SKILL.md`, run `bash update.sh`, then put your copy back. If you committed your own changes to it, the pull also stops: save a copy, run `git reset --hard origin/main` (this drops every local commit on main and every change to a tracked file that was not committed), run `bash update.sh`, then put your copy back

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
