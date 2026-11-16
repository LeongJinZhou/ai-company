---
name: scale-standards
description: Rules for products that serve several organisations or many users - multi-tenant data, roles, pagination, background jobs. Use only when docs/SPEC.md says the product needs that scale; never for a prototype or a tool for one team.
---
# Scale standards

Apply these only when docs/SPEC.md says the product serves several
organisations or many users.

- Multi-tenant: every owned table has organisation_id; every query
  filters by it.
- Roles per organisation (and per group/club) from one permission
  table, never hard-coded per screen.
- Every list is paginated on the server.
- Indexes on foreign keys and on filter/sort columns. No N+1 queries.
- Heavy work (reports, exports, emails) runs as background jobs.
- Reports read from summary tables or caches, not full recalculation.
- Business numbers (limits, durations) live in settings, not code.
