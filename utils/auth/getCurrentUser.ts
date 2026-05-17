import type { NextApiRequest } from 'next';
import prisma from '@utils/prisma';
import { CheckAuth } from '@utils/googleCloud';
import { SESSION_DURATION_SECONDS, needsRefresh, signSession } from '@utils/auth/jwt';
import type { UserRoles } from '@types';

type GetCurrentUserOptions = {
  req?: NextApiRequest | null;
  sessionCookie?: string;
  updateLastLogin?: boolean;
  ip?: string;
};

type CurrentUserResult = {
  user: Awaited<ReturnType<typeof CheckAuth>>['user'];
  refreshedSessionCookie: string | null;
};

export async function getCurrentUser(
  options: GetCurrentUserOptions = {}
): Promise<CurrentUserResult> {
  const { req = null, sessionCookie, updateLastLogin = false, ip = '' } = options;
  const { user, decodedToken } = await CheckAuth(req, undefined, sessionCookie);

  if (!user) {
    return { user: null, refreshedSessionCookie: null };
  }

  let refreshedSessionCookie: string | null = null;

  if (needsRefresh(decodedToken.exp)) {
    const newToken = await signSession({
      uid: user.id,
      email: user.email,
      role: user.role as UserRoles,
    });

    refreshedSessionCookie =
      `session=${newToken};Path=/;HttpOnly;Secure;SameSite=Strict;` +
      `Max-Age=${SESSION_DURATION_SECONDS};`;
  }

  if (updateLastLogin) {
    // we don't care about the result of this update, so we won't await it
    prisma.user
      .update({
        where: { id: user.id },
        data: {
          last_ip: ip,
          last_login: new Date(),
        },
      })
      .then(() => {})
      .catch(() => {});
  }

  return { user, refreshedSessionCookie };
}
