'use client';

import { Text, Alert, Link, useDisclosure } from '@chakra-ui/react';
import { useMemo } from 'react';
import { DropPool, HelpNeeded } from '@app/_components/Item/Drops/ItemDropPool';
import dynamic from 'next/dynamic';
import type {
  ItemDropsContentLabels,
  PoolTextData,
} from '@app/_components/Item/Drops/buildItemDropsContentProps';
import type { ItemData, ItemOpenable } from '@types';
import type { ReactNode } from 'react';

const OldPoolDrops = dynamic(() => import('@app/_components/Item/Drops/OldPoolDrops'));
const OfficialOddsModal = dynamic(() => import('@components/Modal/OfficialOddsModal'));

type Props = {
  item: ItemData;
  itemOpenable: ItemOpenable;
  dropItems: ItemData[];
  labels: ItemDropsContentLabels;
  choiceDropText: ReactNode | null;
  poolTexts: Record<string, PoolTextData>;
  oldPoolTitles: string[];
};

export function ItemDropsContent({
  item,
  itemOpenable,
  dropItems,
  labels,
  choiceDropText,
  poolTexts,
  oldPoolTitles,
}: Props) {
  const { open: isOpen, onOpen, onClose } = useDisclosure();

  const pools = itemOpenable.pools;
  const isChoice = itemOpenable.isChoice;
  const hasOldPool = Object.keys(pools).some((a) => a.includes('old-'));

  const poolsArr = useMemo(
    () => Object.values(pools).sort((a, b) => (a.isLE ? -1 : a.name.localeCompare(b.name))),
    [pools]
  );

  const unknownLabels = {
    categories: labels.unknownCategories,
    text: labels.unknownText,
  };

  return (
    <>
      {isOpen && <OfficialOddsModal isOpen={isOpen} onClose={onClose} />}
      {!itemOpenable.isGBC && <HelpNeeded labels={labels.helpNeeded} />}
      {itemOpenable.isGBC && (
        <Alert.Root status="info" borderRadius={5} mb={3}>
          <Alert.Indicator />
          <Alert.Content>
            <Text fontSize="sm">{labels.gbc}</Text>
          </Alert.Content>
        </Alert.Root>
      )}

      {choiceDropText && (
        <Text textAlign={'center'} mb={3} fontSize="sm" color="gray.200">
          {choiceDropText}
        </Text>
      )}

      {poolsArr
        .filter((a) => !['unknown'].includes(a.name) && !a.name.includes('old-'))
        .sort((a) => (a.isLE ? -1 : 1))
        .map((pool) => (
          <DropPool
            key={pool.name}
            pool={pool}
            itemOpenable={itemOpenable}
            item={item}
            dropData={dropItems}
            poolText={poolTexts[pool.name] ?? {}}
            unknownLabels={unknownLabels}
          />
        ))}

      {pools['unknown'] && (
        <DropPool
          pool={pools['unknown']}
          itemOpenable={itemOpenable}
          item={item}
          dropData={dropItems}
          poolText={poolTexts.unknown ?? {}}
          unknownLabels={unknownLabels}
          hideOdds={isChoice}
        />
      )}

      {hasOldPool && (
        <OldPoolDrops
          pools={poolsArr.filter((a) => a.name.includes('old-'))}
          itemOpenable={itemOpenable}
          item={item}
          dropData={dropItems}
          oldPoolTitles={oldPoolTitles}
          poolTexts={poolTexts}
          unknownLabels={unknownLabels}
        />
      )}

      {labels.itemOpeningReports && (
        <Text textAlign={'center'} mt={4} fontSize="xs" color="gray.300">
          {labels.itemOpeningReports}
        </Text>
      )}
      {item.isNC && (
        <Text textAlign={'center'} mt={2} fontSize="xs" color="gray.400">
          <Link onClick={onOpen}>{labels.officialNcMallDrops}</Link>
        </Text>
      )}
    </>
  );
}
