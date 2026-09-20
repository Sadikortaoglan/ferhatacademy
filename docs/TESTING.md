# Ferhat Academy — Testing Guide

## Philosophy

Tests are part of the **Definition of Done**. A task is not complete because the UI looks right or the build passes — appropriate tests must exist and pass.

- Test **behavior**, not implementation details
- Mock only **external boundaries** (email, payments, storage, third-party APIs)
- Never mock core business logic (Prisma services, entitlement resolution, grant materialization)
- Bug fixes require a **regression test** before the fix lands

---

## Test Layers

### Unit Tests (`tests/unit/`)
Pure functions with no side effects and no I/O.

**Examples:** `formatPrice`, `formatOrderReference`, `getCourseProgress`  
**Stack:** Vitest + Node  
**Command:** `pnpm test:unit`

### Integration Tests (`tests/integration/`)
Real database behavior — Prisma queries, transactions, constraints, idempotency.

**Examples:** `canAccessLesson`, `materializeProductGrants`, `activateUser`/`deactivateUser`  
**Stack:** Vitest + Testcontainers (ephemeral PostgreSQL 16 container)  
**Command:** `pnpm test:integration`  

Each run spins up a fresh container, applies all Prisma migrations, then tears it down. Tests never touch the dev or production DB.

### Component Tests (`tests/component/`)
Interactive React UI behavior — what the user can see and do.

**Examples:** `UserStatusActions` confirm dialog, form validation feedback  
**Stack:** Vitest + jsdom + React Testing Library + user-event  
**Command:** `pnpm test:unit` (same config, both `unit/` and `component/` are included)

### E2E Tests (`tests/e2e/`)
Complete browser journeys through the running application.

**Examples:** login, admin user management, inactive user login rejection  
**Stack:** Playwright (Chromium)  
**Command:** `pnpm test:e2e`

Requires the dev server running at `http://localhost:3000` (or set `PLAYWRIGHT_BASE_URL`).

---

## Database Test Setup

Integration tests use **Testcontainers** — no manual setup needed.

```
globalSetup: tests/setup/integration-global-setup.ts
  → starts postgres:16-alpine container
  → runs: npx prisma migrate deploy
  → sets TEST_DATABASE_URL env var

setupFiles: tests/setup/integration-setup.ts
  → afterEach: truncates all tables (deterministic isolation)
```

Each test gets a clean database. Tests never depend on execution order.

**Never run integration tests against the dev or production database.**

---

## Test Factories (`tests/factories/index.ts`)

Reusable builders that produce minimal valid entities:

```ts
createTestUser(prisma, overrides?)
createTestAdmin(prisma, overrides?)
createTestCourse(prisma, overrides?)
createTestModule(prisma, courseId, position?)
createTestLesson(prisma, moduleId, overrides?)
createTestEntitlement(prisma, userId, courseId, adminId, overrides?)
createTestProduct(prisma, overrides?)
createTestOrder(prisma, userId, productId, status?)
```

Always pass `testPrisma` (from `tests/helpers/prisma.ts`) — not `@/lib/prisma` — in integration tests.

---

## Mocking Policy

| ✓ Mock | ✗ Don't mock |
|--------|-------------|
| email provider | Prisma in integration tests |
| payment gateways | Entitlement resolver |
| Zoom / Meet | ProductGrant resolver |
| object storage | Authorization checks in security tests |
| analytics | Core business logic |
| `next/headers`, `next/cache` (in unit tests only) | |

---

## Commands

```bash
pnpm test                # unit + component tests (fast, no DB)
pnpm test:unit           # same as above, explicit
pnpm test:watch          # unit tests in watch mode
pnpm test:integration    # integration tests (needs Docker)
pnpm test:coverage       # unit/component with v8 coverage
pnpm test:e2e            # Playwright E2E (needs dev server)
pnpm test:e2e:ui         # Playwright with interactive UI
pnpm test:e2e:report     # Open last Playwright HTML report
```

---

## CI Quality Gate

Before any branch merge, all of these must pass:

```
pnpm lint
pnpm typecheck
pnpm test          ← unit + component
pnpm test:integration
pnpm build
```

E2E tests run in CI against a seeded test environment.

---

## Git Workflow

```
main
develop
feature/*    → merge requires: lint + typecheck + relevant unit/integration/component + build
fix/*        → must include regression test
hotfix/*     → regression test before or with the fix
```

---

## Writing a Regression Test

1. Reproduce the bug with a **failing test**
2. Implement the fix
3. Verify the test passes
4. The test stays permanently

Example for a security regression:

```ts
it("does not grant entitlement when payment approval is retried (idempotency)", async () => {
  // ... set up order ...
  await materializeProductGrants(order.id, admin.id);
  await materializeProductGrants(order.id, admin.id); // retry

  const entitlements = await testPrisma.entitlement.findMany({ where: { userId: user.id } });
  expect(entitlements).toHaveLength(1); // not 2
});
```

---

## Test Naming

Describe **behavior**, not code:

```
✓  "denies access to ENTITLED lesson without valid entitlement"
✓  "does not create duplicate entitlements when payment approval is retried"
✓  "allows inactive user to log in after reactivation"

✗  "test1"
✗  "works"
✗  "entitlement test"
```

---

## Playwright Setup

Playwright tests require the app running locally:

```bash
pnpm dev          # in one terminal
pnpm test:e2e     # in another
```

Or set `PLAYWRIGHT_BASE_URL` in env. Seed accounts (dev only):

| Role       | Email                          | Password      |
|------------|-------------------------------|---------------|
| Super Admin | superadmin@ferhatacademy.com | SuperAdmin123! |
| Admin       | admin@ferhatacademy.com      | Admin123!      |
| User        | user@ferhatacademy.com       | User123!       |

---

## Coverage

Coverage is a **signal**, not a vanity metric. Don't write empty tests to hit 100%.

Critical paths that must have strong coverage:
- `src/server/access.ts` — entitlement resolution
- `src/server/commerce.ts` — grant materialization, idempotency
- `src/features/admin/actions/access.ts` — grant/revoke
- `src/app/[locale]/admin/users/[userId]/actions.ts` — activate/deactivate + audit log
