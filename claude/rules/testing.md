# Testing rules (every task)

Write the failing test first, then the code.

Three levels, all required:
- Unit: every function with logic, incl. edge cases and errors.
- Integration: units working together - service + real test database,
  endpoint -> service -> database, permission checks.
- End-to-end (Playwright): every user story in SPEC.md clicked through
  in a real browser.

Coverage: 80%+ on services and business logic. No padding tests.

DONE means, on a clean run: lint, typecheck, unit, integration and e2e
tests pass, and CI on GitHub is green. Never delete, skip or weaken a
test to make it pass.
