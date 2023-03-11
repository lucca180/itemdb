import { HStack, Button, Select, Box, IconButton } from '@chakra-ui/react';
import { BiFirstPage, BiLastPage } from 'react-icons/bi';

type Props = {
  currentPage?: number;
  totalPages?: number;
  setPage?: (page: number) => void;
};

const Pagination = (props: Props) => {
  const { currentPage, totalPages, setPage } = props;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (setPage) setPage(parseInt(e.target.value));
  };

  if (currentPage == null || totalPages == null || !setPage)
    return (
      <HStack mt={4} justifyContent="center">
        <IconButton
          isDisabled
          aria-label="Jump to first page button"
          color="gray.300"
          icon={<BiFirstPage size="24px" />}
        />
        <Button isDisabled>Back</Button>
        <Box>
          <Button isLoading />
        </Box>
        <Button isDisabled>Next</Button>
        <IconButton
          isDisabled
          aria-label="Jump to last page button"
          icon={<BiLastPage size="24px" />}
        />
      </HStack>
    );

  return (
    <HStack mt={4} justifyContent="center">
      <IconButton
        isDisabled={currentPage <= 1}
        onClick={() => setPage(1)}
        aria-label="Jump to first page button"
        color="gray.300"
        icon={<BiFirstPage size="24px" />}
      />
      <Button isDisabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
        Back
      </Button>
      <Box>
        <Select
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
      <Button isDisabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
        Next
      </Button>
      <IconButton
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
