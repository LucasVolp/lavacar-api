#!/bin/sh
set -e

echo "📦 Gerando Prisma Client..."
npx prisma generate

echo "📄 Aplicando migrations existentes..."
npx prisma migrate deploy

echo "🌱 Populando banco de dados com dados iniciais..."
pnpm run db:seed

echo "🚀 Iniciando NestJS..."
pnpm run start:dev