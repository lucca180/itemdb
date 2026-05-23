import { DataList, Link, Text } from '@chakra-ui/react';
import CardBase from '@components/Card/CardBase';
import { ItemData } from '../../types';
import { rarityStr } from '../../utils/utils';
import { useFormatter, useTranslations } from 'next-intl';
import Color from 'color';
import { InfoTip } from '@components/ui/toggle-tip';

type Props = {
  item: ItemData;
};

const ItemInfoCard = (props: Props) => {
  const t = useTranslations();
  const { item } = props;
  const dataList = useItemToDataList(item);
  const color = Color(item.color.hex);
  const rgb = item.color.rgb;
  const rarityString = rarityStr(item.rarity ?? 0);

  return (
    <CardBase
      title={t('ItemPage.item-info')}
      color={rgb}
      chakra={{ display: 'flex', gap: 4, flexFlow: 'column' }}
    >
      <DataList.Root orientation="horizontal" size="lg" gap={4}>
        {dataList.map((i) => (
          <DataList.Item key={i.label}>
            <DataList.ItemLabel>
              <Text
                as="span"
                fontWeight="bold"
                display="inline-flex"
                alignItems="center"
                gap={1}
                bg="whiteAlpha.300"
                color="whiteAlpha.800"
                px="2"
                minH={8}
                minW={8}
                rounded="md"
              >
                {i.label}
                {i.helpText && <InfoTip>{i.helpText}</InfoTip>}
              </Text>
            </DataList.ItemLabel>
            <DataList.ItemValue flexDirection="column" textAlign="right">
              {!i.link && <>{i.value}</>}
              {i.link && (
                <Link href={i.link} color={color.lightness(70).hex()} display="inline">
                  {i.value}
                </Link>
              )}

              {i.rarityExtra && rarityString && (
                <Text as="span" fontWeight="bold" fontSize="sm" color={rarityString.color}>
                  ({rarityString.text})
                </Text>
              )}
            </DataList.ItemValue>
          </DataList.Item>
        ))}
      </DataList.Root>
    </CardBase>
  );
};

export default ItemInfoCard;

const useItemToDataList = (item: ItemData) => {
  const t = useTranslations();
  const format = useFormatter();

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
      value: capitalize(item.category ?? '???'),
      link: item.category ? `/search?s=&category[]=${item.category}` : undefined,
    },
    { label: t('General.status'), value: capitalize(item.status ?? 'Active') },
    { label: t('General.itemdb-id'), value: item.internal_id },
    item.firstSeen && {
      label: t('ItemPage.first-seen'),
      value: format.dateTime(new Date(item.firstSeen), {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      }),
    },
  ].filter((i) => Boolean(i)) as {
    label: string;
    value: string;
    rarityExtra?: boolean;
    helpText?: string;
    link?: string;
  }[];
};

// first letter of each word capitalized
const capitalize = (s: string) =>
  s
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
