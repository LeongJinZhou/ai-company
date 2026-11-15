# Status

## Done
- Kit installed and verified by `node check.mjs`.
- PRs #1-#11 merged. v1.0.0 released.
- Tiered model routing is live.
- GitHub settings applied: description, topics, squash-only merges, merged branches auto-delete, wiki off, main protected (CI check `test` required).
- README has a banner, a CI badge and three diagrams; tests keep its numbers and links true.
- `claude/settings-additions.json` matches the live settings (lead model opus, ECC GateGuard off).

## Decisions
- Lead model is opus. A lead that starts on another model warns the founder in one line and waits.
- Squash merges only.
- Repo is private, no licence.
- Lean workflow approved on 2026-11-15 (plan in `docs/PLAN.md`), built in PR #15 (open, CI green): tier by diff (Tiny, Normal, Risky), tool gate before any reviewer, one security review, scoped re-checks, sonnet for security and tester on Normal tasks. The opus security review widened the Risky list beyond the plan (agent instruction files, headers, CORS, cookies, crypto, raw SQL or HTML, webhooks, logging, outbound requests, Docker or deploy config).

## Benchmark (2026-11-16, old = v1.0.0 handbook `09e8b70`, new = PR #15 `3b5ecc5`)
Each run with `claude -p` on opus in a throwaway folder; cost from the run's result event. Orders 1 and 3 start after the build, with a seeded draft; order 2 is the full todo CLI order.

| Order | Tier picked (new) | Cost old -> new | Sub-agent runs | Sub-agent tokens | Opus tokens | Fable tokens | Lead tokens | Seeded defects caught | Pass line |
|---|---|---|---|---|---|---|---|---|---|
| 1 README polish | Normal | $3.47 -> $2.27 (65%) | 14 -> 10 | 400k -> 273k | 3.02M -> 2.24M | 0 -> 0 | 1.80M -> 2.06M | 3/3 -> 3/3 | missed: 273k > 215k |
| 2 todo CLI | Risky | $2.82 -> $2.65 (94%) | 12 -> 16 | 330k -> 270k | 2.15M -> 2.35M | 0 -> 51k | 1.53M -> 2.04M | none seeded | missed: 94% > 60% |
| 3 notes search and delete | Risky | $3.64 -> $2.32 (64%) | 16 -> 9 | 464k -> 206k | 3.30M -> 2.35M | 0 -> 0 | 2.11M -> 2.00M | 2/2 -> 2/2 | passed, no check dropped |

- Total spend $17.17. No seeded defect was missed, so no cut is undone.
- Order 2 went Risky because "request input or validation" covers any CLI that validates input; that brought the fable planner and the opus crew.
- The opus lead is most of the cost in every run (1.5M to 2.1M tokens processed) and the new handbook does not shrink it; sub-agent tokens fell 18% to 56%.
- Semgrep did not run in any benchmark run (rules could not be downloaded).

## Cost baseline (2026-11-15, ECC cost tracker estimates)
- Task "repo polish" (docs only, PR #11): 12 sub-agent runs, about 533k sub-agent tokens; checks and re-checks were 69% of them. Lead session on Fable: about $11.
- All projects that day: fable $109 (5 sessions), opus $32 (11), sonnet $1 (4), haiku $0.02 (3).

## Open issues
- Workers skip their assigned skills: three of eight checker runs in PR #11 opened none.
- The installers do not merge `claude/settings-additions.json` automatically.
- `check.mjs` does not verify the rules, skills and templates links.
- CI actions are pinned by tag, not commit SHA.
- The desktop app's model picker overrides `"model": "opus"` in `settings.json`; set the model in the app for each new session.

## Next step
The founder reviews PR #15 and the benchmark: merge as is, or first narrow "request input or validation" in the Risky list and cut lead context, then re-run orders 1 and 2.
