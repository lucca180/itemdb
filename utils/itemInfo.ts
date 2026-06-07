import type { ItemData } from '@types';

type Translate = Awaited<ReturnType<typeof import('next-intl/server').getTranslations>>;

type Format = Awaited<ReturnType<typeof import('next-intl/server').getFormatter>>;

export function capitalizeWords(s: string) {
  return s
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export type ItemInfoRow = {
  label: string;
  value: string;
  rarityExtra?: boolean;
  helpText?: string;
  link?: string;
};

export function itemToDataList(item: ItemData, t: Translate, format: Format): ItemInfoRow[] {
  return [
    { label: t('General.item-id'), value: item.item_id ?? '???' },
    {
      label: t('General.rarity'),
      value: item.rarity != null ? `r${item.rarity}` : '???',
      rarityExtra: item.rarity != null,
    },
    { label: t('General.weight'), value: item.weight != null ? `${item.weight} lbs` : '???' },
    {
      label: t('General.est-val'),
      value: item.estVal != null ? `${format.number(item.estVal)} NP` : '???',
      helpText: t('ItemPage.est-val-warning'),
    },
    {
      label: t('General.category'),
      value: capitalizeWords(item.category ?? '???'),
      link: item.category ? `/search?s=&category[]=${item.category}` : undefined,
    },
    { label: t('General.status'), value: capitalizeWords(item.status ?? 'Active') },
    { label: t('General.itemdb-id'), value: String(item.internal_id) },
    item.firstSeen && {
      label: t('ItemPage.first-seen'),
      value: format.dateTime(new Date(item.firstSeen), {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }),
    },
  ].filter(Boolean) as ItemInfoRow[];
}
