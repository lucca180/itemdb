import { Flex, Skeleton } from '@chakra-ui/react';
import CardBase from '@components/Card/CardBase';

type NCTradeSectionSkeletonProps = {
  color?: [number, number, number] | number[] | string;
  title?: string;
};

/** Placeholder while deferred tab panels stream in. */
export function NCTradePanelSkeleton() {
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
    </Flex>
  );
}

/** Full NC trade card shell while insights/lists load. */
export function NCTradeSectionSkeleton({ color, title = 'NC Trade' }: NCTradeSectionSkeletonProps) {
  return (
    <CardBase color={color} title={title}>
      <Flex flexFlow="column" gap={3} minH="200px">
        <Flex gap={2} flexWrap="wrap">
          <Skeleton height="32px" width="90px" borderRadius="md" />
          <Skeleton height="32px" width="90px" borderRadius="md" />
          <Skeleton height="32px" width="90px" borderRadius="md" />
          <Skeleton height="32px" width="110px" borderRadius="md" />
        </Flex>

        <Flex flexFlow={{ base: 'column', md: 'row' }} gap={3} flex={1}>
          <Flex
            flexFlow="column"
            alignItems="center"
            justifyContent="center"
            gap={2}
            minW={{ base: 'auto', md: '140px' }}
            py={4}
            px={3}
            bg="blackAlpha.300"
            borderRadius="md"
          >
            <Skeleton height="20px" width="48px" />
            <Skeleton height="28px" width="72px" />
            <Skeleton height="12px" width="56px" />
          </Flex>

          <Flex flex="1" overflow="hidden">
            <NCTradePanelSkeleton />
          </Flex>
        </Flex>

        <Skeleton height="14px" width="60%" alignSelf="center" />
      </Flex>
    </CardBase>
  );
}
