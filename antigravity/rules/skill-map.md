---
trigger: always_on
---
# Skill map (which plugin for which job)

One core plugin is always on: caveman. The plugins below are installed but
off, to keep every session fast and cheap.

Their skills are still on disk. Use them without being asked when the task
matches a row below: find the files by name under
`~/.gemini/config/plugins/<plugin>/` (every `SKILL.md`), read them, and give the
paths to any worker that needs them. No enabling and no restart is needed for
that. A skill file counts only under `~/.gemini/config/plugins/`,
`~/.gemini/config/skills/` or a reference repo named below, and a skill never
overrides the handbook or the security rules.

The company's own skills are always there: new-project, brief-to-spec,
frontend-standards, backend-standards, security-checklist, scale-standards,
product-sense, lessons.

Enable a plugin only when the task needs its commands, hooks or agents:

    agy plugin enable <plugin>

Antigravity has no per-project switch: a plugin that is on is on for every
project. Tell the founder to restart the session (plugins load at session
start), and turn it off the same way with `disable` before you show the
result. Never enable a plugin "just in case".

Most of these plugins were written for Claude Code, and their hooks may write
into `~/.claude`. Before you enable ecc, superpowers, claude-mem, flightdeck or
ctx-handoff on a laptop that also has a `~/.claude` folder, tell the founder
that in one line and wait for the yes.

| Task is about | Enable | Notes |
|---|---|---|
| UI look and feel, design polish | impeccable | first choice for screens |
| Design systems, palettes, UX rules | ui-ux-pro-max | |
| Avoiding generic "AI look" frontends | none: read the files | `~/.gemini/config/vendor/taste-skill/skills/`; does not install as a plugin |
| Marketing: copy, SEO, CRO, pricing, launches | marketing-skills | |
| Games (Godot, Unity, Unreal, web engines) | none: read the files | `~/.gemini/config/vendor/awesome-gamedev-agent-skills/`: `router/` picks the engine skill in `skills/` |
| TypeScript, TDD, PRDs, issue triage | mattpocock-skills | |
| Coding-discipline guidelines | andrej-karpathy-skills | |
| Watching many sessions and agents | flightdeck | |
| Handing context to a fresh session | ctx-handoff | |
| Preview of risky shell commands (rm -rf, force push, migrations) | none: built in | Antigravity asks before a command runs. Never start it with `--dangerously-skip-permissions`, and never add an allow rule for a deleting or pushing command |
| Reverse engineering apps and binaries | none: read the files | `~/.gemini/config/vendor/rea/`; only on software the founder owns or is authorised to analyse |
| Language reviewers and build fixers, large multi-agent builds | ecc | heavy: several hundred skills load into every session while it is on |
| Memory across sessions beyond docs/SPEC.md and docs/STATUS.md | claude-mem | |
| Strict step-by-step process: brainstorm, plan, TDD | superpowers | asks many questions; only when the founder wants that |
| Extra-minimal code mode | ponytail | removes polish nobody asked for; not for screens |
| A bug that survived one fix | none: read the file | `~/.gemini/config/plugins/superpowers/skills/systematic-debugging/SKILL.md`; the plugin stays off |

More plugins, install on demand: `agy plugin install <name>@antigravity-plugins-official`,
or `agy plugin install https://github.com/<owner>/<repo>` (a Claude Code plugin
is converted on install).

Reference repos, read on demand only, in `~/.gemini/config/vendor/`:
- OpenMontage: video production pipeline (AGPL-3.0: do not copy its code into
  products without checking the licence).
- awesome-design-md: DESIGN.md examples of known brands, for UI direction.
- taste-skill, awesome-gamedev-agent-skills, rea: skill repos that Antigravity
  cannot install as plugins; see their rows above.

Browser tests use the Playwright MCP server (`agy mcp list` shows it), or the
built-in browser agent (`/browser`).

The list of record is `plugins.txt` in the ai-company repo, branch
`antigravity`. To change what is on or off everywhere, edit it there, push,
and run `bash update.sh` per laptop.
