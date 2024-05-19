import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Tr,
  Text,
  IconButton,
  Box,
  Flex,
  Icon,
} from '@chakra-ui/react';
import React from 'react';
import { PriceData } from '../../types';
import { MinusIcon } from '@chakra-ui/icons';
import { useFormatter, useTranslations } from 'next-intl';
import { FiEdit } from 'react-icons/fi';
import { FaCaretDown, FaCaretUp } from 'react-icons/fa';

const intl = new Intl.NumberFormat();

type Props = {
  data: PriceData[];
  isAdmin?: boolean;
  onEdit?: (price: PriceData) => void;
};

const PriceTable = (props: Props) => {
  const { data: sortedData, isAdmin, onEdit } = props;

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
            <PriceItem
              key={price.addedAt}
              price={price}
              data={sortedData}
              index={index}
              isAdmin={isAdmin}
              onEdit={onEdit}
            />
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default PriceTable;

const PriceItem = (props: Props & { price: PriceData; index: number }) => {
  const { price, data: sortedData, index, isAdmin, onEdit } = props;
  const format = useFormatter();
  const t = useTranslations();

  return (
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
          <Flex alignItems={'center'}>
            {!!(price.value - sortedData[index + 1]?.value) && (
              <Box display="inline">
                {price.value - sortedData[index + 1]?.value > 0 && (
                  <Icon as={FaCaretUp} color="green.400" boxSize={'22px'} />
                )}
                {price.value - sortedData[index + 1]?.value < 0 && (
                  <Icon as={FaCaretDown} color="red.400" boxSize={'22px'} />
                )}
              </Box>
            )}
            {!(price.value - sortedData[index + 1]?.value) && <MinusIcon mr={1} boxSize="16px" />}
            <Text>{intl.format(price.value - sortedData[index + 1]?.value)} NP</Text>
          </Flex>
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
  );
};
