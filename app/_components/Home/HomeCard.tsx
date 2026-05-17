'use client';
import { Flex, Divider, styled } from '@styled/jsx';
import { skeleton } from '@styled/recipes';
import { HomeItem } from '@components/Card/HomeCard';
import ItemCard from '@components/Items/ItemCard';
import MainLink from '@components/Utils/MainLink';
import { ItemData } from '@types';
import Color from 'color';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { GoChevronLeft, GoChevronRight } from 'react-icons/go';
import NextImage, { StaticImageData } from 'next/image';

type HomeCardProps = {
  items?: ItemData[];
  title: string;
  image: string | StaticImageData;
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

const Skeleton = styled('div', skeleton);
const StyledMainLink = styled(MainLink);

const chakraButtonBaseStyles = {
  display: 'inline-flex',
  appearance: 'none',
  alignItems: 'center',
  justifyContent: 'center',
  userSelect: 'none',
  position: 'relative',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
  outline: 'none',
  lineHeight: '1.2',
  borderRadius: 'md',
  fontWeight: 'semibold',
  transitionProperty: 'common',
  transitionDuration: 'normal',
  color: 'whiteAlpha.900',
  _hover: {
    bg: 'whiteAlpha.200',
    _disabled: {
      bg: 'initial',
    },
  },
  _active: {
    bg: 'whiteAlpha.300',
  },
  _focusVisible: {
    boxShadow: 'outline',
  },
  _disabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
} as const;

const chakraButtonSmStyles = {
  ...chakraButtonBaseStyles,
  h: '8',
  minW: '8',
  fontSize: 'sm',
  px: '3',
} as const;

const chakraIconButtonSmStyles = {
  ...chakraButtonSmStyles,
  px: '0',
  py: '0',
} as const;

const chakraIconStyles = {
  width: '1em',
  height: '1em',
  fontSize: '20px',
  flexShrink: 0,
  display: 'block',
} as const;

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
      style={{
        backgroundImage: `linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},${
          opacity ?? '.5'
        }) 0%)`,
      }}
    >
      <Flex
        w="100%"
        flex={1}
        px={{ base: 2, lg: 2, xl: 6 }}
        py={4}
        flexFlow={'column'}
        borderRadius={'lg'}
        border={`2px solid #FFFFFF1A`}
      >
        <Flex alignItems={'center'} gap={4} flexShrink={0} h="70px">
          <NextImage src={image} quality={100} width={w ?? 71} height={h ?? 71} alt={title} />
          <styled.h2
            fontFamily="heading"
            fontWeight="bold"
            fontSize={{ base: '2xl', md: '3xl' }}
            lineHeight={1.2}
          >
            {title}
          </styled.h2>
        </Flex>
        <Divider borderColor={'whiteAlpha.300'} mt={3} />
        {isLoading && !useItemCard && <HomeCardLoadingRows />}
        {isLoading && useItemCard && <HomeCardLoadingItemGrid title={title} perPage={perPage} />}
        {!useItemCard && (
          <Flex flexFlow={'column'} display={isLoading ? 'none' : undefined}>
            {items.map((item, i) => (
              <HomeItem
                key={item.internal_id + title}
                menuKey={item.internal_id + title}
                utm_content={utm_content}
                item={item}
                hidden={i < perPage * page || i >= perPage * (page + 1)}
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
            display={isLoading ? 'none' : undefined}
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
          <styled.button
            type="button"
            onClick={() => setPage(0)}
            css={chakraIconButtonSmStyles}
            fontSize="20px"
            disabled={isLoading || page === 0}
            aria-label="Previous Page"
          >
            <GoChevronLeft style={chakraIconStyles} aria-hidden focusable={false} />
          </styled.button>
          {viewAllLink && (
            <StyledMainLink
              href={viewAllLink}
              css={chakraButtonSmStyles}
              trackEvent={utm_content}
              trackEventLabel={linkText || 'view-all'}
            >
              {linkText ?? t('General.view-all')}
            </StyledMainLink>
          )}
          <styled.button
            type="button"
            onClick={() => setPage(1)}
            css={chakraIconButtonSmStyles}
            fontSize="20px"
            disabled={isLoading || page !== 0}
            aria-label="Next Page"
          >
            <GoChevronRight style={chakraIconStyles} aria-hidden focusable={false} />
          </styled.button>
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
        <Skeleton w="60px" h="60px" borderRadius="12px" flexShrink={0} bg="whiteAlpha.300" />
        <Flex flexFlow="column" pl={3} alignItems="start" justifyContent="center" gap={2} w="100%">
          <Skeleton h="14px" w="70%" bg="whiteAlpha.300" />
          <Skeleton h="20px" w="72px" bg="whiteAlpha.300" />
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
