import { PrismaClient } from '@prisma/generated/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
  adapter: PrismaMariaDb;
};

const dbInfo = parseMysql(process.env.DATABASE_URL || '');

const adapter =
  globalForPrisma.adapter ||
  new PrismaMariaDb({
    user: dbInfo.user,
    password: dbInfo.password,
    host: dbInfo.host,
    port: dbInfo.port,
    database: dbInfo.database,
    connectionLimit: dbInfo.queryParams.connectionLimit
      ? parseInt(dbInfo.queryParams.connectionLimit, 10)
      : 5,
    acquireTimeout: dbInfo.queryParams.pool_timeout
      ? parseInt(dbInfo.queryParams.pool_timeout, 10) * 1000
      : 30000,
  });

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

function parseMysql(connStr: string) {
  const regex = /^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)\??(.*)$/;
  const match = connStr.match(regex);

  if (!match) {
    throw new Error('Invalid MySQL connection string format.');
  }

  const [, user, password, host, portStr, database, query] = match;

  const queryParams: Record<string, string> = {};
  if (query) {
    query.split('&').forEach((pair) => {
      const [key, value] = pair.split('=');
      if (key) {
        queryParams[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
    });
  }

  return {
    user,
    password,
    host,
    port: parseInt(portStr, 10),
    database,
    queryParams,
  };
}
