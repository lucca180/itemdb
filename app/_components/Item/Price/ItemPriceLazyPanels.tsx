'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Table } from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import { PriceTableView } from '@app/_components/Item/Price/PriceTable';
import {
  prefetchItemPriceHistory,
  usePrefetchItemTradeLists,
} from '@app/_components/Item/Price/itemPricePrefetch';
import { NCMatchTable } from '@app/_components/Item/NCTrade/NCMatchTable';
import { ItemPricePanelSkeleton } from '@app/_components/Item/Price/ItemPriceCard';
import type { ItemData, PriceData, PriceMarker } from '@types';

type PriceHistoryTableProps = {
  item: ItemData;
  prices: PriceData[];
  markers: PriceMarker[];
  hasMore: boolean;
  isAdmin?: boolean;
};

export function PriceHistoryTable({
  item,
  prices: initialPrices,
  markers: initialMarkers,
  hasMore,
  isAdmin,
}: PriceHistoryTableProps) {
  const t = useTranslations();
  const format = useFormatter();
  const [prices, setPrices] = useState(initialPrices);
  const [markers, setMarkers] = useState(initialMarkers);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const showAll = async () => {
    setLoading(true);
    try {
      const history = await prefetchItemPriceHistory(item.internal_id);
      setPrices(history.prices);
      setMarkers(history.markers);
      setExpanded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box bg="blackAlpha.300" borderRadius="md" overflow="hidden">
      <PriceTableView
        itemColor={item.color.hex}
        data={prices}
        markers={markers}
        isAdmin={isAdmin}
        t={t}
        format={format}
        footer={
          hasMore && !expanded ? (
            <Table.Row>
              <Table.Cell colSpan={isAdmin ? 4 : 3} p={0} border={0}>
                <Button
                  size="xs"
                  variant="ghost"
                  w="100%"
                  borderRadius={0}
                  loading={loading}
                  onClick={showAll}
                >
                  {t('Lists.show-all')}
                </Button>
              </Table.Cell>
            </Table.Row>
          ) : undefined
        }
      />
    </Box>
  );
}

export function ItemPriceListsPanel({
  itemId,
  type,
}: {
  itemId: number;
  type: 'seeking' | 'trading';
}) {
  const prefetchTradeLists = usePrefetchItemTradeLists();
  const [tables, setTables] = useState<Awaited<ReturnType<typeof prefetchTradeLists>> | null>(null);

  useEffect(() => {
    prefetchTradeLists(itemId).then(setTables);
  }, [itemId, prefetchTradeLists]);

  if (!tables) return <ItemPricePanelSkeleton />;

  return (
    <Box bg="blackAlpha.300" borderRadius="md" overflow="hidden">
      <NCMatchTable data={tables[type]} />
    </Box>
  );
}
