---
name: security-checklist
description: Full web app security checklist based on OWASP Top 10:2025. Check every item on every review, not only issues someone mentions.
---
For each changed area, check every item. Report file:line, risk, fix.

A01 Broken access control (incl. SSRF)
- Every endpoint checks login, role AND ownership (org/group/user) on
  the server. Deny by default.
- Changing an ID in a URL or body never reaches others' data.
- Server never fetches user-supplied URLs without an allowlist.
- CORS allows only our own origins.
A02 Security misconfiguration
- CSP, HSTS, X-Content-Type-Options, frame-ancestors headers.
- No debug mode, stack traces, default accounts or open admin routes in
  production. Cookies httpOnly, Secure, SameSite.
A03 Software supply chain
- Lockfile committed; npm audit / osv-scanner: no high or critical.
- New packages are maintained, widely used and correctly spelled.
- No third-party scripts without an integrity hash.
A04 Cryptographic failures
- HTTPS only. Passwords hashed with argon2/bcrypt. No homemade crypto.
- Personal data (IDs, phone numbers) minimised, never in logs or URLs.
A05 Injection
- ORM or parameterised queries only; no string-built SQL, shell
  commands or eval. Schema validation on every input.
- No user content rendered as raw HTML.
A06 Insecure design
- Business rules (limits, durations, points, prices) enforced on server.
- Rate limits on login, sign-up and public forms.
- Unique constraints / transactions stop double submits.
A07 Authentication failures
- Established auth library. Session expiry; new session on login.
- Generic login errors, backoff after failures, single-use expiring
  reset tokens. MFA option for admins.
A08 Software or data integrity
- Verify webhook signatures. No unsafe deserialisation.
A09 Logging and alerting
- Log logins, permission denials, admin actions (who, what, when).
  Never log secrets or passwords.
A10 Mishandling exceptional conditions
- On error, fail closed (deny). Roll back transactions. Users see
  generic messages only.
Also: uploads checked for type and size; the built frontend bundle
contains no secrets; the browser gets only the data it needs.
