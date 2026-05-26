/* eslint-disable  */
import { Button, CloseButton, Dialog, Flex, Portal } from '@chakra-ui/react';
import SearchFilters from './SearchFilters';
import { SearchFilters as SearchFiltersType, SearchStats } from '../../types';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export type SearchFilterModalProps = {
  filters: SearchFiltersType;
  stats: SearchStats | null;
  isColorSearch?: boolean;
  onChange?: (filters: SearchFiltersType) => void;
  resetFilters: () => void;
  applyFilters: (newFilters: SearchFiltersType) => void;
  onClose: () => void;
  isOpen?: boolean;
  isLists?: boolean;
};

const SearchFilterModal = (props: SearchFilterModalProps) => {
  const t = useTranslations();
  const { stats, isColorSearch, isOpen, onClose, onChange, resetFilters, applyFilters, isLists } =
    props;

  const [filters, setFilters] = useState<SearchFiltersType>(props.filters);

  useEffect(() => {
    setFilters(props.filters);
  }, [props.filters]);

  const handleChange = (newFilters: SearchFiltersType) => {
    setFilters(newFilters);
    onChange?.(newFilters);
  };

  const applyFiltersAndClose = () => {
    applyFilters(filters);
    onClose();
  };

  const resetFiltersAndClose = () => {
    resetFilters();
    onClose();
  };

  return (
    <Dialog.Root
      open={!!isOpen}
      onOpenChange={({ open }) => {
        if (!open) onClose();
      }}
      placement="center"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('Search.search-filters')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
            <Dialog.Body>
              <SearchFilters
                onChange={handleChange}
                isLists={isLists}
                filters={filters}
                stats={stats}
                isColorSearch={isColorSearch}
              />
            </Dialog.Body>
            <Dialog.Footer as={Flex} gap={3}>
              <Button
                variant="outline"
                onClick={resetFiltersAndClose}
                colorPalette="gray"
                size="sm"
              >
                {t('General.reset')}
              </Button>
              <Button
                variant="outline"
                colorPalette="green"
                size="sm"
                onClick={applyFiltersAndClose}
              >
                {t('Search.apply-filters')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default SearchFilterModal;
