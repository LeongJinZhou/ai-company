# Changelog

All notable changes to this repo are listed here, in the Keep a Changelog format.

## [Unreleased]

### Added
- The handbook keeps `docs/STATUS.md` short: the two newest rounds of work stay there in full, older ones move, unchanged, to `docs/HISTORY.md`, which a session reads only when a task needs it. The project template names the new file. Seen on one project: the status file had grown to 65 KB because every round was appended, and every session read all of it; after the move it was 10 KB and nothing was lost. Existing projects are not changed by this: the lead moves the older rounds the next time it updates the status file

## [2.0.3] - 2026-11-19

### Fixed
- The three project templates name one stack. The README template said Next.js, PostgreSQL and Prisma while the project CLAUDE.md template said React, PHP and MySQL; both now say React, PHP and MySQL, the stack the real projects use. The CI template runs PHPUnit when the project has `backend/composer.json` (it ran npm commands only, so backend tests never ran on GitHub) and has a `permissions:` block
- The gitignore template no longer ignores `docs/STATUS.md`: the handbook calls it the project's memory, and it never reached a second laptop. `*.sql` still keeps dumps out, but files under a `migrations` or `fixtures` folder now go into git (every real project had to add that exception by hand). `vendor/` is ignored. Existing projects keep their own `.gitignore`: remove the `docs/STATUS.md` line there by hand
- Several organisations are no longer forced on every project. `claude/rules/security.md` scopes owned data to its owner (the user, group or organisation it belongs to); the architect adds `organisation_id` only when the spec says so; backend-standards asks for caching and background jobs only when a measurement or the spec calls for them
- backend-dev and frontend-dev build one part of the approved plan. They follow `docs/API.md` when the project has one; without one the lead's brief must name each endpoint, or they stop and say so. They named `docs/PLAN.md` and `docs/API.md`, which most projects never have
- site-monitor writes no file any more: it reports, and the lead adds the bugs to `docs/STATUS.md`. It used to rewrite `docs/PLAN.md` as a whole, on the smallest model
- The architect's first job is the one the handbook names: review the data model in `docs/SPEC.md` and write it to `docs/ARCHITECTURE.md`. The API contract, the scaffold and CI are done only when the lead's brief asks for them
- The CI template gives its token only the rights it needs: `contents: read` and `pull-requests: read`

### Added
- `check.mjs` fails when this copy of the kit is behind GitHub. A pull that failed used to end in `OK` with the old company in place
- Tests that keep agents, skills and templates in line with the handbook: no file may name a doc that nothing writes, the templates must name one stack, the CI template must run every test runner the stack names, and the gitignore template is tried with real git

## [2.0.2] - 2026-11-19

### Changed
- The lessons skill has two files. `claude/skills/lessons/kit.md` (was `starter.md`) holds the lessons that come with the kit: it is in the repo, the same on every laptop, and `bash update.sh` brings new lessons to laptops that are already installed. `SKILL.md` stays each laptop's own file, ignored by git and never overwritten; a new one is created from `own-template.md` and starts empty. Before 2.0.2 the starter was copied once, so a laptop never got a lesson that was learned later
- A laptop installed with 2.0.0 or 2.0.1 keeps its own `SKILL.md` as it is; `bash update.sh` adds one line at its end that points to `kit.md`. That file still holds the copy of the old starter lessons: delete those lines once, they are in `kit.md` now
- `check.mjs` fails when `kit.md` is missing or the own lessons file does not point to it

### Added
- `check.mjs` prints a warning when semgrep is installed but cannot scan. Seen on one Windows laptop with semgrep 1.184.0: every scan stops with `Unix_error: Invalid argument socketpair`, while `semgrep --version` works

## [2.0.1] - 2026-11-18

### Added
- `bash update.sh` adds the kit's settings to `~/.claude/settings.json` itself (`settings-merge.mjs`): the lead model, ECC GateGuard off, no attribution lines, the ccusage status line. Only missing keys are added, a value you set yourself is never changed, and the file as it was is kept once as `settings.json.backup`. Nobody has to merge `claude/settings-additions.json` by hand any more
- Both installers add the Sentry MCP server, which the site-monitor agent uses; you sign in with your own Sentry account. A laptop installed before 2.0.1 gets it with `claude mcp add --scope user --transport http sentry https://mcp.sentry.dev/mcp`
- `check.mjs` also fails when a kit setting is missing, when the Playwright connection is missing, when one of gh, gitleaks, semgrep, osv-scanner, bun or ccusage does not run, or when a rule or template is not linked. `OK` now means the laptop has the same company as every other laptop that prints `OK`
- The starter lessons hold the git lesson about a file that was untracked and ignored

### Changed
- The installers no longer end with "merge the settings file"

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
