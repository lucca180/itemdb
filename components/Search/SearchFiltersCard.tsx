/* eslint-disable  */
import { HStack, Button } from '@chakra-ui/react';
import CardBase from '../Card/CardBase';
import SearchFilters from './SearchFilters';
import { SearchFilters as SearchFiltersType, SearchStats } from '../../types';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

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

  return (
    <>
      <CardBase title={t('Search.search-filters')} noPadding>
        <SearchFilters
          onChange={handleChange}
          filters={filters}
          stats={stats}
          isColorSearch={isColorSearch}
        />
        <HStack justifyContent="center" my={3} px={2}>
          <Button variant="ghost" onClick={resetFilters} colorScheme="gray" size="sm">
            {t('General.reset')}
          </Button>
          <Button variant="ghost" colorScheme="green" size="sm" onClick={applyFilters}>
            {t('Search.apply-filters')}
          </Button>
        </HStack>
      </CardBase>
    </>
  );
};

export default SearchFilterCard;
