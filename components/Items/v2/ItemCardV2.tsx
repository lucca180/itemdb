'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Box, Link, Skeleton, Text, useMediaQuery } from '@chakra-ui/react';
import type { ItemV2For } from '@types';
import MainLink from '@components/Utils/MainLink';
import { colorHexWithAlpha, getRestockProfitV2, rarityToCCPointsV2 } from '@utils/item/v2';
import { ItemCardBadgeV2 } from '@components/Items/v2/ItemCardBadgeV2';
import { ItemImageV2 } from '@components/Items/v2/ItemImageV2';
import { CtxTrigger } from '@components/Menus/ItemCtxTrigger';

const ItemCtxMenuV2 = dynamic(() => import('@components/Menus/ItemCtxMenuV2'), { ssr: false });

export type ItemCardV2Props = {
  item?: ItemV2For<'card'>;
  isLoading?: boolean;
  selected?: boolean;
  disableLink?: boolean;
  capValue?: number | null;
  quantity?: number;
  onSelect?: () => void;
  onListAction?: (item: ItemV2For<'card'>, action: 'move' | 'delete') => unknown;
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

const ItemCardV2 = (props: ItemCardV2Props) => {
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

  if (!item || isLoading || !item.colorHex) {
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
  }

  const profit = getRestockProfitV2(item);
  const colorWash = colorHexWithAlpha(item.colorHex);
  const npValue = item.price?.type === 'np' ? item.price.value : null;
  const ccPoints = rarityToCCPointsV2(item);
  const menuId = item.internal_id.toString() + '-' + uniqueID;

  const loadContextMenu = () => {
    if (!isMobile) {
      void import('@components/Menus/ItemCtxMenuV2');
      setIsContextMenuLoaded(true);
    }
  };
  const loadContextMenuOnRightClick = (event: React.MouseEvent) => {
    if (event.button === 2) loadContextMenu();
  };

  const content = (
    <Box
      w={{ base: 100, md: small ? 100 : 150 }}
      py={{ base: 2, md: small ? 2 : 4 }}
      px={1}
      bg="gray.700"
      bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,${colorWash} 35%)`}
      h="100%"
      borderRadius="md"
      display="flex"
      flexFlow="column"
      justifyContent="center"
      alignItems="center"
      boxShadow={
        selected
          ? 'none'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);'
      }
      outline={selected ? '3px solid rgba(66, 153, 225, 0.6)' : undefined}
      filter={highlight ? 'drop-shadow(0px 0px 5px #f0f03d)' : undefined}
      textAlign="center"
      cursor="pointer"
      textDecoration="none"
      gap={2}
      flex="1 1 auto"
    >
      <ItemImageV2 item={item} />
      <Text fontSize={{ base: 'xs', md: small ? 'xs' : 'sm' }}>{item.name}</Text>

      <ItemCardBadgeV2
        item={item}
        capValue={props.capValue}
        odds={props.odds}
        isLE={props.isLE}
        sortType={sortType}
        profit={profit}
      />

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
            npValue &&
            (quantity ?? 0) > 1 &&
            `${(npValue * (quantity ?? 1)).toLocaleString()} NP Total`}
          {sortType === 'faerieFest' && !!ccPoints && `${ccPoints} point${ccPoints > 1 ? 's' : ''}`}
        </Text>
      )}
    </Box>
  );

  return (
    <>
      {isContextMenuLoaded && (
        <ItemCtxMenuV2
          menuId={menuId}
          item={item}
          onSelect={props.onSelect}
          onListAction={onListAction}
        />
      )}
      <CtxTrigger
        id={menuId}
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
            {content}
          </Box>
        ) : (
          <Link asChild _hover={{ textDecoration: 'none' }} outline={'none'}>
            <MainLink
              prefetch={disablePrefetch !== false ? false : undefined}
              trackEvent={utm_content || undefined}
              trackEventLabel={item.slug || undefined}
              href={'/item/' + (item.slug ?? item.internal_id)}
              style={{ display: 'flex', height: '100%', width: '100%' }}
            >
              {content}
            </MainLink>
          </Link>
        )}
      </CtxTrigger>
    </>
  );
};

export default React.memo(ItemCardV2);
