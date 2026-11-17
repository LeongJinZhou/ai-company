# Status

## Done
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
- The installers do not merge `claude/settings-additions.json` automatically.
- `check.mjs` does not verify the rules and templates links.
- CI actions are pinned by tag, not commit SHA. CI uses `node-version: 22`, which floats to the latest 22.x.
- Plugins in `plugins.txt` are unpinned, and nobody has checked them one by one for advisories. They run their own code on the machine.
- The installers leave ccusage and semgrep unpinned.
- The desktop app's model picker overrides `"model": "opus"` in `settings.json`; set the model in the app for each new session.
- Low, not fixed: `office-proxy.mjs` accepts any `*.ts.net` host, not only this machine; the pre-commit hook passes silently when gitleaks is missing; `claude/templates/ci.yml` has no `permissions:` block.
- A laptop that pulled main between 1.3.0 and 2.0.0 has the lessons file as a tracked file. Local changes to it stop the pull. The steps are in `CHANGELOG.md` under 2.0.0.
- The installers set git's global hooks path without saving an older value; the README says so and gives the command to undo it.
- The older commits on main name one private project of the first founder in the old lessons file. Nothing secret; removing it needs a history rewrite and a force push.
- Watch item: workers sometimes skip the skill files named in their brief.
- This repo has no `docs/SPEC.md` of its own.

## Next step
On every laptop that runs 1.x: `bash update.sh`, then restart Claude Code.
