#!/bin/sh
set -e

echo "==> Environment: ${NODE_ENV:-development}"

if [ "$NODE_ENV" = "production" ] || [ "$NODE_ENV" = "staging" ]; then
  echo "==> Running database migrations..."
  npx prisma migrate deploy
  echo "==> Starting application..."
  exec node dist/src/main
else
  echo "==> Generating Prisma client..."
  npx prisma generate
  echo "==> Running database migrations..."
  npx prisma migrate deploy
  echo "==> Seeding database..."
  pnpm run db:seed || true
  echo "==> Starting application..."
  exec pnpm run start:dev
fi
