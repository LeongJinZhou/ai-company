# Status

## Done
- Kit installed and verified by `node check.mjs`.
- PRs #1-#11 merged. v1.0.0 released.
- v1.1.0 released on 2026-11-16 (lean workflow, CI actions v7). Release checks: 15/15 tests, gitleaks clean, security-researcher no blocking advisories. A second security review (opus, on `git diff v1.0.0..main`) finished after the tag and found 2 medium gaps in the tier rule: the install lists (`plugins.txt`, `skills.txt`, `refs.txt`), `rules/`, `templates/`, `*.cmd` and `*.ps1` could count as Tiny and skip the security review. Semgrep did not run in that second check (rules could not be downloaded).
- Tiered model routing is live.
- Lean workflow merged in PR #15 (founder ok on 2026-11-16). Each laptop needs `bash update.sh` to install the new handbook.
- GitHub settings applied: description, topics, squash-only merges, merged branches auto-delete, wiki off, main protected (CI check `test` required).
- README has a banner, a CI badge and three diagrams; tests keep its numbers and links true.
- `claude/settings-additions.json` matches the live settings (lead model opus, ECC GateGuard off).

## Decisions
- Lead model is opus. A lead that starts on another model warns the founder in one line and waits.
- Squash merges only.
- Repo is private, no licence.
- Lean workflow approved on 2026-11-15 (plan in `docs/PLAN.md`), built in PR #15: tier by diff (Tiny, Normal, Risky), tool gate before any reviewer, one security review, scoped re-checks, sonnet for security and tester on Normal tasks. The opus security review widened the Risky list beyond the plan (agent instruction files, headers, CORS, cookies, crypto, raw SQL or HTML, webhooks, logging, outbound requests, Docker or deploy config).

## Benchmark (2026-11-16, old = v1.0.0 handbook `09e8b70`, new = PR #15 `3b5ecc5`)
Each run with `claude -p` on opus in a throwaway folder; cost from the run's result event. Orders 1 and 3 start after the build, with a seeded draft; order 2 is the full todo CLI order.

| Order | Tier picked (new) | Cost old -> new | Sub-agent runs | Sub-agent tokens | Opus tokens | Fable tokens | Lead tokens | Seeded defects caught | Pass line |
|---|---|---|---|---|---|---|---|---|---|
| 1 README polish | Normal | $3.47 -> $2.27 (65%) | 14 -> 10 | 400k -> 273k | 3.02M -> 2.24M | 0 -> 0 | 1.80M -> 2.06M | 3/3 -> 3/3 | missed: 273k > 215k |
| 2 todo CLI | Risky | $2.82 -> $2.65 (94%) | 12 -> 16 | 330k -> 270k | 2.15M -> 2.35M | 0 -> 51k | 1.53M -> 2.04M | none seeded | missed: 94% > 60% |
| 3 notes search and delete | Risky | $3.64 -> $2.32 (64%) | 16 -> 9 | 464k -> 206k | 3.30M -> 2.35M | 0 -> 0 | 2.11M -> 2.00M | 2/2 -> 2/2 | passed, no check dropped |
| 1 re-run, tuned `b8c04f7` | Normal | $3.47 -> $1.97 (57%) | 14 -> 9 | 400k -> 203k | 3.02M -> 2.04M | 0 -> 0 | 1.80M -> 1.88M | 3/3 -> 3/3 | passed |
| 2 re-run, tuned `b8c04f7` | Normal | $2.82 -> $2.07 (73%) | 12 -> 17 | 330k -> 210k | 2.15M -> 1.75M | 0 -> 0 | 1.53M -> 1.66M | none seeded | missed: 73% > 60% |

- Total spend $21.21 (first round $17.17, tuned re-runs $4.04). No seeded defect was missed, so no cut is undone.
- First round: order 2 went Risky because "request input or validation" covered any CLI that validates its own arguments. The tune limits it to trust boundaries (with the security reviewer's exceptions) and asks the lead to batch its turns; order 2 then ran as Normal.
- The opus lead is most of the cost in every run (1.5M to 2.1M tokens processed). Each lead turn starts from about 74k tokens of context (system prompt, plugins, handbook), and the lead took 18 to 22 turns. Sub-agent tokens fell 36% to 56%.
- Semgrep did not run in any benchmark run (rules could not be downloaded).

## Cost baseline (2026-11-15, ECC cost tracker estimates)
- Task "repo polish" (docs only, PR #11): 12 sub-agent runs, about 533k sub-agent tokens; checks and re-checks were 69% of them. Lead session on Fable: about $11.
- All projects that day: fable $109 (5 sessions), opus $32 (11), sonnet $1 (4), haiku $0.02 (3).
- Task "tier-rule fix" (2026-11-16, Risky): 8 sub-agent runs (2 of them resumed agents), about 185k sub-agent tokens, 1 fix round. The second release check before it: 2 runs, about 90k tokens. Lead on Fable; cost not yet read from `npx ccusage`.

## Open issues
- Workers skip their assigned skills: three of eight checker runs in PR #11 opened none.
- The installers do not merge `claude/settings-additions.json` automatically.
- `check.mjs` does not verify the rules, skills and templates links.
- CI actions are pinned by tag, not commit SHA.
- CI uses `node-version: 22`, which floats to the latest 22.x. Laptops need Node 22.23.5 or later (security release of 2026-11-11).
- Plugins in `plugins.txt` are unpinned, and nobody has checked them one by one for advisories.
- The desktop app's model picker overrides `"model": "opus"` in `settings.json`; set the model in the app for each new session.
- Low findings from the second release review (2026-11-16), not fixed: `office-proxy.mjs` accepts any `*.ts.net` host, not only this machine; the pre-commit hook passes silently when gitleaks is missing; `claude/templates/ci.yml` has no `permissions:` block; the installers leave ccusage and semgrep unpinned; the tool gate does not say "semgrep not run".
- Semgrep cannot download its rules on this laptop, so it has not run in any gate here.
- Tier rule, after the fix: `docs/STATUS.md`, `docs/PLAN.md` and the README install commands still count as Tiny. The tier test checks words, not behaviour, and does not guard the end of the Risky paragraph.
- Two sessions ran the v1.1.0 release at the same time; the second review's hold request arrived after the tag.
- Git for Windows on this laptop is 2.56.0; the security-researcher reported a fix in 2.56.1 (source not verified).

## Next step
The fix for the 2 medium tier-rule gaps is built and checked on branch `fix/tier-rule-gaps` (plan approved by the founder on 2026-11-16, Risky tier). Founder "ok" merges the PR; then `bash update.sh` on each laptop; then v1.1.1 on the founder's "release". Order 2 still misses its 60% line; the next lever is the lead's 74k starting context (plugins loaded in every session), which the handbook cannot change.
