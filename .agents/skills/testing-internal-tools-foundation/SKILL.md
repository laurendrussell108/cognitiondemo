---
name: testing-internal-tools-foundation
description: Test the local feature-flag reference UI and foundation auth, RBAC, and audit boundaries.
---

# Runtime testing

- Use the running Next.js app at http://localhost:3000 (or the explicitly selected port) and check database health with `docker compose ps` from the repo.
- Run only one Next dev/build process per checkout: parallel processes share `.next` even on different ports and can cause missing build-manifest errors. If the server is unhealthy, inspect its logs and process tree; stop stale processes, preserve or clear only generated `.next`, then restart with `npm run dev -- --port <port>`. Do not reset the database to resolve a frontend cache error.
- For npm commands, source `~/.nvm/nvm.sh` first. The documented startup sequence is compose up, migrate, seed, then `npm run dev`; do not rerun migrations or seeds against an already working environment unnecessarily.
- Local mock login is /login: Venus is admin; Lauren and Sara are viewers. Mock authentication deliberately allows identity selection and is not a production authentication setup.
- Use New flag, row Enable/Disable (now an aria-pressed switch), and Edit for positive writes; History opens /audit?resourceId=<id>.
- For API-only negative cases, run same-origin browser `fetch` with the current browser session; do not export session cookies to curl. Save request bodies, statuses, and JSON responses.
- Capture full /api/flags and /api/audit-logs snapshots before and after each mutation. Existing immutable audit rows may remain from earlier tests: compare added IDs rather than expecting an initially empty log.
- Audit JSON property order differs from flag API property order; compare objects structurally, including timestamps. Each write should add one row with the authenticated actor and exact old/new records.
- A failed viewer or anonymous request must leave both full snapshots unchanged. Test payload role injection as well as ordinary POST/PATCH/DELETE.
- To test malformed HttpOnly sessions, open Chrome DevTools Application → Cookies → localhost and truncate the session value in place. Do not extract it. Protected APIs should return 401 and a full page navigation should redirect to /login.
- Theme changes use the header icon and persist in `localStorage.itf_theme`; verify login, list, create/edit, and audit views in both themes. Check computed alpha-composited text contrast in addition to screenshots, especially muted/tertiary text, badges, and JSON cells.
- For first-paint checks, inject an observation-only document-start script through Chrome CDP to sample theme class/background in requestAnimationFrame and record PerformanceObserver paint entries. Keep that CDP connection alive through the UI reload: document-start registrations disappear when the session disconnects. Compare the first sample before FCP and all subsequent samples, not only the hydrated screenshot. Test stored light/dark and unset storage with emulated light/dark color-scheme separately; reset emulation afterward.

## Devin Secrets Needed

None for the seeded local mock provider. Local `.env` must already contain valid DATABASE_URL, AUTH_PROVIDER=mock, and SESSION_SECRET; never include their values in evidence.
