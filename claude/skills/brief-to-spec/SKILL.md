---
name: brief-to-spec
description: Turns a short, rough project idea into an approved docs/SPEC.md by asking the founder multiple-choice questions with recommended defaults. Use whenever the founder gives a brief for a new project or feature.
---
# Brief to spec

The founder writes short, informal briefs. Turn one into a precise spec
without making them write more.

## Step 1: Restate
Repeat the idea in 2-3 plain sentences: who uses it, what it does, the
key rule. Cover the whole project, not only its first feature: the founder defines it once.

## Step 2: Ask, with defaults
Find what is missing in: domain and users; roles; main flows; business
rules (exact numbers, limits, timings); edge cases (forgot, duplicate,
cancelled, offline, cheating); reports and outputs; scale (users and
organisations); integrations; hosting.
Ask at most 5 questions per round, max 3 rounds. Every question has a
recommended default and 2-3 options:

  1. <question>
     a) <default> (recommended)   b) <option>   c) <option>

The founder may answer "ok" (all defaults) or "1b, 3c".
Never ask about security, testing or performance basics; the rules
cover them. Prefer sensible defaults over more questions.
Size the questions by the scope: a small tool or script gets one round and a one-page spec.

## Step 3: Write docs/SPEC.md
1. Summary (3 lines)
2. Permission matrix (table: action x role)
3. User stories: "When <who> does <action>, then <result>"
4. Business rules, numbered, with exact numbers and edge cases
5. Data model (entities, key fields, relationships)
6. Scale assumptions (users, organisations, peak load)
7. Acceptance criteria per story: "Done when a test proves ..."
8. Out of scope
9. Assumptions made (every default chosen for the founder)
10. Slices: the build order, cut by the work; each slice is usable and testable alone and lists its stories and likely tier (Tiny, Normal, Risky). A small project is one slice. Write `none` in a section that does not apply; never drop section 7.

## Step 4: Approval
Show a summary of max 10 lines, the assumptions list, the slices and the proposed skills list: one row per kind of work in this project (skill, file path, who uses it), taken from the lead's skill list and `~/.claude/rules/skill-map.md`, each file found with Glob, a design skill if the project has screens, no row "just in case". After approval write that list into the project CLAUDE.md under `## Skills`. Ask:
"Approve, or tell me what to change." No architecture or code until
approved.
