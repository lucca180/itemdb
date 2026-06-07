import { ItemPageEditSection } from '@app/_components/Item/page/ItemPageAuthGates';
import { loadItemEffects } from '@app/_components/Item/loadUtils';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
  labels: {
    reportError: string;
    edit: string;
  };
};

export async function ItemPageEditSectionLoader({ item, labels }: Props) {
  const itemEffects = await loadItemEffects(item);
  return <ItemPageEditSection item={item} itemEffects={itemEffects} labels={labels} />;
}
