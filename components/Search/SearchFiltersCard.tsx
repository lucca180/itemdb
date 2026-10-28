/* eslint-disable  */
import { HStack, Button, Box, Text } from '@chakra-ui/react';
import CardBase from '../Card/CardBase';
import SearchFilters from './SearchFilters';
import { SearchFilters as SearchFiltersType, SearchStats } from '../../types';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { BsCheck2 } from 'react-icons/bs';
import { countActiveFilters, getChangedFilterKeys } from '@utils/parseFilters';

type Props = {
  filters: SearchFiltersType;
  stats: SearchStats | null;
  isColorSearch: boolean;
  onChange?: (filters: SearchFiltersType) => void;
  resetFilters: () => void;
  applyFilters: (filters: SearchFiltersType) => void;
};

const SearchFilterCard = (props: Props) => {
  const t = useTranslations();
  const { stats, isColorSearch, onChange, resetFilters } = props;
  const [filters, setFilters] = useState<SearchFiltersType>(props.filters);

  useEffect(() => {
    setFilters(props.filters);
  }, [props.filters]);

  const handleChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    onChange?.(newFilters);
  };

  const applyFilters = () => {
    props.applyFilters(filters);
  };

  const pendingChanges = getChangedFilterKeys(filters, props.filters).length;

  // The footer only starts following the screen after the first change, then keeps doing so.
  const [isFooterSticky, setIsFooterSticky] = useState(false);
  if (pendingChanges > 0 && !isFooterSticky) setIsFooterSticky(true);

  return (
    <>
      <CardBase
        title={t('Search.search-filters')}
        noPadding
        // overflow: hidden would stop the footer from sticking to the viewport
        chakraWrapper={{ overflow: 'visible' }}
        chakra={{ boxShadow: 'none' }}
        chakraTitle={{ borderTopRadius: 'md' }}
      >
        <SearchFilters
          onChange={handleChange}
          filters={filters}
          stats={stats}
          isColorSearch={isColorSearch}
        />
        {/* Once sticky, it stays at the bottom of the screen while the card runs past the fold */}
        <Box
          position={isFooterSticky ? 'sticky' : 'static'}
          bottom={0}
          zIndex={1}
          p={3}
          borderTopWidth="1px"
          borderColor="whiteAlpha.200"
          borderBottomRadius="md"
          bg={pendingChanges > 0 ? 'green.900' : 'gray.700'}
          transition="background 0.2s"
        >
          {pendingChanges > 0 ? (
            <>
              <Text fontSize="xs" color="green.100" mb={2} textAlign="center">
                {t('Search.x-pending-changes', { count: pendingChanges })}
              </Text>
              <HStack justifyContent="center">
                <Button
                  variant="ghost"
                  onClick={() => setFilters(props.filters)}
                  colorPalette="gray"
                  size="sm"
                >
                  {t('Search.discard')}
                </Button>
                <Button colorPalette="green" size="sm" onClick={applyFilters}>
                  {t('Search.apply-filters')}
                </Button>
              </HStack>
            </>
          ) : (
            <HStack justifyContent="space-between" minH="32px">
              <Text fontSize="xs" color="gray.300">
                {countActiveFilters(props.filters) > 0 && (
                  <>
                    <BsCheck2 style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                    {t('Search.filters-applied')}
                  </>
                )}
              </Text>
              <Button variant="ghost" onClick={resetFilters} colorPalette="gray" size="sm">
                {t('General.reset')}
              </Button>
            </HStack>
          )}
        </Box>
      </CardBase>
    </>
  );
};

export default SearchFilterCard;
