import { HStack, Button, NativeSelect, Box, IconButton } from '@chakra-ui/react';
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
        <IconButton size="sm" disabled aria-label="Jump to first page button" color="gray.300">
          <BiFirstPage size="24px" />
        </IconButton>
        <Button size="sm" disabled>
          {t('General.back')}
        </Button>
        <Box>
          <Button size="sm" loading />
        </Box>
        <Button size="sm" disabled>
          {t('General.next')}
        </Button>
        <IconButton size="sm" disabled aria-label="Jump to last page button">
          <BiLastPage size="24px" />
        </IconButton>
      </HStack>
    );

  return (
    <HStack mt={mt ?? 4} mb={mb} justifyContent="center">
      <IconButton
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => setPage(1)}
        aria-label="Jump to first page button"
        color="gray.300"
      >
        <BiFirstPage size="24px" />
      </IconButton>
      <Button size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
        {t('General.back')}
      </Button>
      <Box>
        <NativeSelect.Root size="sm" variant="subtle" disabled={!props.totalPages}>
          <NativeSelect.Field name="sortBy" value={currentPage} onChange={handleChange}>
            {[...Array(props.totalPages || 1)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </Box>
      <Button
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => setPage(currentPage + 1)}
      >
        {t('General.next')}
      </Button>
      <IconButton
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => setPage(totalPages)}
        aria-label="Jump to last page button"
        color="gray.300"
      >
        <BiLastPage size="24px" />
      </IconButton>
    </HStack>
  );
};

export default Pagination;
