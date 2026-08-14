'use client';

import { Flex } from '@chakra-ui/react';
import { useState, type ReactNode } from 'react';
import { useNCTradeTab, type NCTradeTab } from '@app/_components/Item/NCTrade/NCTradeTabContext';

type NCTradePanelProps = {
  tab: NCTradeTab;
  children: ReactNode;
};

export function NCTradePanel({ tab, children }: NCTradePanelProps) {
  const { activeTab } = useNCTradeTab();
  const [visited, setVisited] = useState(activeTab === tab);

  if (activeTab === tab && !visited) {
    setVisited(true);
  }

  if (!visited) return null;

  const hidden = activeTab !== tab;

  if (tab === 'insights') {
    return (
      <Flex
        display={hidden ? 'none' : 'flex'}
        flexFlow="column"
        flex="1"
        overflow="hidden"
        w="100%"
      >
        {children}
      </Flex>
    );
  }

  return (
    <Flex
      display={hidden ? 'none' : 'flex'}
      flexFlow="column"
      flex="1"
      overflow="hidden"
      justifyContent="center"
      w="100%"
    >
      <Flex justifyContent="center" alignItems="center" gap={3} w="100%">
        {children}
      </Flex>
    </Flex>
  );
}
