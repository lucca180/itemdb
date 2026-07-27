import { Suspense } from 'react';
import NcMallCard from '@components/Items/NCMallCard';
import { loadNCMallData } from '@app/_components/Item/loadUtils';
import { getNCMallDataDates } from '@app/_components/Item/NCMall/getNCMallDataDates';
import { getCachedNow } from '@utils/getCachedNow';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

export function NCMallCardSection({ item }: Props) {
  if (!item.isNC) return null;

  return (
    <Suspense fallback={null}>
      <NCMallCardSectionContent item={item} />
    </Suspense>
  );
}

async function NCMallCardSectionContent({ item }: Props) {
  const [ncMallData, now] = await Promise.all([loadNCMallData(item.internal_id), getCachedNow()]);
  if (!ncMallData) return null;

  const { startDate, endDate } = await getNCMallDataDates(ncMallData, item);

  return (
    <NcMallCard
      item={item}
      ncMallData={ncMallData}
      now={now}
      startDate={startDate}
      endDate={endDate}
    />
  );
}

export default NCMallCardSection;
