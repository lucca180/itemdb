'use client';

import { Flex, Tabs } from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import type { ContributeTabContent, ContributeTabLabels } from './buildContributePageProps';

type ContributePageClientProps = {
  tabLabels: ContributeTabLabels;
  tabContent: ContributeTabContent;
};

type ContributeTab = keyof ContributeTabContent;

const TABS: ContributeTab[] = ['extractor', 'feedback', 'official', 'where'];
const DEFAULT_TAB: ContributeTab = 'extractor';

const isContributeTab = (value: string | null): value is ContributeTab =>
  !!value && (TABS as string[]).includes(value);

export function ContributePageClient({ tabLabels, tabContent }: ContributePageClientProps) {
  const [tab, setTab] = useState<ContributeTab>(DEFAULT_TAB);

  // keep the active tab in the url (?tab=) so it can be linked to
  const handleTabChange = (value: string) => {
    if (!isContributeTab(value)) return;
    setTab(value);

    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.replaceState(null, '', url);
  };

  return (
    <Flex flexFlow="column" gap={3} css={{ '& a': { color: '#ffee71' }, b: { color: '#8ea7f1' } }}>
      <Suspense fallback={null}>
        <ContributeTabFromQuery onTab={setTab} />
      </Suspense>
      <Tabs.Root
        colorPalette="yellow"
        value={tab}
        onValueChange={({ value }) => handleTabChange(value)}
      >
        <Tabs.List>
          {TABS.map((value) => (
            <Tabs.Trigger key={value} value={value}>
              {tabLabels[value]}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {TABS.map((value) => (
          <Tabs.Content key={value} value={value}>
            {tabContent[value]}
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </Flex>
  );
}

/**
 * Selects the initial tab from `?tab=`. Isolated in its own Suspense boundary so that
 * `useSearchParams` doesn't opt the (static) tab content out of prerendering.
 */
function ContributeTabFromQuery({ onTab }: { onTab: (tab: ContributeTab) => void }) {
  const tab = useSearchParams()?.get('tab') ?? null;

  useEffect(() => {
    if (isContributeTab(tab)) onTab(tab);
  }, [tab, onTab]);

  return null;
}
