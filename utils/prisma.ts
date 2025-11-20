import { PrismaClient } from '@prisma/generated/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  adapter: PrismaMariaDb;
};

const adapter = globalForPrisma.adapter || new PrismaMariaDb(process.env.DATABASE_URL || '');

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    transactionOptions: {
      maxWait: 5000,
      timeout: 10000,
    },
  });

// const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.adapter = adapter;
}

export default prisma;
