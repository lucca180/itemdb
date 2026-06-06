import type { ItemPageData } from '@app/utils/itemPage';
import { ItemHeader } from '@app/_components/Item/ItemHeader';
import { ItemPageClient } from '@app/_components/Item/ItemPageClient';

type ItemPageProps = {
  data: ItemPageData;
};

export async function ItemPage({ data }: ItemPageProps) {
  const { item, lists } = data;

  return (
    <>
      <ItemHeader item={item} lists={lists} />
      <ItemPageClient {...data} />
    </>
  );
}
