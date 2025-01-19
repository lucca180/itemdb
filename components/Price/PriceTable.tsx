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
  Link,
} from '@chakra-ui/react';
import React, { useMemo } from 'react';
import { PriceData, UserList } from '../../types';
import { MinusIcon } from '@chakra-ui/icons';
import { useFormatter, useTranslations } from 'next-intl';
import { FiEdit } from 'react-icons/fi';
import { FaCaretDown, FaCaretUp } from 'react-icons/fa';
import { MdLabel } from 'react-icons/md';
import NextLink from 'next/link';

const intl = new Intl.NumberFormat();

type PriceOrMarker = Partial<PriceData> & {
  marker?: boolean;
  title?: string;
  color?: string;
  slug?: string;
  addedAt?: string;
};

type Props = {
  showMarkerLabel?: boolean;
  data: PriceData[];
  lists?: UserList[];
  isAdmin?: boolean;
  onEdit?: (price: PriceData) => void;
};

const PriceTable = (props: Props) => {
  const { lists, data, isAdmin, onEdit } = props;

  const sortedData: PriceOrMarker[] = useMemo(() => {
    const sorted: PriceOrMarker[] = [...data];

    lists?.map((list) => {
      if (!list.seriesType) return;

      const date =
        list.seriesType === 'listCreation'
          ? new Date(list.createdAt).toISOString().split('T')[0]
          : new Date(list.itemInfo?.[0].addedAt ?? 0).toISOString().split('T')[0];

      sorted.push({
        marker: true,
        title: list.name,
        slug: list.slug ?? '',
        addedAt: date,
        color: list.colorHex ?? '',
      });
    });

    return sorted.sort((a, b) => new Date(b.addedAt!).getTime() - new Date(a.addedAt!).getTime());
  }, [data, lists]);

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
              lists={lists}
              showMarkerLabel={props.showMarkerLabel}
            />
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default PriceTable;

const PriceItem = (
  props: Omit<Props, 'data'> & {
    data: PriceOrMarker[];
    price: PriceOrMarker;
    index: number;
  }
) => {
  const { price, data: sortedData, index, isAdmin, onEdit } = props;
  const format = useFormatter();
  const t = useTranslations();

  const nextPrice = useMemo(() => {
    let nextIndex = index + 1;
    let next = sortedData[nextIndex];
    while (next && next.marker) {
      nextIndex++;
      next = sortedData[nextIndex];
    }

    return next as PriceData | undefined;
  }, [sortedData, index]);

  const isMarker = price.marker;
  if (isMarker && !props.showMarkerLabel) return null;

  if (isMarker)
    return (
      <Tr key={price.addedAt} h={42}>
        <Td colSpan={2}>
          <Flex alignItems={'center'} gap={1}>
            <Icon as={MdLabel} color={price.color} />
            <Text>
              {t.rich('ItemPage.added-to', {
                List: () => (
                  <Link as={NextLink} href={`/lists/official/${price.slug}`} color={price.color}>
                    {price.title}
                  </Link>
                ),
              })}
            </Text>
          </Flex>
        </Td>
        <Td>
          {format.dateTime(new Date(price.addedAt!), {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Td>
        {isAdmin && <Td></Td>}
      </Tr>
    );

  return (
    <Tr key={price.addedAt}>
      <Td>
        {price.inflated && (
          <Text fontWeight="bold" color="red.400">
            {t('General.inflation')}!
          </Text>
        )}
        {intl.format(price.value!)} NP
      </Td>
      <Td>
        {!!nextPrice?.value && (
          <Flex alignItems={'center'}>
            {!!(price.value! - nextPrice?.value) && (
              <Box display="inline">
                {price.value! - nextPrice?.value > 0 && (
                  <Icon as={FaCaretUp} color="green.400" boxSize={'22px'} />
                )}
                {price.value! - nextPrice?.value < 0 && (
                  <Icon as={FaCaretDown} color="red.400" boxSize={'22px'} />
                )}
              </Box>
            )}
            {!(price.value! - nextPrice?.value) && <MinusIcon mr={1} boxSize="16px" />}
            <Text>{intl.format(price.value! - nextPrice?.value)} NP</Text>
          </Flex>
        )}
      </Td>
      <Td>
        {format.dateTime(new Date(price.addedAt!), {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </Td>
      {isAdmin && (
        <Td>
          {' '}
          <IconButton
            onClick={() => onEdit?.(price as PriceData)}
            size="xs"
            aria-label="Edit"
            icon={<FiEdit />}
          />
        </Td>
      )}
    </Tr>
  );
};
