---
name: backend-standards
description: Backend architecture, logic, testing and performance standards. Use when designing, building or testing server code.
---
Structure
- Route -> validation -> service (business rules) -> data access.
  Business logic never lives in route handlers or the UI.
- Follow docs/API.md exactly. One error shape:
  { error: { code, message } } with correct HTTP status codes.
Data
- Schema changes only through migrations.
- The database enforces rules too: NOT NULL, UNIQUE, foreign keys.
- Multi-step writes run in one transaction.
- Indexes on foreign keys and on filter/sort columns.
- Several organisations or many users: the scale-standards skill.
Testing
- Test first. Every business rule has unit tests with edge cases.
- Integration tests run against a real test database.
- Every endpoint tested for 200, 400, 401, 403 and 404.
- 80%+ coverage on services; no padding tests.
Performance
- Paginate lists. No N+1 queries. Select only needed columns.
- Cache read-heavy data. Heavy work runs as background jobs.
Other
- No magic numbers: rules like "30 minutes" live in settings.
- Times in UTC from the server clock. Repeatable actions idempotent.
