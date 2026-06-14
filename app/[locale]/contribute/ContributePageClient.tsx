'use client';

import { Flex, Tabs } from '@chakra-ui/react';
import type { ContributeTabContent, ContributeTabLabels } from './buildContributePageProps';

type ContributePageClientProps = {
  tabLabels: ContributeTabLabels;
  tabContent: ContributeTabContent;
};

export function ContributePageClient({ tabLabels, tabContent }: ContributePageClientProps) {
  return (
    <Flex flexFlow="column" gap={3} css={{ '& a': { color: '#ffee71' }, b: { color: '#8ea7f1' } }}>
      <Tabs.Root colorPalette="yellow" defaultValue="extractor">
        <Tabs.List>
          <Tabs.Trigger value="extractor">{tabLabels.extractor}</Tabs.Trigger>
          <Tabs.Trigger value="feedback">{tabLabels.feedback}</Tabs.Trigger>
          <Tabs.Trigger value="official">{tabLabels.official}</Tabs.Trigger>
          <Tabs.Trigger value="where">{tabLabels.where}</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="extractor">{tabContent.extractor}</Tabs.Content>
        <Tabs.Content value="feedback">{tabContent.feedback}</Tabs.Content>
        <Tabs.Content value="official">{tabContent.official}</Tabs.Content>
        <Tabs.Content value="where">{tabContent.where}</Tabs.Content>
      </Tabs.Root>
    </Flex>
  );
}
