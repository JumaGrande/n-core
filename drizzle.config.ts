/**
 * Custom Juma:
 * Description: Drizzle Kit configuration for database migrations.
 *
 * This file configures Drizzle Kit to generate and run migrations
 * for PostgreSQL. It points to the schema file and uses the
 * DATABASE_URL environment variable for the connection.
 *
 * Commands:
 * - npm run db:generate - Generate migration files
 * - npm run db:migrate - Apply migrations to database
 * - npm run db:push - Push schema directly (dev only)
 */
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
