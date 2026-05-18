import type { ReactNode } from 'react';
import Link from 'next/link';
import Color from 'color';
import { useTranslations } from 'next-intl';
import NextImage from 'next/image';
import { css } from '@styled/css';
import { Flex, styled, type FlexProps } from '@styled/jsx';
import type { SystemStyleObject } from '@styled/types';

type HorizontalHomeCardProps = {
  title?: string;
  image?: string;
  headerColor: string;
  children?: ReactNode;
  viewAllLink?: string;
  w?: number;
  h?: number;
  bgOpacity?: string;
  rootCss?: SystemStyleObject;
  innerCss?: SystemStyleObject;
  style?: SystemStyleObject;
  innerStyle?: SystemStyleObject;
  utm_content?: string;
  sx?: SystemStyleObject;
  isSmall?: boolean;
  isPriority?: boolean;
  viewAllText?: string;
} & Omit<FlexProps, 'color' | 'children' | 'title' | 'image' | 'w' | 'h' | 'style' | 'css'>;

const StyledLink = styled(Link);

const viewAllLinkStyles = {
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
  h: '8',
  minW: '8',
  fontSize: 'sm',
  px: '3',
  _hover: {
    bg: 'whiteAlpha.200',
  },
  _active: {
    bg: 'whiteAlpha.300',
  },
  _focusVisible: {
    boxShadow: 'outline',
  },
} as const;

export const HorizontalHomeCard = (props: HorizontalHomeCardProps) => {
  const t = useTranslations();
  const {
    children,
    title,
    image,
    headerColor,
    viewAllLink,
    w,
    h,
    bgOpacity,
    utm_content,
    isSmall,
    isPriority,
    viewAllText,
    rootCss,
    innerCss,
    sx,
    style,
    innerStyle,
    ...restProps
  } = props;
  const color = Color(headerColor);
  const rgb = color.rgb().array();

  return (
    <Flex
      {...restProps}
      w="100%"
      flexFlow={'column'}
      p={2}
      bg="gray.700"
      borderRadius={'md'}
      style={{
        backgroundImage: `linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},${bgOpacity ?? '0.45'}) 0%)`,
      }}
      css={css.raw([sx, rootCss, style])}
    >
      <Flex
        w="100%"
        px={2}
        py={4}
        flexFlow={'column'}
        borderRadius={'lg'}
        border={`2px solid`}
        style={{ borderColor: color.lightness(50).alpha(0.3).hexa() }}
        css={css.raw([innerCss, innerStyle])}
      >
        {(image || title || viewAllLink) && (
          <Flex alignItems={'center'} gap={4} flexShrink={0} h={isSmall ? 'auto' : '70px'} mb={3}>
            {image && title && (
              <NextImage
                src={image}
                quality={100}
                width={w ?? 70}
                height={h ?? 70}
                alt={title!}
                priority={isPriority}
                className="card-icon"
              />
            )}
            {title && (
              <styled.h2 fontFamily="heading" fontWeight="bold" fontSize="3xl" lineHeight={1.2}>
                {title}
              </styled.h2>
            )}
            <Flex flex={1} justifyContent={'flex-end'}>
              {viewAllLink && (
                <StyledLink
                  href={viewAllLink}
                  css={viewAllLinkStyles}
                  data-umami-event={utm_content}
                  data-umami-event-label={utm_content ? 'view-all' : undefined}
                >
                  {viewAllText ? viewAllText : t('General.view-all')}
                </StyledLink>
              )}
            </Flex>
          </Flex>
        )}
        {children}
      </Flex>
    </Flex>
  );
};
