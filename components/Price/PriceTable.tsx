import { Stat, StatArrow, Table, TableContainer, Tbody, Td, Tr, Text } from '@chakra-ui/react';
import React from 'react';
import { PriceData } from '../../types';
import { format } from 'date-fns';
import { MinusIcon } from '@chakra-ui/icons';

const intl = new Intl.NumberFormat();

type Props = {
  data: PriceData[];
};

const PriceTable = (props: Props) => {
  const { data } = props;
  const sortedData = data;

  return (
    <TableContainer
      minH={{ base: 100, md: 200 }}
      maxH={{ base: 200, md: 300 }}
      w="100%"
      borderRadius="sm"
      overflowX="auto"
      overflowY="auto"
    >
      <Table h="100%" variant="striped" colorScheme="gray" size="sm">
        <Tbody>
          {sortedData.map((price, index) => (
            <Tr key={price.addedAt}>
              <Td>
                {price.inflated && (
                  <Text fontWeight="bold" color="red.400">
                    Inflation!
                  </Text>
                )}
                {intl.format(price.value)} NP
              </Td>
              <Td>
                {!!sortedData[index + 1]?.value && (
                  <Stat>
                    {!!(price.value - sortedData[index + 1]?.value) && (
                      <StatArrow
                        type={
                          price.value - sortedData[index + 1]?.value > 0 ? 'increase' : 'decrease'
                        }
                      />
                    )}
                    {!(price.value - sortedData[index + 1]?.value) && (
                      <MinusIcon mr={1} boxSize="16px" />
                    )}
                    {intl.format(price.value - sortedData[index + 1]?.value)} NP
                  </Stat>
                )}
              </Td>
              <Td>{format(new Date(price.addedAt), 'PPP')}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default PriceTable;
