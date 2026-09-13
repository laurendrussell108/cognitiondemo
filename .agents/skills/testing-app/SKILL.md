---
name: testing-internal-tools-foundation
description: Test the local feature-flag reference UI and foundation auth, RBAC, and audit boundaries.
---

# Runtime testing

- Use the running Next.js app at http://localhost:3000 and check database health with `docker compose ps` from the repo.
- For npm commands, source `~/.nvm/nvm.sh` first. The documented startup sequence is compose up, migrate, seed, then `npm run dev`; do not rerun migrations or seeds against an already working environment unnecessarily.
- Local mock login is /login: Venus is admin; Lauren and Sara are viewers. Mock authentication deliberately allows identity selection and is not a production authentication setup.
- Use New flag, row Enable/Disable, and Edit for positive writes; History opens /audit?resourceId=<id>.
- For API-only negative cases, run same-origin browser `fetch` with the current browser session; do not export session cookies to curl. Save request bodies, statuses, and JSON responses.
- Capture full /api/flags and /api/audit-logs snapshots before and after each mutation. Existing immutable audit rows may remain from earlier tests: compare added IDs rather than expecting an initially empty log.
- Audit JSON property order differs from flag API property order; compare objects structurally, including timestamps. Each write should add one row with the authenticated actor and exact old/new records.
- A failed viewer or anonymous request must leave both full snapshots unchanged. Test payload role injection as well as ordinary POST/PATCH/DELETE.
- To test malformed HttpOnly sessions, open Chrome DevTools Application → Cookies → localhost and truncate the session value in place. Do not extract it. Protected APIs should return 401 and a full page navigation should redirect to /login.

## Devin Secrets Needed

None for the seeded local mock provider. Local `.env` must already contain valid DATABASE_URL, AUTH_PROVIDER=mock, and SESSION_SECRET; never include their values in evidence.
