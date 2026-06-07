'use client';

import { Button, ButtonGroup, Flex } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { useNCTradeTab, type NCTradeTab } from '@app/_components/Item/NCTrade/NCTradeTabContext';

type NCTradeTabBarProps = {
  hasInsights: boolean;
  seekingCount: number;
  tradingCount: number;
  labels: {
    insights: string;
    seeking: string;
    trading: string;
    owlsFallback: string;
  };
  owlsTabLabel: ReactNode;
};

const TAB_STYLES: Record<NCTradeTab, { palette: string }> = {
  insights: { palette: 'blue' },
  seeking: { palette: 'cyan' },
  trading: { palette: 'purple' },
  ncTrading: { palette: 'yellow' },
};

export function NCTradeTabBar({
  hasInsights,
  seekingCount,
  tradingCount,
  labels,
  owlsTabLabel,
}: NCTradeTabBarProps) {
  const { activeTab, setActiveTab } = useNCTradeTab();

  const tabButton = (tab: NCTradeTab, label: ReactNode, eventLabel: string) => (
    <Button
      colorPalette={activeTab === tab ? TAB_STYLES[tab].palette : ''}
      borderColor={activeTab === tab ? undefined : 'whiteAlpha.800'}
      data-active={activeTab === tab ? true : undefined}
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
        {tabButton('seeking', `${seekingCount} ${labels.seeking}`, 'seeking')}
        {tabButton('trading', `${tradingCount} ${labels.trading}`, 'trading')}
        {tabButton('ncTrading', owlsTabLabel ?? labels.owlsFallback, 'owls-trading')}
      </ButtonGroup>
    </Flex>
  );
}
