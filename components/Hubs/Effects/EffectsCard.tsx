'use client';

import { Box, Flex, HStack, Link, Separator, Text, useMediaQuery } from '@chakra-ui/react';
import MainLink from '@components/Utils/MainLink';
import Color from 'color';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import React, { useState } from 'react';
import type { ItemEffect, ItemV2For } from '@types';
import { EffectText, EffectTypes } from '@components/Items/EffectCard';
import { ItemCardBadgeV2 } from '@components/Items/v2/ItemCardBadgeV2';
import { ItemImageV2 } from '@components/Items/v2/ItemImageV2';
import { CtxTrigger } from '@components/Menus/ItemCtxTrigger';

const ItemCtxMenuV2 = dynamic(() => import('@components/Menus/ItemCtxMenuV2'), { ssr: false });

const FALLBACK_COLOR_HEX = '#4A5568';

type EffectsCardProps = {
  item: ItemV2For<'card'> & { effects?: ItemEffect[] };
  uniqueID: string;
};

export const EffectsCard = (props: EffectsCardProps) => {
  const { item, uniqueID } = props;
  const color = Color(item.colorHex ?? FALLBACK_COLOR_HEX);
  const rgb = color.rgb().array();
  const [isMobile] = useMediaQuery(['(hover: none)'], { fallback: [false] });
  const [isContextMenuLoaded, setIsContextMenuLoaded] = useState(false);
  const menuId = uniqueID + item.internal_id.toString();

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
    <Flex
      p={2}
      w={400}
      bg="gray.700"
      boxShadow={'lg'}
      bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},.45) 0%)`}
      borderRadius={'md'}
      flexFlow={'column'}
    >
      {isContextMenuLoaded && <ItemCtxMenuV2 menuId={menuId} item={item} />}
      <CtxTrigger
        id={menuId}
        //@ts-ignore
        disableWhileShiftPressed
        disable={isMobile ? true : undefined}
        attributes={{
          onPointerEnter: loadContextMenu,
          onFocus: loadContextMenu,
          onMouseDownCapture: loadContextMenuOnRightClick,
          onContextMenuCapture: loadContextMenu,
        }}
      >
        <Link asChild _hover={{ textDecoration: 'none' }} color="white">
          <MainLink prefetch={false} href={'/item/' + (item.slug ?? item.internal_id)}>
            <Flex gap={2}>
              <Box w="50px" h="50px">
                <ItemImageV2 item={item} width={50} height={50} />
              </Box>
              <Flex flexFlow={'column'} gap={1}>
                <Text fontSize={'sm'}>{item.name}</Text>
                <Flex gap={1} flexWrap={'wrap'}>
                  <ItemCardBadgeV2 item={item} />
                </Flex>
              </Flex>
            </Flex>
          </MainLink>
        </Link>
      </CtxTrigger>
      {item.effects && item.effects.length > 0 && (
        <>
          <Separator my={3} />
          <Flex flexFlow={'column'} gap={2} css={{ '& a': { color: color.lightness(70).hex() } }}>
            {item.effects.map((effect) => (
              <HStack
                key={effect.internal_id}
                gap={2}
                bg="blackAlpha.300"
                p={1}
                borderRadius={'md'}
              >
                <Box w={'20px'} h="20px" flex="0 0 auto" overflow={'hidden'} borderRadius={'sm'}>
                  <Image
                    width={20}
                    height={20}
                    src={EffectTypes[effect.type].img}
                    alt={effect.name}
                    quality={100}
                  />
                </Box>
                <Text
                  fontSize="xs"
                  color="whiteAlpha.800"
                  css={{ 'b, strong': { color: 'white' } }}
                  as="div"
                >
                  <EffectText effect={effect} />
                </Text>
              </HStack>
            ))}
          </Flex>
        </>
      )}
    </Flex>
  );
};
