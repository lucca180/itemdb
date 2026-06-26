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

export default prisma;
