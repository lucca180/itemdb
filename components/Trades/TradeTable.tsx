'use client';

import { Fragment, useState } from 'react';
import { Button, Flex, Badge, Tooltip, IconButton } from '@chakra-ui/react';
import { ItemData, TradeData } from '@types';
import { slugify } from '@utils/utils';
import MainLink from '@components/Utils/MainLink';
import { useFormatter, useTranslations } from 'next-intl';
import { useAuth } from '@utils/auth';
import { FaFlag, FaPen } from 'react-icons/fa';
import { ListingRelistingBadge } from '@components/Trades/TradeRelisting';
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

/** Same styles as Chakra's `Link` recipe (plain variant), applied to the plain item anchors. */
const LINK_CSS = {
  display: 'inline-flex',
  alignItems: 'center',
  outline: 'none',
  gap: '1.5',
  cursor: 'pointer',
  borderRadius: 'l1',
  focusVisibleRing: 'outside',
  color: 'colorPalette.fg',
  _hover: {
    textDecoration: 'underline',
    textUnderlineOffset: '3px',
    textDecorationColor: 'currentColor/20',
  },
};

const SEPARATOR_LINE_CSS = { display: 'block', borderTop: '1px solid' };

/**
 * Lot styling lives in static selectors so each trade row renders plain elements instead of
 * ~8 Chakra components (Flex/Text/Link/Separator) that each resolve style props on every render.
 */
const TRADE_TABLE_CSS = {
  '& [data-trade-body]': { display: 'flex', flexDirection: 'column' },
  '& [data-trade-header]': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  '& [data-trade-meta]': { fontSize: 'xs', px: 3, py: 2 },
  '& [data-trade-lot]': {
    color: 'gray.200',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
  },
  '& [data-trade-seen]': { color: 'gray.300' },
  '& [data-trade-actions]': { display: 'flex', gap: 1, pr: 2 },
  '& [data-trade-item]': { display: 'flex', px: 3, py: 2, gap: 2 },
  '& [data-trade-item][data-featured]': { bg: 'gray.700' },
  '& [data-trade-thumb]': {
    display: 'flex',
    w: '50px',
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  '& [data-trade-info]': { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  '& [data-trade-name]': { wordBreak: 'break-word', whiteSpace: 'pre-line', fontSize: 'sm' },
  '& [data-trade-thumb] > a, & [data-trade-name] > a': LINK_CSS,
  '& [data-trade-price]': { fontSize: 'xs', opacity: 0.8 },
  '& [data-trade-price][data-unspecified]': { fontStyle: 'italic' },
  '& [data-trade-gap]': {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    px: 3,
    py: 1.5,
    color: 'whiteAlpha.700',
  },
  '& [data-trade-gap-line]': { ...SEPARATOR_LINE_CSS, flex: 1, borderColor: 'whiteAlpha.400' },
  '& [data-trade-gap-dots]': { fontSize: 'lg', lineHeight: '1' },
  '& [data-trade-footer]': {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'center',
    fontSize: 'xs',
    wordBreak: 'break-word',
    whiteSpace: 'pre-line',
    p: 2,
  },
  '& [data-trade-instant]': { mb: 2 },
  '& [data-trade-separator]': { ...SEPARATOR_LINE_CSS, mt: 4, borderColor: 'border' },
};

function HiddenItemsGap({ count }: { count: number }) {
  return (
    <div data-trade-gap>
      <span data-trade-gap-line />
      <span data-trade-gap-dots>…</span>
      <Badge size="xs" variant="surface" colorPalette="gray">
        +{count}
      </Badge>
      <span data-trade-gap-line />
    </div>
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
    <Flex flexFlow="column" w="100%" flex={1} mb={3} css={TRADE_TABLE_CSS}>
      <div data-trade-body>
        <div data-trade-header>
          <div data-trade-meta>
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
            <span data-trade-lot>
              <b>
                {t('ItemPage.lot')} {data.trade_id}
              </b>{' '}
              | {t('ItemPage.owned-by')} {data.owner}
            </span>
            <div data-trade-seen>
              {t('ItemPage.seen-at')}{' '}
              {format.dateTime(new Date(data.addedAt), {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
          </div>
          {!!props.onReport || (props.showAdminEdit && user?.isAdmin) ? (
            <div data-trade-actions>
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
              {!!props.onReport && (
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
            </div>
          ) : null}
        </div>
        {indexedItems.map(({ item, sourceIndex }, displayIndex) => {
          const previousSourceIndex =
            displayIndex === 0 ? -1 : indexedItems[displayIndex - 1].sourceIndex;
          const omittedBefore = sourceIndex - previousSourceIndex - 1;
          const itemHref = `/item/${slugify(item.name)}`;

          return (
            <Fragment key={item.order}>
              {!expanded && omittedBefore > 0 && <HiddenItemsGap count={omittedBefore} />}
              <div
                data-trade-item
                data-featured={isFeaturedTradeItem(item, featuredItem) || undefined}
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
                <div data-trade-thumb>
                  <MainLink href={itemHref} prefetch={false}>
                    {/* Fixed 50px thumbnails: next/image is `unoptimized` here anyway, and
                        getImgProps showed up in SSR profiles. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image}
                      width={50}
                      height={50}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  </MainLink>
                </div>
                <div data-trade-info>
                  <div data-trade-name>
                    {item.amount > 1 && (
                      <Badge mr={1} colorPalette="yellow" textTransform={'none'}>
                        {item.amount}x
                      </Badge>
                    )}
                    <MainLink href={itemHref} prefetch={false}>
                      {item.name}
                    </MainLink>
                  </div>
                  {item.price && <div data-trade-price>{format.number(item.price)} NP</div>}
                  {data.priced && !item.price && (
                    <div data-trade-price data-unspecified>
                      {t('ItemPage.unspecified-price')}
                    </div>
                  )}
                  {item.relisting && <ListingRelistingBadge relisting={item.relisting} />}
                </div>
              </div>
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
        <div data-trade-footer>
          {!!data.instantBuy && (
            <div data-trade-instant>
              <Badge colorPalette="orange">Instant Buy - {format.number(data.instantBuy)} NP</Badge>
            </div>
          )}
          <b>{t('ItemPage.wishlist')}</b>
          <div>{data.wishlist}</div>
        </div>
      </div>
      <div data-trade-separator />
    </Flex>
  );
};

export default TradeTable;
