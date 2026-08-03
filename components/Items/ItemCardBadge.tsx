'use client';

/**
 * Badge for legacy `ItemData` cards / rows.
 * Not to be confused with `ItemCardBadgeV2` (`@components/Items/v2/ItemCardBadgeV2`).
 */
import { Badge, Icon, useMediaQuery } from '@chakra-ui/react';
import { AiFillInfoCircle, AiFillWarning } from 'react-icons/ai';
import { MdHelp, MdOutlineHourglassBottom } from 'react-icons/md';
import { useFormatter, useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useSyncExternalStore, type ReactElement, type ReactNode } from 'react';
import type { ItemData } from '@types';
import { isMallDiscounted } from '@components/Items/NCMallCard';

/** ~30-day months; same 6-month stale threshold as before, without date-fns. */
const MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;
const STALE_PRICE_MS = 6 * MS_PER_MONTH;

const noopSubscribe = () => () => {};

/** Wall-clock now on the client only — avoids Date.now() during prerender. */
function useClientNow() {
  return useSyncExternalStore(
    noopSubscribe,
    () => Date.now(),
    () => 0
  );
}

const ItemCardBadgeTooltip = dynamic(() => import('@components/Items/ItemCardBadgeTooltip'), {
  ssr: false,
});

export type ItemCardBadgeProps = {
  item?: ItemData;
  capValue?: number | null;
  odds?: number;
  isLE?: boolean;
  sortType?: string;
  profit?: number | null;
  /**
   * When false, never mount Tooltip wrappers (e.g. omni search).
   * Even when true, tooltips are skipped on `(hover: none)` devices.
   * @default true
   */
  interactive?: boolean;
};

function MaybeTooltip({
  enabled,
  content,
  children,
}: {
  enabled: boolean;
  content: ReactNode;
  children: ReactElement;
}) {
  if (!enabled) return children;
  return <ItemCardBadgeTooltip content={content}>{children}</ItemCardBadgeTooltip>;
}

export const ItemCardBadge = (props: ItemCardBadgeProps) => {
  const t = useTranslations();
  const format = useFormatter();
  const { item, capValue, odds, profit, isLE, sortType, interactive = true } = props;
  const [noHover] = useMediaQuery(['(hover: none)'], { fallback: [false] });
  const showTooltips = interactive && !noHover;
  const now = useClientNow();

  if (!item) return null;
  const isDiscounted = now > 0 && isMallDiscounted(item.mallData, now);
  const priceAgeMs =
    now > 0 && item.price.addedAt ? now - new Date(item.price.addedAt).getTime() : 0;
  const hasStalePriceBadge = now > 0 && priceAgeMs >= STALE_PRICE_MS;
  const priceAgeInMonths = Math.max(6, Math.floor(priceAgeMs / MS_PER_MONTH));

  return (
    <>
      {!hasStalePriceBadge && !!item.price.value && item.price.inflated && (
        <MaybeTooltip enabled={showTooltips} content={t('General.inflation')}>
          <Badge colorPalette="red" whiteSpace="normal" cursor="default">
            <Icon as={AiFillWarning} verticalAlign="middle" /> {format.number(item.price.value)} NP
          </Badge>
        </MaybeTooltip>
      )}

      {!hasStalePriceBadge && !!item.price.value && !item.price.inflated && (
        <Badge whiteSpace="normal">{format.number(item.price.value)} NP</Badge>
      )}

      {hasStalePriceBadge && item.price.value && (
        <MaybeTooltip
          enabled={showTooltips}
          content={t('ItemPage.last-known-price-x-months-ago', { x: priceAgeInMonths })}
        >
          <Badge colorPalette="orange" whiteSpace="normal" cursor="default">
            <Icon as={MdOutlineHourglassBottom} verticalAlign="middle" />
            {format.number(item.price.value)} NP
          </Badge>
        </MaybeTooltip>
      )}

      {item.type === 'np' && item.status === 'no trade' && <Badge>No Trade</Badge>}

      {item.type === 'pb' && <Badge colorPalette="yellow">PB</Badge>}

      {item.isNC && !capValue && !item.mallData && !item.ncValue && item.status !== 'no trade' && (
        <Badge colorPalette="purple">NC</Badge>
      )}

      {item.isNC && !capValue && !item.mallData && !item.ncValue && item.status === 'no trade' && (
        <Badge colorPalette="purple">NC - No Trade</Badge>
      )}

      {item.isNC && item.ncValue && !capValue && !item.mallData && (
        <Badge
          colorPalette={item.ncValue.source === 'lebron' ? 'yellow' : 'purple'}
          whiteSpace="normal"
        >
          {item.ncValue.range} Caps
        </Badge>
      )}

      {item.isNC && item.mallData && (
        <Badge colorPalette={isDiscounted ? 'orange' : 'purple'} whiteSpace="normal">
          {item.mallData.price > 0 &&
            `${format.number(
              isDiscounted ? (item.mallData.discountPrice ?? -1) : item.mallData.price
            )} NC`}
          {item.mallData.price === 0 && t('ItemPage.free')}
        </Badge>
      )}

      {item.isNC && Number(capValue) > 0 && (
        <MaybeTooltip enabled={showTooltips} content="User Asking Price in GBCs - Not Official">
          <Badge colorPalette="purple" whiteSpace="normal" cursor="default">
            <Icon as={AiFillInfoCircle} verticalAlign="middle" /> NC - {capValue} CAPS
          </Badge>
        </MaybeTooltip>
      )}

      {!!odds && (
        <Badge colorPalette={isLE ? 'green' : 'white'} whiteSpace="pre-wrap" textAlign={'center'}>
          {isLE ? 'LE' : ''} {odds.toFixed(2)}%
        </Badge>
      )}

      {sortType === 'profit' && !!profit && (
        <>
          {profit <= 1000 && (
            <MaybeTooltip
              enabled={showTooltips}
              content={
                profit > 0
                  ? t('Restock.estimated-profit-is-less-than')
                  : t('Restock.estimated-loss')
              }
            >
              <Badge
                colorPalette="red"
                display="flex"
                alignItems={'center'}
                gap={1}
                cursor="default"
              >
                {format.number(profit)} NP <MdHelp size={'0.7rem'} />
              </Badge>
            </MaybeTooltip>
          )}
          {profit > 1000 && (
            <MaybeTooltip enabled={showTooltips} content={t('Restock.estimated-profit')}>
              <Badge
                colorPalette="green"
                display="flex"
                alignItems={'center'}
                gap={1}
                cursor="default"
              >
                {format.number(profit)} NP <MdHelp size={'0.7rem'} />
              </Badge>
            </MaybeTooltip>
          )}
        </>
      )}
    </>
  );
};
