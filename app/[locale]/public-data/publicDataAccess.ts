import type { User } from '@types';

export const MIN_ACCOUNT_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export type PublicDataAccess = 'unauthenticated' | 'banned' | 'new_account' | 'ok';

export function canAccessPublicData(user: User | null): PublicDataAccess {
  if (!user) return 'unauthenticated';
  if (user.banned) return 'banned';
  if (
    user.role !== 'ADMIN' &&
    Date.now() - new Date(user.createdAt).getTime() < MIN_ACCOUNT_AGE_MS
  ) {
    return 'new_account';
  }
  return 'ok';
}
