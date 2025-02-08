import {
  Accordion,
  AccordionItem,
  AccordionButton,
  Box,
  AccordionIcon,
  AccordionPanel,
} from '@chakra-ui/react';
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
    <Accordion allowToggle bg="blackAlpha.500">
      {pools.map((pool, index) => (
        <AccordionItem key={index}>
          <h2>
            <AccordionButton>
              <Box as="span" flex="1" textAlign="left">
                {t('ItemPage.old-pool-x', {
                  x: index + 1,
                })}
              </Box>
              <AccordionIcon />
            </AccordionButton>
          </h2>
          <AccordionPanel pb={4}>
            <DropPool
              pool={pool}
              itemOpenable={itemOpenable}
              item={item}
              dropData={dropData}
              forceOddsText
            />
          </AccordionPanel>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default OldPoolDrops;
