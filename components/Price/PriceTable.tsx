import {
  Stat,
  StatArrow,
  Table,
  TableContainer,
  Tbody,
  Td,
  Tr,
  Text,
  IconButton,
} from '@chakra-ui/react';
import React from 'react';
import { PriceData } from '../../types';
import { MinusIcon } from '@chakra-ui/icons';
import { useFormatter, useTranslations } from 'next-intl';
import { FiEdit } from 'react-icons/fi';

const intl = new Intl.NumberFormat();

type Props = {
  data: PriceData[];
  isAdmin?: boolean;
  onEdit?: (price: PriceData) => void;
};

const PriceTable = (props: Props) => {
  const { data, isAdmin, onEdit } = props;
  const sortedData = data;
  const t = useTranslations();
  const format = useFormatter();

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
                    {t('General.inflation')}!
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
              <Td>
                {format.dateTime(new Date(price.addedAt), {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Td>
              {isAdmin && (
                <Td>
                  {' '}
                  <IconButton
                    onClick={() => onEdit?.(price)}
                    size="xs"
                    aria-label="Edit"
                    icon={<FiEdit />}
                  />
                </Td>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default PriceTable;
