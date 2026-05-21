import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { getCurrentUser } from '@utils/auth/getCurrentUser';

export const getServerCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return { user: null, refreshedSessionCookie: null };
  }

  return getCurrentUser({ sessionCookie });
});
