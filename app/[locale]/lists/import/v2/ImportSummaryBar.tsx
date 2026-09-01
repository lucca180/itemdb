'use client';

import { Box, Flex, Heading, Text, SimpleGrid, HStack, Icon, Badge } from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import { AiFillWarning } from 'react-icons/ai';
import { LuBoxes, LuCoins, LuLayers, LuSparkles } from 'react-icons/lu';
import type { ImportSummary } from '@utils/list/computeImportSummary';

export type ImportSummaryBarProps = {
  summary: ImportSummary;
  totalCount: number;
  notFoundCount: number;
};

export function ImportSummaryBar({ summary, totalCount, notFoundCount }: ImportSummaryBarProps) {
  const t = useTranslations();
  const format = useFormatter();

  return (
    <Flex direction="column" gap={3} w="100%">
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
        <Box bg="gray.800" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="lg" p={3.5}>
          <Flex align="center" gap={2} mb={1}>
            <Icon as={LuBoxes} color="teal.400" />
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="whiteAlpha.700"
              textTransform="uppercase"
            >
              {t('Lists.importV2-summary-items')}
            </Text>
          </Flex>
          <Heading size="md" color="whiteAlpha.900">
            {summary.resolvedCount}{' '}
            <Text as="span" fontSize="xs" fontWeight="normal" color="whiteAlpha.600">
              ({summary.totalQuantity} {t('Lists.importV2-units')})
            </Text>
          </Heading>
        </Box>

        <Box bg="gray.800" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="lg" p={3.5}>
          <Flex align="center" gap={2} mb={1}>
            <Icon as={LuCoins} color="yellow.400" />
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="whiteAlpha.700"
              textTransform="uppercase"
            >
              {t('Lists.importV2-summary-np-total')}
            </Text>
          </Flex>
          <Heading size="md" color="yellow.300">
            {format.number(summary.totalNpValueWithQty)}{' '}
            <Text as="span" fontSize="xs">
              NP
            </Text>
          </Heading>
        </Box>

        <Box bg="gray.800" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="lg" p={3.5}>
          <Flex align="center" gap={2} mb={1}>
            <Icon as={LuLayers} color="green.400" />
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="whiteAlpha.700"
              textTransform="uppercase"
            >
              {t('Lists.importV2-summary-priced-np')}
            </Text>
          </Flex>
          <Heading size="md" color="green.300">
            {summary.pricedNpCount}
          </Heading>
          <Text fontSize="2xs" color="whiteAlpha.500" mt={1}>
            {t('Lists.importV2-summary-unpriced', { count: summary.unpricedNpCount })}
            {summary.pbCount > 0 ? ` · ${summary.pbCount} PB` : ''}
          </Text>
        </Box>

        <Box bg="gray.800" borderWidth="1px" borderColor="whiteAlpha.200" borderRadius="lg" p={3.5}>
          <Flex align="center" gap={2} mb={1}>
            <Icon as={LuSparkles} color="purple.400" />
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="whiteAlpha.700"
              textTransform="uppercase"
            >
              NC
            </Text>
          </Flex>
          <Heading size="md" color="purple.300">
            {summary.ncCount}
          </Heading>
        </Box>
      </SimpleGrid>

      {notFoundCount > 0 && (
        <Box bg="orange.950" borderWidth="1px" borderColor="orange.800" borderRadius="md" p={3}>
          <HStack gap={2}>
            <Icon as={AiFillWarning} color="orange.400" boxSize={4} />
            <Text fontSize="sm" fontWeight="medium" color="orange.200">
              {t('Lists.importV2-not-found', { count: notFoundCount, total: totalCount })}
            </Text>
            <Badge colorPalette="orange" size="sm">
              {t('Lists.importV2-unresolved')}
            </Badge>
          </HStack>
        </Box>
      )}
    </Flex>
  );
}
