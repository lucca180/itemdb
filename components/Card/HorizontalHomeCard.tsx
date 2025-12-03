import { Flex, Heading, Button, FlexProps } from '@chakra-ui/react';
import Color from 'color';
import NextImage from 'next/image';
import MainLink from '../Utils/MainLink';
import { useTranslations } from 'next-intl';

type HorizontalHomeCard = {
  // lists: UserList[];
  title?: string;
  image?: string;
  color: string;
  children?: React.ReactNode;
  viewAllLink?: string;
  w?: number;
  h?: number;
  bgOpacity?: string;
  style?: FlexProps;
  innerStyle?: FlexProps;
  utm_content?: string;
  sx?: FlexProps['sx'];
  isSmall?: boolean;
  isPriority?: boolean;
  viewAllText?: string;
};

export const HorizontalHomeCard = (props: HorizontalHomeCard) => {
  const t = useTranslations();
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
  const rgb = color.rgb().array();

  return (
    <Flex
      w="100%"
      flexFlow={'column'}
      p={2}
      bg="gray.700"
      borderRadius={'md'}
      bgGradient={`linear-gradient(to top,rgba(0,0,0,0) 0,rgba(${rgb[0]},${rgb[1]}, ${rgb[2]},${bgOpacity ?? '0.45'}) 0%)`}
      {...props.style}
      sx={props.sx}
    >
      <Flex
        w="100%"
        px={2}
        py={4}
        flexFlow={'column'}
        borderRadius={'lg'}
        border={`2px solid ${color.lightness(50).alpha(0.3).hexa()}`}
        {...props.innerStyle}
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
              />
            )}
            {title && <Heading size={'lg'}>{title}</Heading>}
            <Flex flex={1} justifyContent={'flex-end'}>
              {viewAllLink && (
                <Button
                  as={MainLink}
                  href={viewAllLink}
                  variant={'ghost'}
                  size={'sm'}
                  trackEvent={utm_content}
                  trackEventLabel={utm_content ? 'view-all' : undefined}
                >
                  {viewAllText ? viewAllText : t('General.view-all')}
                </Button>
              )}
            </Flex>
          </Flex>
        )}
        {children}
      </Flex>
    </Flex>
  );
};

export const TVWHomeCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <HorizontalHomeCard
      color="#5436ab"
      h={50}
      w={50}
      image="https://images.neopets.com/plots/tvw/activities/void-collection/images/void-attractor.png"
      viewAllLink="/hub/the-void-within"
      title={'The Void Within'}
      isSmall
      utm_content="tvw-lists"
      sx={{
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
          backgroundImage:
            "url('https://images.neopets.com/plots/tvw/home/images/void-pattern.png')",
          opacity: 0.5,
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
};

export const FFHomeCard = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations();
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
      sx={{
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
};

export const HalloweenHomeCard = ({ children }: { children: React.ReactNode }) => {
  // const t = useTranslations();
  return (
    <HorizontalHomeCard
      color="#54ACB4"
      h={50}
      w={50}
      image="https://images.neopets.com/festivaloffears/images/goodiebag-icon.png"
      // viewAllLink="/hub/faeriefestival"
      title={'Festival of Fears'}
      isSmall
      utm_content="halloween-lists"
      // viewAllText={t('HomePage.more-guides-and-tools')}
      sx={{
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
};

export const WinterStarlightCard = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations();
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
      sx={{
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
};
