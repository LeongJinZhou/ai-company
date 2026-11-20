---
trigger: always_on
---
# Testing rules (every task)

Tests grow with the product. Never delete, skip or weaken a test to make it
pass.

## Prototype (the default)
- Every function with real logic gets a unit test: the normal case, the
  edges, the errors. For a bug: the failing test first, then the fix.
- Every feature is run through the real product before it is shown. With
  screens: clicked through in a real browser. Without screens: driven
  through its real entry point.
- Each finished feature leaves one saved browser test (Playwright) of its
  main path, so a later change cannot quietly break it.
- Lint and typecheck pass where the project has them.

## Before real users or real data
All three levels, on a clean run, with CI on GitHub green:
- Unit: every function with logic, incl. edge cases and errors.
- Integration: units working together - service + real test database,
  endpoint -> service -> database, permission checks.
- End-to-end: every user story in SPEC.md run through the real product
  (Playwright for screens; a real test database, no mocks of our own code).
Coverage: 80%+ on services and business logic. No padding tests.
