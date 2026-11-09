---
name: brief-to-spec
description: Turns a short, rough project idea into an approved docs/SPEC.md by asking the founder multiple-choice questions with recommended defaults. Use whenever the founder gives a brief for a new project or feature.
---
# Brief to spec

The founder writes short, informal briefs. Turn one into a precise spec
without making them write more.

## Step 1: Restate
Repeat the idea in 2-3 plain sentences: who uses it, what it does, the
key rule.

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

## Step 4: Approval
Show a summary of max 10 lines plus the assumptions list. Ask:
"Approve, or tell me what to change." No architecture or code until
approved.
