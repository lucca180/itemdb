import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import type { PoolConfig } from 'mariadb';

const POOL_OPTION_KEYS = [
  'connectionLimit',
  'acquireTimeout',
  'idleTimeout',
  'leakDetectionTimeout',
  'minimumIdle',
  'connectTimeout',
] as const satisfies readonly (keyof PoolConfig)[];

/**
 * Production pool defaults — sized for item-page preload bursts (~15 parallel queries)
 * with 3 PM2 workers (3 × 25 = 75 max connections per active deploy).
 */
export const MARIADB_POOL_DEFAULTS_PRODUCTION = {
  connectionLimit: 25,
  acquireTimeout: 10_000,
  idleTimeout: 600,
  leakDetectionTimeout: 20_000,
} as const satisfies Partial<PoolConfig>;

/** Modest pool defaults for local `yarn dev` (single Node process). */
export const MARIADB_POOL_DEFAULTS_DEVELOPMENT = {
  connectionLimit: 5,
  acquireTimeout: 10_000,
  idleTimeout: 600,
} as const satisfies Partial<PoolConfig>;

export function getMariaDbPoolDefaults(): Partial<PoolConfig> {
  return process.env.NODE_ENV === 'development'
    ? MARIADB_POOL_DEFAULTS_DEVELOPMENT
    : MARIADB_POOL_DEFAULTS_PRODUCTION;
}

function parsePoolOverrides(searchParams: URLSearchParams): Partial<PoolConfig> {
  const overrides: Partial<PoolConfig> = {};

  for (const key of POOL_OPTION_KEYS) {
    const value = searchParams.get(key);
    if (value == null || value === '') continue;
    overrides[key] = Number(value);
  }

  return overrides;
}

/** Builds a mariadb `PoolConfig` from `DATABASE_URL` plus code defaults (not URL query params). */
export function buildMariaDbPoolConfig(databaseUrl: string): PoolConfig | string {
  if (!databaseUrl) return databaseUrl;

  try {
    const url = new URL(databaseUrl);
    const database = url.pathname.replace(/^\//, '') || undefined;

    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
      prepareCacheLength: 0,
      ...getMariaDbPoolDefaults(),
      ...parsePoolOverrides(url.searchParams),
    };
  } catch {
    return databaseUrl;
  }
}

export function createPrismaAdapter(databaseUrl: string): PrismaMariaDb {
  return new PrismaMariaDb(buildMariaDbPoolConfig(databaseUrl));
}
