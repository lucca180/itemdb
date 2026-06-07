'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

export type NCTradeTab = 'seeking' | 'trading' | 'insights' | 'ncTrading';

type NCTradeTabContextValue = {
  activeTab: NCTradeTab;
  setActiveTab: (tab: NCTradeTab) => void;
};

const NCTradeTabContext = createContext<NCTradeTabContextValue | null>(null);

export function NCTradeTabProvider({
  defaultTab,
  children,
}: {
  defaultTab: NCTradeTab;
  children: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<NCTradeTab>(defaultTab);

  return (
    <NCTradeTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </NCTradeTabContext.Provider>
  );
}

export function useNCTradeTab() {
  const context = useContext(NCTradeTabContext);
  if (!context) {
    throw new Error('useNCTradeTab must be used within NCTradeTabProvider');
  }
  return context;
}
