'use client';

import { Badge, Box, Flex, HStack, Icon, Table, Text } from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import { FaCaretDown, FaCaretUp, FaSort } from 'react-icons/fa';
import { LuExternalLink } from 'react-icons/lu';
import MainLink from '@components/Utils/MainLink';
import { ItemCardBadgeV2 } from '@components/Items/v2/ItemCardBadgeV2';
import { ItemImageV2 } from '@components/Items/v2/ItemImageV2';
import type {
  ImportItemBadge,
  ImportPreviewItemV2,
} from '@app/[locale]/lists/import/v2/importV2Shared';
import type { ImportSortDir, ImportSortKey } from '@utils/list/sortImportPreviewItems';
import { capitalizeWords } from '@utils/item/itemInfo';
import { rarityToCCPointsV2 } from '@utils/item/v2';

/** Colors match ItemHeader.tsx and SearchFilters.tsx (album item = yellow). */
const BADGE_CONFIG: Record<ImportItemBadge, { labelKey: string; colorPalette: string }> = {
  gourmet: { labelKey: 'Lists.importV2-badge-gourmet', colorPalette: 'orange' },
  book: { labelKey: 'Lists.importV2-badge-book', colorPalette: 'orange' },
  booktastic: { labelKey: 'Lists.importV2-badge-booktastic', colorPalette: 'orange' },
  stamp: { labelKey: 'Lists.importV2-badge-stamp', colorPalette: 'yellow' },
  wearable: { labelKey: 'Lists.importV2-badge-wearable', colorPalette: 'blue' },
  bd: { labelKey: 'Lists.importV2-badge-bd', colorPalette: 'red' },
};

export type ImportItemTableProps = {
  items: ImportPreviewItemV2[];
  sortBy: ImportSortKey;
  sortDir: ImportSortDir;
  onSortChange: (key: ImportSortKey, dir: ImportSortDir) => void;
  isLoading?: boolean;
};

export function ImportItemTable({
  items,
  sortBy,
  sortDir,
  onSortChange,
  isLoading,
}: ImportItemTableProps) {
  const t = useTranslations();
  const format = useFormatter();

  const handleHeaderClick = (columnKey: ImportSortKey) => {
    let nextDir: ImportSortDir;
    if (sortBy === columnKey) nextDir = sortDir === 'asc' ? 'desc' : 'asc';
    else nextDir = columnKey === 'name' ? 'asc' : 'desc';

    window.umami?.track('import-v2-sort', { label: `${columnKey}-${nextDir}`, source: 'column' });
    onSortChange(columnKey, nextDir);
  };

  const renderSortIndicator = (columnKey: ImportSortKey) => {
    if (sortBy !== columnKey) {
      return <Icon as={FaSort} color="whiteAlpha.400" boxSize={2.5} ml={1} opacity={0.5} />;
    }
    return (
      <Icon as={sortDir === 'asc' ? FaCaretUp : FaCaretDown} color="teal.400" boxSize={3} ml={1} />
    );
  };

  const header = (
    label: string,
    key: ImportSortKey,
    opts?: { center?: boolean; end?: boolean }
  ) => (
    <Table.ColumnHeader
      cursor="pointer"
      userSelect="none"
      py={3}
      px={3}
      textAlign={opts?.center ? 'center' : opts?.end ? 'right' : 'start'}
      onClick={() => handleHeaderClick(key)}
      _hover={{ bg: 'whiteAlpha.100' }}
    >
      <Flex
        align="center"
        justify={opts?.center ? 'center' : opts?.end ? 'flex-end' : 'flex-start'}
      >
        <Text fontWeight="semibold" fontSize="xs" color="whiteAlpha.900">
          {label}
        </Text>
        {renderSortIndicator(key)}
      </Flex>
    </Table.ColumnHeader>
  );

  return (
    <Table.ScrollArea
      w="100%"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="lg"
      bg="gray.900"
      opacity={isLoading ? 0.6 : 1}
      transition="opacity 0.15s"
    >
      <Table.Root size="sm" variant="line" interactive>
        <Table.Header bg="gray.800">
          <Table.Row borderColor="whiteAlpha.300">
            {header(t('General.item'), 'name')}
            {header(t('General.quantity'), 'quantity', { center: true })}
            {header(t('Lists.importV2-col-price'), 'price')}
            {header(t('Lists.importV2-col-total'), 'price_qty', { end: true })}
            {header(t('General.rarity'), 'rarity', { center: true })}
            {header(t('Lists.importV2-col-points'), 'ffPoints', { center: true })}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items.map(({ key, item, quantity, badges }, index) => {
            const npUnit = item.price?.type === 'np' ? item.price.value : null;
            const totalNp = typeof npUnit === 'number' && npUnit > 0 ? npUnit * quantity : null;
            const isNc = item.type === 'nc';
            const ncTradeMin = item.ncValue?.minValue;
            const ncTradeMax = item.ncValue?.maxValue;
            const ncMall = item.price?.type === 'ncMall' ? item.price : null;
            const ncMallUnit = ncMall ? (ncMall.discountPrice ?? ncMall.price ?? 0) : null;
            const totalNcMall = ncMallUnit != null ? ncMallUnit * quantity : null;

            return (
              <Table.Row
                key={key}
                bg={index % 2 === 0 ? 'blackAlpha.300' : 'transparent'}
                _hover={{ bg: 'whiteAlpha.100' }}
                borderColor="whiteAlpha.100"
              >
                <Table.Cell py={2.5} px={3}>
                  <Flex align="center" gap={3}>
                    <Box
                      w="40px"
                      h="40px"
                      flexShrink={0}
                      borderRadius="md"
                      overflow="hidden"
                      bg="gray.950"
                      borderWidth="1px"
                      borderColor={item.colorHex ? `${item.colorHex}66` : 'whiteAlpha.200'}
                    >
                      <ItemImageV2 item={item} width={40} height={40} />
                    </Box>
                    <Flex direction="column" minW={0} gap={0.5}>
                      <MainLink
                        href={`/item/${item.slug ?? item.internal_id}`}
                        prefetch={false}
                        target="_blank"
                      >
                        <HStack gap={1} align="baseline">
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            color="whiteAlpha.900"
                            _hover={{ color: 'teal.300', textDecoration: 'underline' }}
                            lineClamp={1}
                          >
                            {item.name}
                          </Text>
                          <Icon as={LuExternalLink} boxSize={2.5} color="whiteAlpha.400" />
                        </HStack>
                      </MainLink>
                      <HStack gap={1.5} flexWrap="wrap">
                        {item.category && (
                          <Text fontSize="2xs" color="whiteAlpha.600">
                            {capitalizeWords(item.category)}
                          </Text>
                        )}
                        {badges.map((badge) => (
                          <Badge
                            key={badge}
                            size="xs"
                            variant="subtle"
                            colorPalette={BADGE_CONFIG[badge].colorPalette}
                          >
                            {t(BADGE_CONFIG[badge].labelKey)}
                          </Badge>
                        ))}
                      </HStack>
                    </Flex>
                  </Flex>
                </Table.Cell>
                <Table.Cell textAlign="center" py={2.5} px={3}>
                  <Badge
                    size="sm"
                    colorPalette={quantity > 1 ? 'teal' : 'gray'}
                    variant={quantity > 1 ? 'solid' : 'subtle'}
                    textTransform="none"
                  >
                    {quantity}x
                  </Badge>
                </Table.Cell>
                <Table.Cell py={2.5} px={3}>
                  <ItemCardBadgeV2 item={item} />
                </Table.Cell>
                <Table.Cell textAlign="right" py={2.5} px={3}>
                  {totalNp != null && (
                    <Text fontSize="sm" fontWeight="semibold" color="yellow.300">
                      {format.number(totalNp)} NP
                    </Text>
                  )}
                  {isNc && ncTradeMin != null && (
                    <Text fontSize="sm" fontWeight="semibold" color="purple.300">
                      {ncTradeMin * quantity}
                      {ncTradeMax != null ? `-${ncTradeMax * quantity}` : ''} Caps
                    </Text>
                  )}
                  {isNc && totalNcMall != null && totalNcMall > 0 && (
                    <Text fontSize="sm" fontWeight="semibold" color="orange.300">
                      {format.number(totalNcMall)} NC
                    </Text>
                  )}
                  {totalNp == null &&
                    (!isNc || (ncTradeMin == null && (!totalNcMall || totalNcMall === 0))) && (
                      <Text fontSize="sm" color="whiteAlpha.400">
                        —
                      </Text>
                    )}
                </Table.Cell>
                <Table.Cell textAlign="center" py={2.5} px={3}>
                  {item.rarity != null ? (
                    <Badge size="xs" variant="outline">
                      r{item.rarity}
                    </Badge>
                  ) : (
                    <Text fontSize="xs" color="whiteAlpha.400">
                      —
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell textAlign="center" py={2.5} px={3}>
                  {(() => {
                    const points = rarityToCCPointsV2(item);
                    return points > 0 ? (
                      <Badge
                        size="lg"
                        colorPalette="pink"
                        variant="subtle"
                        fontSize="sm"
                        fontWeight="bold"
                        px={2.5}
                      >
                        {points}
                      </Badge>
                    ) : (
                      <Text fontSize="xs" color="whiteAlpha.400">
                        —
                      </Text>
                    );
                  })()}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
