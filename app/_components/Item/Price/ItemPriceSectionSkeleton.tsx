import { Flex, Skeleton } from '@chakra-ui/react';
import CardBase from '@components/Card/CardBase';

type ItemPriceSectionSkeletonProps = {
  color?: [number, number, number] | number[] | string;
  title?: string;
};

function PricePanelSkeleton() {
  return (
    <Flex
      direction="column"
      gap={2}
      w="100%"
      minH={{ base: 150, md: 150 }}
      maxH={{ base: 200, md: 300 }}
      bg="blackAlpha.300"
      borderRadius="sm"
      p={3}
    >
      <Skeleton height="20px" />
      <Skeleton height="20px" />
      <Skeleton height="20px" />
      <Skeleton height="20px" />
      <Skeleton height="20px" width="70%" />
    </Flex>
  );
}

/** Full price-card shell while `loadNPPrices` streams. */
export function ItemPriceSectionSkeleton({
  color,
  title = 'Price Overview',
}: ItemPriceSectionSkeletonProps) {
  return (
    <CardBase color={color} title={title}>
      <Flex gap={3} flexFlow="column">
        <Flex gap={2} flexWrap="wrap">
          <Skeleton height="32px" width="110px" borderRadius="md" />
          <Skeleton height="32px" width="90px" borderRadius="md" />
          <Skeleton height="32px" width="90px" borderRadius="md" />
          <Skeleton height="32px" width="100px" borderRadius="md" />
        </Flex>

        <Flex
          flexFlow={{ base: 'column', md: 'row' }}
          alignItems={{ base: 'stretch', md: 'center' }}
          justifyContent={{ base: 'flex-start', md: 'space-around' }}
          gap={4}
        >
          <Flex
            flexFlow="column"
            gap={2}
            alignItems="center"
            justifyContent="center"
            minW={{ base: 'auto', md: '160px' }}
            py={2}
          >
            <Skeleton height="28px" width="130px" />
            <Skeleton height="14px" width="90px" />
            <Skeleton height="14px" width="70px" />
            <Skeleton height="32px" width="110px" borderRadius="md" mt={1} />
          </Flex>

          <Flex flexFlow="column" width="100%" maxW="580px">
            <PricePanelSkeleton />
          </Flex>
        </Flex>

        <Skeleton height="14px" width="70px" mt={1} />
        <Flex gap={2} flexWrap="wrap">
          <Skeleton height="64px" flex="1" minW="100px" borderRadius="md" />
          <Skeleton height="64px" flex="1" minW="100px" borderRadius="md" />
          <Skeleton height="64px" flex="1" minW="100px" borderRadius="md" />
        </Flex>
      </Flex>
    </CardBase>
  );
}
