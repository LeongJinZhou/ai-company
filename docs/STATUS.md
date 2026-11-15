# Status

## Done
- Kit installed and verified by `node check.mjs`.
- PRs #1-#10 merged.
- Tiered model routing is live.
- GitHub settings applied: description, topics, squash-only merges, merged branches auto-delete, wiki off, main protected (CI check `test` required).

## Decisions
- Lead model is opus.
- Squash merges only.
- Repo is private, no licence.

## Open issues
- Three workers skipped their assigned skills in the last benchmark.
- The installers do not merge `claude/settings-additions.json` automatically.
- `check.mjs` does not verify the rules, skills and templates links.
- CI actions are pinned by tag, not commit SHA.

## Next step
Merge the repo-polish PR, then release v1.0.0.
