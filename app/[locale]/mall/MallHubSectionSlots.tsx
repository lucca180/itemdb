import { Flex } from '@chakra-ui/react';
import { LeavingSection } from './sections/LeavingSection';
import { OnSaleSection } from './sections/OnSaleSection';

export function MallHubSectionSlots() {
  return (
    <Flex direction="column" gap={{ base: 6, md: 8 }} w="100%" minW={0}>
      <OnSaleSection />
      <LeavingSection />
    </Flex>
  );
}
