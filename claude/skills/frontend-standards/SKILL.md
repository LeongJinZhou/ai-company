---
name: frontend-standards
description: Frontend logic, quality, accessibility and performance standards. Use when building or reviewing screens.
---
Logic
- One API client. Server data through a query library with loading,
  error and empty states on every screen.
- Form validation uses the same schema as the server (client checks
  are for convenience only).
- Hide actions the role can't do (for looks; the server decides).
Quality
- Small components, one design system, shared design tokens.
- Mobile-first: works on a phone screen first.
- WCAG 2.2 AA: labels on inputs, full keyboard use, visible focus,
  enough colour contrast.
Testing
- A Playwright test for every user story the screen serves.
Safety
- No secrets or personal data in localStorage, URLs or console logs.
Performance
- Split code per page, optimise images, aim for LCP under 2.5s.
