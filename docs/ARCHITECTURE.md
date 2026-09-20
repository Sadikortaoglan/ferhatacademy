# Ferhat Academy — Architecture

## Overview

Ferhat Academy is a bilingual (Turkish/English) digital academy and commerce platform built with Next.js 16 App Router, PostgreSQL, and Better Auth. This document describes the Phase 01 foundation and the planned architecture for future phases.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| Auth | Better Auth 1.x |
| Styling | Tailwind CSS v4 |
| i18n | next-intl v4 |
| Validation | Zod 4 |
| Forms | React Hook Form |
| Package manager | pnpm |

## Folder Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── [locale]/             # All user-facing routes (locale-prefixed)
│   │   ├── page.tsx          # Public home
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   ├── dashboard/        # Authenticated user area
│   │   └── admin/            # Admin panel (ADMIN, SUPER_ADMIN only)
│   ├── api/auth/[...all]/    # Better Auth API routes
│   └── globals.css           # Design tokens + base styles
├── components/
│   ├── ui/                   # Primitive UI: Button, Input, Card, Badge, Label
│   └── shared/               # PageHeader, EmptyState, LoadingState, StatusBadge
├── config/
│   └── site.ts               # Locale config, app name
├── features/                 # Domain feature modules
│   ├── auth/components/      # LoginForm, RegisterForm, ForgotPasswordForm
│   ├── dashboard/components/ # DashboardNav
│   └── admin/
│       ├── components/       # AdminSidebar, SiteSettingsForm
│       └── actions/          # Server Actions (settings.ts)
├── i18n/
│   ├── routing.ts            # next-intl routing config
│   └── request.ts            # getRequestConfig for per-request locale
├── lib/
│   ├── auth.ts               # Better Auth server instance
│   ├── auth-client.ts        # Better Auth React client
│   ├── prisma.ts             # Prisma client singleton
│   └── utils.ts              # cn() helper
├── middleware.ts              # next-intl locale middleware
├── server/
│   ├── auth.ts               # requireUser/requireAdmin/requireSuperAdmin
│   ├── audit.ts              # createAuditLog()
│   └── settings.ts           # getSiteSettings(), upsertSiteSetting()
└── types/                    # Shared TypeScript types (future)

messages/
├── tr.json                   # Turkish translations (default)
└── en.json                   # English translations

prisma/
├── schema.prisma             # Database schema
├── migrations/               # Prisma migration files
└── seed.ts                   # Development seed script

docs/
├── ARCHITECTURE.md           # This file
└── PHASE-01.md               # Phase 01 plan and status
```

## Roles & Authorization

Three roles exist:
- `USER` — regular registered student
- `ADMIN` — academy staff, can manage users and settings
- `SUPER_ADMIN` — full access

Authorization is **always server-side**:
```typescript
// src/server/auth.ts
export async function requireAdmin(locale: string = "tr") { ... }
export async function requireSuperAdmin(locale: string = "tr") { ... }
```

UI hiding (removing buttons/menus) is a UX concern only, never a security control.

## Internationalization

- Turkish (`tr`) is the default locale
- Routes: `/tr/*`, `/en/*`
- Translation files: `messages/tr.json`, `messages/en.json`
- Namespaces: `common`, `auth`, `navigation`, `dashboard`, `admin`, `errors`

### Future: Database-backed content localization

```prisma
model CourseTranslation {
  id          String @id @default(cuid())
  courseId    String
  locale      String  // "tr" | "en"
  title       String
  description String
  course      Course @relation(...)
  @@unique([courseId, locale])
}
```

## Design System

Tailwind v4 with CSS variable design tokens defined in `src/app/globals.css`:
- `--color-primary`, `--color-secondary`, `--color-accent`
- `--color-background`, `--color-surface`, `--color-foreground`
- `--color-muted`, `--color-border`
- `--color-success`, `--color-warning`, `--color-danger`

The entire brand palette can be swapped by editing CSS variables without touching components.

## Future Modules (DO NOT IMPLEMENT YET)

### Academy

```
Course → CourseTranslation (title, description per locale)
       → Lesson → LessonContent (video, text, quiz)
```

### Access & Entitlements

> **Important rule**: Access and Assignment are distinct concepts.
>
> - **Access** determines what a user is *allowed* to consume
> - **Assignment** determines what Ferhat *recommends or requires* the user to consume
>
> A user may have Access without an Assignment, and vice versa.

```
Entitlement {
  userId: string
  courseId: string
  grantedBy: "PAYMENT" | "BANK_TRANSFER" | "CASH" | "MANUAL" | "PROMOTION" | "MEMBERSHIP" | "MENTORSHIP"
  grantedAt: DateTime
  expiresAt: DateTime?
}
```

### Commerce Rule

> **Payment must never be tightly coupled to content access.**
>
> Future payment sources that produce Access Grants:
> - Online payment (Stripe, iyzico)
> - Bank transfer (manually verified)
> - Cash payment (offline, admin-recorded)
> - Manual admin grant
> - Promotional code
> - Membership subscription
> - Mentorship package
>
> All of these produce a common `Entitlement` record. Payment processing is a separate concern from access enforcement.

### Other Future Modules

| Module | Description |
|--------|-------------|
| Progress | Student lesson completion, quiz scores |
| Products | Purchasable items (courses, packages) |
| Orders | Purchase records |
| Payments | Payment provider integrations |
| Memberships | Recurring subscription plans |
| Appointments | 1:1 mentoring session scheduling |
| StudentNotes | Admin notes on individual students |
| Assignments | Ferhat's curated learning paths for students |

## Security Principles

1. All authorization checks are server-side
2. Server Actions validate input with Zod before processing
3. Roles are read from the database, never from client payloads
4. Better Auth manages session cookies with secure settings
5. Environment secrets are never committed (`.env` is gitignored)
6. Error messages to users never expose database details or stack traces

## Local Development

```bash
# Start PostgreSQL
docker compose up -d

# Install dependencies
pnpm install

# Run migrations
pnpm db:migrate

# Seed development data
pnpm db:seed

# Start dev server
pnpm dev
```

See README.md for full setup instructions.
