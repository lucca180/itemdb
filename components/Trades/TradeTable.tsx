import { Box, Text, Separator, Flex, Link, Badge, Tooltip, IconButton } from '@chakra-ui/react';
import { ItemData, TradeData } from '@types';
import Image from 'next/image';
import { genItemKey, slugify } from '@utils/utils';
import MainLink from '@components/Utils/MainLink';
import { useFormatter, useTranslations } from 'next-intl';
import { FaFlag } from 'react-icons/fa';
import { TradeRelisting } from '@components/Trades/TradeRelisting';

type Props = {
  data: TradeData;
  featuredItem?: ItemData;
  isAuto?: boolean;
  onReport?: () => void;
};

const TradeTable = (props: Props) => {
  const t = useTranslations();
  const format = useFormatter();
  const { data, featuredItem } = props;

  return (
    <Flex flexFlow="column" w="100%" flex={1} mb={3}>
      <Flex flexFlow="column">
        <Flex justifyContent={'space-between'} alignItems={'center'}>
          <Box fontSize="xs" px={3} py={2}>
            {props.isAuto && (
              <Tooltip.Root positioning={{ placement: 'top' }}>
                <Tooltip.Trigger asChild>
                  <Badge colorPalette="blue" fontSize={'11px'} size="xs" mr={1} cursor="default">
                    Auto
                  </Badge>
                </Tooltip.Trigger>
                <Tooltip.Positioner>
                  <Tooltip.Content>{t('Feedback.this-trade-was-auto-priced')}</Tooltip.Content>
                </Tooltip.Positioner>
              </Tooltip.Root>
            )}
            <Text
              color="gray.200"
              display="inline-flex"
              justifyContent={'center'}
              alignItems={'center'}
              gap={1}
            >
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
          {!!props.onReport && !props.isAuto && (
            <IconButton
              aria-label="Report Trade"
              onClick={props.onReport}
              size={'xs'}
              colorPalette="red"
              variant={'ghost'}
            >
              <FaFlag />
            </IconButton>
          )}
        </Flex>
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
              <Link asChild>
                <MainLink href={`/item/${slugify(item.name)}`} prefetch={false}>
                  <Image src={item.image} width={50} height={50} alt="" />
                </MainLink>
              </Link>
            </Flex>
            <Flex flexFlow="column" justifyContent="center">
              <Text wordBreak={'break-word'} whiteSpace={'pre-line'} fontSize="sm">
                {item.amount > 1 && (
                  <Badge mr={1} colorPalette="yellow" textTransform={'none'}>
                    {item.amount}x
                  </Badge>
                )}
                <Link asChild>
                  <MainLink href={`/item/${slugify(item.name)}`} prefetch={false}>
                    {item.name}
                  </MainLink>
                </Link>
              </Text>
              {item.price && (
                <Text fontSize="xs" opacity="0.8">
                  {format.number(item.price)} NP
                </Text>
              )}
              {data.priced && !item.price && (
                <Text fontSize="xs" opacity="0.8" fontStyle="italic">
                  {t('ItemPage.unspecified-price')}
                </Text>
              )}
              {item.relisting && (
                <TradeRelisting
                  disclaimer={t('ItemPage.relisting-disclaimer')}
                  history={item.relisting.history.map((entry) => ({
                    date: format.dateTime(new Date(entry.date), {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }),
                    price:
                      entry.price === null
                        ? t('ItemPage.unspecified-price')
                        : `${format.number(entry.price)} NP`,
                  }))}
                  label={t('ItemPage.relisting-history', {
                    count: item.relisting.history.length,
                    date: format.dateTime(new Date(item.relisting.since), {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }),
                  })}
                />
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
          {!!data.instantBuy && (
            <Text mb={2}>
              <Badge colorPalette="orange">Instant Buy - {format.number(data.instantBuy)} NP</Badge>
            </Text>
          )}
          <b>{t('ItemPage.wishlist')}</b>
          <Text>{data.wishlist}</Text>
        </Flex>
      </Flex>
      <Separator mt={4} />
    </Flex>
  );
};

export default TradeTable;
