import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { io } from 'next/cache';
import { getCurrentUser } from '@utils/auth/getCurrentUser';

export const getServerCurrentUser = cache(async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return { user: null, refreshedSessionCookie: null };
  }

  // Cookies resolve during runtime prefetches (partialPrefetching). JWT checks, Redis/Prisma
  // lookups and the user-specific queries that follow read the clock synchronously, which
  // aborts the whole prefetch — so signed-in content waits for the request instead.
  await io();

  return getCurrentUser({ sessionCookie });
});
