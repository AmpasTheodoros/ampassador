import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton
 * 
 * Optimized for Neon Serverless Postgres:
 * - Use connection pooling URL in production: ?sslmode=require&pgbouncer=true
 * - This singleton pattern prevents connection exhaustion in serverless environments
 * - Prisma works seamlessly with Neon's connection pooling
 * 
 * For Edge Functions (advanced):
 * - Consider using @neondatabase/serverless with PrismaNeon adapter
 * - Current setup works great for API routes and server components
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // Neon-specific: Connection pooling is handled via DATABASE_URL
    // Make sure your DATABASE_URL uses the pooling endpoint (ends with ?pgbouncer=true)
  });

// Prevent multiple instances in development (Next.js hot reload)
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

