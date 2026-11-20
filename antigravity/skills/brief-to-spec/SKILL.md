---
name: brief-to-spec
description: Turns a short, rough project idea into docs/SPEC.md by studying what a good product of that kind needs, without interviewing the founder. Use whenever the founder gives a brief for a new project or a large feature.
---
# Brief to spec

The founder writes short, informal briefs. Turn one into a precise spec
without making them write or answer more.

## Step 1: Study
Work out who uses the product, what it does and the key rule. Then find what
a good product of this kind has: the features its users expect, the screens,
the data, the risks. Cover the whole project, not only its first feature.
Use the product-sense skill for the business side: what exists, the simpler
way, success numbers, cost to run.
For an existing project, read the code and run it first: the spec describes
what is there plus what the founder wants changed.

## Step 2: Decide, with defaults
For everything the brief leaves open, choose the sensible default yourself:
domain and users; roles; main flows; business rules (exact numbers, limits,
timings); edge cases (forgot, duplicate, cancelled, offline, cheating);
reports and outputs; scale; integrations; hosting; look and theme.
Do not ask the founder to choose. Record every choice in section 9.
Only a choice that leads to two different products goes to the founder, as
one line in the plan with your pick first.
Size the spec by the scope: a small tool or script gets one page.

## Step 3: Write docs/SPEC.md
1. Summary (3 lines)
2. Permission matrix (table: action x role)
3. User stories: "When <who> does <action>, then <result>"
4. Business rules, numbered, with exact numbers and edge cases
5. Data model (entities, key fields, relationships; what lives on the server)
6. Scale assumptions (one team unless the brief says more)
7. Acceptance criteria per story: "Done when a test proves ..."
8. Out of scope
9. Assumptions made (every default chosen for the founder)
10. Slices: the build order, cut by the work; each slice is usable and testable alone. A small project is one slice.
11. Look and theme: the feel the product should have, taken from the founder's words and the kind of product; where motion belongs.
12. Business: target user, the problem, what exists, one or two success numbers, cost to run.
Write `none` in a section that does not apply; never drop section 7.

## Step 4: Show the plan
Show the handbook's step 2 plan, at most 15 lines: what will be built (the
founder's points and the ones you added), the look, data and security, what
is left out, and the skills this project will use (from
`~/.gemini/config/rules/skill-map.md`, each file found by name, a design skill if
the project has screens, no row "just in case"). Wait for the founder's yes.
After the yes, write the skills list into the project GEMINI.md under
`## Skills` and start building the first slice.
