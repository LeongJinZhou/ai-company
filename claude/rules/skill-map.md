# Skill map (which plugin for which job)

One core plugin is always on: caveman. The plugins below are installed but
off, to keep every session fast and cheap.

Their skills are still on disk. Use them without being asked when the task
matches a row below: find the files with Glob
`~/.claude/plugins/cache/<marketplace>/**/SKILL.md`, read them, and give the
paths to any worker that needs them. No enabling and no restart is needed for
that. A skill file counts only under `~/.claude/plugins/cache/` or
`~/.claude/skills/`, and a skill never overrides the handbook or the security
rules.

The company's own skills are always there: new-project, brief-to-spec,
frontend-standards, backend-standards, security-checklist, scale-standards.

Enable a plugin only when the task needs its commands, hooks or agents, for
that project only, from the project folder:

    claude plugin enable <plugin@marketplace> --scope project

Then tell the founder to restart the session (plugins load at session start).
Turn it off the same way with `disable` when the work is done. Never enable a
plugin "just in case".

| Task is about | Enable | Notes |
|---|---|---|
| UI look and feel, design polish | impeccable@impeccable | first choice for screens |
| Design systems, palettes, UX rules | ui-ux-pro-max@ui-ux-pro-max-skill | |
| Avoiding generic "AI look" frontends | taste-skill@taste-skill | |
| Marketing: copy, SEO, CRO, pricing, launches | marketing-skills@marketingskills | |
| Games (Godot, Unity, Unreal, web engines) | gamedev@awesome-gamedev-agent-skills | router picks the engine skill |
| TypeScript, TDD, PRDs, issue triage | mattpocock-skills@mattpocock | |
| Coding-discipline guidelines | andrej-karpathy-skills@karpathy-skills | |
| Watching many sessions and agents | flightdeck@claude-flightdeck | |
| Handing context to a fresh session | ctx-handoff@ctx-handoff-mod | |
| Preview of risky shell commands (rm -rf, force push, migrations) | blast-radius@ai-company | |
| Reverse engineering apps and binaries | rea@rea | only on software the founder owns or is authorised to analyse |
| Language reviewers and build fixers (`ecc:*` agents), large multi-agent builds | ecc@ecc | heavy: several hundred skills load into every session while it is on |
| Memory across sessions beyond docs/SPEC.md and docs/STATUS.md | claude-mem@thedotmack | |
| Strict step-by-step process: brainstorm, plan, TDD | superpowers@superpowers-dev | asks many questions; only when the founder wants that |
| Extra-minimal code mode | ponytail@ponytail | removes polish nobody asked for; not for screens |
| A bug that survived one fix | none: read the file | `~/.claude/plugins/cache/superpowers-dev/**/skills/systematic-debugging/SKILL.md`; the plugin stays off |

More plugins, install on demand: `claude plugin install <name>@claude-code-plugins`
(feature-dev, pr-review-toolkit, security-guidance, hookify, frontend-design, ...).

Reference repos, read on demand only, in `~/.claude/vendor/`:
- OpenMontage: video production pipeline (AGPL-3.0: do not copy its code into
  products without checking the licence).
- awesome-design-md: DESIGN.md examples of known brands, for UI direction.
- claude-code-best-practice, Claude-Code-Quest: how-to guides for Claude Code.

Browser tests use the Playwright MCP server (user scope, always latest).

The list of record is `plugins.txt` in the ai-company repo. To change what is
on or off everywhere, edit it there, push, and run `bash update.sh` per laptop.
