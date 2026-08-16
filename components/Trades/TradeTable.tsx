'use client';

import { Fragment, useState } from 'react';
import {
  Box,
  Button,
  Text,
  Separator,
  Flex,
  Link,
  Badge,
  Tooltip,
  IconButton,
} from '@chakra-ui/react';
import { ItemData, TradeData } from '@types';
import Image from 'next/image';
import { slugify } from '@utils/utils';
import MainLink from '@components/Utils/MainLink';
import { useFormatter, useTranslations } from 'next-intl';
import { useAuth } from '@utils/auth';
import { FaFlag, FaPen } from 'react-icons/fa';
import { TradeRelisting } from '@components/Trades/TradeRelisting';
import {
  TRADE_LOT_VISIBLE_LIMIT,
  isFeaturedTradeItem,
  visibleTradeItems,
} from '@components/Trades/visibleTradeItems';

type Props = {
  data: TradeData;
  featuredItem?: ItemData;
  collapseItems?: boolean;
  isAuto?: boolean;
  onReport?: () => void;
  showAdminEdit?: boolean;
};

function HiddenItemsGap({ count }: { count: number }) {
  return (
    <Flex alignItems="center" gap={2} px={3} py={1.5} color="whiteAlpha.700">
      <Separator flex="1" borderColor="whiteAlpha.400" />
      <Text fontSize="lg" lineHeight="1">
        …
      </Text>
      <Badge size="xs" variant="surface" colorPalette="gray">
        +{count}
      </Badge>
      <Separator flex="1" borderColor="whiteAlpha.400" />
    </Flex>
  );
}

const TradeTable = (props: Props) => {
  const t = useTranslations();
  const format = useFormatter();
  const { user } = useAuth();
  const { data, featuredItem } = props;
  const [expanded, setExpanded] = useState(false);
  const canCollapse = !!props.collapseItems && data.items.length > TRADE_LOT_VISIBLE_LIMIT;
  const items = expanded || !canCollapse ? data.items : visibleTradeItems(data.items, featuredItem);
  const indexedItems = items.map((item) => ({
    item,
    sourceIndex: data.items.indexOf(item),
  }));
  const hiddenCount = data.items.length - items.length;

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
          {(!!props.onReport && !props.isAuto) || (props.showAdminEdit && user?.isAdmin) ? (
            <Flex gap={1} pr={2}>
              {props.showAdminEdit && user?.isAdmin && (
                <IconButton
                  aria-label="Edit trade prices"
                  size="2xs"
                  variant="ghost"
                  onClick={() => {
                    window.open(`/feedback/trades?admin_edit_id=${data.trade_id}`, '_blank');
                  }}
                  p={0}
                >
                  <FaPen />
                </IconButton>
              )}
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
          ) : null}
        </Flex>
        {indexedItems.map(({ item, sourceIndex }, displayIndex) => {
          const previousSourceIndex =
            displayIndex === 0 ? -1 : indexedItems[displayIndex - 1].sourceIndex;
          const omittedBefore = sourceIndex - previousSourceIndex - 1;

          return (
            <Fragment key={item.order}>
              {!expanded && omittedBefore > 0 && <HiddenItemsGap count={omittedBefore} />}
              <Flex
                px={3}
                py={2}
                gap={2}
                bg={isFeaturedTradeItem(item, featuredItem) ? 'gray.700' : ''}
              >
                {props.collapseItems && (
                  <Badge
                    size="xs"
                    minW={4}
                    h={4}
                    px={1}
                    fontSize="2xs"
                    alignSelf="center"
                    justifyContent="center"
                    borderRadius="full"
                    variant="surface"
                    colorPalette="gray"
                  >
                    {sourceIndex + 1}
                  </Badge>
                )}
                <Flex w={50} flexShrink="0" justifyContent="center" alignItems="center">
                  <Link asChild>
                    <MainLink href={`/item/${slugify(item.name)}`} prefetch={false}>
                      <Image src={item.image} unoptimized width={50} height={50} alt="" />
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
            </Fragment>
          );
        })}
        {!expanded &&
          indexedItems.length > 0 &&
          indexedItems[indexedItems.length - 1].sourceIndex < data.items.length - 1 && (
            <HiddenItemsGap
              count={data.items.length - indexedItems[indexedItems.length - 1].sourceIndex - 1}
            />
          )}
        {canCollapse && (
          <Button
            size="xs"
            variant="subtle"
            mx={3}
            mt={1}
            mb={2}
            aria-expanded={expanded}
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? t('ItemPage.show-less') : `${t('ItemPage.show-more')} (${hiddenCount})`}
          </Button>
        )}
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
