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

type Props = {
  filters: SearchFiltersType;
  stats: SearchStats | null;
  isColorSearch: boolean;
  onChange: (filters: SearchFiltersType) => void;
  resetFilters: () => void;
  applyFilters: () => void;
  onClose: () => void;
  isOpen: boolean;
};

const SearchFilterModal = (props: Props) => {
  const {
    filters,
    stats,
    isColorSearch,
    isOpen,
    onClose,
    onChange,
    resetFilters,
    applyFilters,
  } = props;

  const applyFiltersAndClose = () => {
    applyFilters();
    onClose();
  };

  const resetFiltersAndClose = () => {
    resetFilters();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Search Filters</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SearchFilters
            onChange={onChange}
            filters={filters}
            stats={stats}
            isColorSearch={isColorSearch}
          />
        </ModalBody>
        <ModalFooter as={Flex} gap={3}>
          <Button
            variant="outline"
            onClick={resetFiltersAndClose}
            colorScheme="gray"
            size="sm"
          >
            Reset
          </Button>
          <Button
            variant="outline"
            colorScheme="green"
            size="sm"
            onClick={applyFiltersAndClose}
          >
            Apply Filters
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SearchFilterModal;
