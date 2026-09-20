# Ferhat Academy

Bilingual (Turkish/English) digital academy and commerce platform.

## Tech Stack

- **Next.js 16** (App Router, Server Components)
- **TypeScript** (strict mode)
- **PostgreSQL 16** + **Prisma 6**
- **Better Auth** 1.x
- **Tailwind CSS** v4
- **next-intl** v4 (TR default, EN secondary)
- **Zod** + **React Hook Form**
- **pnpm**

## Local Setup

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- Docker (for PostgreSQL)

### Installation

```bash
# 1. Clone and install
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env if needed (defaults work for local Docker)

# 3. Start PostgreSQL
docker compose up -d

# 4. Run migrations
pnpm db:migrate

# 5. Seed development data
pnpm db:seed

# 6. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/tr`.

### Development Accounts

| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | superadmin@ferhatacademy.com | SuperAdmin123! |
| ADMIN | admin@ferhatacademy.com | Admin123! |
| USER | user@ferhatacademy.com | User123! |

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm db:migrate` | Run Prisma migrations |
| `pnpm db:seed` | Seed development data |
| `pnpm db:studio` | Prisma Studio (DB GUI) |
| `pnpm db:generate` | Regenerate Prisma client |

## Environment Variables

See `.env.example` for all variables.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Auth session secret (change in production!) |
| `BETTER_AUTH_URL` | App base URL |
| `NEXT_PUBLIC_APP_URL` | Public-facing app URL |
| `SEED_*` | Development seed account credentials |

## Folder Structure

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Internationalization

Routes:
- `/tr/*` — Turkish (default)
- `/en/*` — English

Translation files:
- `messages/tr.json`
- `messages/en.json`

## Roles

| Role | Access |
|------|--------|
| `USER` | Dashboard, own profile |
| `ADMIN` | + Admin panel, user management, settings |
| `SUPER_ADMIN` | All admin capabilities |

Authorization is enforced server-side. Never trust client-claimed roles.

## Database

Schema: `prisma/schema.prisma`

Migrations: `prisma/migrations/`

To reset and re-seed:
```bash
./node_modules/.bin/prisma migrate reset
pnpm db:seed
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full architecture documentation including future modules.

## Phase 01

See [docs/PHASE-01.md](docs/PHASE-01.md) for what was built and what's next.
