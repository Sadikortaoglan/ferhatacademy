# Phase 01 — Foundation

## Status: COMPLETE

## Scope

Foundation phase only. Authentication, admin panel, dashboard shell, i18n, and database foundation. No courses, payments, video systems, or appointments.

## Implementation Checklist

- [x] Project scaffolding (Next.js 16, TypeScript strict, Tailwind v4)
- [x] Design system with CSS variable tokens (`@theme` in Tailwind v4)
- [x] PostgreSQL + Prisma 6 schema with migrations
- [x] Docker Compose for local DB
- [x] Better Auth integration (email/password)
- [x] Role-based access control (USER, ADMIN, SUPER_ADMIN)
- [x] Server-side auth guards: `requireUser()`, `requireAdmin()`, `requireSuperAdmin()`
- [x] i18n with next-intl v4 (Turkish default, English secondary)
- [x] Public home page with bilingual hero section
- [x] Login, Register, Forgot Password pages
- [x] Authenticated dashboard (placeholder with empty states)
- [x] Admin panel: users list with pagination, user detail, site settings
- [x] SiteSetting system with admin-editable form
- [x] AuditLog model with settings tracking
- [x] Database seed (SUPER_ADMIN, ADMIN, USER, site settings)
- [x] ESLint + TypeScript strict mode
- [x] `pnpm lint` — passes
- [x] `pnpm typecheck` — passes
- [x] `pnpm build` — passes

## Architecture Decisions

### Better Auth
Better Auth v1.7 manages authentication. The schema mirrors Better Auth's required fields (`Session`, `Account`, `Verification`). The custom `User` model extends this with role, locale, and profile fields. `image` field is required by Better Auth's schema validator.

### Roles
Roles are stored directly on the `User` model (not a separate table). Simple, sufficient for this phase. Authorization is enforced server-side via `requireAdmin()` / `requireSuperAdmin()` helpers that query the database directly, never trusting client-side claims.

### next-intl routing
`/tr/*` and `/en/*` with Turkish as default. Middleware handles locale detection and redirects. `getRequestConfig` in `src/i18n/request.ts` loads per-request messages.

### Server vs. Client Components
Server Components handle all data fetching. Client Components are only used for interactive forms (login, register, forgot-password, site settings form, dashboard nav logout button, admin sidebar active state).

### AuditLog
Append-only. No event sourcing. Records admin operations: `SETTINGS_UPDATED`, `USER_ROLE_CHANGED`, etc. Phase 01 records settings changes only.

### Tailwind v4
Uses CSS-based configuration with `@theme` directive instead of `tailwind.config.ts`. Design tokens are CSS variables, making brand palette changes trivial.

### Prisma v6
Using stable Prisma v6 (not v8-rc which has a completely different workflow). Client generated in `node_modules/@prisma/client`.

## Localization Strategy (Future)

Database-backed content will follow this pattern:
```
CourseTranslation {
  courseId: string
  locale: "tr" | "en"
  title: string
  description: string
}
```
Phase 01 UI strings are in `messages/tr.json` and `messages/en.json`. Component-level hardcoded strings are in UI components only where locale-neutral (e.g., brand name "Ferhat Academy").

## Remaining Technical Debt

- Email sending is not implemented — Better Auth password reset works via API but emails don't send (no SMTP configured)
- Rate limiting not yet applied to auth endpoints
- Admin mobile navigation not fully built (desktop sidebar, mobile nav is hidden on small screens)
- No toast/notification system for action feedback in admin
- `middleware.ts` → Next.js 16 uses `proxy` convention (deprecated warning), but `createMiddleware` from next-intl works correctly
- Docker Compose uses port 5432 which may conflict if another PostgreSQL is running locally

## Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| SUPER_ADMIN | superadmin@ferhatacademy.com | SuperAdmin123! |
| ADMIN | admin@ferhatacademy.com | Admin123! |
| USER | user@ferhatacademy.com | User123! |

## Recommended Phase 02

1. Course/Content model (`Course`, `CourseTranslation`, `Lesson`, `LessonContent`)
2. Video upload and streaming (e.g., Mux, Cloudflare Stream)
3. Access/Entitlement system — decouple from payment (see ARCHITECTURE.md)
4. Student progress tracking
5. Email service integration (Resend, Postmark)
6. Toast notification system in admin panel

## Public Experience & Brand Foundation

### Brand System
- CSS variables updated to warm orange primary (`hsl(24 95% 53%)`) — away from default blue
- Dark section palette added: `--color-dark-bg`, `--color-dark-surface`, `--color-dark-foreground`
- `.section-dark` utility class for dark-background page strips
- All colors tokenized — replaceable from one location

### Navigation
- `src/components/layout/public-header.tsx` — sticky, responsive, backdrop blur
- Desktop: logo + 5 nav links + locale switcher + login + "Academy'ye Katıl" CTA
- Mobile: hamburger → full dropdown overlay
- `src/components/layout/public-footer.tsx` — 4-column grid, social icons, nav links, legal placeholders

### Route Architecture
- `src/app/[locale]/(public)/` route group — wraps public pages with header+footer
- Routes: `/`, `/academy`, `/courses`, `/live`, `/products`, `/about`
- Auth routes (login/register/forgot-password) remain outside public layout

### Homepage
- Hero: dark section, bold 2-line heading, warm orange accent line, two CTAs, media placeholder
- Featured Programs: 3 mock cards from `src/config/mock-content.ts`
- Learning Options: 3-column section on muted background
- Live Training: dark strip, 1:1 vs Group cards
- Free Content: 3 cards with visibility badges (PUBLIC/REGISTERED/ENTITLED)
- About Ferhat: compact 2-column with media placeholder
- Final CTA: dark strip

### Shared Components
- `Section` — wrapper with title/subtitle, dark variant
- `MediaPlaceholder` — aspect-ratio box, easily swapped for next/image
- `ProgramCard` — course/program card with type badge, pricing
- `ContentCard` — lesson/video card with visibility badge

### Mock Content
- `src/config/mock-content.ts` — all placeholder data in one place, not embedded in components

### Translation Coverage
- `navigation`, `home`, `courses`, `live`, `products`, `about`, `footer` namespaces added
- Dashboard "Yakında" removed; replaced with contextual empty states

### Assets Needed From Ferhat
- Profile photo (portrait format)
- Hero/program cover images
- Logo asset (SVG)
- Real social links (Instagram, YouTube URLs)
- Legal documents (KVKK, terms)
