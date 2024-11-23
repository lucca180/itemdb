import { HStack, Button, Select, Box, IconButton } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import { BiFirstPage, BiLastPage } from 'react-icons/bi';

type Props = {
  mt?: number;
  mb?: number;
  currentPage?: number;
  totalPages?: number;
  setPage?: (page: number) => void;
};

const Pagination = (props: Props) => {
  const t = useTranslations();
  const { currentPage, totalPages, setPage, mt, mb } = props;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (setPage) setPage(parseInt(e.target.value));
  };

  if (currentPage == null || totalPages == null || !setPage)
    return (
      <HStack mt={mt ?? 4} mb={mb} justifyContent="center">
        <IconButton
          size="sm"
          isDisabled
          aria-label="Jump to first page button"
          color="gray.300"
          icon={<BiFirstPage size="24px" />}
        />
        <Button size="sm" isDisabled>
          {t('General.back')}
        </Button>
        <Box>
          <Button size="sm" isLoading />
        </Box>
        <Button size="sm" isDisabled>
          {t('General.next')}
        </Button>
        <IconButton
          size="sm"
          isDisabled
          aria-label="Jump to last page button"
          icon={<BiLastPage size="24px" />}
        />
      </HStack>
    );

  return (
    <HStack mt={mt ?? 4} mb={mb} justifyContent="center">
      <IconButton
        size="sm"
        isDisabled={currentPage <= 1}
        onClick={() => setPage(1)}
        aria-label="Jump to first page button"
        color="gray.300"
        icon={<BiFirstPage size="24px" />}
      />
      <Button size="sm" isDisabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
        {t('General.back')}
      </Button>
      <Box>
        <Select
          size="sm"
          name="sortBy"
          variant="filled"
          value={currentPage}
          onChange={handleChange}
          disabled={!props.totalPages}
        >
          {[...Array(props.totalPages || 1)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </Select>
      </Box>
      <Button
        size="sm"
        isDisabled={currentPage >= totalPages}
        onClick={() => setPage(currentPage + 1)}
      >
        {t('General.next')}
      </Button>
      <IconButton
        size="sm"
        isDisabled={currentPage >= totalPages}
        onClick={() => setPage(totalPages)}
        aria-label="Jump to last page button"
        color="gray.300"
        icon={<BiLastPage size="24px" />}
      />
    </HStack>
  );
};

export default Pagination;
