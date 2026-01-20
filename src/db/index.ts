/**
 * Custom Juma:
 * Description: Database connection using Drizzle ORM with PostgreSQL.
 *
 * This file creates and exports the database client instance.
 * It uses 'postgres.js' driver which is compatible with Next.js,
 * Edge Runtime, and Serverless environments.
 *
 * Usage:
 * import { db } from '@/db'
 * const users = await db.select().from(usersTable)
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
