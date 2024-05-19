import { Flex, Heading, Text } from '@chakra-ui/react';
import { ItemData } from '../../../types';
import { useEffect, useState } from 'react';
import { VirtualizedItemList } from '../../Utils/VirtualizedItemList';
import { useTranslations } from 'next-intl';
import { restockBlackMarketItems } from '../../../utils/utils';

type Props = {
  itemList: ItemData[] | undefined;
  sortType?: string;
};

export const RarityView = (props: Props) => {
  const t = useTranslations();
  const { itemList, sortType } = props;
  const [groupedItems, setGroupedItems] = useState<{ [range: string]: ItemData[] }>({});

  useEffect(() => {
    if (!itemList) return;
    setGroupedItems(groupItems(itemList));
  }, [itemList]);

  return (
    <Flex flexFlow="column" gap={5}>
      {Object.entries(groupedItems)
        .reverse()
        .map(([range, items]) => (
          <Flex
            key={range}
            bg="whiteAlpha.50"
            px={2}
            py={4}
            flexFlow={'column'}
            gap={3}
            borderRadius={'md'}
          >
            <Heading size="lg" textAlign="center">
              {t('Restock.rarity-range', { range })}
            </Heading>
            <Text textAlign={'center'}>{t(rarityText[range])}</Text>
            <VirtualizedItemList
              sortType={sortType}
              key={range}
              items={items}
              highlightList={restockBlackMarketItems}
            />
          </Flex>
        ))}
    </Flex>
  );
};

const rarityGroups = [85, 94, 99];
const rarityText: { [range: string]: string } = {
  'r1-r85': 'Restock.rarity-range-1',
  'r86-r94': 'Restock.rarity-range-2',
  'r95-r99': 'Restock.rarity-range-3',
  unknown: 'Unknown',
};
const groupItems = (items: ItemData[]) => {
  const groups: { [range: string]: ItemData[] } = {};

  let last = 0;
  rarityGroups.map((rarity) => {
    const itemList = items.filter(
      (item) => item.rarity && item.rarity <= rarity && item.rarity > last
    );

    if (!itemList.length) {
      last = rarity;
      return;
    }
    groups[`r${last + 1}-r${rarity}`] = itemList;
    last = rarity;
  });

  const itemList = items.filter((item) => !item.rarity);

  if (itemList.length > 0) groups['unknown'] = itemList;

  return groups;
};
