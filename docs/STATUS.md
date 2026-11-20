# Status

## This branch: the company for Google Antigravity (2026-11-20)
This is the `antigravity` branch. It is the kit of `main` at 2.0.3 with Claude Code switched to Google Antigravity, kept side by side with `main` and never merged into it. Everything below "Done" is the history of the Claude Code kit and is kept for reference.

Tried on the real `agy` 1.5.9 on Windows, signed in, lead model Gemini 4 Neon (High):
- In a project folder: a `GEMINI.md`, a rule file with `trigger: always_on`, a skill and a custom agent with `model: pro` all loaded, and the lead ran the agent.
- Agent tools: an agent with no `tools:` line got no shell and no file tools. The documented names (`view_file`, `grep_search`, `run_command`, `write_to_file`, `replace_file_content`, `search_web`, `read_url_content`) were all accepted; none hung.
- Plugins, in a throwaway home folder: 12 of 15 installed with `agy plugin install https://github.com/<repo>` (Claude Code plugins are converted). taste-skill and awesome-gamedev-agent-skills: "could not detect plugin structure". rea: its clone fails on Windows (a file name in a submodule). A disabled plugin keeps its files on disk, and an install over an existing one replaces it and keeps it disabled.
- `agy mcp add` and `agy mcp list` for Playwright and Sentry, in the throwaway home folder.
- The real files, copied into a project folder: the handbook and the three rule files loaded (the lead quoted them), and six of the 13 agents answered with the tools their file names: code-reviewer and site-monitor read and run commands, planner reads and writes, backend-dev also edits, security-researcher also searches the web. Each of them was also offered the Playwright connection of that folder.
- `bash update.sh --no-pull` and `--check` against a throwaway home folder, with the four folders linked the way the Windows installer links them.

Open on this branch:
- The lead model label in `settings.json` and the files in `~/.gemini/config` (the handbook, the rules, the agents) were not tried from the global folder on a real laptop; the same files were tried from a project folder. The first real install is that test.
- No staff agent clicked through a real page yet: the agents were offered the Playwright tools, but none was asked to use them. The Sentry connection was not tried with an account.
- `install-windows.bat` itself was not run; its steps were done by hand in the throwaway home folder.
- The converted plugins install, but none was used in a real task. caveman is the only one that is on: it arrives with its skills and no hooks that Antigravity reads, so nothing of it writes into `~/.claude`, and its always-on short voice was not seen working here. ecc and superpowers bring a `hooks/hooks.json` written for Claude Code; whether Antigravity runs it, and whether it then writes into `~/.claude`, was not tried. They are off; the skill map makes the lead ask before enabling one, and `check.mjs` warns about any that is on. flightdeck, ctx-handoff and claude-mem were written around Claude Code's hooks and may do nothing here.
- `agy models` also answered in the throwaway home folder, so the check's "agy cannot list its models" line was never seen to fire.
- In headless mode (`agy -p`) a staff agent that needs a shell command stops at the permission question. In a normal session the question reaches the founder.
- No cost was measured on Antigravity. The benchmark below is the Claude Code kit's.
- The Mac installer was not run.
- `claude-mem` and the text of some converted plugins still say "Claude"; that is their own wording.

## Done
- 2.0.3 (2026-11-19): agents, skills and templates agree with the handbook again. An outside read of 2.0.2 found that the rewrite of the handbook in 2.0.0 left v1 wording behind: three templates with two different stacks, a CI template that never ran the PHP tests, a gitignore template that kept `docs/STATUS.md` and migration files out of git, organisation scoping forced on every project, and builders that followed `docs/PLAN.md` and `docs/API.md`. All confirmed against the files and against the real projects, then fixed; tests now check agreement, not only the handbook's wording. `check.mjs` fails when the copy is behind GitHub.
- 2.0.2 (2026-11-19): the kit's lessons are one file in git (`claude/skills/lessons/kit.md`), the same on every laptop and brought up to date by `bash update.sh`. Each laptop's own notes stay in its own ignored `SKILL.md`. Why: with the copied starter of 2.0.0 a second laptop never got a later lesson, and the first founder's lessons lived on one laptop only. `check.mjs` warns when semgrep cannot scan.
- 2.0.1 (2026-11-18): every laptop gets the same company without a manual step. `update.sh` adds the kit's missing settings to `~/.claude/settings.json` (never changes a value the user set, keeps one backup), the installers add the Sentry connection, and `check.mjs` also verifies settings, the Playwright connection, the tools and the rules and templates links. Found by comparing the first founder's laptop with what the repo installs: skills, agents, rules, plugins, reference repos and tools matched; the settings, the Sentry connection and one lesson did not reach other users.
- 2.0.0 (2026-11-17): the kit is ready for anyone to use. MIT licence. The founder's own lessons live in a file git ignores, created once from `claude/skills/lessons/starter.md`. The README says who the kit is for, what it needs, what the installer changes and what a task cost. The handbook no longer describes one person. `docs/PLAN.md` (the plan for 1.3.0) is removed. Release checks: 31/31 tests, gitleaks clean on the full history and the working files, code-reviewer and security-reviewer (opus) on the whole change with every medium or higher finding fixed and re-checked by the reviewer that raised it. Semgrep did not run. No full install on an empty machine was run; the new lessons lines of `update.sh` and the new backup line of `install-windows.bat` were each run twice against a temp folder.
- Safety net (PR 26): a local checkpoint before every substantial change and the word "undo" to go back; a database change that can lose data asks first and is backed up first; reports say what a thing does for the user before its technical name.
- Business sense and learning (PR 25): the product-sense skill, two plan lines ("Worth building because", "My advice"), an "I noticed" line in the report, the lessons skill, a rule-change proposal after two corrections of the same kind. Not added: departments, a CEO agent, agents on a schedule.
- Two strong modes (PR 24). Building: tools first, code-reviewer on every code change, ux-reviewer on every new screen, architect on the data model of a new project with a database or login, one saved browser test per feature. Production: the full sweep of the whole product on the word "production".
- Assistant workflow (PR 22): five steps (study, propose one short plan, build, check itself, show); no interview, one yes; a design skill for every screen; security and testing always on, scale only when the spec needs it; only caveman stays a core plugin. A new session loaded 76,290 tokens before the change and 54,959 after (`claude -p` on haiku in an empty folder).
- 1.0.0 to 1.3.0: the older workflows (tiers, founder gates, founder-proxy). All removed in 2.0.0; see `CHANGELOG.md`.
- GitHub settings: squash-only merges, merged branches auto-delete, wiki off, main protected (CI check `test` required).
- README has a banner, a CI badge and three diagrams; tests keep its numbers and links true.

## Decisions
- One public repo, not a private copy plus a public one (2026-11-17). Two copies drift apart, and everyone gets the same result only from the same files. What is private stays out of the repo instead.
- Licence: MIT (2026-11-17).
- Git history is not rewritten. Older commits hold earlier notes of the first founder; gitleaks found no secret in the full history.
- No interview, one yes (2026-11-16). Why the old workflow was dropped: one feature took 6 to 9 agent runs, the handbook told the lead to ask whenever the spec was silent, and nothing told it to make screens good.
- Lead model is opus (`claude/settings-additions.json`). The handbook does not make a lead on another model stop and wait.
- Squash merges only.

## Benchmark (2026-11-17)
Each run with `claude -p` on an opus lead in a throwaway folder; cost from the run's result event, at API prices. "Old" is the 1.0.0 handbook. One run per order.

| Order | Handbook | Cost old -> new | Agent runs | Opus tokens | Planted defects caught |
|---|---|---|---|---|---|
| 1 README polish | assistant workflow `c24068a` | $3.47 -> $0.99 | 14 -> 1 | 3.02M -> 1.03M | 3/3 -> 3/3 |
| 2 todo CLI | assistant workflow `c24068a` | $2.82 -> $0.64 | 12 -> 1 | 2.15M -> 0.56M | none planted |
| 3 notes search and delete | assistant workflow `c24068a` | $3.64 -> $0.67 | 16 -> 1 | 3.30M -> 0.83M | 2/2 -> 2/2 |
| 1 README polish | strong modes `f4961c1` | $3.47 -> $1.93 | 14 -> 5 | 3.02M -> 2.15M | 3/3 -> 6/6 (3 obvious, 3 subtle) |
| 2 todo CLI | strong modes `f4961c1` | $2.82 -> $1.26 | 12 -> 3 | 2.15M -> 1.06M | none planted |
| 3 notes search and delete | strong modes `f4961c1` | $3.64 -> $1.21 | 16 -> 4 | 3.30M -> 1.27M | 2/2 -> 5/5 (2 obvious, 3 subtle) |
| 4 notes web page (new screen) | strong modes `f4961c1` | no old run -> $3.78 | 7 | 5.70M | none planted |
| 5 production sweep | strong modes `f4961c1` | no old run -> $1.86 | 8 | 1.95M | 3/3 (1 security, 1 logic, 1 missing test) |

- Assistant workflow rows: no independent reviewer ran; the lead checked its own work. That is why the strong modes were added.
- Strong modes, orders 1 to 3: $4.40 together, against $9.93 on 1.0.0. 11 of 11 planted defects were caught. The opus lead named all 11 itself before any reviewer ran; the reviewers still raised 5 medium findings of their own, all fixed and re-checked. Sent to the raw drafts alone, code-reviewer found 6 of 6 and 5 of 5, security-reviewer 5 of 5.
- Order 4: the lead read the design skill, used the browser, and ux-reviewer found 1 medium (search box edge too faint), fixed. The look is for a person to judge.
- Order 5: all 3 planted defects were found by the reviewers, not by the lead; the tests went from 15 to 73. The sweep also changed more than the findings asked for.
- Limits: one run per order, an opus lead, small projects. No planted defect was missed by anyone, so the benchmark has not yet found the level at which this workflow fails. Semgrep did not run in the first rounds (its rules could not be downloaded).
- The older rows (tiers and founder-proxy, 2026-11-16) are in the git history of this file.

## Open issues
- Semgrep cannot scan on the first founder's Windows laptop (1.184.0 from pip, `Unix_error: Invalid argument socketpair`, in Git Bash and PowerShell, with and without a rule download). Not fixed: tried pattern mode, one job and the experimental engine. Next try: semgrep 1.186.0. Until then no security check on that laptop includes semgrep.
- A lesson reaches other laptops only after it is moved from the own `SKILL.md` into `kit.md` and released. Notes written since the last release live on one laptop.
- `check.mjs` does not check the Sentry connection (a user without Sentry may remove it), the git hooks path, or which model a session really runs on.
- A laptop installed before 2.0.1 does not get the Sentry connection from `bash update.sh`; the command is in `CHANGELOG.md` under 2.0.1.
- CI actions are pinned by tag, not commit SHA. CI uses `node-version: 22`, which floats to the latest 22.x.
- Plugins in `plugins.txt` are unpinned, and nobody has checked them one by one for advisories. They run their own code on the machine.
- The installers leave ccusage and semgrep unpinned.
- The desktop app's model picker overrides `"model": "opus"` in `settings.json`; set the model in the app for each new session.
- Low, not fixed: `office-proxy.mjs` accepts any `*.ts.net` host, not only this machine; the pre-commit hook passes silently when gitleaks is missing; `claude/templates/ci.yml` installs semgrep without a version.
- From the outside read of 2.0.2, left as they are: planner repeats the slices of brief-to-spec; devops-engineer and site-monitor only fit a product that is deployed; impeccable is off and its files must be read from the plugin cache; a second install renames into an existing `.backup` folder.
- Projects started before 2.0.3 still ignore `docs/STATUS.md` in their own `.gitignore`, so their status file is on one laptop only.
- A laptop that pulled main between 1.3.0 and 2.0.0 has the lessons file as a tracked file. Local changes to it stop the pull. The steps are in `CHANGELOG.md` under 2.0.0.
- The installers set git's global hooks path without saving an older value; the README says so and gives the command to undo it.
- The older commits on main name one private project of the first founder in the old lessons file. Nothing secret; removing it needs a history rewrite and a force push.
- Watch item: workers sometimes skip the skill files named in their brief.
- This repo has no `docs/SPEC.md` of its own.

## Next step
On every laptop: `bash update.sh`, then restart Antigravity. It must end with `OK: ...`.
