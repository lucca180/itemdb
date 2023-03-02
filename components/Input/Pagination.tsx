import { HStack, Button, Select, Box } from '@chakra-ui/react';

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

  if (!currentPage || !totalPages || !setPage)
    return (
      <HStack mt={4} justifyContent="center">
        <Button isDisabled>Back</Button>
        <Box>
          <Button isLoading />
        </Box>
        <Button isDisabled>Next</Button>
      </HStack>
    );

  return (
    <HStack mt={4} justifyContent="center">
      <Button
        isDisabled={currentPage <= 1}
        onClick={() => setPage(currentPage - 1)}
      >
        Back
      </Button>
      <Box>
        <Select
          name="sortBy"
          variant="filled"
          value={currentPage}
          onChange={handleChange}
        >
          {[...Array(props.totalPages)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </Select>
      </Box>
      <Button
        isDisabled={currentPage >= totalPages}
        onClick={() => setPage(currentPage + 1)}
      >
        Next
      </Button>
    </HStack>
  );
};

export default Pagination;
