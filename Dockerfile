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

RUN echo '#!/bin/sh\n\
    echo "Running database migrations..."\n\
    npx prisma generate\n\
    npx prisma migrate deploy\n\
    echo "Starting application..."\n\
    pnpm run start:prod' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"] 