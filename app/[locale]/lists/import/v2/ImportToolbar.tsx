'use client';

import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  Text,
} from '@chakra-ui/react';
import { useFormatter, useTranslations } from 'next-intl';
import { LuArrowUpDown, LuRotateCcw, LuSearch, LuX } from 'react-icons/lu';
import { SortSelect } from '@components/Input/SortSelect';
import type { ImportFilterCounts, ImportFilterType } from '@utils/list/filterImportPreviewItems';
import type { ImportSortDir, ImportSortKey } from '@utils/list/sortImportPreviewItems';

export type ImportToolbarProps = {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterType: ImportFilterType;
  onFilterChange: (type: ImportFilterType) => void;
  sortBy: ImportSortKey;
  sortDir: ImportSortDir;
  onSortChange: (key: ImportSortKey, dir: ImportSortDir) => void;
  filterCounts: ImportFilterCounts;
  page: number;
  pageSize: number;
  totalFiltered: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
};

const SORT_TYPES = {
  name: 'name',
  quantity: 'quantity',
  price: 'price',
  price_qty: 'price-quantity',
  rarity: 'rarity',
  item_id: 'item-id',
};

export function ImportToolbar({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterChange,
  sortBy,
  sortDir,
  onSortChange,
  filterCounts,
  page,
  pageSize,
  totalFiltered,
  hasActiveFilters,
  onResetFilters,
}: ImportToolbarProps) {
  const t = useTranslations();
  const format = useFormatter();
  const showingFrom = totalFiltered === 0 ? 0 : pageSize * (page - 1) + 1;
  const showingTo = Math.min(pageSize * page, totalFiltered);

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
        <Box flex={{ base: '1', md: '0 1 320px' }} minW="180px">
          <InputGroup
            w="100%"
            startElement={<Icon as={LuSearch} color="gray.400" boxSize={4} />}
            endElement={
              searchQuery ? (
                <IconButton
                  size="2xs"
                  variant="ghost"
                  aria-label={t('General.clear')}
                  onClick={() => onSearchChange('')}
                >
                  <Icon as={LuX} boxSize={3} />
                </IconButton>
              ) : undefined
            }
          >
            <Input
              size="sm"
              placeholder={t('Lists.importV2-search-placeholder')}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              bg="blackAlpha.400"
              borderColor="whiteAlpha.200"
            />
          </InputGroup>
        </Box>

        <HStack gap={2} wrap="wrap">
          <SortSelect
            sortTypes={SORT_TYPES}
            sortBy={sortBy in SORT_TYPES ? sortBy : 'price_qty'}
            sortDir={sortDir}
            onClick={(key, dir) => onSortChange(key as ImportSortKey, dir)}
          />
          <IconButton
            size="sm"
            variant="outline"
            borderColor="whiteAlpha.200"
            aria-label={t('Lists.importV2-toggle-sort-dir')}
            onClick={() => onSortChange(sortBy, sortDir === 'asc' ? 'desc' : 'asc')}
          >
            <Icon as={LuArrowUpDown} boxSize={3.5} />
          </IconButton>
        </HStack>
      </Flex>

      <Flex justify="space-between" align="center" wrap="wrap" gap={2} px={1}>
        <HStack gap={1.5} wrap="wrap">
          {(
            [
              ['all', 'teal', filterCounts.all],
              ['np', 'green', filterCounts.np],
              ['nc', 'purple', filterCounts.nc],
              ['pb', 'yellow', filterCounts.pb],
              ['unpriced', 'red', filterCounts.unpriced],
            ] as const
          ).map(([key, palette, count]) => (
            <Button
              key={key}
              size="xs"
              variant={filterType === key ? 'solid' : 'outline'}
              colorPalette={filterType === key ? palette : 'gray'}
              onClick={() => onFilterChange(key)}
              borderRadius="full"
            >
              {t(`Lists.importV2-filter-${key}`)}{' '}
              <Badge size="xs" ml={1} colorPalette={palette}>
                {count}
              </Badge>
            </Button>
          ))}
        </HStack>

        <HStack gap={2}>
          <Text fontSize="xs" color="whiteAlpha.600">
            {t('Lists.importV2-showing', {
              val1: format.number(showingFrom),
              val2: format.number(showingTo),
              val3: format.number(totalFiltered),
            })}
          </Text>
          {hasActiveFilters && (
            <Button size="2xs" variant="ghost" colorPalette="teal" onClick={onResetFilters}>
              <Icon as={LuRotateCcw} mr={1} />
              {t('Lists.importV2-reset-filters')}
            </Button>
          )}
        </HStack>
      </Flex>
    </Flex>
  );
}
