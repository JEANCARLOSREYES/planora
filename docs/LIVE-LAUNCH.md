# Live Planora launch checklist

The account application and static demo are different products. Do not publish
the static demo and describe it as a hosted account service.

## First release scope

- Registration, login, private empty workspaces, and a public welcome page.
- Rich notes, nested pages, templates, tasks, collections, boards, and calendar.
- Google sign-in, verified Google identities, new-user onboarding, session controls.
- Local password accounts remain supported; hosted password mode needs an email sender.
- Workspace export, account deletion, and an honest privacy notice.
- No AI assistant or AI billing in this release.

## Free-first hosting candidate

Vercel Hobby plus Turso's free hosted SQLite tier is a candidate for a personal,
noncommercial launch. These have usage limits and provider terms. Vercel Hobby
is not a commercial hosting plan. No paid plan, domain, or service account has
been purchased or provisioned by this change.

- https://vercel.com/docs/plans/hobby
- https://turso.tech/pricing
- https://docs.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite

Never use the local `prisma/dev.db` as serverless storage. Public hosting needs a
separate, empty cloud database; do not upload personal local workspace content.
Cloud migrations must be applied explicitly before exposing the application.
Do not use the CLI's local `migrate deploy` as proof the remote schema exists.

The application already selects Prisma's libSQL adapter when
`TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are configured privately. Leave them
blank for the local SQLite app. Neither is a browser-visible variable. For a
brand-new, empty Turso database only, review and apply the two initial migrations
using the authenticated Turso CLI:

```bash
turso db shell YOUR_NEW_DATABASE < prisma/migrations/20260905180738_init/migration.sql
turso db shell YOUR_NEW_DATABASE < prisma/migrations/20260930193000_accounts/migration.sql
```

Do not replay these on an already initialized database. Track applied migrations
and review later upgrades individually. The cloud adapter is tested against a
disposable local libSQL database; remote connectivity, provider behavior, and
redeployment persistence still need staging verification.

The owner approved Google-only authentication on October 5 to avoid buying an
email-sender domain. Set `AUTH_MODE=google`, configure a Web application OAuth
client and its exact HTTPS `/api/auth/callback/google` redirect in Google Cloud,
and store `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` privately in Vercel.
Only email, profile, and openid scopes are requested. Do not enable billing,
Google AI, or extra Google API permissions. Google manages account recovery;
Planora password signup/login/reset endpoints are disabled in this mode.
Google consent configuration must permit external public users rather than
remaining restricted to test users before a public launch is described as ready.
Hosted password mode still requires Resend with a verified sender.

## Configuration and acceptance gates

1. The owner creates the free hosting/database accounts and accepts their terms.
2. Configure the cloud database privately in the host's environment settings.
3. Apply reviewed migrations to the new remote database. Back up before upgrades.
4. Set the exact HTTPS `BETTER_AUTH_URL` and a generated `BETTER_AUTH_SECRET`.
5. Configure and verify Google OAuth; never put keys in GitHub or chat.
6. Configure trusted edge-proxy IP headers, test rate limits behind that proxy,
   and use platform-level abuse limits as well as application limits.
7. Run typecheck, lint, formatting, tests, production build, and browser tests.
8. Finalize provider disclosures, privacy contact, backup retention/deletion,
   and a tested database restore procedure.
9. In staging, test two real Google accounts, login, onboarding, logout,
   cross-account URLs, exports, deletion, and persistence across redeployment.
10. Publish only after these checks pass; report the actual verified HTTPS URL.

The earlier GitHub CI failure was calendar contrast in dark mode. Its local fix
and all new account changes need to be pushed and checked in a fresh CI run after
the owner's requested review. The owner authorized GitHub publication on October
2, 2026; this does not bypass the remaining public-account deployment gates.

## Zero-charge requirement

Use only actual free plans, not trials that renew into paid subscriptions. Do not
add a payment method, buy a domain, enable paid upgrades, or enable AI services.
If a provider limit is reached, pause or restrict the service rather than incur
charges. Explain free-tier reliability, capacity, and noncommercial-use limits
before the owner accepts provider terms. A static-only alternative would remove
real hosted accounts and cross-device storage, so it needs an explicit owner
choice rather than an automatic downgrade.
