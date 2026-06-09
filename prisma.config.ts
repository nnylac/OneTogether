import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'prisma/config';

config({
  path: fileURLToPath(new URL('apps/backend/.env', import.meta.url)),
});

export default defineConfig({
  schema: 'apps/backend/prisma/schema.prisma',
  migrations: {
    path: 'apps/backend/prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
