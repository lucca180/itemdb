import { cookies } from 'next/headers';
import { getCurrentUser } from '@utils/auth/getCurrentUser';
import type { User } from '@types';

export type PreloadedAuthState = {
  user: User | null;
};

export async function getPreloadedAuthState(): Promise<PreloadedAuthState> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  if (!sessionCookie) {
    return { user: null };
  }

  try {
    const { user } = await getCurrentUser({ sessionCookie, updateLastLogin: true });
    return { user };
  } catch {
    return { user: null };
  }
}
