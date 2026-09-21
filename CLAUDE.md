@AGENTS.md

## Testing Rule (Permanent)

Every meaningful feature, fix, refactor, or business-rule change must include appropriate automated tests. Tests are part of the Definition of Done.

- Choose the correct layer: unit (pure functions) → integration (real DB via Testcontainers) → component (RTL) → E2E (Playwright)
- Do NOT mock core business logic (Prisma, entitlement resolution, grant materialization)
- Bug fixes require a regression test where practical
- Critical workflows (auth, entitlements, commerce, user status) require integration or E2E coverage
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` must pass before commit/merge

See `docs/TESTING.md` for full details.
