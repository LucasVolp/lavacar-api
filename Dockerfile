# ============================================================
# Stage 1 — Install ALL dependencies (dev + prod) and build
# ============================================================
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Install deps first (layer cache)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source + prisma schema
COPY . .

# Generate Prisma client (does NOT connect to the DB)
RUN npx prisma generate

# Build NestJS
RUN pnpm run build

# Remove dev dependencies — keep only production deps
RUN pnpm prune --prod && \
    pnpm store prune

# ============================================================
# Stage 2 — Minimal production image
# ============================================================
FROM node:22-alpine AS production

# Security: no root, no shell exploits
RUN apk --no-cache add dumb-init && \
    rm -rf /var/cache/apk/*

ENV NODE_ENV=production

WORKDIR /app

# Copy only what's needed to run
COPY --from=builder /app/dist              ./dist
COPY --from=builder /app/node_modules      ./node_modules
COPY --from=builder /app/package.json      ./package.json
COPY --from=builder /app/prisma            ./prisma
COPY --from=builder /app/prisma.config.ts  ./prisma.config.ts

# Entrypoint: migrations + start
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Run as non-root
USER node

EXPOSE 3000

# dumb-init handles PID 1, forwards signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["./entrypoint.sh"]
