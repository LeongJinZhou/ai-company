# ai-company

My personal AI software company for Claude Code. I give the order; ECC leads the
work; staff agents and plugin skills do it.

    Founder (you)
      -> ECC plugin (lead: plans, picks agents and skills, runs the workflow)
           -> staff agents (claude/agents) and plugin skills
      always on: security, scale and testing rules (claude/rules)

## What is in here

| Path | What |
|---|---|
| `claude/CLAUDE.md` | The handbook every session reads first |
| `claude/rules/` | Always-on rules: security, scale, testing, skill map |
| `claude/agents/` | 12 staff agents |
| `claude/skills/` | Company skills (new-project, brief-to-spec, standards, checklist) |
| `claude/templates/`, `claude/git-hooks/` | Project templates and git safety hooks |
| `plugins.txt` | Every plugin, and whether it is on or off |
| `refs.txt` | Reference repos kept in `~/.claude/vendor` |
| `update.sh`, `check.mjs` | Update everything to latest, then verify |

## New laptop

1. Install Git, then clone this repo into your home folder:
   `git clone https://github.com/LeongJinZhou/ai-company` (sign in when asked; the repo is private).
2. Double-click `install-windows.bat` (Windows) or `install-mac.command` (Mac).
3. Merge `claude/settings-additions.json` into `~/.claude/settings.json`.
4. Restart Claude Code.

The installer ends with `OK: ...` when the laptop matches `plugins.txt`.

## Update (any laptop, any time)

    bash update.sh

It pulls this repo, then the latest version of every marketplace, plugin and
reference repo, and checks the result. On Windows run it from Git Bash.
`bash update.sh --check` only checks.

## Plugins

Core plugins (`on` in `plugins.txt`) load in every session. The rest are
installed but off, so they cost nothing until needed. `claude/rules/skill-map.md`
tells the lead which one to enable for which kind of task:

    claude plugin enable <plugin@marketplace> --scope project

To change the set everywhere: edit `plugins.txt`, commit, push, run
`bash update.sh` on each laptop.

Plugins run their own hooks and code on your machine. Only add ones you trust.

## Changing the company

Edit files here, commit, push. Other laptops get it with `bash update.sh`.
`node --test` runs the tests; CI runs them on every push.
