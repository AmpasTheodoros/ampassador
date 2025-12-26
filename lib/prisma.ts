import { PrismaClient } from "@prisma/client";

/**
 * Prisma Client Singleton
 * 
 * Optimized for Neon Serverless Postgres:
 * - Use connection pooling URL in production: ?sslmode=require&pgbouncer=true
 * - This singleton pattern prevents connection exhaustion in serverless environments
 * - Prisma works seamlessly with Neon's connection pooling
 * 
 * Connection Closure Errors:
 * - The "Error in PostgreSQL connection: Error { kind: Closed }" errors are expected
 * - They occur when Neon serverless closes idle connections after queries complete
 * - These are harmless and don't affect functionality - Prisma handles reconnection automatically
 * - We filter them from logs to reduce noise
 * 
 * For Edge Functions (advanced):
 * - Consider using @neondatabase/serverless with PrismaNeon adapter
 * - Current setup works great for API routes and server components
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Store original console.error
const originalConsoleError = console.error;

// Override console.error to filter out expected connection closure errors
// This prevents noise from harmless Neon serverless connection cleanup
console.error = (...args: any[]) => {
  const message = args[0]?.toString() || "";
  
  // Suppress expected connection closure errors from Neon serverless
  // These occur when connections are cleaned up after queries complete
  if (
    message.includes("prisma:error Error in PostgreSQL connection: Error { kind: Closed") ||
    message.includes("kind: Closed, cause: None") ||
    (message.includes("Error in PostgreSQL connection") && message.includes("Closed"))
  ) {
    // These are expected cleanup errors - suppress from logs
    return;
  }
  
  // Log all other errors normally
  originalConsoleError.apply(console, args);
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"]
      : ["error"],
    // Neon-specific: Connection pooling is handled via DATABASE_URL
    // Make sure your DATABASE_URL uses the pooling endpoint (ends with ?pgbouncer=true)
  });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

// Prevent multiple instances in development (Next.js hot reload)
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

