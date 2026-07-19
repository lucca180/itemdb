/**
 * Short-TTL Redis cache for the `CheckAuth` user lookup.
 *
 * `CheckAuth` runs on every authenticated request and its only slow step is a
 * `prisma.user.findUnique`. We cache the *mapped* `User` (the value CheckAuth
 * returns) so repeat requests skip the DB round trip.
 *
 * We cache the mapped `User` — not the raw Prisma row — because `rawToUser`
 * already serializes `last_login` / `createdAt` to strings, so the value
 * JSON-round-trips cleanly (no Date revival needed).
 *
 * Fail-open by design: when Redis is absent (dev/test) or slow, reads return
 * `undefined` (caller falls back to Prisma) and writes are no-ops. The hard
 * latency ceiling comes from the client's `commandTimeout` (see `redisCache`),
 * so a slow/timed-out command simply throws and is swallowed here. Correctness
 * for user-driven edits is preserved via `invalidateCachedUser` on writes; a
 * bounded staleness window (up to the TTL) is accepted for role/banned/xp.
 */
import { redisCache as redis } from '@utils/api/redis';
import type { User } from '@types';

/** Bounds staleness of role/banned/xp for changes not routed through invalidation. */
export const AUTH_USER_CACHE_TTL_SECONDS = 60;

function authUserKey(uid: string): string {
  return `auth:user:${uid}`;
}

export async function getCachedUser(uid: string): Promise<User | undefined> {
  if (!redis || !uid) return undefined;

  try {
    const value = await redis.get(authUserKey(uid));
    if (typeof value !== 'string') return undefined;
    return JSON.parse(value) as User;
  } catch {
    // No redis, command timeout, or corrupt value — treat as a miss.
    return undefined;
  }
}

export async function setCachedUser(uid: string, user: User): Promise<void> {
  if (!redis || !uid) return;

  try {
    await redis.set(authUserKey(uid), JSON.stringify(user), 'EX', AUTH_USER_CACHE_TTL_SECONDS);
  } catch (error) {
    console.error('setCachedUser redis error', error);
  }
}

export async function invalidateCachedUser(uid: string): Promise<void> {
  if (!redis || !uid) return;

  try {
    await redis.del(authUserKey(uid));
  } catch (error) {
    console.error('invalidateCachedUser redis error', error);
  }
}
