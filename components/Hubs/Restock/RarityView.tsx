import { Flex, Heading, Text } from '@chakra-ui/react';
import { ItemData } from '../../../types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { VirtualizedItemList } from '../../Utils/VirtualizedItemList';
import { useTranslations } from 'next-intl';
import { restockBlackMarketItems } from '../../../utils/utils';

type Props = {
  itemList: ItemData[];
  sortType?: string;
};

export const RarityView = (props: Props) => {
  const t = useTranslations();
  const { itemList, sortType } = props;
  const [groupedItems, setGroupedItems] = useState<{ [range: string]: ItemData[] }>(
    groupItems(itemList)
  );
  const skippedFirst = useRef(false);

  const rarityGroupList = useMemo(
    () => Object.entries(groupedItems).sort((a, b) => b[0].localeCompare(a[0])),
    [groupedItems]
  );

  useEffect(() => {
    if (!skippedFirst.current) {
      skippedFirst.current = true;
      return;
    }

    setGroupedItems(groupItems(itemList));
  }, [itemList]);

  return (
    <Flex flexFlow="column" gap={5}>
      {rarityGroupList.map(([range, items]) => (
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
          <Text textAlign={'center'}>{t(`Restock.${rarityText[range]}`)}</Text>
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

const rarityGroups = [85, 94, 100];
const rarityText: { [range: string]: string } = {
  'r1-r85': 'rarity-range-1',
  'r86-r94': 'rarity-range-2',
  'r95-r100': 'rarity-range-3',
  unknown: 'Unknown',
};

const groupItems = (items: ItemData[]) => {
  const groups: { [range: string]: ItemData[] } = {};

  items.map((item) => {
    if (!item.rarity) {
      groups['unknown'] = [...(groups['unknown'] ?? []), item];
      return;
    }

    if (item.rarity <= rarityGroups[0]) {
      groups['r1-r85'] = [...(groups['r1-r85'] ?? []), item];
    } else if (item.rarity <= rarityGroups[1]) {
      groups['r86-r94'] = [...(groups['r86-r94'] ?? []), item];
    } else {
      groups['r95-r100'] = [...(groups['r95-r100'] ?? []), item];
    }
  });

  return groups;
};
