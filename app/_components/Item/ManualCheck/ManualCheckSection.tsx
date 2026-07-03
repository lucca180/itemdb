import { ManualCheckCard } from '@app/_components/Item/ManualCheck/ManualCheckCard';
import { getItemManualCheck } from '@pages/api/admin/manual/[id]';
import { getServerCurrentUser } from '@utils/auth/getServerCurrentUser';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

export async function ManualCheckSection({ item }: Props) {
  const { user } = await getServerCurrentUser();

  if (!user?.isAdmin) return null;

  const { inflation, info } = await getItemManualCheck(item.internal_id);

  if (info) {
    return (
      <ManualCheckCard
        item={item}
        type="info"
        manualCheck={info.process}
        conflictField={info.conflictField}
        changes={info.changes}
      />
    );
  }

  if (inflation) {
    return (
      <ManualCheckCard item={item} type="inflation" manualCheck={inflation} conflictField={null} />
    );
  }

  return null;
}
