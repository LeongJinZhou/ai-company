# Scale rules (design for large organisations by default)

- Multi-tenant: every owned table has organisation_id; every query
  filters by it.
- Roles per organisation (and per group/club) from one permission
  table, never hard-coded per screen.
- Every list is paginated on the server.
- Indexes on foreign keys and on filter/sort columns. No N+1 queries.
- Times stored in UTC from the server clock; shown in the user's zone.
- Repeatable actions (submit, clock in, pay) are idempotent.
- Heavy work (reports, exports, emails) runs as background jobs.
- Reports read from summary tables or caches, not full recalculation.
- Business numbers (limits, durations) live in settings, not code.
