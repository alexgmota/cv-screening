FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/frontend/package.json ./services/frontend/

RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY services/frontend/ ./services/frontend/

RUN pnpm --filter @leadtech/shared build
RUN pnpm --filter @leadtech/frontend build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/services/frontend/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/services/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/services/frontend/.next/static ./services/frontend/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "services/frontend/server.js"]
