import { PrismaMariaDb } from '@prisma/adapter-mariadb';

/**
 * Production pool defaults — sized for item-page preload bursts (~15 parallel queries)
 * with 3 PM2 workers (3 × 18 = 54 max connections per active deploy).
 */
export const MARIADB_POOL_DEFAULTS_PRODUCTION = {
  connectionLimit: '18',
  acquireTimeout: '10000',
  idleTimeout: '900',
  leakDetectionTimeout: '30000',
} as const;

/** Modest pool defaults for local `yarn dev` (single Node process). */
export const MARIADB_POOL_DEFAULTS_DEVELOPMENT = {
  connectionLimit: '5',
  acquireTimeout: '10000',
  idleTimeout: '600',
} as const;

export function getMariaDbPoolDefaults() {
  return process.env.NODE_ENV === 'production'
    ? MARIADB_POOL_DEFAULTS_PRODUCTION
    : MARIADB_POOL_DEFAULTS_DEVELOPMENT;
}

export function withMariaDbPoolDefaults(databaseUrl: string): string {
  if (!databaseUrl) return databaseUrl;

  try {
    const url = new URL(databaseUrl);

    if (url.protocol === 'mysql:') {
      url.protocol = 'mariadb:';
    }

    for (const [key, value] of Object.entries(getMariaDbPoolDefaults())) {
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
