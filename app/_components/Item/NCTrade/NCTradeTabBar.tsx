'use client';

import { Button, ButtonGroup, Flex } from '@chakra-ui/react';
import { useRef } from 'react';
import { useNCTradeTab, type NCTradeTab } from '@app/_components/Item/NCTrade/NCTradeTabContext';
import {
  prefetchNCOwlsTrades,
  usePrefetchNCTradeListTable,
} from '@app/_components/Item/NCTrade/ncTradePrefetch';

type NCTradeTabBarProps = {
  itemId: number;
  itemName: string;
  hasInsights: boolean;
  ssrTabs?: NCTradeTab[];
  labels: {
    insights: string;
    seeking: string;
    trading: string;
    owls: string;
  };
};

const TAB_STYLES: Record<NCTradeTab, { palette: string }> = {
  insights: { palette: 'blue' },
  seeking: { palette: 'cyan' },
  trading: { palette: 'purple' },
  ncTrading: { palette: 'yellow' },
};

const PREFETCH_DELAY_MS = 80;

export function NCTradeTabBar({
  itemId,
  itemName,
  hasInsights,
  ssrTabs,
  labels,
}: NCTradeTabBarProps) {
  const { activeTab, setActiveTab } = useNCTradeTab();
  const prefetchListTable = usePrefetchNCTradeListTable();
  const prefetchTimer = useRef(0);

  const prefetchTab = (tab: NCTradeTab) => {
    if (ssrTabs?.includes(tab)) return;
    if (tab === 'seeking' || tab === 'trading') prefetchListTable(itemId, tab);
    if (tab === 'ncTrading') prefetchNCOwlsTrades(itemId, itemName);
  };

  const tabButton = (tab: NCTradeTab, label: string, eventLabel: string) => (
    <Button
      colorPalette={activeTab === tab ? TAB_STYLES[tab].palette : ''}
      borderColor={activeTab === tab ? undefined : 'whiteAlpha.800'}
      data-active={activeTab === tab ? true : undefined}
      onPointerEnter={() => {
        window.clearTimeout(prefetchTimer.current);
        prefetchTimer.current = window.setTimeout(() => prefetchTab(tab), PREFETCH_DELAY_MS);
      }}
      onPointerLeave={() => window.clearTimeout(prefetchTimer.current)}
      onFocus={() => prefetchTab(tab)}
      onClick={() => setActiveTab(tab)}
      data-umami-event="nc-trade-buttons"
      data-umami-event-label={eventLabel}
    >
      {label}
    </Button>
  );

  return (
    <Flex
      justifyContent={{ base: 'flex-start', md: 'center' }}
      gap={2}
      alignItems="center"
      pb={1.5}
      mb={1.5}
      overflow="auto"
    >
      <ButtonGroup size="sm" attached variant="outline">
        {hasInsights && tabButton('insights', labels.insights, 'insights')}
        {tabButton('seeking', labels.seeking, 'seeking')}
        {tabButton('trading', labels.trading, 'trading')}
        {tabButton('ncTrading', labels.owls, 'owls-trading')}
      </ButtonGroup>
    </Flex>
  );
}
