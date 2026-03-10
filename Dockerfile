FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

RUN mkdir -p /app/node_modules && \
    chown -R node:node /app && \
    chmod -R 755 /app

USER node

COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY --chown=node:node . .

RUN npx prisma generate
RUN pnpm run build

RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Running database migrations..."' >> /app/start.sh && \
    echo 'npx prisma generate' >> /app/start.sh && \
    echo 'npx prisma migrate deploy' >> /app/start.sh && \
    echo 'echo "Starting application..."' >> /app/start.sh && \
    echo 'exec pnpm run start:prod' >> /app/start.sh && \
    chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"] 