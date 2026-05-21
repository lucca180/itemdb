import type { User } from '@types';
import prisma from '@utils/prisma';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';

export type PreloadedAuthState = {
  user: User | null;
};

export async function getPreloadedAuthState(): Promise<PreloadedAuthState> {
  const { user } = await getServerCurrentUser();

  try {
    if (user) {
      // Keep the lightweight "last seen" update without re-fetching auth state.
      prisma.user
        .update({
          where: { id: user.id },
          data: {
            last_ip: '',
            last_login: new Date(),
          },
        })
        .then(() => {})
        .catch(() => {});
    }

    return { user };
  } catch {
    return { user: null };
  }
}
