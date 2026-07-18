import { getNCMallData } from '@pages/api/v1/mall/index';
import { ItemService } from '@services/ItemService';
import type { ItemV2For } from '@types';

export async function getNCMallItemsDataV2(
  limit: number,
  isLeaving = false
): Promise<ItemV2For<'card'>[]> {
  const ncMallData = await getNCMallData(limit, isLeaving);

  const items = await ItemService.getManyItems(
    {
      type: 'id',
      data: ncMallData.map((data) => data.item_iid.toString()),
    },
    { intent: 'card' }
  );

  return Object.values(items).sort((a, b) => {
    const aData = ncMallData.find((data) => data.item_iid === a.internal_id);
    const bData = ncMallData.find((data) => data.item_iid === b.internal_id);

    if (!aData || !bData) return 0;

    if (isLeaving) {
      return (
        new Date(aData.saleEnd ?? 0).getTime() - new Date(bData.saleEnd ?? 0).getTime() ||
        a.name.localeCompare(b.name)
      );
    }

    return (
      new Date(bData.saleBegin ?? 0).getTime() - new Date(aData.saleBegin ?? 0).getTime() ||
      a.name.localeCompare(b.name)
    );
  });
}
