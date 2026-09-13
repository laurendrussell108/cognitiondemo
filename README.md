# Internal Tools Foundation

A starter kit for internal tools — **auth, role-based access control, and audit
logging** — with a feature-flag admin panel built on top of it as the reference
application.

The feature-flag panel is the least important part of this repo. It exists to
prove the three foundation modules actually get used by a real feature rather
than sitting unused next to it.

## What this demonstrates

A low-code platform gives you an identity layer, a permission model, and an
audit trail for free. This repo is a timeboxed prototype of what it costs to own
those three things yourself, and what they look like when they are built to be
copied into the next ten tools instead of one.

| Layer | Lives in | Designed so that |
| --- | --- | --- |
| Auth | `lib/auth/` | The identity provider is a config value. Callers depend on an `AuthProvider` interface and a session cookie, never on the provider. |
| RBAC | `lib/rbac/` | Permissions are `resource:action` pairs in one policy file. A new resource is a policy entry, not new enforcement code. |
| Audit | `lib/audit/` | A write and its audit row commit in the same transaction, so no feature can log inconsistently or forget to log. |

Design decisions worth calling out:

- **Enforcement is server-side only.** `withAuthorization` wraps every API
  route handler. The UI hides buttons a viewer cannot use, but hiding them is
  cosmetic — a viewer calling the API directly gets a 403, and the tests assert
  that (`tests/rbac.test.ts`).
- **The audit log is append-only in the database.** A Postgres trigger
  (`prisma/migrations/*_audit_log_immutable`) rejects `UPDATE` and `DELETE` on
  `audit_log`. Immutability enforced by convention is not immutability.
- **Writes and their audit rows share a transaction.** `withAudit` opens one
  transaction around the mutation and the log write, so a committed change
  always has its log entry and a rejected change leaves nothing behind.
- **Dependencies are deliberately boring.** Next.js, Prisma, and `jose` for
  signing the session cookie. No auth framework, no UI kit, no state library —
  a generalist engineer should be able to read all of `lib/` in one sitting.

## Setup

Requires Node 20+ and Docker.

```bash
cp .env.example .env
docker compose up -d        # Postgres on localhost:5432
npm install
npm run db:migrate          # apply migrations (creates schema + audit trigger)
npm run db:seed             # 3 users, 3 example flags
npm run dev                 # http://localhost:3000
```

Sign in at `/login` by picking one of the seeded users:

| User | Role | Can |
| --- | --- | --- |
| venus.admin@example.com | admin | read + create/edit/toggle/delete |
| lauren.viewer@example.com | viewer | read only |
| sara.viewer@example.com | viewer | read only |

Other commands:

```bash
npm test        # RBAC enforcement + audit-log correctness (needs Postgres running)
npm run lint
npm run typecheck
npm run build
```

## Layout

```
lib/auth/          Foundation — session + swappable identity provider
  types.ts           AuthProvider / AuthUser interfaces (the seam)
  session.ts         Signed JWT session cookie, getCurrentUser()
  index.ts           getAuthProvider(), reads AUTH_PROVIDER
  providers/mock.ts  Seeded users, no passwords — local development only
  providers/oidc.ts  Shape of a real Okta/Entra provider (not implemented)
lib/rbac/          Foundation — authorization
  policy.ts          Roles and the resource:action permission matrix
  guard.ts           withAuthorization() wrapper for API route handlers
  server.ts          requireUser()/requirePermission() for server components
lib/audit/         Foundation — audit logging
  index.ts           recordAudit(), withAudit(), listAuditLogs()
lib/db.ts          Prisma client singleton
lib/feature-flags/ Reference app logic (not foundation)
  service.ts         Flag CRUD; every write goes through withAudit()
  evaluation.ts      Read side: evaluate()/isEnabled() with sticky rollout buckets
  propagation.ts     Stub: publishFlagChange(), the cache-invalidation seam
app/api/flags/     Reference app API routes (incl. /evaluate for services)
app/flags/         Reference app UI
app/demo/          "Flag effect" page: what a consumer sees for the selected flag
app/audit/         Read-only audit log view, filterable by resource
app/login/         Login screen driven by the configured auth provider
prisma/            Schema, migrations (incl. audit immutability), seed
tests/             RBAC enforcement and audit correctness tests
```

### How a write flows

`PATCH /api/flags/:id` →
`withAuthorization("feature_flag", "update", …)` (401/403 here) →
`updateFlag()` →
`withAudit()` opens a transaction → reads the old row, writes the new row,
inserts the audit row → commit.

A future tool's write looks identical with different strings.

## Reusability

**Copy these into the next internal tool as-is:**

| File | Why |
| --- | --- |
| `lib/auth/` (whole directory) | Provider-agnostic. Swap the provider, keep the callers. |
| `lib/rbac/policy.ts` | Edit the `POLICY` map for the new tool's roles/resources; the matching logic stays. |
| `lib/rbac/guard.ts` | Resource-agnostic; takes the resource name as an argument. |
| `lib/rbac/server.ts` | Page-level guards; only the fallback redirect path is app-specific. |
| `lib/audit/index.ts` | Resource-agnostic. |
| `lib/db.ts` | Standard Prisma singleton. |
| `prisma/schema.prisma` — `User` and `AuditLog` models | The foundation tables. |
| `prisma/migrations/*_audit_log_immutable` | The append-only trigger. |
| `app/api/auth/*`, `app/login/*` | Login plumbing; only the copy is cosmetic. |
| `app/audit/page.tsx` | Generic log viewer; filters by resource type, not by flag. |
| `tests/setup.ts`, `tests/helpers.ts` | Harness for testing guarded route handlers. |
| `app/globals.css`, `app/_components/theme-toggle.tsx`, `app/_components/nav-link.tsx`, `public/cognition-mark.svg` | Shared shell: Cognition-styled design tokens, light/dark theming, nav. |

**Do NOT reuse as-is — feature-flag specific:**

| File | Note |
| --- | --- |
| `lib/feature-flags/service.ts` | Flag domain logic. Use it as the *template* for a new service: every write goes through `withAudit`, never `prisma` directly. |
| `app/api/flags/**` | Flag endpoints. The pattern to copy is `export const POST = withAuthorization(RESOURCE, "create", handler)`. |
| `app/flags/**`, `app/demo/page.tsx` | Flag UI and the evaluation demo. |
| `lib/feature-flags/evaluation.ts`, `lib/feature-flags/propagation.ts` | Flag read/propagation stubs. The *shape* (pure evaluation + post-commit publish) transfers; the rollout maths does not. |
| `prisma/schema.prisma` — `FeatureFlag` model | Flag table. |
| `prisma/seed.ts` — `FLAGS` | Flag fixtures. Keep the `USERS` half. |
| `tests/*.test.ts` | Written against flags; the structure (viewer gets 403, one accurate audit row per write) transfers. |

**When adding a resource to a new tool**, the whole authorization change is one
line in `lib/rbac/policy.ts`'s `POLICY` map (or nothing at all — `admin` holds
`*:*` and `viewer` holds `*:read`, so a new resource inherits sane defaults),
plus wrapping each route in `withAuthorization`.

### Making a toggle change behavior

Flipping the switch on `/flags` writes `enabled` through the RBAC guard and the
audit helper, but a flag only matters once something *reads* it. That read path
is stubbed here, split into the two pieces a real deployment needs:

- **Evaluation** — `lib/feature-flags/evaluation.ts`. `evaluate(flag, { userKey })`
  is a pure function: off if the flag is missing or disabled, otherwise on when
  `bucketOf(name, userKey) < rolloutPercentage`. The bucket is an FNV-1a hash, so
  a subject stays on the same side of a partial rollout across requests and
  processes, and raising the percentage only ever adds subjects. `/demo` renders
  this for the signed-in user plus sample accounts; `GET /api/flags/evaluate?name=&environment=&userKey=`
  returns the same answer over HTTP.
- **Propagation** — `lib/feature-flags/propagation.ts`. `publishFlagChange()` is
  called after each write commits (never inside the audit transaction, so a
  publish failure cannot lose a write or its audit row). Today it logs.

To make this real:

1. Implement `publishFlagChange()` to publish to Redis pub/sub, SNS, or a signed
   webhook. Set `FLAG_PUBLISH_WEBHOOK_URL` once it does — the stub throws if that
   variable is set, so a half-wired deployment fails loudly instead of silently
   never propagating.
2. Replace the body of `isEnabled()` with a read from an in-process snapshot of
   all flags for the environment, refreshed on that event plus a periodic poll as
   a backstop. `evaluate()` itself does not change — it never touches the
   database, so it can be lifted into a client SDK unchanged.
3. Authenticate services on `/api/flags/evaluate`. It currently authorizes with
   the operator's session because the mock provider only issues human sessions;
   a real deployment exchanges a machine token for a principal holding
   `feature_flag:read`. The guard and `POLICY` do not change.
4. Decide the failure mode explicitly: on a stale or unreachable flag source,
   serving the last known snapshot is usually right, and `evaluate(null, …)`
   already fails closed for an unknown flag.

Not addressed by the stub: kill-switch latency targets, per-request targeting
rules beyond percentage rollout (plan, country, account tier), and client-side
evaluation for browsers.

### Theming

`app/globals.css` holds the palette as CSS variables under a `.light` and a
`.dark` class, matching the Cognition/Devin surface tokens. The theme class is
set on `<html>` before hydration by the inline script in `app/layout.tsx`
(system preference by default, overridden by `localStorage.itf_theme`) and
flipped by `ThemeToggle`. New components should consume `rgb(var(--token))`
rather than literal colors so both themes stay consistent.

### Swapping the auth provider

`AUTH_PROVIDER` selects the provider in `lib/auth/index.ts`. Adding real Okta or
Entra means implementing `lib/auth/providers/oidc.ts` against the existing
`AuthProvider` interface — build the authorize URL, exchange the code for an
id token, verify it, upsert the user by the `sub` claim, and map an IdP group
claim onto a `Role`. The session cookie, the guards, the routes, and the UI are
unchanged; `providers/mock.ts` stays for local development and tests.

## Non-goals / next steps

Deliberately not built in this prototype:

- **Real SSO (Okta/Entra).** The provider seam and a stub exist; the OIDC
  handshake does not.
- **Multi-tenant or per-team environment isolation.** Every signed-in user sees
  every flag in every environment.
- **CI/CD and deployment infrastructure.** Local Docker Compose only.
- **A real flag read path.** Evaluation and propagation exist as stubs with a
  documented wiring plan (see "Making a toggle change behavior"); no service
  consumes them and nothing is cached.
- **Row-level permissions.** Authorization is role-level
  (`resource:action`); it cannot yet express "this team's flags only". The
  policy signature is the place that would grow a subject/record argument.

Also worth doing before this becomes a real platform: session revocation
(the JWT is valid until it expires), audit-log retention and export, and a
shared UI component library so ten tools do not each invent their own table.
