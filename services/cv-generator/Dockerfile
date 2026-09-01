FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY services/cv-generator/package.json ./services/cv-generator/

RUN pnpm install

COPY packages/shared/ ./packages/shared/
COPY services/cv-generator/ ./services/cv-generator/

RUN pnpm --filter @leadtech/shared build
RUN pnpm --filter @leadtech/cv-generator build

FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared/package.json ./packages/shared/
COPY services/cv-generator/package.json ./services/cv-generator/

RUN pnpm install --prod

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/services/cv-generator/dist ./services/cv-generator/dist

WORKDIR /app/services/cv-generator
EXPOSE 4001
CMD ["node", "dist/index.js"]