import prisma from '@utils/prisma';
import { redis } from '@utils/api/redis';

const PATH_MAX = 255;
const FLUSH_EVERY_SECONDS = 60;
const DP_WINDOW_SECONDS = 24 * 60 * 60;

function metaKey(id: string) {
  return `apiKeyTel:${id}`;
}

function normalizePath(path?: string) {
  if (!path) return null;
  const withoutQuery = path.split('?')[0] ?? '';
  const trimmed = withoutQuery.slice(0, PATH_MAX);
  return trimmed || null;
}

/** Fire-and-forget. Must not be awaited on the API hot path. */
export function trackApiKeyTelemetry(args: {
  keyId: string | number;
  ip?: string;
  path?: string;
  requests?: number;
  dataPoints?: number;
}) {
  void persistApiKeyTelemetry(args);
}

async function persistApiKeyTelemetry(args: {
  keyId: string | number;
  ip?: string;
  path?: string;
  requests?: number;
  dataPoints?: number;
}) {
  if (!redis) return;

  const keyId = Number(args.keyId);
  if (Number.isNaN(keyId)) return;

  const id = String(keyId);
  const requests = args.requests ?? 1;
  const dataPoints = args.dataPoints ?? 0;
  const lastIp = args.ip || null;
  const lastPath = normalizePath(args.path);

  if (requests <= 0 && dataPoints <= 0 && !lastIp && !lastPath) return;

  try {
    const hashKey = metaKey(id);
    if (lastIp) await redis.hset(hashKey, 'ip', lastIp);
    if (lastPath) await redis.hset(hashKey, 'path', lastPath);
    if (requests > 0) await redis.incrby(`${hashKey}:n`, requests);
    if (dataPoints > 0) {
      const dpKey = `${hashKey}:dp`;
      await redis.incrby(dpKey, dataPoints);
      const ttl = await redis.ttl(dpKey);
      if (ttl < 0) await redis.expire(dpKey, DP_WINDOW_SECONDS);
    }

    const locked = await redis.set(`${hashKey}:lock`, '1', 'EX', FLUSH_EVERY_SECONDS, 'NX');
    if (locked !== 'OK') return;

    const [hash, pendingRaw, dpRaw] = await Promise.all([
      redis.hgetall(hashKey),
      redis.get(`${hashKey}:n`),
      redis.get(`${hashKey}:dp`),
    ]);

    const pending = Number(pendingRaw || 0);
    const dataPoints24h = Number(dpRaw || 0);

    await prisma.$executeRaw`
      UPDATE apiKeys
      SET
        lastUsedAt = NOW(),
        lastIp = COALESCE(${hash.ip || null}, lastIp),
        lastPath = COALESCE(${hash.path || null}, lastPath),
        requestCount = requestCount + ${pending},
        dataPoints24h = ${dataPoints24h}
      WHERE key_id = ${keyId}
    `;

    if (pending > 0) await redis.decrby(`${hashKey}:n`, pending);
  } catch (e) {
    console.error('api key telemetry error', e);
  }
}
