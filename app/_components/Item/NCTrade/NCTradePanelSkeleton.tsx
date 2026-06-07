import { Flex, Skeleton } from '@chakra-ui/react';

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
