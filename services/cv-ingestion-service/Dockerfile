FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/cv-ingestion-service/package.json ./services/cv-ingestion-service/

RUN pnpm install

COPY packages/shared/ ./packages/shared/
COPY services/cv-ingestion-service/ ./services/cv-ingestion-service/

RUN pnpm --filter @leadtech/shared build
RUN pnpm --filter @leadtech/cv-ingestion-service build

FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/cv-ingestion-service/package.json ./services/cv-ingestion-service/

RUN pnpm install --prod --no-frozen-lockfile

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/cv-ingestion-service/dist ./services/cv-ingestion-service/dist

WORKDIR /app/services/cv-ingestion-service
EXPOSE 4003
CMD ["node", "dist/index.js"]