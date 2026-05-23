import { Accordion, Box } from '@chakra-ui/react';
import { ItemData, ItemOpenable, PrizePoolData } from '../../types';
import { DropPool } from '../Items/ItemDrops';
import { useTranslations } from 'next-intl';

type OldPoolDropsProps = {
  pools: PrizePoolData[];
  itemOpenable: ItemOpenable;
  item: ItemData;
  dropData: ItemData[];
};

const OldPoolDrops = (props: OldPoolDropsProps) => {
  const { pools, itemOpenable, item, dropData } = props;
  const t = useTranslations();
  return (
    <Accordion.Root collapsible bg="blackAlpha.500">
      {pools.map((pool, index) => (
        <Accordion.Item key={index} value={`pool-${index}`}>
          <Accordion.ItemTrigger>
            <Box as="span" flex="1" textAlign="left">
              {t('ItemPage.old-pool-x', {
                x: index + 1,
              })}
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
                forceOddsText
              />
            </Accordion.ItemBody>
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
};

export default OldPoolDrops;
