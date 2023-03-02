import { HStack, Button } from '@chakra-ui/react';
import CardBase from '../Card/CardBase';
import SearchFilters from './SearchFilters';
import { SearchFilters as SearchFiltersType, SearchStats } from '../../types';

type Props = {
  filters: SearchFiltersType;
  stats: SearchStats | null;
  isColorSearch: boolean;
  onChange: (filters: SearchFiltersType) => void;
  resetFilters: () => void;
  applyFilters: () => void;
};

const SearchFilterCard = (props: Props) => {
  const {
    filters,
    stats,
    isColorSearch,
    onChange,
    resetFilters,
    applyFilters,
  } = props;
  return (
    <CardBase title="Search Filters" noPadding>
      <SearchFilters
        onChange={onChange}
        filters={filters}
        stats={stats}
        isColorSearch={isColorSearch}
      />
      <HStack justifyContent="center" my={3}>
        <Button
          variant="outline"
          onClick={resetFilters}
          colorScheme="gray"
          size="sm"
        >
          Reset
        </Button>
        <Button
          variant="outline"
          colorScheme="green"
          size="sm"
          onClick={applyFilters}
        >
          Apply Filters
        </Button>
      </HStack>
    </CardBase>
  );
};

export default SearchFilterCard;
