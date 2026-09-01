'use client';

import { Box, Flex, HStack, SimpleGrid, Skeleton, Table } from '@chakra-ui/react';
import { IMPORT_V2_PAGE_SIZE } from './importV2Shared';

const SKELETON_ROWS = Math.min(8, IMPORT_V2_PAGE_SIZE);

function SummaryCardSkeleton() {
  return (
    <Box bg="gray.800" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="lg" p={3.5}>
      <Skeleton h="3" w="40%" mb={3} borderRadius="sm" />
      <Skeleton h="6" w="55%" mb={2} borderRadius="sm" />
      <Skeleton h="2.5" w="70%" borderRadius="sm" />
    </Box>
  );
}

function ToolbarSkeleton() {
  return (
    <Flex direction="column" gap={3} w="100%">
      <Flex
        wrap="wrap"
        justify="space-between"
        align="center"
        gap={3}
        bg="gray.800"
        p={3}
        borderRadius="lg"
        borderWidth="1px"
        borderColor="whiteAlpha.200"
      >
        <Skeleton h="8" w={{ base: '100%', md: '280px' }} borderRadius="md" />
        <HStack gap={2}>
          <Skeleton h="8" w="120px" borderRadius="md" />
          <Skeleton h="8" w="8" borderRadius="md" />
        </HStack>
      </Flex>
      <HStack gap={1.5} wrap="wrap" px={1}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} h="6" w="72px" borderRadius="full" />
        ))}
      </HStack>
    </Flex>
  );
}

function TableSkeleton() {
  return (
    <Table.ScrollArea
      w="100%"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="lg"
      bg="gray.900"
    >
      <Table.Root size="sm" variant="line">
        <Table.Header bg="gray.800">
          <Table.Row borderColor="whiteAlpha.300">
            <Table.ColumnHeader py={3} px={3}>
              <Skeleton h="3" w="48px" />
            </Table.ColumnHeader>
            <Table.ColumnHeader py={3} px={3} w="80px">
              <Skeleton h="3" w="28px" mx="auto" />
            </Table.ColumnHeader>
            <Table.ColumnHeader py={3} px={3} minW="150px">
              <Skeleton h="3" w="100px" />
            </Table.ColumnHeader>
            <Table.ColumnHeader py={3} px={3} minW="140px">
              <Skeleton h="3" w="90px" ml="auto" />
            </Table.ColumnHeader>
            <Table.ColumnHeader py={3} px={3} w="90px">
              <Skeleton h="3" w="40px" mx="auto" />
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
            <Table.Row
              key={index}
              bg={index % 2 === 0 ? 'blackAlpha.300' : 'transparent'}
              borderColor="whiteAlpha.100"
            >
              <Table.Cell py={2.5} px={3}>
                <Flex align="center" gap={3}>
                  <Skeleton w="40px" h="40px" borderRadius="md" flexShrink={0} />
                  <Flex direction="column" gap={1.5} flex="1" minW={0}>
                    <Skeleton h="3.5" w={`${55 + (index % 3) * 12}%`} maxW="220px" />
                    <Skeleton h="2.5" w="80px" />
                  </Flex>
                </Flex>
              </Table.Cell>
              <Table.Cell py={2.5} px={3}>
                <Skeleton h="5" w="36px" mx="auto" borderRadius="full" />
              </Table.Cell>
              <Table.Cell py={2.5} px={3}>
                <Skeleton h="5" w="88px" borderRadius="full" />
              </Table.Cell>
              <Table.Cell py={2.5} px={3}>
                <Skeleton h="3.5" w="72px" ml="auto" />
              </Table.Cell>
              <Table.Cell py={2.5} px={3}>
                <Skeleton h="5" w="40px" mx="auto" borderRadius="full" />
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}

function SidebarSkeleton() {
  return (
    <Box
      w="100%"
      bg="gray.800"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="lg"
      p={4}
      display="flex"
      flexDirection="column"
      gap={4}
    >
      <Skeleton h="4" w="45%" />
      <Skeleton h="12" w="100%" borderRadius="md" />
      <Skeleton h="3" w="30%" />
      <Skeleton h="8" w="100%" borderRadius="md" />
      <Skeleton h="3" w="25%" />
      <Skeleton h="8" w="100%" borderRadius="md" />
      <Flex direction="column" gap={2}>
        <Skeleton h="4" w="55%" />
        <Skeleton h="4" w="50%" />
        <Skeleton h="4" w="65%" />
      </Flex>
      <Skeleton h="10" w="100%" borderRadius="md" mt={2} />
    </Box>
  );
}

/** Full-page skeleton shown before the first `loadImportItemsPage` response. */
export function ImportItemsLoadingSkeleton() {
  return (
    <Flex direction="column" gap={4} w="100%" aria-busy="true" aria-live="polite">
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
        <SummaryCardSkeleton />
      </SimpleGrid>

      <ToolbarSkeleton />

      <Flex direction={{ base: 'column', lg: 'row' }} gap={5} align="flex-start" w="100%">
        <Box flex="1" minW={0} w="100%">
          <TableSkeleton />
        </Box>
        <Box w={{ base: '100%', lg: '300px', xl: '320px' }} flexShrink={0}>
          <SidebarSkeleton />
        </Box>
      </Flex>
    </Flex>
  );
}
