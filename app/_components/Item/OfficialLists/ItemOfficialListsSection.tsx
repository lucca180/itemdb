import { Suspense } from 'react';
import ItemOfficialLists from '@components/Items/ItemOfficialList';
import { loadItemPageLists } from '@app/_components/Item/loadUtils';
import { shouldShowTradeLists } from '@utils/utils';
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
  const lists = await loadItemPageLists(item.internal_id, shouldShowTradeLists(item));
  if (!lists.length) return null;
  return <ItemOfficialLists item={item} lists={lists} />;
}
