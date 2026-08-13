'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Link, Table, Text } from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import { Link as I18nLink } from '@i18n/navigation';
import { PriceTableView } from '@app/_components/Item/Price/PriceTable';
import {
  prefetchItemPriceHistory,
  prefetchItemTradeLists,
} from '@app/_components/Item/Price/itemPricePrefetch';
import { ItemPricePanelSkeleton } from '@app/_components/Item/Price/ItemPriceCard';
import type { MatchTableLabeledRow } from '@app/_components/Item/NCTrade/matchTableView';
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
  const [tables, setTables] = useState<Awaited<ReturnType<typeof prefetchItemTradeLists>> | null>(
    null
  );

  useEffect(() => {
    prefetchItemTradeLists(itemId).then(setTables);
  }, [itemId]);

  if (!tables) return <ItemPricePanelSkeleton />;

  return (
    <Box bg="blackAlpha.300" borderRadius="md" overflow="hidden">
      <ItemPriceMatchTable data={tables[type]} />
    </Box>
  );
}

function ItemPriceMatchTable({ data }: { data: MatchTableLabeledRow[] }) {
  const t = useTranslations();

  return (
    <Table.ScrollArea
      minH={{ base: 150, md: 150 }}
      maxH={{ base: 200, md: 300 }}
      w="100%"
      borderRadius="sm"
    >
      <Table.Root
        h="100%"
        variant="outline"
        colorPalette="blackAlpha"
        bg="blackAlpha.300"
        size="sm"
        striped
      >
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>{t('ItemPage.list-name')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('ItemPage.owner')}</Table.ColumnHeader>
            <Table.ColumnHeader>{t('ItemPage.last-seen')}</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {!data.length && (
            <Table.Row>
              <Table.Cell colSpan={3} textAlign="center">
                {t('ItemPage.no-lists-found')} :(
                <br />
                <Text fontSize="xs" mt={2} color="whiteAlpha.600">
                  {t.rich('Lists.import-adv-tip', {
                    Link: (chunks) => (
                      <Link asChild color="whiteAlpha.800">
                        <I18nLink href="/lists/import">{chunks}</I18nLink>
                      </Link>
                    ),
                  })}
                </Text>
              </Table.Cell>
            </Table.Row>
          )}
          {data.map((list) => (
            <Table.Row key={list.internal_id}>
              <Table.Cell maxW="200px" overflow="hidden" textOverflow="ellipsis">
                <I18nLink
                  href={`/lists/${list.ownerUsername}/${list.slug ?? list.internal_id}`}
                  data-umami-event="match-table"
                  data-umami-event-label="list-name"
                >
                  {list.name}
                </I18nLink>
              </Table.Cell>
              <Table.Cell>
                <I18nLink
                  href={`/lists/${list.ownerUsername}`}
                  data-umami-event="match-table"
                  data-umami-event-label="owner-username"
                >
                  {list.ownerUsername}
                </I18nLink>
              </Table.Cell>
              <Table.Cell>{list.lastSeenLabel}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
