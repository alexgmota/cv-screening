FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/cv-service/package.json ./services/cv-service/

RUN pnpm install

COPY packages/shared/ ./packages/shared/
COPY services/cv-service/ ./services/cv-service/

RUN pnpm --filter @leadtech/shared build
RUN pnpm --filter @leadtech/cv-service build

FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/cv-service/package.json ./services/cv-service/

RUN pnpm install --prod --no-frozen-lockfile

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/cv-service/dist ./services/cv-service/dist

WORKDIR /app/services/cv-service
EXPOSE 4002
CMD ["node", "dist/index.js"]