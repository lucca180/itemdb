import { Box, Text, Divider, Flex, Link } from '@chakra-ui/react';
import React from 'react';
import { ItemData, TradeData } from '../../types';
import Image from 'next/image';
import { genItemKey, slugify } from '../../utils/utils';
import NextLink from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';

type Props = {
  data: TradeData;
  featuredItem?: ItemData;
};

const intl = new Intl.NumberFormat();

const TradeTable = (props: Props) => {
  const t = useTranslations();
  const format = useFormatter();
  const { data, featuredItem } = props;
  return (
    <Flex flexFlow="column" w="100%" flex={1} mb={3}>
      <Flex flexFlow="column">
        <Box fontSize="xs" px={3} py={2}>
          <Text color="gray.200">
            <b>
              {t('ItemPage.lot')} {data.trade_id}
            </b>{' '}
            | {t('ItemPage.owned-by')} {data.owner}
          </Text>
          <Text color="gray.300">
            {t('ItemPage.seen-at')}{' '}
            {format.dateTime(new Date(data.addedAt), {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </Box>
        {data.items.map((item) => (
          <Flex
            px={3}
            py={2}
            gap={2}
            key={item.order}
            bg={
              featuredItem && genItemKey(featuredItem, true) === genItemKey(item, true)
                ? 'gray.700'
                : ''
            }
          >
            <Flex w={50} flexShrink="0" justifyContent="center" alignItems="center">
              <Link as={NextLink} href={`/item/${slugify(item.name)}`} prefetch={false}>
                <Image src={item.image} width={50} height={50} alt={item.name} />
              </Link>
            </Flex>
            <Flex flexFlow="column" justifyContent="center">
              <Text wordBreak={'break-word'} whiteSpace={'pre-line'} fontSize="sm">
                <Link as={NextLink} href={`/item/${slugify(item.name)}`} prefetch={false}>
                  {item.name}
                </Link>
              </Text>
              {item.price && (
                <Text fontSize="xs" opacity="0.8">
                  {intl.format(item.price)} NP
                </Text>
              )}
              {data.priced && !item.price && (
                <Text fontSize="xs" opacity="0.8" fontStyle="italic">
                  {t('ItemPage.unspecified-price')}
                </Text>
              )}
            </Flex>
          </Flex>
        ))}
        <Flex
          textAlign="center"
          fontSize="xs"
          wordBreak={'break-word'}
          whiteSpace={'pre-line'}
          flexFlow="column"
          p={2}
        >
          <b>{t('ItemPage.wishlist')}</b>
          <Text>{data.wishlist}</Text>
        </Flex>
      </Flex>
      <Divider mt={4} />
    </Flex>
  );
};

export default TradeTable;
