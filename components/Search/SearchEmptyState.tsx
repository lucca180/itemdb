'use client';

import { Button, Center, Image, Link, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import queryString from 'query-string';
import MainLink from '@components/Utils/MainLink';
import type { SearchFilters, SearchStats } from '@types';
import { countActiveFilters, defaultFilters, getFiltersDiff } from '@utils/parseFilters';
import { runSearch } from '@app/[locale]/search/actions';

type SearchEmptyStateProps = {
  query: string;
  filters: SearchFilters;
  stats: SearchStats | null;
  totalResults: number | null;
  isColorSearch: boolean;
  listJWT?: string | null;
  onClearFilters: () => void;
};

const SearchEmptyState = (props: SearchEmptyStateProps) => {
  const { query, filters, stats, totalResults, isColorSearch, listJWT, onClearFilters } = props;
  const t = useTranslations();
  const [fuzzySuggestions, setFuzzySuggestions] = useState<{
    key: string;
    names: string[];
  } | null>(null);

  // The facet stats ignore the filters and every item has one type, so the type facet adds up
  // to the results the query has with no filters.
  const unfilteredTotal = stats
    ? Object.values(stats.type ?? {}).reduce((sum, n) => sum + n, 0)
    : null;
  const isEmpty = totalResults === 0;
  const filtersHideResults = isEmpty && countActiveFilters(filters) > 0 && !!unfilteredTotal;

  // "Did you mean" only when the query alone finds nothing: fuzzy scans every item name.
  const fuzzyKey =
    isEmpty &&
    unfilteredTotal === 0 &&
    query.length >= 3 &&
    filters.mode === 'name' &&
    !isColorSearch
      ? `${query}\0${filters.list_id ?? 0}`
      : null;
  const suggestions = fuzzySuggestions?.key === fuzzyKey ? fuzzySuggestions.names : [];

  useEffect(() => {
    if (!fuzzyKey) return;
    let cancelled = false;

    // Without the filters: the query alone already has 0, so they would only hide suggestions.
    runSearch(
      query,
      { ...defaultFilters, list_id: filters.list_id, mode: 'fuzzy', limit: 6 },
      listJWT
    )
      .then((result) => {
        if (cancelled) return;
        const names = [...new Set(result.content.map((item) => item.name))].slice(0, 3);
        setFuzzySuggestions({ key: fuzzyKey, names });
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [fuzzyKey]);

  // Suggestions keep the current filters and sort, like a new search from the header.
  const suggestionHref = (name: string) => {
    const params = queryString.stringify(getFiltersDiff({ ...filters, page: 1 }), {
      arrayFormat: 'bracket',
    });
    return `/search?s=${encodeURIComponent(name)}${params ? '&' + params : ''}`;
  };

  const clearFilters = () => {
    window.umami?.track('search-empty', { label: 'clear-filters' });
    onClearFilters();
  };

  return (
    <Center minH="60vh" flexFlow="column" gap={3} textAlign="center" px={2}>
      <Image
        src="https://images.neopets.com/halloween/tot/2020/1_5WhOgu.png"
        alt="no results found coltzan"
        maxW="75%"
      />
      <Text color="gray.400">{t('Layout.no-results-found')} :(</Text>
      {filtersHideResults && (
        <>
          <Text fontSize="sm" color="whiteAlpha.700" wordBreak="break-word">
            {query ? t('Search.filters-no-results-for', { query }) : t('Search.filters-no-results')}
          </Text>
          <Button size="sm" variant="outline" onClick={clearFilters}>
            {t('Search.clear-filters')}
          </Button>
        </>
      )}
      {suggestions.length > 0 && (
        <Text fontSize="sm" color="whiteAlpha.700">
          {t('Search.did-you-mean')}:{' '}
          {suggestions.map((name, i) => (
            <React.Fragment key={name}>
              {i > 0 && ' · '}
              <Link asChild color="blue.300">
                <MainLink
                  href={suggestionHref(name)}
                  trackEvent="search-empty"
                  trackEventLabel="suggestion"
                >
                  {name}
                </MainLink>
              </Link>
            </React.Fragment>
          ))}
          ?
        </Text>
      )}
    </Center>
  );
};

export default SearchEmptyState;
