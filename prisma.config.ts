import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'npx ts-node ./prisma/seed.ts',
  },
  datasource: {
    // process.env allows build-time generate without a real DB connection.
    // env() from prisma/config throws if the variable is missing.
    url: process.env.DATABASE_URL ?? '',
  },
});
