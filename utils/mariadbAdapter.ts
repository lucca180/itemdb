import { PrismaMariaDb } from '@prisma/adapter-mariadb';

/** Applied to DATABASE_URL when a pool param is not already set. */
export const MARIADB_POOL_DEFAULTS = {
  connectionLimit: '4',
  acquireTimeout: '15000',
  idleTimeout: '600',
  minimumIdle: '1',
} as const;

export function withMariaDbPoolDefaults(databaseUrl: string): string {
  if (!databaseUrl) return databaseUrl;

  try {
    const url = new URL(databaseUrl);

    if (url.protocol === 'mysql:') {
      url.protocol = 'mariadb:';
    }

    for (const [key, value] of Object.entries(MARIADB_POOL_DEFAULTS)) {
      if (!url.searchParams.has(key)) {
        url.searchParams.set(key, value);
      }
    }

    if (!url.searchParams.has('prepareCacheLength')) {
      url.searchParams.set('prepareCacheLength', '0');
    }

    return url.toString();
  } catch {
    return databaseUrl;
  }
}

export function createPrismaAdapter(databaseUrl: string): PrismaMariaDb {
  return new PrismaMariaDb(withMariaDbPoolDefaults(databaseUrl));
}
