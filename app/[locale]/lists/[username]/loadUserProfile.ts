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

export type ProfileData = {
  owner: User;
  viewer: User | null;
  isOwner: boolean;
  lists: UserList[];
  achievements: UserAchievement[];
  matches: ProfileListMatches;
};

export type ProfileCore = {
  owner: User;
  viewer: User | null;
  isOwner: boolean;
};

export type ProfileListData = {
  lists: UserList[];
  matches: ProfileListMatches;
};

async function fetchUser(username: string) {
  'use cache';
  cacheTag(userProfileTag(username));
  cacheLife('homeSection');

  return getUser(username);
}

const getUserCached = cache(fetchUser);

async function fetchAchievements(username: string, owner: User) {
  'use cache';
  cacheTag(userAchievementsTag(username));
  cacheLife('homeSlow');

  return (await getUserAchievements(owner)) ?? [];
}

const getAchievementsCached = cache(fetchAchievements);

async function fetchLists(username: string, isOwnerView: boolean) {
  'use cache';
  cacheTag(userListsTag(username));
  cacheLife('homeSection');

  const owner = await getUserCached(username);
  if (!owner) return [];

  return ListService.initUser(isOwnerView ? owner : null).getUserLists({
    username,
    owner,
  });
}

const getListsCached = cache(fetchLists);

async function fetchMatches(viewerUsername: string, ownerUsername: string) {
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

const getMatchesCached = cache(fetchMatches);

async function resolveProfileCore(username: string): Promise<ProfileCore> {
  const [{ user: viewer }, owner] = await Promise.all([
    getServerCurrentUser(),
    getUserCached(username),
  ]);

  if (!owner) notFound();

  return { owner, viewer, isOwner: viewer?.id === owner.id };
}

export const getProfileCore = cache(resolveProfileCore);

async function resolveAchievements(username: string): Promise<UserAchievement[]> {
  const owner = await getUserCached(username);
  if (!owner) return [];

  return getAchievementsCached(username, owner);
}

export const getAchievements = cache(resolveAchievements);

async function resolveLists(username: string, isOwner: boolean): Promise<UserList[]> {
  return getListsCached(username, isOwner);
}

export const getLists = cache(resolveLists);

async function resolveMatches(
  ownerUsername: string,
  viewerUsername: string | undefined,
  isOwner: boolean
): Promise<ProfileListMatches> {
  if (!viewerUsername || isOwner) {
    return { seek: {}, trade: {} } as ProfileListMatches;
  }

  return getMatchesCached(viewerUsername, ownerUsername);
}

export const getMatches = cache(resolveMatches);

async function resolveListData(
  username: string,
  isOwner: boolean,
  viewerUsername: string | undefined
): Promise<ProfileListData> {
  const [lists, matches] = await Promise.all([
    getLists(username, isOwner),
    getMatches(username, viewerUsername, isOwner),
  ]);

  return { lists, matches };
}

export const getListData = cache(resolveListData);

async function resolveProfile(username: string): Promise<ProfileData> {
  const core = await getProfileCore(username);
  const [listData, achievements] = await Promise.all([
    getListData(username, core.isOwner, core.viewer?.username ?? undefined),
    getAchievements(username),
  ]);

  return { ...core, ...listData, achievements };
}

export const getProfile = cache(resolveProfile);
