# Ferhat Academy — Production Deployment Guide

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Runtime | Node.js 22.x |
| Package Manager | pnpm 12 |
| Database | PostgreSQL (external — see below) |
| ORM | Prisma 6 |
| Auth | Better Auth 1.7 |
| Email | Resend |

---

## Environment Variables

| Variable | Required | Purpose | Example |
|---|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `DIRECT_URL` | ⚠️ Supabase only | Non-pooled URL for Prisma migrations | same format as DATABASE_URL |
| `BETTER_AUTH_SECRET` | ✅ | JWT signing secret (min 32 chars, random) | `openssl rand -base64 48` |
| `BETTER_AUTH_URL` | ✅ | Production origin for auth cookies | `https://ferhatacademy.com` |
| `NEXT_PUBLIC_APP_URL` | ✅ | Used in email links, redirects | `https://ferhatacademy.com` |
| `NODE_ENV` | ✅ | Must be `production` in prod | `production` |
| `RESEND_API_KEY` | ✅ | Resend email API key | `re_xxxx` |
| `EMAIL_FROM` | optional | Sender address shown in emails | `Ferhat Academy <noreply@ferhatacademy.com>` |
| `ADMIN_NOTIFY_EMAIL` | optional | Where new order alerts are sent | `info@ferhatacademy.com` |

Never commit real values. Use `.env.example` as the template.

---

## Database

The application requires **PostgreSQL**. Do NOT use MySQL or SQLite.

Recommended: [Supabase](https://supabase.com) free tier (500 MB, 2 direct connections).

If using Supabase, add both `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) to your environment, and update `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

---

## Build & Start Commands

```bash
# Install
pnpm install --frozen-lockfile

# Build (includes prisma generate)
pnpm build

# Start
pnpm start
```

---

## Database Migration (Production)

**Order of operations — run ONCE on first deployment:**

1. Provision a PostgreSQL database
2. Set `DATABASE_URL` (and `DIRECT_URL` if Supabase)
3. Run migrations:
   ```bash
   pnpm prisma migrate deploy
   ```
4. Deploy the application
5. Visit `/api/health` — confirm `{"status":"ok","db":"connected"}`

> ⚠️ **Never** use `prisma migrate dev` or `prisma db push` in production.
> ⚠️ **Never** run the dev seed (`pnpm db:seed`) in production — it creates test users and demo data.

### First Admin Account

After deploying, register via the normal signup flow, then update the role directly:

```bash
pnpm prisma studio
# Find the user → set role = SUPER_ADMIN
```

Or via psql:
```sql
UPDATE "User" SET role = 'SUPER_ADMIN' WHERE email = 'your@email.com';
```

---

## File Uploads ⚠️ Production Risk

Current upload implementation (`/api/upload`) writes files to `public/uploads/` on the **local filesystem**.

This works on a dedicated VPS but **will lose files** on platforms that:
- Reset the filesystem on deploy (Vercel, Railway, Render free tier)
- Run multiple instances (horizontal scaling)

For Hostinger Node.js VPS this is safe as long as you have a single instance and persistent disk.

**Future recommendation:** Migrate to an object storage provider (Cloudflare R2, AWS S3, or Supabase Storage) when scaling.

---

## Hostinger Configuration

| Setting | Value |
|---|---|
| Framework | Next.js |
| Node.js version | 22.x |
| Package manager | pnpm |
| Root directory | `/` (repository root) |
| Build command | `pnpm install --frozen-lockfile && pnpm build` |
| Start command | `pnpm start` |
| Output directory | `.next` (auto-detected) |
| Port | Hostinger sets `PORT` automatically — Next.js reads it |

---

## Health Check

`GET /api/health` — returns:
- `200 {"status":"ok","db":"connected"}` — app and DB healthy
- `503 {"status":"error","db":"disconnected"}` — DB unreachable
