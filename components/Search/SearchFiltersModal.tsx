/* eslint-disable react-you-might-not-need-an-effect/you-might-not-need-an-effect */
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Flex,
} from '@chakra-ui/react';
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
    <Modal isOpen={!!isOpen} onClose={onClose} isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{t('Search.search-filters')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SearchFilters
            onChange={handleChange}
            isLists={isLists}
            filters={filters}
            stats={stats}
            isColorSearch={isColorSearch}
          />
        </ModalBody>
        <ModalFooter as={Flex} gap={3}>
          <Button variant="outline" onClick={resetFiltersAndClose} colorScheme="gray" size="sm">
            {t('General.reset')}
          </Button>
          <Button variant="outline" colorScheme="green" size="sm" onClick={applyFiltersAndClose}>
            {t('Search.apply-filters')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SearchFilterModal;
