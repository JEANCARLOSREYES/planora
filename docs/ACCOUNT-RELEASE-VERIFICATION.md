# Account release verification — October 2, 2026

## October 5 update

- Google-only hosted mode and new-user onboarding implemented; local password mode preserved.
- 52 unit/integration tests pass. Google tests use real signatures with disposable test keys and mocked Google public-key delivery, not live Google accounts.
- Production build, TypeScript, ESLint and formatting pass. All 16 browser workflows pass, including eight accessible palette combinations; newly added workspace onboarding also passes its browser rerun.
- Vercel Hobby project and free production address `myplanora.vercel.app` configured. Turso remote schema verified (11 tables); production database and Google credentials stored privately in Vercel.
- No production deployment or real hosted Google sign-in has yet been verified. No billing enabled, domain purchased, or AI activated. Earlier statements below describe the October 2 snapshot, not current cloud setup.

## Implemented locally

- Public welcome page; separate registration/login/recovery pages.
- Better Auth password hashing, hosted email verification, database sessions,
  explicit origin/CSRF protection, persisted login throttling, and name validation.
- One empty private workspace per new account; scoped records, searches, and saves.
- Password changes, other-device logout, workspace exports, and password-confirmed
  account deletion. Signing out clears recovery drafts and reloads the application
  to discard its authenticated client cache.
- Safe account migration preserving unowned legacy workspaces.
- Cloud SQLite adapter selected only by private Turso environment configuration.
- Calendar contrast correction for the earlier GitHub accessibility failure.

## Evidence from this local checkout

- Prisma client generation and production build: passed.
- TypeScript: passed, including after restoring the preexisting development-type
  imports in the generated `next-env.d.ts` file.
- ESLint with zero allowed warnings: passed.
- Formatting: passed before this final report; rechecked after documentation edits.
- Unit/integration tests: **42 passed across 7 files**.
- Browser workflows: **15 passed** against an isolated production build on port
  3100 with disposable accounts/database. Includes registration, logout, private
  exports, direct cross-account URLs, valid unauthorized editor saves, search
  isolation, responsive forms, keyboard navigation, and accessibility checks.
- Vite static-demo build: passed; existing bundle-size/split warnings remain.
- Dependency install audit: **0 reported vulnerabilities**.
- Local welcome/registration preview: both HTTP 200 on port 3000.
- Local database backup created before migration. Existing workspace, page, task,
  collection, and tag record counts match that backup after migration.
- Welcome and mobile registration screenshots rendered and visually inspected.

The initial new cross-account browser test used an invalid empty document and
expected the wrong response code. The corrected test submits a structurally
valid document, checks the API's non-disclosing conflict response, and verifies
the owner's original record is unchanged. The full browser suite was rerun.

## Not yet established

This is not a public-deployment verification or a security certification. Real
verification/recovery email delivery is not configured: handler tests mock the
email provider. The hosted SQLite adapter is tested locally, not against a remote
endpoint. Provider accounts, remote schema, persistence across redeployment,
trusted proxy settings, backups/restore, final privacy contact and retention
policy, and a staging verification remain required before inviting public users.

No paid hosting plan or domain was purchased. No AI was activated. Account
changes remain local; they have not been pushed to GitHub. The previous red CI
run is not superseded until a new published revision passes CI.

See `LIVE-LAUNCH.md` for the remaining launch gates.
