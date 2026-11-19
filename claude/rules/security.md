# Security rules (every project, every task)

Apply these without being asked, from the first line of a prototype. Apply
what the product has: a page with no login needs no session rules. Never
skip a rule that does apply.

## Never trust the browser
- All permission checks happen on the server. Hiding a button is only
  for looks; the endpoint must still refuse.
- Anything that matters (times, totals, prices, roles, points) is
  calculated on the server, never accepted from the client.
- APIs return only the fields this user may see. Never send password
  hashes, other users' data or secrets.
- No secrets in frontend code or public env vars. Secrets live in .env
  on the server or in the host's settings; .env is in .gitignore.

## Data and input
- Database access only through the ORM or parameterised queries. Never
  build SQL by joining strings.
- Validate every request body, query and param on the server with a
  schema (e.g. zod). Reject unknown fields.
- Every query on owned data is scoped to its owner: the user, group or
  organisation it belongs to.
- No raw HTML from users.

## Auth and sessions
- Established auth library only; no hand-rolled crypto.
- Sessions in httpOnly, Secure, SameSite cookies, never localStorage.
  Passwords hashed with argon2 or bcrypt.
- Rate-limit login and sensitive endpoints. CSRF protection on
  state-changing requests.

## Operations
- Security headers (CSP, HSTS, X-Content-Type-Options, frame-ancestors).
- Generic error messages to users; details only in server logs. Never
  log passwords, tokens or personal data.
- Audit log for admin actions (who, what, when).
- Full checklist: the security-checklist skill (OWASP Top 10:2025).
