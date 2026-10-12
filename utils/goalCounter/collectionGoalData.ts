import prisma from '@utils/prisma';
import { GOAL_COLLECTIONS, isGoalCollectionSlug, type GoalCollectionSlug } from './collections';

export type CollectionGoalData = {
  collection: GoalCollectionSlug;
  title: string;
  iconImage: string;
  /** hidden items of the checklist that are still in the official list */
  owned: number;
  /** visible items of the official list */
  total: number;
};

/**
 * Resolves the collection behind a list and the owner's progress.
 *
 * - A user list must be linked to one of the official collection lists; owned items are the ones
 *   hidden in the user's list (the checklist convention) that are still in the official list.
 * - An official collection list resolves to itself with nothing owned.
 */
export async function getCollectionGoalData(listId: number): Promise<CollectionGoalData | null> {
  const list = await prisma.userList.findUnique({
    where: { internal_id: listId },
    select: {
      internal_id: true,
      official: true,
      slug: true,
      linkedList: { select: { internal_id: true, official: true, slug: true } },
    },
  });

  if (!list) return null;

  let official: { internal_id: number; slug: GoalCollectionSlug };
  if (list.official && isGoalCollectionSlug(list.slug)) {
    official = { internal_id: list.internal_id, slug: list.slug };
  } else if (list.linkedList?.official && isGoalCollectionSlug(list.linkedList.slug)) {
    official = { internal_id: list.linkedList.internal_id, slug: list.linkedList.slug };
  } else return null;

  const isOfficialItself = official.internal_id === list.internal_id;

  const [total, ownedRows] = await Promise.all([
    prisma.listItems.count({ where: { list_id: official.internal_id, isHidden: false } }),
    isOfficialItself
      ? Promise.resolve([] as { n: bigint | number }[])
      : (prisma.$queryRaw`
          SELECT COUNT(*) AS n
          FROM listitems u
          JOIN listitems o ON o.item_iid = u.item_iid AND o.list_id = ${official.internal_id} AND o.isHidden = 0
          WHERE u.list_id = ${list.internal_id} AND u.isHidden = 1
        ` as Promise<{ n: bigint | number }[]>),
  ]);

  return {
    collection: official.slug,
    title: GOAL_COLLECTIONS[official.slug].title,
    iconImage: GOAL_COLLECTIONS[official.slug].icon,
    owned: Number(ownedRows[0]?.n ?? 0),
    total,
  };
}
