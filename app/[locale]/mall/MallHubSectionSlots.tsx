import { Flex, Skeleton } from '@chakra-ui/react';
import { OnSaleSection } from './sections/OnSaleSection';

function PanelSkeleton({ h }: { h: { base: string; md: string } }) {
  return <Skeleton w="100%" minW={0} h={h} borderRadius="xl" bg="gray.700" aria-hidden="true" />;
}

/** Remaining empty section placeholders until later phases fill each slot. */
export function MallHubSectionSlots() {
  return (
    <Flex direction="column" gap={{ base: 6, md: 8 }} w="100%" minW={0}>
      <OnSaleSection />
      <PanelSkeleton h={{ base: '160px', md: '180px' }} />
    </Flex>
  );
}
