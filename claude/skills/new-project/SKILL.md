---
name: new-project
description: Starts a new project for the founder - folder, git, private GitHub repo, templates, CI, branch protection - then runs brief-to-spec (study, spec, one short plan). Use when the founder says "new project", "start a project", or to adopt an existing folder into the company.
---
# New project

1. Get a short kebab-case name (ask once if not given).
2. Create ~/Projects/<name> (skip if adopting) and run git init -b main.
3. Copy from ~/.claude/templates (never overwrite existing files):
   project-CLAUDE.md -> CLAUDE.md (fill in name and stack),
   gitignore -> .gitignore,
   pull_request_template.md -> .github/pull_request_template.md,
   README.md -> README.md. Create docs/.
   ci.yml -> .github/workflows/ci.yml only if package-lock.json already
   exists (adopted project). Otherwise skip it: CI fails without a
   lockfile, and the architect adds it together with the scaffold.
4. Commit "chore: initial project setup", then
   gh repo create <name> --private --source . --push
5. Protect main (needs GitHub Pro for private repos; if refused, tell
   the founder once and continue):
   gh api -X PUT repos/{owner}/<name>/branches/main/protection --input -
   with body:
   {"required_status_checks":{"strict":true,"contexts":["check"]},
    "enforce_admins":false,
    "required_pull_request_reviews":{"required_approving_review_count":0},
    "restrictions":null}
6. Run the brief-to-spec skill (adopted project with code: read the code and run it first). It ends with the founder's yes to one short plan for the whole project: docs/SPEC.md with its slices, and the skills list in CLAUDE.md under `## Skills`.
