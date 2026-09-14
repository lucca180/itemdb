import type { NextApiRequest } from 'next';
import prisma from './prisma';
import { User as dbUser } from '@prisma/generated/client';
import { rawToUser } from '../pages/api/auth/login';
import { verifySession, VerifiedSession } from './auth/jwt';
import { getCachedUser, setCachedUser } from './auth/userCache';

// R2/S3 storage helpers now live in ./r2Storage (kept independent of auth/redis so standalone
// scripts can import just those without pulling in an ioredis connection). Re-exported here
// for backwards compatibility with existing call sites.
export * from './r2Storage';

// Kept for backwards-compatibility — call sites that destructure `decodedToken`
// use its `uid` and `email` fields, which we populate from the JWT payload.
export type DecodedToken = {
  uid: string;
  email: string | undefined;
  role: string;
  sessionVersion?: VerifiedSession['sessionVersion'];
  exp: number;
};

/** No-op shim — kept so import sites that reference `Auth` don't break. */
export const Auth = {
  // intentionally empty — Firebase Auth has been removed
} as const;

export type CheckAuthResult = {
  decodedToken: DecodedToken | null;
  user: ReturnType<typeof rawToUser> | null;
};

/**
 * Validates the session cookie and loads the user.
 *
 * Expected auth failures (missing / invalid / expired session) return
 * `{ decodedToken: null, user: null }` instead of throwing — callers should
 * treat that as unauthenticated. Only unexpected failures (e.g. DB) throw.
 */
export const CheckAuth = async (
  req: NextApiRequest | null,
  _token?: string,
  sessionOverride?: string,
  skipUser = false
): Promise<CheckAuthResult> => {
  const sessionCookie = sessionOverride ?? req?.cookies?.session;
  if (!sessionCookie) return { decodedToken: null, user: null };

  let payload: VerifiedSession;
  try {
    payload = await verifySession(sessionCookie);
  } catch {
    return { decodedToken: null, user: null };
  }

  const decodedToken: DecodedToken = {
    uid: payload.uid,
    email: payload.email,
    role: payload.role,
    sessionVersion: payload.sessionVersion,
    exp: payload.exp,
  };

  if (skipUser) return { decodedToken, user: null };

  const cached = await getCachedUser(payload.uid);
  if (cached) return { decodedToken, user: cached };

  const dbUser = (await prisma.user.findUnique({
    where: { id: payload.uid },
  })) as dbUser | null;

  if (!dbUser) return { decodedToken, user: null };

  const user = rawToUser(dbUser);

  // Fire-and-forget: caching must never block or fail the auth check.
  void setCachedUser(payload.uid, user);

  return { decodedToken, user };
};
