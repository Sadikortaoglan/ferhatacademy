FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate

# ── deps ────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile
# Resolve @prisma/engines from pnpm's nested store to a flat location
# so it can be COPY'd into the runner stage without broken symlinks.
RUN mkdir -p /prisma-engines && \
    find /app/node_modules -path "*/@prisma/engines" -type d | head -1 | \
    xargs -I{} cp -rL {} /prisma-engines/

# ── builder ─────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APP_URL=https://ferhatacademy.com
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Generate Prisma client and build Next.js
RUN pnpm exec prisma generate && pnpm exec next build
# Copy generated prisma client to a known flat location for the runner
RUN mkdir -p /prisma-client && \
    find node_modules -name ".prisma" -type d | head -1 | xargs -I{} cp -r {} /prisma-client/

# ── runner ──────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Public assets
COPY --from=builder /app/public ./public

# Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma client + CLI + schema (needed at runtime + migrations)
COPY --from=builder /prisma-client                   ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma        ./node_modules/@prisma
COPY --from=deps    /prisma-engines                  ./node_modules/@prisma/engines
COPY --from=builder /app/node_modules/prisma         ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma    ./node_modules/.bin/prisma
COPY --from=builder /app/prisma                      ./prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
