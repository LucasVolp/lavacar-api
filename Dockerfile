FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN npx prisma generate
RUN pnpm run build

RUN pnpm prune --prod && \
    pnpm store prune

RUN cp -r node_modules/.pnpm/prisma@*/node_modules/prisma /app/_prisma_cli && \
    cp -r node_modules/.pnpm/@prisma+engines@*/node_modules/@prisma/engines /app/_prisma_engines

FROM node:22-alpine AS production

RUN apk --no-cache add dumb-init

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/dist              ./dist
COPY --from=builder /app/node_modules      ./node_modules
COPY --from=builder /app/package.json      ./package.json
COPY --from=builder /app/prisma            ./prisma
COPY --from=builder /app/prisma.config.ts  ./prisma.config.ts
COPY --from=builder /app/_prisma_cli       ./node_modules/prisma
COPY --from=builder /app/_prisma_engines   ./node_modules/@prisma/engines

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER node

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["./entrypoint.sh"]
