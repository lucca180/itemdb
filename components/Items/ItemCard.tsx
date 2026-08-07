'use client';
import { Box, Skeleton, Text, Link, useMediaQuery } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import React, { useState } from 'react';
import Image from 'next/image';
import { ItemData } from '../../types';
import { CtxTrigger } from '@components/Menus/ItemCtxTrigger';

const ItemCtxMenu = dynamic(() => import('@components/Menus/ItemCtxMenu'), { ssr: false });
import { getRestockProfit, rarityToCCPoints } from '../../utils/utils';
import { useFormatter } from 'next-intl';
import MainLink from '../Utils/MainLink';
import { ItemCardBadge } from '@components/Items/ItemCardBadge';

export type { ItemCardBadgeProps } from '@components/Items/ItemCardBadge';
export { ItemCardBadge } from '@components/Items/ItemCardBadge';

export type ItemProps = {
  item?: ItemData;
  isLoading?: boolean;
  selected?: boolean;
  disableLink?: boolean;
  capValue?: number | null;
  quantity?: number;
  onSelect?: () => void;
  onListAction?: (item: ItemData, action: 'move' | 'delete') => any;
  style?: React.CSSProperties;
  small?: boolean;
  odds?: number;
  isLE?: boolean;
  sortType?: string;
  disablePrefetch?: boolean;
  highlight?: boolean;
  utm_content?: string;
  uniqueID: string;
};

const ItemCardBase = (props: ItemProps) => {
  const {
    item,
    isLoading,
    selected,
    disableLink,
    quantity,
    small,
    onListAction,
    sortType,
    disablePrefetch,
    highlight,
    utm_content,
    uniqueID,
  } = props;
  const [isMobile] = useMediaQuery(['(hover: none)'], { fallback: [false] });
  const [isContextMenuLoaded, setIsContextMenuLoaded] = useState(false);
  const format = useFormatter();

  const color = item?.color.rgb;

  if (!item || isLoading || !color)
    return (
      <Box
        as="a"
        _hover={{ textDecoration: 'none' }}
        pointerEvents="none"
        style={{ ...props.style }}
      >
        <Box
          w={{ base: 100, md: small ? 100 : 150 }}
          py={{ base: 2, md: small ? 2 : 4 }}
          px={2}
          bg="gray.700"
          h="100%"
          borderRadius="md"
          display="flex"
          flexFlow="column"
          justifyContent="center"
          alignItems="center"
          boxShadow={'inset'}
          textAlign="center"
          cursor="pointer"
          flex="1 1 auto"
        >
          <Skeleton w="80px" h="80px" bg="whiteAlpha.300" />
          <Skeleton w="80px" h="12px" mt={2} bg="whiteAlpha.300" />
        </Box>
      </Box>
    );

  const profit = getRestockProfit(item);
  const loadContextMenu = () => {
    if (!isMobile) {
      void import('@components/Menus/ItemCtxMenu');
      setIsContextMenuLoaded(true);
    }
  };
  const loadContextMenuOnRightClick = (event: React.MouseEvent) => {
    if (event.button === 2) loadContextMenu();
  };

  return (
    <>
      {isContextMenuLoaded && (
        <ItemCtxMenu
          menuId={item.internal_id.toString() + '-' + uniqueID}
          item={item}
          onSelect={props.onSelect}
          onListAction={onListAction}
        />
      )}
      <CtxTrigger
        id={item.internal_id.toString() + '-' + uniqueID}
        //@ts-ignore
        disableWhileShiftPressed
        disable={isMobile ? true : undefined}
        style={{ ...props.style, display: 'flex', alignSelf: 'stretch' }}
        attributes={{
          onPointerEnter: loadContextMenu,
          onFocus: loadContextMenu,
          onMouseDownCapture: loadContextMenuOnRightClick,
          onContextMenuCapture: loadContextMenu,
        }}
      >
        {disableLink ? (
          <Box
            _hover={{ textDecoration: 'none' }}
            style={{ display: 'flex', height: '100%', width: '100%' }}
          >
            <ItemCardContent
              item={item}
              color={color}
              small={small}
              selected={selected}
              highlight={highlight}
              quantity={quantity}
              sortType={sortType}
              format={format}
              profit={profit}
              props={props}
            />
          </Box>
        ) : (
          <Link asChild _hover={{ textDecoration: 'none' }} outline={'none'}>
            <MainLink
              prefetch={disablePrefetch !== false ? false : 'auto'}
              trackEvent={utm_content || undefined}
              trackEventLabel={item.slug || undefined}
              href={'/item/' + (item.slug ?? item.internal_id)}
              style={{ display: 'flex', height: '100%', width: '100%' }}
            >
              <ItemCardContent
                item={item}
                color={color}
                small={small}
                selected={selected}
                highlight={highlight}
                quantity={quantity}
                sortType={sortType}
                format={format}
                profit={profit}
                props={props}
              />
            </MainLink>
          </Link>
        )}
      </CtxTrigger>
    </>
  );
};

type ItemCardContentProps = {
  item: ItemData;
  color: number[];
  small?: boolean;
  selected?: boolean;
  highlight?: boolean;
  quantity?: number;
  sortType?: string;
  format: ReturnType<typeof useFormatter>;
  profit: number | null | undefined;
  props: ItemProps;
};

const ItemCardContent = ({
  item,
  color,
  small,
  selected,
  highlight,
  quantity,
  sortType,
  format,
  profit,
  props,
}: ItemCardContentProps) => (
  <Box
    w={{ base: 100, md: small ? 100 : 150 }}
    py={{ base: 2, md: small ? 2 : 4 }}
    px={1}
    bg="gray.700"
    bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${color[0]},${color[1]}, ${color[2]},.45) 35%)`}
    h="100%"
    borderRadius="md"
    display="flex"
    flexFlow="column"
    justifyContent="center"
    alignItems="center"
    boxShadow={
      selected ? 'none' : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);'
    }
    outline={selected ? '3px solid rgba(66, 153, 225, 0.6)' : undefined}
    filter={highlight ? 'drop-shadow(0px 0px 5px #f0f03d)' : undefined}
    textAlign="center"
    cursor="pointer"
    textDecoration="none"
    gap={2}
    flex="1 1 auto"
  >
    <ItemImage item={item} />
    <Text fontSize={{ base: 'xs', md: small ? 'xs' : 'sm' }}>{item.name}</Text>

    <ItemCardBadge {...props} profit={profit} />

    {(quantity ?? 0) > 1 && (
      <Text fontSize={'xs'} fontWeight="bold">
        {quantity}x
      </Text>
    )}

    {['faerieFest', 'item_id', 'rarity', 'quantity', 'price_qty'].includes(sortType ?? '') && (
      <Text fontSize={'xs'} fontWeight="bold">
        {sortType === 'rarity' && item.rarity && `r${item.rarity}`}
        {sortType === 'item_id' && item.item_id && `#${item.item_id}`}
        {['quantity', 'price_qty'].includes(sortType ?? '') &&
          item.price.value &&
          (quantity ?? 0) > 1 &&
          `${format.number(item.price.value * (quantity ?? 1))} NP Total`}
        {sortType === 'faerieFest' &&
          !!rarityToCCPoints(item) &&
          `${rarityToCCPoints(item)} point${rarityToCCPoints(item) > 1 ? 's' : ''}`}
      </Text>
    )}
  </Box>
);

const ItemCard = React.memo(ItemCardBase);

export default ItemCard;

type ImageProps = React.ComponentProps<typeof Image>;

export const ItemImage = (props: { item: ItemData } & Partial<ImageProps>) => {
  const { item } = props;
  const [error, setError] = useState(false);

  const src = error
    ? `/api/cache/items/${item.image_id}.gif`
    : `https://cdn.itemdb.com.br/items/${item.image_id}.gif`;

  return (
    <Image
      src={src}
      width={80}
      height={80}
      unoptimized
      alt=""
      title={item.description}
      onError={() => setError(true)}
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      {...(({ item, ...rest }) => rest)(props)}
    />
  );
};
