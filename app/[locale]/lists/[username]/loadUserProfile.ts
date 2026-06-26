import 'server-only';

import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';
import { notFound } from 'next/navigation';
import { getListMatchWithViewer } from '@pages/api/v1/lists/match/[...usernames]';
import { getUser } from '@pages/api/v1/users/[username]';
import { getUserAchievements } from '@pages/api/v1/users/[username]/achievements';
import { ListService } from '@services/ListService';
import type { ListItemInfo, User, UserAchievement, UserList } from '@types';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import {
  userAchievementsTag,
  userListsTag,
  userMatchesTag,
  userProfileTag,
} from '@utils/appCacheTags';
export type ProfileListMatches = {
  seek: { [list_id: number]: ListItemInfo[] };
  trade: { [list_id: number]: ListItemInfo[] };
};

export function countProfileMatchItems(matches: ProfileListMatches, key: 'seek' | 'trade') {
  return new Set(Object.values(matches[key]).flat()).size;
}

export type UserProfilePageData = {
  owner: User;
  viewer: User | null;
  isOwner: boolean;
  lists: UserList[];
  achievements: UserAchievement[];
  matches: ProfileListMatches;
};

async function getUserCachedData(username: string) {
  'use cache';
  cacheTag(userProfileTag(username));
  cacheLife('homeSection');

  return getUser(username);
}

const getUserCached = cache(getUserCachedData);

async function loadUserAchievementsCached(username: string, owner: User) {
  'use cache';
  cacheTag(userAchievementsTag(username));
  cacheLife('homeSlow');

  return (await getUserAchievements(owner)) ?? [];
}

async function loadUserListsCached(username: string, isOwnerView: boolean) {
  'use cache';
  cacheTag(userListsTag(username));
  cacheLife('homeSection');

  const owner = await getUser(username);
  if (!owner) return [];

  return ListService.initUser(isOwnerView ? owner : null).getUserLists({
    username,
    owner,
  });
}

async function loadProfileMatchesCached(viewerUsername: string, ownerUsername: string) {
  'use cache';
  cacheTag(userMatchesTag(viewerUsername, ownerUsername));
  cacheLife('itemFast');

  const [viewer, owner] = await Promise.all([
    getUserCached(viewerUsername),
    getUserCached(ownerUsername),
  ]);

  if (!viewer || !owner) {
    return { seek: {}, trade: {} } as ProfileListMatches;
  }

  try {
    const [seek, trade] = await Promise.all([
      getListMatchWithViewer(viewerUsername, ownerUsername, viewer) as Promise<{
        [list_id: number]: ListItemInfo[];
      }>,
      getListMatchWithViewer(ownerUsername, viewerUsername, viewer) as Promise<{
        [list_id: number]: ListItemInfo[];
      }>,
    ]);

    return { seek, trade };
  } catch {
    return { seek: {}, trade: {} } as ProfileListMatches;
  }
}

export async function loadUserProfile(username: string): Promise<UserProfilePageData> {
  const [{ user: viewer }, owner] = await Promise.all([
    getServerCurrentUser(),
    getUserCached(username),
  ]);

  if (!owner) notFound();

  const isOwner = viewer?.id === owner.id;
  const shouldLoadMatches = Boolean(viewer && !isOwner && viewer.username);

  const [lists, achievements, matches] = await Promise.all([
    loadUserListsCached(username, isOwner),
    loadUserAchievementsCached(username, owner),
    shouldLoadMatches
      ? loadProfileMatchesCached(viewer!.username!, username)
      : Promise.resolve({ seek: {}, trade: {} } as ProfileListMatches),
  ]);

  return { owner, viewer, isOwner, lists, achievements, matches };
}

export const loadUserProfileRequest = cache(loadUserProfile);
