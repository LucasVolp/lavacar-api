#!/bin/sh
set -e

# -----------------------------------------------------------
#  Entrypoint — works for BOTH local dev and Railway prod
# -----------------------------------------------------------
#  NODE_ENV is set by docker-compose (dev) or Railway (prod).
#  The script detects the environment and runs accordingly.
# -----------------------------------------------------------

echo "==> Environment: ${NODE_ENV:-development}"

# --- Prisma generate (always, ensures client matches schema) ---
echo "==> Generating Prisma client..."
npx prisma generate

# --- Migrations (only in production / staging) ---
if [ "$NODE_ENV" = "production" ] || [ "$NODE_ENV" = "staging" ]; then
  echo "==> Running database migrations..."
  npx prisma migrate deploy
  echo "==> Migrations applied."

  echo "==> Starting application (production)..."
  exec node dist/main
else
  echo "==> Running database migrations..."
  npx prisma migrate deploy

  echo "==> Seeding database..."
  pnpm run db:seed || echo "==> Seed skipped or already applied."

  echo "==> Starting application (development)..."
  exec pnpm run start:dev
fi
