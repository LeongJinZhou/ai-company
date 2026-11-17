<p align="center"><img src="docs/assets/banner.svg" alt="ai-company" width="100%"></p>

[![ci](https://github.com/LeongJinZhou/ai-company/actions/workflows/ci.yml/badge.svg)](https://github.com/LeongJinZhou/ai-company/actions/workflows/ci.yml)

My personal AI assistant for Claude Code, built like a small software company.
I give a topic and a few rough points. It studies the product, shows me one short plan, and after my yes it builds, checks its own work and shows me the result.

## How it works

```mermaid
flowchart TD
    F["Founder<br>a topic and a few rough points,<br>one yes to the plan"] --> L["Lead: the main session<br>studies, proposes, builds,<br>checks and shows"]
    L --> S["Skills, picked per task<br>a design skill for every screen,<br>frontend, backend and security standards"]
    L --> W["13 staff agents<br>independent reviewers for code, security<br>and screens; builders for independent parts"]
    R["Always on<br>security and testing rules"] -.-> L
    R -.-> W
    D["Only the founder decides<br>deploy, delete, publish, pay, secrets,<br>commit, merge and release"] -.-> L
```

## From order to result

```mermaid
flowchart TD
    A["Order: a topic and rough points"] --> B["1. Study<br>read and run the project, or find out<br>what a good product of this kind has"]
    B --> S{"Small order?<br>a fix or one clear tweak"}
    S -- yes --> D
    S -- no --> C["2. Propose<br>one plan, 15 lines at most: build, look,<br>data and security, left out, skills"]
    C --> Y{"Founder says yes?"}
    Y -- "change a line" --> C
    Y -- yes --> D["3. Build<br>with the plan's skills: design for every screen,<br>clean code, security from the first line"]
    D --> E["4. Check<br>tools and a real browser, then independent reviewers:<br>code always, screens, security"]
    E -- "something is off" --> D
    E -- good --> G["5. Show<br>screenshot or URL, what was assumed,<br>what is not done"]
    G --> H["Commit, merge, release:<br>only on the founder's word"]
    G --> P["Production, on the founder's word:<br>full sweep of the whole product<br>before real users or real data"]
```

The lead also thinks like a business partner. For a new product or a large feature it works out who it is for, what already exists, the simpler way and what it costs to run, and the plan says why the product is worth building and gives plain advice when it would build less or something different. What the company learns across projects goes into one short skill, `claude/skills/lessons/SKILL.md`, read when a project starts.

There are two modes. Building (steps 1 to 5) is the default and checks each change: the builder never has the last word, a code-reviewer reads every code change, and new screens and risky changes get their own reviewer. Production is the full sweep of the whole product, run once on the founder's word "production" before real users or real data: every test level, semgrep, the full security checklist, every dependency, every screen and endpoint.

The founder is not interviewed: no rounds of questions. The lead fills the gaps itself from the order, the project and what a good product of that kind has, and puts every choice in the plan. The founder is asked first only for outward or irreversible actions: deploying to production, deleting data or a repo, a force push, making a repo public, messages to real people, a paid service, secrets, and commit, merge and release. Changing the company itself also needs the founder's yes.

## What is in here

| Path | What |
|---|---|
| `claude/CLAUDE.md` | The handbook every session reads first |
| `claude/rules/` | Always-on rules: security, testing and the skill map. Every file here loads into every session, so nothing else goes in |
| `claude/agents/` | 13 staff agents |
| `claude/skills/` | 8 company skills: new-project, brief-to-spec, backend-standards, frontend-standards, security-checklist, scale-standards (read only when a product needs that scale), product-sense (business thinking for a new product or large feature), lessons (what was learned across all projects) |
| `claude/templates/` | 5 project templates |
| `claude/git-hooks/` | 2 git hooks: commit-msg, pre-commit |
| `plugins.txt` | Every plugin, and whether it is on or off |
| `refs.txt` | 4 reference repos kept in `~/.claude/vendor` |
| `skills.txt` | Skills pulled from their own GitHub repo (`/myoffice`: live view of all agents) |
| `.claude-plugin/marketplace.json` | This repo as a plugin marketplace (the blast-radius plugin) |
| `update.sh`, `check.mjs` | Update everything to latest, then verify |
| `office-proxy.mjs`, `office-remote.cmd` | Private phone access to the office page |
| `docs/STATUS.md`, `docs/PLAN.md` | Project state and the current plan |
| `CHANGELOG.md` | What changed, one line per change |

## New laptop

1. Install Git, then clone this repo into your home folder:
   `git clone https://github.com/LeongJinZhou/ai-company` (the repo is public; no sign-in is needed to clone it).
2. Double-click `install-windows.bat` (Windows) or `install-mac.command` (Mac).
3. Merge `claude/settings-additions.json` into `~/.claude/settings.json`. The file sets the lead model (`opus`), turns ECC GateGuard off, clears commit and PR attribution, and sets the ccusage status line. GateGuard is ECC's check-before-edit gate; the blast-radius plugin is the preview for risky shell commands.
4. Restart Claude Code.

The installer prints `OK: ...` when the laptop matches `plugins.txt`.

## Update (any laptop, any time)

    bash update.sh

It pulls this repo, then the latest version of every marketplace, plugin and
reference repo, and checks the result. On Windows run it from Git Bash.
`bash update.sh --check` only checks.

```mermaid
flowchart TD
    R["This repo"] --> I["install-windows.bat<br>install-mac.command<br>update.sh"]
    I --> H["~/.claude<br>CLAUDE.md, rules, agents,<br>skills, templates"]
    P["plugins.txt"] --> PI["plugins installed,<br>on or off"]
    X["refs.txt"] --> V["~/.claude/vendor"]
    S["skills.txt"] --> K["~/.claude/skills"]
    H -- "CLAUDE.md and agents" --> C["check.mjs prints OK"]
    PI --> C
    V --> C
    K --> C
```

## Plugins

There is 1 core plugin, always on (caveman), and 15 plugins that are off until a task needs them; one more marketplace is added for on-demand installs.

A plugin that is `on` in `plugins.txt` loads into every session, so the core
is kept small: with five plugins on, a new session loaded about 76,000 tokens
before the first word. The rest are installed but off, so they cost nothing
until needed. Their skill files are still on disk and the lead reads them
when a task matches. `claude/rules/skill-map.md` tells the lead which skill
or plugin fits which kind of task, and how to enable one for a project:

    claude plugin enable <plugin@marketplace> --scope project

To change the set everywhere: edit `plugins.txt`, commit, push, run
`bash update.sh` on each laptop.

Plugins run their own hooks and code on your machine. Only add ones you trust.

## Changing the company

Edit files here and open a pull request. It is squash-merged, and
`CHANGELOG.md` records each change. Other laptops get it with `bash update.sh`.
`node --test` runs the tests; CI runs them on every push.

## Watching the agents

Type `/myoffice` in Claude Code. A local page opens at `http://localhost:4545`
showing every session and what it is doing. `/myoffice stop` closes it.

First time in each browser: open **Settings** (gear, top right) and turn on
**Subagents**. They are hidden by default, and without them the workers the lead
sends out never appear. Turn on **Idle** as well to keep finished workers listed.

The page shows your prompts and replies. Start it with `/myoffice --private` before
sharing your screen.

### From your phone (private)

The office answers only on the laptop itself. To open it from your own phone,
without putting it on the public internet, use Tailscale (free):

1. Install Tailscale on the laptop and the phone; sign in to the same account
   on both.
2. On the laptop, once: `"%ProgramFiles%\Tailscale\tailscale.exe" serve --bg --http=80 4546`
3. Run `office-remote.cmd`. To start it at every login, put a file in the
   Windows Startup folder that calls it.
4. On the phone open `http://<laptop-name>.<tailnet>.ts.net/` and bookmark it.
   `tailscale status` on the laptop shows the name.

Only devices on your tailnet can open that link. The
laptop must be on. `office-proxy.mjs` is the small forwarder that makes this
work; it refuses every address that is not a `.ts.net` name. Windows only for
now. Never use `tailscale funnel` for this: that would make the page public.

## Security notes

- This repo is public. It holds the working method only: rules, agents, skills and the installer. Project code stays in its own private repos.
- No secrets, .env files or real data go in this repo. The `pre-commit` hook in `claude/git-hooks/` runs gitleaks on staged changes and blocks the commit if it finds a secret. It does nothing if gitleaks is not installed. It needs gitleaks 8.19 or newer; the installers install gitleaks.
