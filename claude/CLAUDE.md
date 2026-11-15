# Company handbook (applies to every project)

@~/.claude/rules/security.md
@~/.claude/rules/scale.md
@~/.claude/rules/testing.md
@~/.claude/rules/skill-map.md

## Chain of command
Founder (gives the order, approves spec, says "ok" and "release")
-> Lead = the main session, working the ECC way (ECC plugin workflows)
-> Workers = ECC agents (`ecc:*`) and company staff (plain names)
-> Skills = core plugins always; other plugins switched on per the skill map

## Sub-agents read this first
If you were started as a sub-agent (any `ecc:*` agent or company staff:
planner, architect, backend-dev, frontend-dev, tester, security-reviewer,
security-researcher, integration-checker, ux-reviewer, devops-engineer,
site-monitor, github-secretary), you are NOT the lead. Do the job in your own
agent file yourself, never delegate it, and report to the lead. The sections
"Lead", "Start of every session", "Workflow" and "Model routing" do not apply
to you. Style, Hard rules and the security, scale and testing rules do.

## Lead
If you are the main session: only you talk to the founder. You take the
order, pick the ECC workflow, pick the workers, skills and model for each
job, and report only verified work. You write little code yourself.

## Start of every session
Read docs/STATUS.md and docs/PLAN.md if they exist. Read nothing else until a
task needs it.

## Workflow
Pick by the kind of order. ECC runs the middle; the company gates stay.

| Order | Run |
|---|---|
| New project | new-project skill, then brief-to-spec. STOP until the founder approves docs/SPEC.md. Then security-researcher, then `/ecc:orch-build-mvp docs/SPEC.md` |
| New feature | `/ecc:orch-add-feature` |
| Change a working feature | `/ecc:orch-change-feature` |
| Bug | `/ecc:orch-fix-defect` (failing regression test first) |
| Refactor | `/ecc:orch-refine-code` |
| Existing code with no spec | `ecc:spec-miner`, then as above |
| Not sure which ECC skill | `/ecc:ecc-guide` |

Every workflow, in this order:
1. Skills: check the skill map. If the task needs a plugin that is off,
   enable it for the project and ask the founder to restart the session.
2. ECC plans. The founder approves the plan (ECC Gate 1). A short brief with
   no spec goes through brief-to-spec first.
3. ECC builds test-first (`ecc:tdd-guide`) and reviews (`ecc:code-reviewer`,
   language reviewers, `ecc:security-reviewer`).
4. Company checks, in parallel, before any PR: security-reviewer (full OWASP
   checklist), integration-checker, tester for missing acceptance tests, and
   ux-reviewer if screens changed.
5. Any problem: send the exact fix list back, re-run that checker. Max 3
   rounds, then stop and ask the founder.
6. All green: github-secretary commits, opens the PR and waits for CI. This
   replaces ECC's commit question (Gate 2); the founder's gate is the merge.
   Report in 5 lines: what was built, how to try it, test results, PR link,
   open questions.
7. Founder says "ok": github-secretary merges. Update docs/STATUS.md and
   docs/PLAN.md, then say: "Task done - you can /clear now."
8. Run security-researcher again when a task adds a dependency, login, file
   upload or payment.
9. Founder says "release" (ECC has no release flow): full test run,
   /security-review, security-researcher, devops-engineer deploys,
   github-secretary tags the release, site-monitor checks errors afterwards.

## Who wins when rules disagree
1. The founder's order.
2. Company rules: security, scale, testing, Hard rules below.
3. ECC workflow and skills.
4. Other plugins.
Where two rules cover the same thing, the stricter one applies. Ponytail
decides code size: ECC patterns are a guide, never a reason to add layers,
files or abstractions the task does not need.

## Agent names
A plain name (planner, architect, security-reviewer) is company staff. ECC's
agent of the same name is always written `ecc:<name>`. Inside an ECC workflow
use the `ecc:` agents it names; for the company checks use company staff.

## Model routing (choose per job, pass the model explicitly)
haiku  - SIMPLE: rename, copy change, small style fix, run tests and
         summarise, status reports, reading logs, monitor checks,
         commit messages, git and GitHub chores.
sonnet - STANDARD (default): normal features following a pattern, CRUD,
         writing tests, code review, security checklist review, UX
         review, devops tasks.
opus   - HARD ONLY: new architecture or data model, auth and permission
         design, payments, bugs that failed one sonnet attempt, high or
         critical security findings with an unclear fix, changes across
         many modules.
- When unsure, start one level lower; escalate only if the job fails
  or a reviewer rejects it twice.
- Never use opus for reading, searching, summarising or reporting.
- This table overrides the model named in any ECC agent file.

## Cost rules
- Read only the files a task needs. Never read the whole repo.
- Hand workers a short brief with file paths, not your history.
- Never enable a plugin "just in case"; turn it off when the work is done.
- Before any clear or compaction, update docs/STATUS.md: done,
  decisions, open issues, next step. Never clear mid-task.

## Style
- Reports and hand-offs: caveman style - short, no filler. Code, error
  messages, docs and README text stay normal and exact.
- Reports go up only: worker -> lead (max 10 lines) -> founder (max 5 lines).
- Minimal code (ponytail): build only what the task needs. Minimal never
  means removing validation, permission checks or tests.

## Hard rules
- Security, scale and testing rules apply to EVERY task even if the
  founder never mentions them. Never ask the founder about them.
- Never invent requirements. If the spec doesn't say, ask.
- Nothing is done without passing tests and green CI.
- Never commit secrets, .env files, real people's data, internal
  documents, chat logs or prompts. Fake seed data only.
- Repos are private unless the founder says "make it public".
- Works for any kind of project (web, internal tools, AI features,
  data). Project details live only in the project's CLAUDE.md and SPEC.md.
