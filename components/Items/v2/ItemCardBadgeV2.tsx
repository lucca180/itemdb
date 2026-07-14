'use client';

import { Badge, Icon, Tooltip } from '@chakra-ui/react';
import { differenceInMonths } from 'date-fns';
import { AiFillInfoCircle, AiFillWarning } from 'react-icons/ai';
import { MdHelp, MdOutlineHourglassBottom } from 'react-icons/md';
import { useFormatter, useTranslations } from 'next-intl';
import type { ItemV2For } from '@types';
import { isMallDiscounted } from '@components/Items/NCMallCard';

export type ItemCardBadgeV2Props = {
  item?: ItemV2For<'card'>;
  capValue?: number | null;
  odds?: number;
  isLE?: boolean;
  sortType?: string;
  profit?: number | null;
};

export const ItemCardBadgeV2 = (props: ItemCardBadgeV2Props) => {
  const t = useTranslations();
  const format = useFormatter();
  const { item, capValue, odds, profit, isLE, sortType } = props;

  if (!item) return null;

  const npPrice = item.price?.type === 'np' ? item.price : null;
  const ncMall = item.price?.type === 'ncMall' ? item.price : null;
  const ncValue = item.price?.type === 'ncValue' ? item.price : null;
  const isNc = item.type === 'nc';
  const isDiscounted = isMallDiscounted(ncMall);
  const priceAgeInMonths = npPrice?.addedAt
    ? differenceInMonths(new Date(), new Date(npPrice.addedAt))
    : 0;
  const hasStalePriceBadge = !!npPrice?.flags.includes('outdated') || priceAgeInMonths >= 6;
  const isInflated = !!npPrice?.flags.includes('inflation');

  return (
    <>
      {!hasStalePriceBadge && !!npPrice?.value && isInflated && (
        <Tooltip.Root positioning={{ placement: 'top' }}>
          <Tooltip.Trigger asChild>
            <Badge colorPalette="red" whiteSpace="normal" cursor="default">
              <Icon as={AiFillWarning} verticalAlign="middle" /> {format.number(npPrice.value)} NP
            </Badge>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>{t('General.inflation')}</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      )}

      {!hasStalePriceBadge && !!npPrice?.value && !isInflated && (
        <Badge whiteSpace="normal">{format.number(npPrice.value)} NP</Badge>
      )}

      {hasStalePriceBadge && !!npPrice?.value && (
        <Tooltip.Root positioning={{ placement: 'top' }}>
          <Tooltip.Trigger asChild>
            <Badge colorPalette="orange" whiteSpace="normal" cursor="default">
              <Icon as={MdOutlineHourglassBottom} verticalAlign="middle" />
              {format.number(npPrice.value)} NP
            </Badge>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>
              {t('ItemPage.last-known-price-x-months-ago', {
                x: Math.max(priceAgeInMonths, 6),
              })}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      )}

      {item.type === 'np' && item.status === 'no trade' && <Badge>No Trade</Badge>}

      {item.type === 'pb' && <Badge colorPalette="yellow">PB</Badge>}

      {isNc && !capValue && !ncMall && !ncValue && item.status !== 'no trade' && (
        <Badge colorPalette="purple">NC</Badge>
      )}

      {isNc && !capValue && !ncMall && !ncValue && item.status === 'no trade' && (
        <Badge colorPalette="purple">NC - No Trade</Badge>
      )}

      {isNc && ncValue && !capValue && !ncMall && (
        <Badge colorPalette={ncValue.source === 'lebron' ? 'yellow' : 'purple'} whiteSpace="normal">
          {ncValue.range} Caps
        </Badge>
      )}

      {isNc && ncMall && (
        <Badge colorPalette={isDiscounted ? 'orange' : 'purple'} whiteSpace="normal">
          {ncMall.price > 0 &&
            `${format.number(isDiscounted ? (ncMall.discountPrice ?? -1) : ncMall.price)} NC`}
          {ncMall.price === 0 && t('ItemPage.free')}
        </Badge>
      )}

      {isNc && Number(capValue) > 0 && (
        <Tooltip.Root positioning={{ placement: 'top' }}>
          <Tooltip.Trigger asChild>
            <Badge colorPalette="purple" whiteSpace="normal" cursor="default">
              <Icon as={AiFillInfoCircle} verticalAlign="middle" /> NC - {capValue} CAPS
            </Badge>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>User Asking Price in GBCs - Not Official</Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      )}

      {!!odds && (
        <Badge colorPalette={isLE ? 'green' : 'white'} whiteSpace="pre-wrap" textAlign={'center'}>
          {isLE ? 'LE' : ''} {odds.toFixed(2)}%
        </Badge>
      )}

      {sortType === 'profit' && !!profit && (
        <>
          {profit <= 1000 && (
            <Tooltip.Root positioning={{ placement: 'top' }}>
              <Tooltip.Trigger asChild>
                <Badge
                  colorPalette="red"
                  display="flex"
                  alignItems={'center'}
                  gap={1}
                  cursor="default"
                >
                  {format.number(profit)} NP <MdHelp size={'0.7rem'} />
                </Badge>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content>
                  {profit > 0
                    ? t('Restock.estimated-profit-is-less-than')
                    : t('Restock.estimated-loss')}
                </Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          )}
          {profit > 1000 && (
            <Tooltip.Root positioning={{ placement: 'top' }}>
              <Tooltip.Trigger asChild>
                <Badge
                  colorPalette="green"
                  display="flex"
                  alignItems={'center'}
                  gap={1}
                  cursor="default"
                >
                  {format.number(profit)} NP <MdHelp size={'0.7rem'} />
                </Badge>
              </Tooltip.Trigger>
              <Tooltip.Positioner>
                <Tooltip.Content>{t('Restock.estimated-profit')}</Tooltip.Content>
              </Tooltip.Positioner>
            </Tooltip.Root>
          )}
        </>
      )}
    </>
  );
};
