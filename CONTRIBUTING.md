# Contributing to Planora

Keep changes focused, preserve the local-first setup, and pair data-model changes with reviewed Prisma migrations.

1. Follow the README setup steps and create a feature branch.
2. Keep presentation in components, persistence in `src/lib/server`, and shared validation/business rules in `src/lib`.
3. Validate every mutation. Never apply creation defaults to partial updates.
4. Preserve safe page-tree behavior, shared task records, and editor revision checks.
5. Run `npm run format`, `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build`.
6. For interaction changes, also run the Playwright suite and inspect desktop/mobile layouts in both themes.
7. Include the behavior change, relevant tradeoffs, and test results in your pull request.

Do not commit personal database files, `.env`, generated clients, build output, screenshots containing private workspace data, or dependency directories. Keep the lockfile updated with intentional dependency changes.
