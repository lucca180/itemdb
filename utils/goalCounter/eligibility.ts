import { cacheLife, cacheTag } from 'next/cache';
import prisma from '@utils/prisma';
import { goalCounterAlbumTag } from '@utils/appCacheTags';
import { isStampAlbum, toAvatarUrl } from './stampGoalData';
import { GOAL_COLLECTIONS, isGoalCollectionSlug, type GoalCollectionSlug } from './collections';

type GoalCounterBase = {
  /** The official list the checklist is linked to */
  albumListId: number;
  /** Shown in the modal header */
  name: string;
  image: string;
};

export type GoalCounterInfo =
  | (GoalCounterBase & { kind: 'stamps' })
  | (GoalCounterBase & { kind: 'collection'; collection: GoalCollectionSlug });

/**
 * Whether an official list can back a goal counter: a stamp album page with an avatar, or one
 * of the collection checklists (Gourmet Food, NeoDeck, Book Awards).
 * Keyed by the official list, so every checklist linked to it shares the cached answer.
 * Avatars rarely change; the avatar sync (/api/v1/avatars) revalidates the tag of every list it
 * touches.
 */
export async function getGoalCounterAlbum(albumListId: number): Promise<GoalCounterInfo | null> {
  'use cache';
  cacheLife('days');
  cacheTag(goalCounterAlbumTag(albumListId));

  const album = await prisma.userList.findUnique({
    where: { internal_id: albumListId },
    select: { official: true, official_tag: true, slug: true, name: true },
  });

  if (!album?.official) return null;

  if (isStampAlbum(album)) {
    const avatar = await prisma.avatarSolution.findFirst({
      where: { list_id: albumListId },
      orderBy: { internal_id: 'asc' },
      select: { name: true, image: true },
    });
    if (!avatar) return null;
    return { kind: 'stamps', albumListId, name: avatar.name, image: toAvatarUrl(avatar.image) };
  }

  if (isGoalCollectionSlug(album.slug)) {
    return {
      kind: 'collection',
      collection: album.slug,
      albumListId,
      name: album.name,
      image: GOAL_COLLECTIONS[album.slug].icon,
    };
  }

  return null;
}

/** Goal counters are offered on user checklists linked to an eligible official list. */
export async function getListGoalCounter(list: {
  official: boolean;
  linkedListId: number | null;
}): Promise<GoalCounterInfo | null> {
  if (list.official || !list.linkedListId) return null;
  return getGoalCounterAlbum(list.linkedListId);
}
