import type { ImportPreviewItem } from '@app/[locale]/lists/import/importShared';
import prisma from '@utils/prisma';

export type ImportItemBadge = 'gourmet' | 'book' | 'booktastic' | 'stamp' | 'wearable' | 'bd';

const BOOKTASTIC_CATEGORY = 'booktastic book';

/** Resolves award/collection badges for a (paginated) set of import items. */
export async function getImportItemBadges(
  items: ImportPreviewItem[]
): Promise<Map<number, ImportItemBadge[]>> {
  const ids = [...new Set(items.map(({ item }) => item.internal_id))];
  const result = new Map<number, ImportItemBadge[]>();
  if (!ids.length) return result;

  const [useTypes, stampRows] = await Promise.all([
    prisma.items.findMany({
      where: { internal_id: { in: ids } },
      select: { internal_id: true, canEat: true, canRead: true },
    }),
    prisma.listItems.findMany({
      where: {
        item_iid: { in: ids },
        isHidden: false,
        list: { official: true, official_tag: 'stamps', visibility: 'public' },
      },
      select: { item_iid: true },
      distinct: ['item_iid'],
    }),
  ]);

  const useTypesById = new Map(useTypes.map((row) => [row.internal_id, row]));
  const stampIds = new Set(stampRows.map((row) => row.item_iid));

  for (const { item } of items) {
    if (result.has(item.internal_id)) continue;

    const badges: ImportItemBadge[] = [];
    const types = useTypesById.get(item.internal_id);
    const rarity = item.rarity ?? 0;

    if (types?.canEat === 'true' && rarity >= 90 && rarity <= 100) badges.push('gourmet');
    if (types?.canRead === 'true') {
      badges.push(item.category?.toLowerCase() === BOOKTASTIC_CATEGORY ? 'booktastic' : 'book');
    }
    if (stampIds.has(item.internal_id)) badges.push('stamp');
    if (item.flags.includes('wearable')) badges.push('wearable');
    if (item.flags.includes('bd')) badges.push('bd');

    result.set(item.internal_id, badges);
  }

  return result;
}
