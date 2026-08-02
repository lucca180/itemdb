'use client';

import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  NativeSelect,
  Pagination,
  Switch,
  Text,
  VisuallyHidden,
} from '@chakra-ui/react';
import { useRouter } from '@i18n/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState, type ChangeEvent } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import {
  PET_STYLES_PAGE_SIZE,
  STYLES_BASE_PATH,
  stylesBrowseHref,
  stylesComboHref,
  stylesFilterQuery,
  stylesListQuery,
  withStylesQuery,
} from '@utils/petStyles/paths';
import type { StyleToken } from '@utils/petStyles/display';
import { StyleTokenTile } from './StyleTokenTile';

type PetStylesSearchBarProps = {
  colors: string[];
  species: string[];
  seriesOptions: string[];
  initialSpecies?: string;
  initialColor?: string;
  initialSeries?: string;
  initialPrismatic?: boolean;
  initialAvailableNow?: boolean;
  /** Applied page state — not the draft selects. Controls Reset visibility. */
  isPageDefault?: boolean;
};

export function PetStylesSearchBar({
  colors,
  species,
  seriesOptions,
  initialSpecies = '',
  initialColor = '',
  initialSeries = '',
  initialPrismatic = false,
  initialAvailableNow = false,
  isPageDefault = true,
}: PetStylesSearchBarProps) {
  const t = useTranslations();
  const router = useRouter();
  const [speciesValue, setSpeciesValue] = useState(initialSpecies);
  const [color, setColor] = useState(initialColor);
  const [series, setSeries] = useState(initialSeries);
  const [prismaticOnly, setPrismaticOnly] = useState(initialPrismatic);
  const [availableNowOnly, setAvailableNowOnly] = useState(initialAvailableNow);

  const speciesId = useId();
  const colorId = useId();
  const seriesId = useId();

  const reset = () => {
    setSpeciesValue('');
    setColor('');
    setSeries('');
    setPrismaticOnly(false);
    setAvailableNowOnly(false);
    router.push(STYLES_BASE_PATH);
  };

  const apply = () => {
    const draftIsEmpty = !speciesValue && !color && !series && !prismaticOnly && !availableNowOnly;
    if (draftIsEmpty) {
      reset();
      return;
    }

    const filterQs = stylesFilterQuery({
      series: series || undefined,
      prismaticOnly,
      availableNowOnly,
    });

    // Species × colour combo pages ignore hub filters (tokens are already scoped).
    if (speciesValue && color) {
      router.push(stylesComboHref(speciesValue, color));
      return;
    }
    if (speciesValue) {
      router.push(withStylesQuery(stylesBrowseHref(speciesValue), filterQs));
      return;
    }
    if (color) {
      router.push(withStylesQuery(stylesBrowseHref(color), filterQs));
      return;
    }
    router.push(withStylesQuery(STYLES_BASE_PATH, filterQs));
  };

  return (
    <Flex flexFlow="column" gap={3} align="center" w="100%">
      <HStack flexWrap="wrap" justify="center" gap={2}>
        <VisuallyHidden asChild>
          <label htmlFor={colorId}>{t('PetColors.select-color')}</label>
        </VisuallyHidden>
        <NativeSelect.Root size="sm" variant="subtle" w="150px" bg="blackAlpha.400">
          <NativeSelect.Field
            id={colorId}
            value={color}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setColor(e.target.value)}
          >
            <option value="">{t('PetStyles.all-colours')}</option>
            {colors.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>

        <VisuallyHidden asChild>
          <label htmlFor={speciesId}>{t('PetColors.select-species')}</label>
        </VisuallyHidden>
        <NativeSelect.Root size="sm" variant="subtle" w="160px" bg="blackAlpha.400">
          <NativeSelect.Field
            id={speciesId}
            value={speciesValue}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSpeciesValue(e.target.value)}
          >
            <option value="">{t('PetStyles.all-species')}</option>
            {species.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>

        <VisuallyHidden asChild>
          <label htmlFor={seriesId}>{t('PetStyles.series')}</label>
        </VisuallyHidden>
        <NativeSelect.Root size="sm" variant="subtle" w="170px" bg="blackAlpha.400">
          <NativeSelect.Field
            id={seriesId}
            value={series}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setSeries(e.target.value)}
          >
            <option value="">{t('PetStyles.all-series')}</option>
            {seriesOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>

        <Switch.Root
          size="sm"
          checked={prismaticOnly}
          onCheckedChange={(e) => setPrismaticOnly(e.checked)}
          colorPalette="purple"
        >
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>
            <Text fontSize="sm">{t('PetStyles.prismatic')}</Text>
          </Switch.Label>
        </Switch.Root>

        <Switch.Root
          size="sm"
          checked={availableNowOnly}
          onCheckedChange={(e) => setAvailableNowOnly(e.checked)}
          colorPalette="yellow"
        >
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>
            <Text fontSize="sm" whiteSpace="nowrap">
              {t('PetStyles.current-rotation')}
            </Text>
          </Switch.Label>
        </Switch.Root>
      </HStack>

      <HStack gap={2} justify="center">
        <Button size="sm" bg="blackAlpha.500" onClick={apply}>
          {t('Search.search')}
        </Button>
        {!isPageDefault && (
          <Button size="sm" variant="ghost" color="whiteAlpha.800" onClick={reset}>
            {t('General.reset')}
          </Button>
        )}
      </HStack>
    </Flex>
  );
}

type HubResultsGridProps = {
  tokens: StyleToken[];
  total: number;
  page: number;
  pageSize?: number;
  /** Path without query (hub or browse). */
  pathname: string;
  seriesName?: string;
  prismatic?: boolean;
  availableNow?: boolean;
  /** Hide “Showing X–Y of Z” (e.g. hub recently-released strip). */
  showRange?: boolean;
};

export function HubResultsGrid({
  tokens,
  total,
  page,
  pageSize = PET_STYLES_PAGE_SIZE,
  pathname,
  seriesName = '',
  prismatic = false,
  availableNow = false,
  showRange = true,
}: HubResultsGridProps) {
  const t = useTranslations();
  const router = useRouter();

  if (!tokens.length) {
    return (
      <Text textAlign="center" color="whiteAlpha.700" py={8}>
        {t('PetStyles.no-results')}
      </Text>
    );
  }

  const start = (page - 1) * pageSize;
  const showPagination = total > pageSize;

  const goToPage = (nextPage: number) => {
    router.push(
      withStylesQuery(
        pathname,
        stylesListQuery({
          series: seriesName || undefined,
          prismaticOnly: prismatic,
          availableNowOnly: availableNow,
          page: nextPage,
        })
      )
    );
  };

  return (
    <Flex flexFlow="column" gap={4} align="center" w="100%">
      {showRange && (
        <Text fontSize="xs" color="whiteAlpha.600" alignSelf="stretch">
          {t('PetStyles.showing-range', {
            from: start + 1,
            to: Math.min(start + pageSize, total),
            total,
          })}
        </Text>
      )}

      <Flex flexWrap="wrap" gap={3} justify="center" w="100%">
        {tokens.map((token) => (
          <Box key={token.id} w={{ base: 'calc(50% - 6px)', sm: '160px' }}>
            <StyleTokenTile token={token} />
          </Box>
        ))}
      </Flex>

      {showPagination && (
        <Pagination.Root
          count={total}
          pageSize={pageSize}
          page={page}
          onPageChange={(e) => goToPage(e.page)}
        >
          <ButtonGroup variant="ghost" size="sm">
            <Pagination.PrevTrigger asChild>
              <IconButton aria-label={t('MissingHub.prev-page')}>
                <LuChevronLeft />
              </IconButton>
            </Pagination.PrevTrigger>

            <Pagination.Items
              render={(item) => (
                <IconButton
                  variant={{ base: 'ghost', _selected: 'outline' }}
                  aria-label={t('PetStyles.page-n', { n: item.value })}
                >
                  {item.value}
                </IconButton>
              )}
            />

            <Pagination.NextTrigger asChild>
              <IconButton aria-label={t('MissingHub.next-page')}>
                <LuChevronRight />
              </IconButton>
            </Pagination.NextTrigger>
          </ButtonGroup>
        </Pagination.Root>
      )}
    </Flex>
  );
}
