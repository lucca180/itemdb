import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@utils/prisma';
import { isStampAlbum, toAvatarUrl } from './stampGoalData';

export type GoalCounterInfo = {
  albumListId: number;
  avatarName: string;
  avatarImage: string;
};

export const goalCounterAlbumTag = (albumListId: number) => `goal-counter-album:${albumListId}`;

/**
 * Whether an official list is a stamp album page with an avatar (and so can have goal counters).
 * Keyed by the album, so every checklist linked to the same page shares the cached answer.
 * Avatars rarely change; the tag allows invalidating it after an avatar sync.
 */
export async function getGoalCounterAlbum(albumListId: number): Promise<GoalCounterInfo | null> {
  'use cache';
  cacheLife('days');
  cacheTag(goalCounterAlbumTag(albumListId));

  const [album, avatar] = await Promise.all([
    prisma.userList.findUnique({
      where: { internal_id: albumListId },
      select: { official: true, official_tag: true },
    }),
    prisma.avatarSolution.findFirst({
      where: { list_id: albumListId },
      orderBy: { internal_id: 'asc' },
      select: { name: true, image: true },
    }),
  ]);

  if (!isStampAlbum(album) || !avatar) return null;

  return { albumListId, avatarName: avatar.name, avatarImage: toAvatarUrl(avatar.image) };
}

/** Goal counters are offered on user checklists linked to a stamp album page. */
export async function getListGoalCounter(list: {
  official: boolean;
  linkedListId: number | null;
}): Promise<GoalCounterInfo | null> {
  if (list.official || !list.linkedListId) return null;
  return getGoalCounterAlbum(list.linkedListId);
}
