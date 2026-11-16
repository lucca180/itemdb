'use client';

import { Badge, Tabs } from '@chakra-ui/react';
import { useSearchParams } from 'next/navigation';
import type { ListSuggestionGroup } from '@services/ListSuggestionService';
import type { PriceContextSuggestionGroup } from '@services/PriceContextSuggestionService';
import { ListSuggestionsDashboardClient } from './ListSuggestionsDashboardClient';
import { PriceContextSuggestionsClient } from './PriceContextSuggestionsClient';

/**
 * Tabs of /admin/list-suggestions: official list suggestions and price context suggestions.
 * `?tab=price-context` opens the second one (linked from the Discord webhook).
 */
type Props = {
  listGroups: ListSuggestionGroup[];
  priceContextGroups: PriceContextSuggestionGroup[];
};

type SuggestionsTab = 'lists' | 'price-context';

export function SuggestionsTabsClient({ listGroups, priceContextGroups }: Props) {
  const searchParams = useSearchParams();
  const defaultTab: SuggestionsTab =
    searchParams?.get('tab') === 'price-context' ? 'price-context' : 'lists';
  const listCount = listGroups.reduce((sum, group) => sum + group.items.length, 0);

  // keeps the tab on reload without a navigation (no server round trip)
  const onTabChange = (tab: string) => {
    const url = new URL(window.location.href);
    if (tab === 'lists') url.searchParams.delete('tab');
    else url.searchParams.set('tab', tab);
    window.history.replaceState(null, '', url);
  };

  return (
    <Tabs.Root
      defaultValue={defaultTab}
      onValueChange={({ value }) => onTabChange(value)}
      variant="line"
      colorPalette="blue"
      mt={4}
      lazyMount
    >
      <Tabs.List>
        <Tabs.Trigger value="lists">
          Official lists
          <Badge variant="subtle">{listCount}</Badge>
        </Tabs.Trigger>
        <Tabs.Trigger value="price-context">
          Price context
          <Badge variant="subtle">{priceContextGroups.length}</Badge>
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="lists">
        <ListSuggestionsDashboardClient groups={listGroups} />
      </Tabs.Content>
      <Tabs.Content value="price-context">
        <PriceContextSuggestionsClient groups={priceContextGroups} />
      </Tabs.Content>
    </Tabs.Root>
  );
}
