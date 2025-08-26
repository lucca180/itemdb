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
  Box,
  Badge,
} from '@chakra-ui/react';
import React, { useMemo } from 'react';
import { ItemData, PriceData, UserList } from '../../types';
import { MinusIcon } from '@chakra-ui/icons';
import { useFormatter, useTranslations } from 'next-intl';
import { BiEditAlt } from 'react-icons/bi';
import { FaCaretDown, FaCaretUp } from 'react-icons/fa';
import Color from 'color';
import { isSameDay } from 'date-fns';
import dynamic from 'next/dynamic';
import MainLink from '@components/Utils/MainLink';

const Markdown = dynamic(() => import('../Utils/Markdown'));

type PriceOrMarker = Partial<PriceData> & {
  marker?: boolean;
  title?: string;
  color?: string;
  slug?: string;
  addedAt?: string;
  hasEnding?: boolean;
  markerType?: 'added-to' | 'available-at' | 'unavailable-at';
};

type Props = {
  data: PriceData[];
  color: string;
  lists?: UserList[];
  isAdmin?: boolean;
  onEdit?: (price: PriceData) => void;
  item: ItemData;
};

const PriceTable = (props: Props) => {
  const { lists, data, isAdmin, onEdit, item } = props;

  const linkColor = Color(props.color).alpha(0.8).lightness(70).hexa();

  const sortedData: PriceOrMarker[] = useMemo(() => {
    const sorted: PriceOrMarker[] = [...data];
    const itemAdded = new Date(item.firstSeen ?? 0);

    lists?.map((list) => {
      if (!list.seriesType) return;

      const color = Color(list.colorHex ?? '#000')
        .lightness(70)
        .hex();

      let date = list.createdAt;
      let markerType = 'added-to';

      if (list.seriesType === 'itemAddition' && list.itemInfo?.[0].addedAt)
        date = list.itemInfo?.[0].addedAt;

      let hasEnding = false;

      if (list.seriesType === 'listDates' && list.seriesStart) {
        date = list.itemInfo?.[0].seriesStart || list.seriesStart;
        markerType = 'available-at';

        if (list.seriesEnd) {
          const endDate = list.itemInfo?.[0].seriesEnd || list.seriesEnd;

          if (new Date(endDate) < itemAdded) return;

          hasEnding = true;

          sorted.push({
            marker: true,
            title: list.name,
            slug: list.slug ?? '',
            hasEnding: true,
            addedAt: list.itemInfo?.[0].seriesEnd || list.seriesEnd,
            color: color,
            markerType: 'unavailable-at',
          });
        }
      }

      date = dateMax(itemAdded, new Date(date)).toJSON();

      sorted.push({
        marker: true,
        title: list.name,
        slug: list.slug ?? '',
        addedAt: date,
        color: color,
        hasEnding: hasEnding,
        markerType: markerType as 'added-to' | 'available-at' | 'unavailable-at',
      });
    });

    sorted.sort((a, b) => {
      const aDate = new Date(a.addedAt!);
      const bDate = new Date(b.addedAt!);

      if (isSameDay(aDate, bDate)) return b.marker ? -1 : 1;

      return bDate.getTime() - aDate.getTime();
    });

    let markerColor = '';
    sorted.forEach((item) => {
      if (!item.marker && markerColor) item.color = markerColor;

      if (markerColor && item.marker && markerColor === item.color) {
        markerColor = '';
        return;
      }

      if (!markerColor && item.marker && item.hasEnding) {
        markerColor = item.color!;
        return;
      }
    });

    return sorted;
  }, [data, lists]);

  return (
    <TableContainer
      minH={{ base: 100 }}
      maxH={{ base: 200, md: 300 }}
      w="100%"
      borderRadius="sm"
      overflowX="auto"
      overflowY="auto"
      sx={{ a: { color: linkColor } }}
    >
      <Table h="100%" size="sm" sx={{ td: { border: 0 } }}>
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
            />
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
};

export default PriceTable;

const PriceItem = (
  props: Omit<Props, 'data' | 'color' | 'item'> & {
    data: PriceOrMarker[];
    price: PriceOrMarker;
    index: number;
  }
) => {
  const { price, data: sortedData, index, isAdmin, onEdit } = props;
  const format = useFormatter();
  const t = useTranslations();

  const bgColor = index % 2 === 0 ? 'blackAlpha.400' : 'transparent';

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

  if (isMarker)
    return (
      <Tr key={price.addedAt} h={42} bg={bgColor} borderLeft={`3px solid ${price.color}85`}>
        <Td colSpan={isAdmin ? 4 : 3} border={0}>
          <Flex flexFlow={'column'} alignItems={'center'} gap={2}>
            <Badge>
              <MarkerText markerType={price.markerType} />
            </Badge>
            <Link
              as={MainLink}
              trackEvent="price-marker"
              trackEventLabel={price.slug}
              href={`/lists/official/${price.slug}`}
              sx={{ color: price.color + ' !important' }}
            >
              {price.title}
            </Link>
            <Text fontSize={'xs'}>
              {format.dateTime(new Date(price.addedAt!), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </Flex>
        </Td>
      </Tr>
    );

  return (
    <React.Fragment key={price.addedAt}>
      <Tr
        key={price.addedAt}
        bg={bgColor}
        border={0}
        borderLeft={price.color ? `3px solid ${price.color}85` : undefined}
      >
        <Td>
          <Flex alignItems={'center'}>
            <Flex flexFlow={'column'}>
              {price.inflated && (
                <Text fontWeight="bold" color="red.400">
                  {t('General.inflation')}!
                </Text>
              )}
              {format.number(price.value!)} NP
            </Flex>
          </Flex>
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
              icon={<BiEditAlt />}
            />
          </Td>
        )}
      </Tr>
      {!!price.context && (
        <Tr bg={bgColor} border={0}>
          <Td colSpan={4}>
            <Box
              whiteSpace={'normal'}
              fontSize={'0.8rem'}
              color={'whiteAlpha.700'}
              fontStyle={'italic'}
              textAlign={'center'}
            >
              <Markdown>{price.context}</Markdown>
            </Box>
          </Td>
        </Tr>
      )}
    </React.Fragment>
  );
};

const getPercentChange = (newPrice: number, oldPrice: number) => {
  const isPositive = newPrice - oldPrice > 0;
  const val = ((newPrice - oldPrice) / oldPrice) * 100;

  return `${isPositive ? '+' : ''}${val.toFixed(Math.abs(val) < 1 ? 1 : 0)}`;
};

const MarkerText = (props: { markerType?: 'added-to' | 'available-at' | 'unavailable-at' }) => {
  const t = useTranslations();
  switch (props.markerType) {
    case 'added-to':
      return t('ItemPage.added-to');
    case 'available-at':
      return t('ItemPage.available-at');
    case 'unavailable-at':
      return t('ItemPage.unavailable-at');
    default:
      return '';
  }
};

const dateMax = (...dates: Date[]) => {
  return dates.reduce((max, date) => (date > max ? date : max), new Date(0));
};
