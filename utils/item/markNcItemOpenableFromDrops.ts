import { LogService } from '@services/ActionLogService';
import prisma from '@utils/prisma';
import { ItemRevalidateTags, revalidateItem } from '@utils/item/revalidateItem';

export type NcOpenableMarkCandidate = {
  internal_id: number;
  isNC: boolean;
  canOpen?: string;
  useTypes?: { canOpen: string };
};

/** NC items that still have an unknown openable flag — never overrides an explicit false. */
export const isNcUnknownOpenable = (item: NcOpenableMarkCandidate) => {
  const canOpen = item.useTypes?.canOpen ?? item.canOpen;
  return item.isNC && canOpen === 'unknown';
};

/**
 * Persist `canOpen = true` for an NC item that received at least one NC drop.
 * No-ops when the row is NP, already true, explicitly false, or every drop is NP.
 */
export async function markNcItemOpenableFromDrops(
  internalId: number,
  dropItemIds: number[]
): Promise<boolean> {
  try {
    if (dropItemIds.length === 0) return false;

    const ncDropCount = await prisma.items.count({
      where: { internal_id: { in: dropItemIds }, isNC: true },
    });

    if (ncDropCount === 0) return false;

    const result = await prisma.items.updateMany({
      where: {
        internal_id: internalId,
        isNC: true,
        canOpen: 'unknown',
      },
      data: {
        canOpen: 'true',
      },
    });

    if (result.count === 0) return false;

    await Promise.all([
      LogService.createLog(
        'itemUpdate',
        { canOpen: { oldVal: 'unknown', newVal: 'true' } },
        String(internalId),
        'itemdb_system'
      ),
      revalidateItem(internalId, ItemRevalidateTags.root(internalId)),
    ]);

    return true;
  } catch (error) {
    console.error('markNcItemOpenableFromDrops error', error);
    return false;
  }
}

export async function maybeMarkNcItemOpenableFromDrops(
  item: NcOpenableMarkCandidate,
  dropItemIds: number[]
): Promise<boolean> {
  if (!isNcUnknownOpenable(item)) return false;
  return markNcItemOpenableFromDrops(item.internal_id, dropItemIds);
}
