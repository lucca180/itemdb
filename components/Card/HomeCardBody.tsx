'use client';

import { Button, Flex, IconButton, Link, Skeleton, Text, useMediaQuery } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import type { ItemV2For } from '@types';
import ItemCardV2 from '@components/Items/v2/ItemCardV2';
import { ItemCardBadgeV2 } from '@components/Items/v2/ItemCardBadgeV2';
import { ItemImageV2 } from '@components/Items/v2/ItemImageV2';
import { CtxTrigger } from '@components/Menus/ItemCtxTrigger';
import MainLink from '@components/Utils/MainLink';
import { GoChevronLeft, GoChevronRight } from 'react-icons/go';
import { useState, type MouseEvent, type ReactNode } from 'react';
import { useFormatter, useTranslations } from 'next-intl';

const ItemCtxMenuV2 = dynamic(() => import('@components/Menus/ItemCtxMenuV2'), { ssr: false });

export type HomeCardBodyProps = {
  items?: ItemV2For<'card'>[];
  title: string;
  href?: string;
  linkText?: string;
  useItemCard?: boolean;
  showMallLeaveDate?: boolean;
  utm_content?: string;
  perPage?: number;
  isLoading?: boolean;
  bodyRows?: ReactNode[];
};

export function HomeCardBody(props: HomeCardBodyProps) {
  const {
    items = [],
    title,
    href: viewAllLink,
    linkText,
    useItemCard,
    showMallLeaveDate,
    utm_content,
    perPage = 10,
    isLoading = false,
    bodyRows,
  } = props;
  const [page, setPage] = useState(0);
  const t = useTranslations();
  const [isMobile] = useMediaQuery(['(hover: none)'], { fallback: [false] });
  const hasBodyRows = bodyRows != null;
  const pageStart = perPage * page;
  const pageEnd = perPage * (page + 1);

  return (
    <>
      {isLoading && !useItemCard && <HomeCardLoadingRows count={perPage} />}
      {isLoading && useItemCard && <HomeCardLoadingItemGrid title={title} perPage={perPage} />}
      {hasBodyRows && !isLoading && (
        <Flex flexFlow="column">{bodyRows.slice(pageStart, pageEnd)}</Flex>
      )}
      {!hasBodyRows && !useItemCard && (
        <Flex flexFlow={'column'} display={isLoading ? 'none' : undefined}>
          {items
            .filter((_, i) => i >= pageStart && i < pageEnd)
            .map((item) => (
              <HomeItem
                key={item.internal_id + title}
                menuKey={item.internal_id + title}
                utm_content={utm_content}
                item={item}
                showMallLeaveDate={showMallLeaveDate}
                isMobile={isMobile}
              />
            ))}
        </Flex>
      )}
      {!hasBodyRows && useItemCard && (
        <Flex
          flexWrap={'wrap'}
          gap={2}
          my={3}
          justifyContent={'center'}
          display={isLoading ? 'none' : 'flex'}
        >
          {items
            .filter((_, i) => i >= pageStart && i < pageEnd)
            .map((item) => (
              <ItemCardV2
                uniqueID={title}
                key={item.internal_id + title}
                item={item}
                utm_content={utm_content}
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
              viaNextLink
              prefetch={false}
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
    </>
  );
}

const HomeCardLoadingRows = ({ count = 10 }: { count?: number }) => (
  <Flex flexFlow="column">
    {Array.from({ length: count }).map((_, index) => (
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
      <ItemCardV2 uniqueID={title} key={`${title}-loading-${index}`} isLoading />
    ))}
  </Flex>
);

type HomeItemProps = {
  item: ItemV2For<'card'>;
  menuKey: string;
  utm_content?: string;
  showMallLeaveDate?: boolean;
  /** When set, skips `useMediaQuery` inside HomeItem. */
  isMobile?: boolean;
};

export function HomeItem(props: HomeItemProps) {
  if (props.isMobile !== undefined) {
    return <HomeItemInner {...props} isMobile={props.isMobile} />;
  }
  return <HomeItemWithMediaQuery {...props} />;
}

function HomeItemWithMediaQuery(props: Omit<HomeItemProps, 'isMobile'>) {
  const [isMobile] = useMediaQuery(['(hover: none)'], { fallback: [false] });
  return <HomeItemInner {...props} isMobile={isMobile} />;
}

function HomeItemInner({
  item,
  menuKey,
  utm_content,
  showMallLeaveDate,
  isMobile,
}: HomeItemProps & { isMobile: boolean }) {
  const t = useTranslations();
  const format = useFormatter();
  const [isContextMenuLoaded, setIsContextMenuLoaded] = useState(false);
  const loadContextMenu = () => {
    if (!isMobile) {
      void import('@components/Menus/ItemCtxMenuV2');
      setIsContextMenuLoaded(true);
    }
  };
  const loadContextMenuOnRightClick = (event: MouseEvent) => {
    if (event.button === 2) loadContextMenu();
  };

  const saleEnd = item.price?.type === 'ncMall' ? item.price.saleEnd : null;
  const leaveDateLabel =
    showMallLeaveDate && saleEnd
      ? `${t('ItemPage.until')} ${format.dateTime(new Date(saleEnd), {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}`
      : null;

  return (
    <>
      {isContextMenuLoaded && <ItemCtxMenuV2 item={item} menuId={menuKey} />}
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
        <Link asChild _hover={{ textDecoration: 'none' }} w="100%" minW={0} display="block">
          <MainLink
            viaNextLink
            prefetch={false}
            href={'/item/' + (item.slug ?? item.internal_id)}
            trackEvent={utm_content || undefined}
            trackEventLabel={item.slug || undefined}
          >
            <Flex
              minH="80px"
              borderBottom={'1px solid rgba(255, 255, 255, 0.16)'}
              p={2}
              _hover={{ bg: 'blackAlpha.300' }}
              alignItems={'center'}
              color="whiteAlpha.900"
              w="100%"
              minW={0}
              overflow="hidden"
            >
              <ItemImageV2
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
                minW={0}
                flex={1}
                overflow="hidden"
              >
                {showMallLeaveDate ? (
                  <>
                    <Flex alignItems="center" gap={2} w="100%" minW={0}>
                      <Text fontSize={'sm'} lineClamp={2} minW={0} flex="1">
                        {item.name}
                      </Text>
                      <Flex flexShrink={0}>
                        <ItemCardBadgeV2 item={item} />
                      </Flex>
                    </Flex>
                    {leaveDateLabel && (
                      <Text fontSize="xs" color="whiteAlpha.700">
                        {leaveDateLabel}
                      </Text>
                    )}
                  </>
                ) : (
                  <>
                    <Text fontSize={'sm'} lineClamp={2}>
                      {item.name}
                    </Text>
                    <ItemCardBadgeV2 item={item} />
                  </>
                )}
              </Flex>
            </Flex>
          </MainLink>
        </Link>
      </CtxTrigger>
    </>
  );
}
