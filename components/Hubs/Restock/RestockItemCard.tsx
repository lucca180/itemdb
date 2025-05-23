import { Badge, Flex, Link, Text, Image, HStack, Tooltip } from '@chakra-ui/react';
import Color from 'color';
import NextLink from 'next/link';
import { ItemData, RestockSession } from '../../../types';
import { getRestockProfitOnDate, msIntervalFormatted } from '../../../utils/utils';
import { differenceInMilliseconds } from 'date-fns';
import { useFormatter, useTranslations } from 'next-intl';
import { MdHelp } from 'react-icons/md';
import { useMemo } from 'react';

type Props = {
  item: ItemData;
  clickData: RestockSession['clicks'][0];
  restockItem: RestockSession['items'][0];
  disablePrefetch?: boolean;
};

const RestockItem = (props: Props) => {
  const t = useTranslations();
  const format = useFormatter();

  const { item, clickData, restockItem, disablePrefetch } = props;
  const rgb = Color(item.color.hex).rgb().array();

  const profit = useMemo(() => {
    if (clickData.buy_price && item.price.value) {
      return item.price.value - clickData.buy_price;
    } else if (clickData.buy_timestamp && item.price.value) {
      return getRestockProfitOnDate(item, clickData.buy_timestamp);
    }
    return null;
  }, [item, clickData]);

  const isBait = profit && profit <= 0;

  const boughtTime = restockItem
    ? differenceInMilliseconds(
        new Date(clickData.buy_timestamp ?? 0),
        new Date(restockItem.timestamp)
      )
    : -1;

  const lostHaggle = restockItem
    ? differenceInMilliseconds(
        new Date(clickData.haggle_timestamp ?? 0),
        new Date(restockItem.timestamp)
      )
    : -1;

  const lostNoHaggle = restockItem
    ? differenceInMilliseconds(
        new Date(clickData.soldOut_timestamp ?? 0),
        new Date(restockItem.timestamp)
      )
    : -1;

  return (
    <Link
      as={NextLink}
      prefetch={!disablePrefetch ? undefined : false}
      href={'/item/' + (item.slug ?? item.internal_id)}
      _hover={{ textDecoration: 'none' }}
    >
      <Flex
        bg="gray.700"
        p={2}
        bgGradient={`linear(to-r, rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5), rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.35) 99%)`}
        borderRadius={'md'}
        boxShadow={'md'}
        gap={2}
      >
        <Image
          src={item.image}
          alt={item.name}
          boxSize="50px"
          objectFit="cover"
          borderRadius="md"
        />
        <Flex
          alignItems={'flex-start'}
          gap={1}
          flexFlow={'column'}
          justifyContent={'center'}
          textAlign={'left'}
        >
          <HStack>
            <Text as="span" fontSize={'md'}>
              {item.name}
            </Text>
            {item.price.value && <Badge>{format.number(item.price.value)} NP</Badge>}
            {isBait && (
              <Tooltip
                hasArrow
                label={
                  profit > 0
                    ? t('Restock.estimated-profit-is-less-than')
                    : t('Restock.estimated-loss')
                }
                // bg="gray.700"
                placement="top"
                // color="white"
              >
                <Badge colorScheme="red" display="flex" alignItems={'center'} gap={1}>
                  {format.number(profit)} NP <MdHelp size={'0.7rem'} />
                </Badge>
              </Tooltip>
            )}
          </HStack>

          {boughtTime > 0 && (
            <Text as="span" fontSize={'xs'}>
              {t.rich('Restock.bought-in-x-at-y', {
                b: (children) => <b>{children}</b>,
                x: restockItem.notTrust ? '???' : msIntervalFormatted(boughtTime, true, 2),
                y:
                  format.dateTime(clickData.buy_timestamp ?? 0, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    timeZone: 'America/Los_Angeles',
                  }) + ' NST',
              })}
            </Text>
          )}

          {boughtTime < 0 && lostHaggle > 0 && (
            <Text as="span" fontSize={'xs'}>
              {t.rich('Restock.lost-haggling', {
                b: (children) => <b>{children}</b>,
                x: restockItem.notTrust ? '???' : msIntervalFormatted(lostHaggle, true, 2),
                y:
                  format.dateTime(clickData.haggle_timestamp ?? 0, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    timeZone: 'America/Los_Angeles',
                  }) + ' NST',
              })}
            </Text>
          )}

          {boughtTime < 0 && lostHaggle < 0 && lostNoHaggle > 0 && (
            <Text as="span" fontSize={'xs'}>
              {t.rich('Restock.lost-no-haggle', {
                b: (children) => <b>{children}</b>,
                x: restockItem.notTrust ? '???' : msIntervalFormatted(lostNoHaggle, true, 2),
                y:
                  format.dateTime(clickData.soldOut_timestamp ?? 0, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    timeZone: 'America/Los_Angeles',
                  }) + ' NST',
              })}
            </Text>
          )}
        </Flex>
      </Flex>
    </Link>
  );
};

export default RestockItem;
