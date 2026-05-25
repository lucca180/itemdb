'use client';

import {
  Button,
  Separator,
  Flex,
  Heading,
  IconButton,
  Link,
  Skeleton,
  Text,
  useMediaQuery,
} from '@chakra-ui/react';
import NextImage from 'next/image';
import { ItemData } from '@types';
import Color from 'color';
import ItemCard, { ItemCardBadge, ItemImage } from '@components/Items/ItemCard';
import ItemCtxMenu, { CtxTrigger } from '@components/Menus/ItemCtxMenu';
import MainLink from '@components/Utils/MainLink';
import { GoChevronLeft, GoChevronRight } from 'react-icons/go';
import { useState, type MouseEvent } from 'react';
import { useTranslations } from 'next-intl';

type HomeCardProps = {
  items?: ItemData[];
  title: string;
  image: string;
  color: string;
  href?: string;
  linkText?: string;
  h?: number;
  w?: number;
  useItemCard?: boolean;
  opacity?: number;
  utm_content?: string;
  perPage?: number;
  isLoading?: boolean;
};

export const HomeCard = (props: HomeCardProps) => {
  const {
    items = [],
    title,
    image,
    href: viewAllLink,
    linkText,
    w,
    h,
    useItemCard,
    opacity,
    utm_content,
    perPage = 10,
    isLoading = false,
  } = props;
  const [page, setPage] = useState(0);
  const color = new Color(props.color);
  const rgb = color.rgb().array();
  const t = useTranslations();

  return (
    <Flex
      w="100%"
      flexFlow={'column'}
      p={{ base: 4, lg: 2, xl: 4 }}
      bg="gray.700"
      borderRadius={'md'}
      bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},${
        opacity ?? '.5'
      }) 0%)`}
    >
      <Flex
        w="100%"
        flex={1}
        px={{ base: 2, lg: 2, xl: 6 }}
        py={4}
        flexFlow={'column'}
        borderRadius={'lg'}
        border={`2px solid ${Color('#fff').alpha(0.1).hexa()}`}
      >
        <Flex alignItems={'center'} gap={4} flexShrink={0} h="70px">
          <NextImage src={image} quality={100} width={w ?? 71} height={h ?? 71} alt={title} />
          <Heading size={'lg'} css={{ textWrap: 'balance' }}>
            {title}
          </Heading>
        </Flex>
        <Separator borderColor={'whiteAlpha.300'} mt={3} />
        {isLoading && !useItemCard && <HomeCardLoadingRows />}
        {isLoading && useItemCard && <HomeCardLoadingItemGrid title={title} perPage={perPage} />}
        {!useItemCard && (
          <Flex flexFlow={'column'} display={isLoading ? 'none' : undefined}>
            {items
              .filter((_, i) => i >= perPage * page && i < perPage * (page + 1))
              .map((item) => (
                <HomeItem
                  key={item.internal_id + title}
                  menuKey={item.internal_id + title}
                  utm_content={utm_content}
                  item={item}
                />
              ))}
          </Flex>
        )}
        {useItemCard && (
          <Flex
            flexWrap={'wrap'}
            gap={2}
            my={3}
            justifyContent={'center'}
            display={isLoading ? 'none' : 'flex'}
          >
            {items.map((item, i) => (
              <ItemCard
                uniqueID={title}
                key={item.internal_id + title}
                item={item}
                utm_content={utm_content}
                style={{
                  display: i < perPage * page || i >= perPage * (page + 1) ? 'none' : undefined,
                }}
              />
            ))}
          </Flex>
        )}
        <Flex flex="1" alignItems={'flex-end'} justifyContent={'center'} mt={3} gap={1}>
          <IconButton
            onClick={() => setPage(0)}
            fontSize="20px"
            disabled={isLoading || page === 0}
            variant={'ghost'}
            aria-label="Previous Page"
            size="sm"
          >
            <GoChevronLeft />
          </IconButton>
          {viewAllLink && (
            <Button asChild variant={'ghost'} size={'sm'}>
              <MainLink
                href={viewAllLink}
                trackEvent={utm_content}
                trackEventLabel={linkText || 'view-all'}
              >
                {linkText ?? t('General.view-all')}
              </MainLink>
            </Button>
          )}
          <IconButton
            onClick={() => setPage(1)}
            fontSize="20px"
            disabled={isLoading || page !== 0}
            variant={'ghost'}
            aria-label="Next Page"
            size="sm"
          >
            <GoChevronRight />
          </IconButton>
        </Flex>
      </Flex>
    </Flex>
  );
};

const HomeCardLoadingRows = () => (
  <Flex flexFlow="column">
    {Array.from({ length: 10 }).map((_, index) => (
      <Flex
        key={index}
        h="80px"
        borderBottom="1px solid rgba(255, 255, 255, 0.16)"
        p={2}
        alignItems="center"
        color="whiteAlpha.900"
      >
        <Skeleton w="60px" h="60px" borderRadius="12px" flexShrink={0} />
        <Flex flexFlow="column" pl={3} alignItems="start" justifyContent="center" gap={2} w="100%">
          <Skeleton h="14px" w="70%" />
          <Skeleton h="20px" w="72px" />
        </Flex>
      </Flex>
    ))}
  </Flex>
);

const HomeCardLoadingItemGrid = ({ title, perPage }: { title: string; perPage: number }) => (
  <Flex flexWrap="wrap" gap={2} my={3} justifyContent="center">
    {Array.from({ length: perPage }).map((_, index) => (
      <ItemCard uniqueID={title} key={`${title}-loading-${index}`} isLoading />
    ))}
  </Flex>
);

export const HomeItem = ({
  item,
  menuKey,
  utm_content,
}: {
  item: ItemData;
  menuKey: string;
  utm_content?: string;
}) => {
  const [isMobile] = useMediaQuery(['(hover: none)']);
  const [isContextMenuLoaded, setIsContextMenuLoaded] = useState(false);
  const loadContextMenu = () => {
    if (!isMobile) setIsContextMenuLoaded(true);
  };
  const loadContextMenuOnRightClick = (event: MouseEvent) => {
    if (event.button === 2) loadContextMenu();
  };

  return (
    <>
      {isContextMenuLoaded && <ItemCtxMenu item={item} menuId={menuKey} />}
      <CtxTrigger
        id={menuKey}
        disable={isMobile ? true : undefined}
        //@ts-ignore
        disableWhileShiftPressed
        attributes={{
          onPointerEnter: loadContextMenu,
          onFocus: loadContextMenu,
          onMouseDownCapture: loadContextMenuOnRightClick,
          onContextMenuCapture: loadContextMenu,
        }}
      >
        <Link asChild _hover={{ textDecoration: 'none' }}>
          <MainLink
            prefetch={false}
            href={'/item/' + (item.slug ?? item.internal_id)}
            trackEvent={utm_content || undefined}
            trackEventLabel={item.slug || undefined}
          >
            <Flex
              h="80px"
              borderBottom={'1px solid rgba(255, 255, 255, 0.16)'}
              p={2}
              _hover={{ bg: 'blackAlpha.300' }}
              alignItems={'center'}
              color="whiteAlpha.900"
              w="100%"
            >
              <ItemImage
                item={item}
                width={60}
                height={60}
                style={{ borderRadius: '12px', flexShrink: 0 }}
              />
              <Flex
                flexFlow={'column'}
                pl={3}
                alignItems={'start'}
                justifyContent={'center'}
                gap={1}
              >
                <Text fontSize={'sm'}>{item.name}</Text>
                <ItemCardBadge item={item} />
              </Flex>
            </Flex>
          </MainLink>
        </Link>
      </CtxTrigger>
    </>
  );
};
