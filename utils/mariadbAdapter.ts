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

/** Default per-statement timeout (seconds) for app pool connections in production. */
export const DEFAULT_STATEMENT_TIMEOUT = 90;

export type PrismaAdapterOptions = {
  /** Pass `false` to skip session timeout (maintenance scripts). */
  statementTimeout?: number | false;
};

/**
 * Production pool defaults
 * with 4 PM2 workers (4 × 16 = 64 max connections per active deploy).
 */
export const MARIADB_POOL_DEFAULTS_PRODUCTION = {
  connectionLimit: 16,
  connectTimeout: 3_000,
  acquireTimeout: 20_000,
  idleTimeout: 900,
  leakDetectionTimeout: 0,
} as const satisfies Partial<PoolConfig>;

/** Modest pool defaults for local `yarn dev` (single Node process). */
export const MARIADB_POOL_DEFAULTS_DEVELOPMENT = {
  connectionLimit: 5,
  acquireTimeout: 10_000,
  idleTimeout: 600,
  leakDetectionTimeout: 0,
} as const satisfies Partial<PoolConfig>;

export function getMariaDbPoolDefaults(): Partial<PoolConfig> {
  return process.env.NODE_ENV === 'development'
    ? MARIADB_POOL_DEFAULTS_DEVELOPMENT
    : MARIADB_POOL_DEFAULTS_PRODUCTION;
}

function getStatementTimeout(
  override?: PrismaAdapterOptions['statementTimeout']
): number | undefined {
  if (override === false) return undefined;
  if (typeof override === 'number') {
    return override > 0 ? override : undefined;
  }

  const raw = process.env.DB_STATEMENT_TIMEOUT;
  if (raw === '0') return undefined;
  if (raw != null && raw !== '') {
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }

  if (process.env.NODE_ENV === 'production') {
    return DEFAULT_STATEMENT_TIMEOUT;
  }

  return undefined;
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
export function buildMariaDbPoolConfig(
  databaseUrl: string,
  options?: PrismaAdapterOptions
): PoolConfig | string {
  if (!databaseUrl) return databaseUrl;

  try {
    const url = new URL(databaseUrl);
    const database = url.pathname.replace(/^\//, '') || undefined;
    const statementTimeout = getStatementTimeout(options?.statementTimeout);

    return {
      host: url.hostname,
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
      // Required with binary protocol; kept at 0 even with useTextProtocol (Prisma default).
      prepareCacheLength: 0,
      ...getMariaDbPoolDefaults(),
      ...parsePoolOverrides(url.searchParams),
      ...(statementTimeout != null
        ? { sessionVariables: { max_statement_time: statementTimeout } }
        : {}),
    };
  } catch {
    return databaseUrl;
  }
}

export function createPrismaAdapter(
  databaseUrl: string,
  options?: PrismaAdapterOptions
): PrismaMariaDb {
  return new PrismaMariaDb(buildMariaDbPoolConfig(databaseUrl, options), {
    // Text protocol avoids COM_STMT_PREPARE/CLOSE churn and prepared-statement leaks
    // (see prisma/prisma#29364). Trade-off: less precise numeric conversions vs binary.
    useTextProtocol: true,
  });
}
