'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Flex, Link, Text, useMediaQuery } from '@chakra-ui/react';
import type { ItemV2For } from '@types';
import MainLink from '@components/Utils/MainLink';
import { ItemCardBadgeV2 } from '@components/Items/v2/ItemCardBadgeV2';
import { ItemImageV2 } from '@components/Items/v2/ItemImageV2';
import { CtxTrigger } from '@components/Menus/ItemCtxTrigger';

const ItemCtxMenuV2 = dynamic(() => import('@components/Menus/ItemCtxMenuV2'), { ssr: false });

export type ItemRowV2Props = {
  item: ItemV2For<'card'>;
  uniqueID: string;
  disablePrefetch?: boolean;
  utm_content?: string;
};

/** Compact horizontal item: image + name + badge, with item link. */
const ItemRowV2 = ({ item, uniqueID, disablePrefetch, utm_content }: ItemRowV2Props) => {
  const [isMobile] = useMediaQuery(['(hover: none)'], { fallback: [false] });
  const [isContextMenuLoaded, setIsContextMenuLoaded] = useState(false);
  const menuId = `${item.internal_id}-${uniqueID}`;

  const loadContextMenu = () => {
    if (!isMobile) {
      void import('@components/Menus/ItemCtxMenuV2');
      setIsContextMenuLoaded(true);
    }
  };
  const loadContextMenuOnRightClick = (event: React.MouseEvent) => {
    if (event.button === 2) loadContextMenu();
  };

  return (
    <>
      {isContextMenuLoaded && <ItemCtxMenuV2 menuId={menuId} item={item} />}
      <CtxTrigger
        id={menuId}
        //@ts-ignore
        disableWhileShiftPressed
        disable={isMobile ? true : undefined}
        style={{ display: 'block', width: '100%' }}
        attributes={{
          onPointerEnter: loadContextMenu,
          onFocus: loadContextMenu,
          onMouseDownCapture: loadContextMenuOnRightClick,
          onContextMenuCapture: loadContextMenu,
        }}
      >
        <Link asChild _hover={{ textDecoration: 'none' }} outline="none" w="100%">
          <MainLink
            viaNextLink
            prefetch={disablePrefetch !== false ? false : undefined}
            trackEvent={utm_content || undefined}
            trackEventLabel={item.slug || undefined}
            href={'/item/' + (item.slug ?? item.internal_id)}
            style={{ display: 'block', width: '100%' }}
          >
            <Flex
              w="100%"
              align="center"
              gap={2}
              px={2}
              py={1.5}
              borderRadius="md"
              bg="blackAlpha.400"
              _hover={{ bg: 'blackAlpha.600' }}
              color="whiteAlpha.900"
            >
              <ItemImageV2
                item={item}
                width={40}
                height={40}
                style={{ borderRadius: '8px', flexShrink: 0 }}
              />
              <Flex
                flexFlow="column"
                align="flex-start"
                justify="center"
                gap={0.5}
                minW={0}
                flex="1"
              >
                <Text fontSize="xs" lineClamp={2} css={{ textWrap: 'pretty' }} textAlign="start">
                  {item.name}
                </Text>
                <ItemCardBadgeV2 item={item} />
              </Flex>
            </Flex>
          </MainLink>
        </Link>
      </CtxTrigger>
    </>
  );
};

export default React.memo(ItemRowV2);
