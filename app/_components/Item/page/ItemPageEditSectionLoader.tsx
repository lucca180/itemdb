import { ItemPageEditSection } from '@app/_components/Item/page/ItemPageAuthGates';
import { loadItemEffects } from '@app/_components/Item/loadUtils';
import type { ItemData } from '@types';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';

type Props = {
  item: ItemData;
  labels: {
    reportError: string;
    edit: string;
  };
};

export async function ItemPageEditSectionLoader({ item, labels }: Props) {
  const itemEffects = await loadItemEffects(item.internal_id);
  const user = (await getServerCurrentUser()).user;

  return <ItemPageEditSection item={item} itemEffects={itemEffects} labels={labels} user={user} />;
}
