import { Button, Flex, Heading, type FlexProps } from '@chakra-ui/react';
import Color from 'color';
import NextImage from 'next/image';
import MainLink from '@components/Utils/MainLink';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

type NestedCssObject = Record<string, unknown>;

type HorizontalHomeCardProps = {
  title?: string;
  image?: string;
  color: string;
  children?: ReactNode;
  viewAllLink?: string;
  w?: number;
  h?: number;
  bgOpacity?: string;
  style?: FlexProps;
  innerStyle?: FlexProps;
  utm_content?: string;
  css?: NestedCssObject;
  sx?: NestedCssObject;
  isSmall?: boolean;
  isPriority?: boolean;
  viewAllText?: string;
};

export function HorizontalHomeCard(props: HorizontalHomeCardProps) {
  const {
    children,
    title,
    image,
    viewAllLink,
    w,
    h,
    bgOpacity,
    utm_content,
    isSmall,
    isPriority,
    viewAllText,
  } = props;

  const color = Color(props.color);
  const opacity = bgOpacity != null ? Number(bgOpacity) : 0.45;
  const wash = color.alpha(Number.isFinite(opacity) ? opacity : 0.45).hexa();
  const borderColor = color.lightness(50).alpha(0.3).hexa();

  return (
    <Flex
      w="100%"
      flexFlow={'column'}
      p={2}
      bg="gray.700"
      borderRadius={'md'}
      bgImage={`linear-gradient(to top, transparent 0, ${wash} 0%)`}
      {...props.style}
      css={props.css ?? props.sx}
    >
      <Flex
        w="100%"
        px={2}
        py={4}
        flexFlow={'column'}
        borderRadius={'lg'}
        border={`2px solid ${borderColor}`}
        {...props.innerStyle}
      >
        {(image || title || viewAllLink) && (
          <Flex alignItems={'center'} gap={4} flexShrink={0} h={isSmall ? 'auto' : '70px'} mb={3}>
            {image && title && (
              <NextImage
                src={image}
                quality={80}
                width={w ?? 70}
                height={h ?? 70}
                alt={title!}
                priority={isPriority}
                className="card-icon"
              />
            )}
            {title && <Heading size={'lg'}>{title}</Heading>}
            <Flex flex={1} justifyContent={'flex-end'}>
              {viewAllLink && (
                <Button asChild variant={'ghost'} size={'sm'}>
                  <MainLink
                    viaNextLink
                    prefetch={false}
                    href={viewAllLink}
                    trackEvent={utm_content}
                    trackEventLabel={utm_content ? 'view-all' : undefined}
                  >
                    {viewAllText}
                  </MainLink>
                </Button>
              )}
            </Flex>
          </Flex>
        )}
        {children}
      </Flex>
    </Flex>
  );
}

export async function FFHomeCard({ children }: { children: ReactNode }) {
  const t = await getTranslations();
  return (
    <HorizontalHomeCard
      color="#5436ab"
      h={50}
      w={50}
      image="https://images.neopets.com/faeriefestival/2025/np/prizeshop-icon.png"
      viewAllLink="/hub/faeriefestival"
      title={'Faerie Festival'}
      isSmall
      utm_content="ff-lists"
      viewAllText={t('HomePage.more-guides-and-tools')}
      css={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        img: {
          filter: 'drop-shadow(0 0 5px #f3a4ff)',
        },
        h2: {
          textShadow: '0 0 10px #f3a4ff',
        },
        '::before': {
          content: "''",
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: "url('https://images.neopets.com/faeriefestival/2025/np/bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.5,
          filter: 'blur(10px) brightness(0.5)',
          zIndex: -1,
        },
      }}
      innerStyle={{
        border: '2px solid #f3a4ff7d',
      }}
    >
      {children}
    </HorizontalHomeCard>
  );
}

export function HalloweenHomeCard({ children }: { children: ReactNode }) {
  return (
    <HorizontalHomeCard
      color="#54ACB4"
      h={50}
      w={50}
      image="https://images.neopets.com/festivaloffears/images/goodiebag-icon.png"
      title={'Festival of Fears'}
      isSmall
      utm_content="halloween-lists"
      css={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        img: {
          filter: 'drop-shadow(0 0 5px #54ACB4)',
        },
        h2: {
          textShadow: '0 0 10px #54ACB4',
        },
        '::before': {
          content: "''",
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: "url('https://images.neopets.com/festivaloffears/images/fof-bg.webp')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.5,
          filter: 'blur(10px) brightness(0.5)',
          zIndex: -1,
        },
      }}
      innerStyle={{
        border: '2px solid #54ACB47d',
      }}
    >
      {children}
    </HorizontalHomeCard>
  );
}

export async function WinterStarlightCard({ children }: { children: ReactNode }) {
  const t = await getTranslations();
  return (
    <HorizontalHomeCard
      color="#54ACB4"
      h={50}
      w={50}
      image="https://images.neopets.com/themes/h5/basic/images/advent-icon.png"
      viewAllLink="/lists/official?cat=Winter%20Starlight%202025"
      title={'Winter Starlight Celebration'}
      isSmall
      utm_content="winter-lists"
      viewAllText={t('HomePage.more-guides-and-tools')}
      css={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        img: {
          filter: 'drop-shadow(0 0 5px #b45454ff)',
        },
        h2: {
          textShadow: '0 0 10px #b45454ff',
        },
        '::before': {
          content: "''",
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: "url('https://portal.neopets.com/images/lands/terror_mountain.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.5,
          filter: 'blur(10px) brightness(0.5)',
          zIndex: -1,
        },
      }}
      innerStyle={{
        border: '2px solid #54b491ff',
      }}
    >
      {children}
    </HorizontalHomeCard>
  );
}

export async function NeopiesCard({ children }: { children: ReactNode }) {
  const t = await getTranslations();
  return (
    <HorizontalHomeCard
      color="#b45454"
      h={50}
      w={50}
      image="https://images.neopets.com/faq/neopie_80x80.png"
      viewAllLink="/lists/official?cat=Neopies%202026"
      title={'Neopies 2026'}
      isSmall
      utm_content="neopies-lists"
      viewAllText={t('General.view-all')}
      css={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        '.card-icon': {
          filter: 'drop-shadow(0 0 5px #ddc146ff)',
        },
        '::before': {
          content: "''",
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: "url('https://images.neopets.com/neopies/y23/images/banner_stage.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.5,
          filter: 'blur(10px) brightness(0.5)',
          zIndex: -1,
        },
      }}
      innerStyle={{
        border: '2px solid #ddc146',
      }}
    >
      {children}
    </HorizontalHomeCard>
  );
}
