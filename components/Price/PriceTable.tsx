import {
  Table,
  TableContainer,
  Tbody,
  Td,
  Tr,
  Text,
  IconButton,
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
import Color from 'color';
import { isSameDay } from 'date-fns';

type PriceOrMarker = Partial<PriceData> & {
  marker?: boolean;
  title?: string;
  color?: string;
  slug?: string;
  addedAt?: string;
  markerType?: 'added-to' | 'available-at' | 'unavailable-at';
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
      const color = Color(list.colorHex ?? '#000');
      let date = list.createdAt;
      let markerType = 'added-to';

      if (list.seriesType === 'itemAddition' && list.itemInfo?.[0].addedAt)
        date = list.itemInfo?.[0].addedAt;

      if (list.seriesType === 'listDates' && list.seriesStart) {
        date = list.itemInfo?.[0].seriesStart || list.seriesStart;
        markerType = 'available-at';

        if (list.seriesEnd) {
          sorted.push({
            marker: true,
            title: list.name,
            slug: list.slug ?? '',
            addedAt: list.itemInfo?.[0].seriesEnd || list.seriesEnd,
            color: color.lightness(70).hex(),
            markerType: 'unavailable-at',
          });
        }
      }

      sorted.push({
        marker: true,
        title: list.name,
        slug: list.slug ?? '',
        addedAt: date,
        color: color.lightness(70).hex(),
        markerType: markerType as 'added-to' | 'available-at' | 'unavailable-at',
      });
    });

    return sorted.sort((a, b) => {
      const aDate = new Date(a.addedAt!);
      const bDate = new Date(b.addedAt!);

      if (isSameDay(aDate, bDate)) return b.marker ? -1 : 1;

      return bDate.getTime() - aDate.getTime();
    });
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
        <Td colSpan={1}>
          <Flex alignItems={'center'} gap={1}>
            <Icon as={MdLabel} color={price.color} />
            <Text>{t('ItemPage.' + price.markerType)}</Text>
          </Flex>
        </Td>
        <Td px={1} textAlign={'center'} whiteSpace={'normal'}>
          <Link as={NextLink} href={`/lists/official/${price.slug}`} color={price.color}>
            {price.title}
          </Link>
        </Td>
        <Td px={1}>
          {format.dateTime(new Date(price.addedAt!), {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Td>
        {isAdmin && <Td px={1}></Td>}
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
        {format.number(price.value!)} NP
      </Td>
      <Td px={1}>
        {!!nextPrice?.value && (
          <Flex alignItems={'center'}>
            {!!(price.value! - nextPrice?.value) && (
              <Flex
                display="inline-flex"
                flexFlow={'column'}
                justifyContent={'center'}
                alignItems={'center'}
              >
                {price.value! - nextPrice?.value > 0 && (
                  <Icon as={FaCaretUp} color="green.400" boxSize={'22px'} />
                )}
                {price.value! - nextPrice?.value < 0 && (
                  <Icon as={FaCaretDown} color="red.400" boxSize={'22px'} />
                )}
              </Flex>
            )}
            {!(price.value! - nextPrice?.value) && <MinusIcon mr={1} boxSize="16px" />}
            <Text>{format.number(price.value! - nextPrice?.value)} NP</Text>
            <Text
              ml={1}
              fontSize={'0.55rem'}
              color={price.value! > nextPrice?.value ? 'green.100' : 'red.200'}
              opacity={0.8}
            >
              {getPercentChange(price.value!, nextPrice.value!)}%
            </Text>
          </Flex>
        )}
      </Td>
      <Td px={1}>
        {format.dateTime(new Date(price.addedAt!), {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </Td>
      {isAdmin && (
        <Td px={1}>
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

const getPercentChange = (newPrice: number, oldPrice: number) => {
  const isPositive = newPrice - oldPrice > 0;
  const val = ((newPrice - oldPrice) / oldPrice) * 100;

  return `${isPositive ? '+' : ''}${val.toFixed(Math.abs(val) < 1 ? 1 : 0)}`;
};
