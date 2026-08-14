import { Suspense } from 'react';
import ItemOfficialLists from '@components/Items/ItemOfficialList';
import { getOfficialItemLists } from '@app/_components/Item/loadUtils';
import { getCachedNow } from '@utils/getCachedNow';
import { shouldShowTradeLists } from '@utils/utils';
import { DeferredItemSection } from '@app/_components/Item/page/DeferredItemSection';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

export function ItemOfficialListsSection({ item }: Props) {
  return (
    <Suspense fallback={null}>
      <ItemOfficialListsSectionContent item={item} />
    </Suspense>
  );
}

async function ItemOfficialListsSectionContent({ item }: Props) {
  const lists = await getOfficialItemLists(
    item.internal_id,
    shouldShowTradeLists(item, await getCachedNow())
  );
  if (!lists.length) return null;
  return (
    <DeferredItemSection>
      <ItemOfficialLists item={item} lists={lists} />
    </DeferredItemSection>
  );
}
