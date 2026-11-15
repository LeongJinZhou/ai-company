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
- Lean workflow approved on 2026-11-15 (plan in `docs/PLAN.md`): tier by diff (Tiny, Normal, Risky), tool gate before any reviewer, one security review, scoped re-checks, sonnet for security and tester on Normal tasks.
- The lean workflow is proven by a full benchmark: three fixed orders on the old and the new handbook, budget about $20.

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
Build the lean workflow from `docs/PLAN.md` in a fresh session on opus, then run the benchmark.
