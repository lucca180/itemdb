import { Accordion, Box } from '@chakra-ui/react';
import { DropPool } from '@app/_components/Item/Drops/ItemDropPool';
import type { UnknownCategoryLabels } from '@app/_components/Item/Drops/ItemDropPool';
import type { PoolTextData } from '@app/_components/Item/Drops/buildItemDropsContentProps';
import type { ItemData, ItemOpenable, PrizePoolData } from '@types';

type OldPoolDropsProps = {
  pools: PrizePoolData[];
  itemOpenable: ItemOpenable;
  item: ItemData;
  dropData: ItemData[];
  oldPoolTitles: string[];
  poolTexts: Record<string, PoolTextData>;
  unknownLabels: UnknownCategoryLabels;
};

const OldPoolDrops = (props: OldPoolDropsProps) => {
  const { pools, itemOpenable, item, dropData, oldPoolTitles, poolTexts, unknownLabels } = props;

  return (
    <Accordion.Root collapsible bg="blackAlpha.500">
      {pools.map((pool, index) => (
        <Accordion.Item key={index} value={`pool-${index}`}>
          <Accordion.ItemTrigger>
            <Box as="span" flex="1" textAlign="left">
              {oldPoolTitles[index]}
            </Box>
            <Accordion.ItemIndicator />
          </Accordion.ItemTrigger>
          <Accordion.ItemContent>
            <Accordion.ItemBody pb={4}>
              <DropPool
                pool={pool}
                itemOpenable={itemOpenable}
                item={item}
                dropData={dropData}
                poolText={poolTexts[pool.name] ?? {}}
                unknownLabels={unknownLabels}
                hideOdds
              />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
};

export default OldPoolDrops;
