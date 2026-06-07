import { Suspense } from 'react';
import ItemEffectsCard from '@components/Items/ItemEffectsCard';
import { loadItemEffects } from '@app/_components/Item/loadUtils';
import type { ItemData } from '@types';

type Props = {
  item: ItemData;
};

export function ItemEffectsSection({ item }: Props) {
  return (
    <Suspense fallback={null}>
      <ItemEffectsSectionContent item={item} />
    </Suspense>
  );
}

async function ItemEffectsSectionContent({ item }: Props) {
  const effects = await loadItemEffects(item);
  if (!effects.length) return null;
  return <ItemEffectsCard item={item} effects={effects} />;
}
