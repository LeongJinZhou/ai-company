# Plan: lean workflow (approved by the founder on 2026-11-15)

Goal: spend the minimum tokens and keep top-tier quality. Gate 1 is passed; built and merged in PR #15 (benchmark results in `docs/STATUS.md`).

## Why (measured on PR #11, a docs-only task)
- 12 sub-agent runs, about 533k tokens. Six opus checkers ran in parallel (251k) and two opus re-checks cost 119k.
- The checkers repeated each other: the two security reviewers returned the same low findings; code reviewer and integration-checker found the same medium; language reviewer and tester found the same two mediums. Three unique mediums in total, nothing critical or high.
- The lead session ran on Fable, not opus. That was the largest single cost.
- A sonnet builder wrote a file through `node -e "..."`; bash executed the backticks in the text and ran the installer.

## The workflow to build

The tier comes from file paths. The lead sets it from the plan's file list and checks it again with `git diff --name-only main...HEAD` before the checks start. A task moves up a tier when the diff says so. It never moves down.

- Risky: the diff touches auth, sessions, permissions, request input or validation, database schema or migrations, payments, uploads, dependencies (package or lock files), CI (`.github/`), shell or installer scripts (`*.sh`, `*.bat`, `*.command`), env or secrets, or `rules/security.md`; or it touches more than 3 modules.
- Tiny: only text and docs (md, txt, svg, images) and none of the risky paths.
- Normal: everything else.

| Tier | Planner | Builder | Checks, after the tool gate passes | Re-check |
|---|---|---|---|---|
| Tiny | `ecc:planner` on sonnet, plan of 20 lines or less | sonnet | One `ecc:code-reviewer` on opus: do the claims match the code, any stale lines | The lead re-runs the tool gate. Only a non-mechanical fix gets one sonnet re-check, scoped to the fix list |
| Normal | `ecc:planner` on opus | sonnet, `ecc:tdd-guide` | Language reviewer on opus (`ecc:code-reviewer` if there is none); security-reviewer on sonnet; tester on sonnet; integration-checker on opus only if the diff touches UI and API; ux-reviewer on opus only if screens change | Only the checker that raised the finding, on sonnet, given the fix list and the fix diff |
| Risky | `ecc:planner` on fable, then `ecc:code-architect` on opus | sonnet, `ecc:tdd-guide` | Same crew as Normal, every check on opus; security-researcher as today (dependency, login, upload, payment) | The same checker, on opus, scoped to the fix list and the fix diff |

- Tool gate, before every LLM check: lint, typecheck, unit, integration and e2e tests, gitleaks, semgrep if installed, and the repo's own count and link tests. Red gate: back to the builder; no reviewer runs.
- Reviewers are told: the gate is green; do not re-run the tests; do not comment on style.
- One security review, not two: drop `ecc:security-reviewer` from the default crew; the company security-reviewer runs the full OWASP checklist.
- Gate 1 (founder approves the plan) stays for every tier.
- Lead: at session start the lead reads its own model. If it is not opus, it tells the founder in one line (the app's model picker overrides `settings.json`) and waits for the answer. The lead keeps its context small: haiku for bulk reading, the tool gate instead of re-reading files, `/clear` after every merge.
- Skills: at most 2 per worker, each with the exact section (`path#Heading`). Tiny reviewers get none. A missing "Skills read" line is reported as "skipped by X"; it does not cause a re-run.
- Brief template, 6 lines: `[name] task` / files / diff command / skills#section / done when / "report 10 lines or less".
- Hard rule: workers change files only with the Write or Edit tools, never through the shell (`node -e`, echo, heredoc, any quoted shell string).
- Measuring: one line per task in `docs/STATUS.md`: tier, sub-agent runs, sub-agent tokens, cost from `npx ccusage` or `~/.claude/metrics/costs.jsonl`.

## Files to change
- [x] `check.test.mjs`, tests first: (a) the handbook names Tiny, Normal and Risky and the risky list contains auth, migration, payment, dependenc, CI, script; (b) each agent's `model:` frontmatter equals a map in the test that mirrors the routing table; (c) Hard rules forbid shell file writes; (d) README diagram 2 contains "Tier" and "tool gate". README keeps exactly 3 Mermaid blocks.
- [x] `claude/CLAUDE.md`: Start of every session (model check); Workflow steps 2-5 (tier rule, risky list, table, tool gate, re-check rule); Skills section (2 with section, skipped skills reported); Model routing (opus: checks on Risky, code review and integration on Normal; sonnet: also security and tester on Normal, planner on Tiny); Cost rules (brief template, STATUS cost line); Hard rules (no shell file writes).
- [x] `claude/agents/tester.md`: model opus to sonnet (the lead passes opus on Risky).
- [x] `claude/agents/security-reviewer.md`: model stays opus (the lead passes sonnet on Normal); add "scope is the diff's files; gitleaks and semgrep findings are already covered".
- [x] `claude/agents/integration-checker.md`: add "run only when the diff touches UI and API; check only the changed actions".
- [x] `README.md` diagram 2: order, tier by diff, plan, Gate 1, build, tool gate, tier crew, fix list (scoped re-check, max 3 rounds), PR.
- [x] `CHANGELOG.md` and `docs/STATUS.md`.

## Proof: benchmark (budget about $20)
- [x] Order 1 (Tiny): re-run the PR #11 README order from commit `eb7209e` with its three known mediums seeded (a diagram claim that is not true, a stale installer line, loose tests).
- [x] Order 2 (Normal): re-run the normal order from the tiered-models benchmark (a small todo CLI feature).
- [x] Order 3 (Risky): one order with two seeded defects: a missing permission check and an SQL string built by concatenation.
- Run each order on the old handbook (`09e8b70`) and on the new one, in throwaway folders.
- Record per order: runs, sub-agent tokens, opus and fable tokens, cost, lead cost, seeded defects caught.
- Pass: Order 1 uses at most 215k tokens and catches 3 of 3; Order 2 costs at most 60% of the old run; Order 3 catches 2 of 2 with no check dropped. A missed seeded defect means that cut is undone.

## After this plan
- [ ] Release the lean workflow as v1.1.0.
