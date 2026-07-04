import { PrismaClient } from '@prisma/generated/client';
import { createPrismaAdapter } from '@utils/mariadbAdapter';
import type { PrismaMariaDb } from '@prisma/adapter-mariadb';

// Next.js may bundle prisma into separate server chunks (app, ssr, pages/api);
// globalThis ensures one adapter + client per process across those chunks.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  adapter: PrismaMariaDb | undefined;
};

const adapter = globalForPrisma.adapter ?? createPrismaAdapter(process.env.DATABASE_URL || '');

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    transactionOptions: {
      maxWait: 5000,
      timeout: 10000,
    },
  });

globalForPrisma.adapter = adapter;
globalForPrisma.prisma = prisma;

/** Idempotent SIGTERM/SIGINT handler — one pool per PM2 worker; PM2 reload sends SIGINT. */
function registerGracefulShutdown(client: PrismaClient) {
  const g = globalThis as typeof globalThis & { __prismaGracefulShutdown?: boolean };
  if (g.__prismaGracefulShutdown) return;
  g.__prismaGracefulShutdown = true;

  let inProgress = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (inProgress) return;
    inProgress = true;
    try {
      await client.$disconnect();
    } catch (error) {
      console.error(`[prisma] ${signal}: failed to disconnect`, error);
    } finally {
      process.exit(0);
    }
  };

  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
}

if (process.env.NODE_ENV !== 'test') {
  registerGracefulShutdown(prisma);
}

export default prisma;
